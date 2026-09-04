import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { clearSession, setSessionTokens, WIX_API_BASE } from "./client";
import { WIX_STORES_APP_ID } from "./config";
import {
  addLineItemsToCart,
  clearCurrentCart,
  createCheckoutFromCart,
  redirectToCheckoutPayment,
  startWixCheckout,
} from "./ecom";

/**
 * Mesmo padrão de client.test.ts: mocka `fetch` global e deixa o `wixApiRequest`
 * real rodar, em vez de mockar o módulo `./client` (`vi.mock` + `vi.fn()`
 * cruzando a fronteira do módulo mockado produz um unhandled rejection falso
 * nesta versão do Vitest quando o mock rejeita — confirmado por reprodução
 * mínima antes de escolher esta abordagem).
 */
function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("lib/wix/ecom", () => {
  beforeEach(() => {
    // Sessão de membro já válida — evita que wixApiRequest precise mintar token.
    setSessionTokens({ accessToken: "member-token", refreshToken: "r", expiresIn: 3600 });
  });

  afterEach(() => {
    clearSession();
    vi.unstubAllGlobals();
  });

  describe("addLineItemsToCart", () => {
    it("monta lineItems com o appId fixo da Wix Stores", async () => {
      const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === "string" ? input : input.toString();
        expect(url).toBe(`${WIX_API_BASE}/ecom/v1/carts/current/add-to-cart`);
        expect(JSON.parse(init?.body as string)).toEqual({
          lineItems: [
            { catalogReference: { appId: WIX_STORES_APP_ID, catalogItemId: "prod-1" }, quantity: 2 },
          ],
        });
        return jsonResponse({ cart: {} });
      });
      vi.stubGlobal("fetch", fetchMock);

      await addLineItemsToCart([{ catalogItemId: "prod-1", quantity: 2 }]);

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("lança sem chamar a API quando a lista está vazia", async () => {
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);

      await expect(addLineItemsToCart([])).rejects.toThrow();
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe("clearCurrentCart", () => {
    it("ignora 404 (sem carrinho ainda)", async () => {
      const fetchMock = vi.fn(async () => jsonResponse({ message: "not found" }, 404));
      vi.stubGlobal("fetch", fetchMock);

      await expect(clearCurrentCart()).resolves.toBeUndefined();
    });

    it("propaga outros erros", async () => {
      const fetchMock = vi.fn(async () => jsonResponse({ message: "server error" }, 500));
      vi.stubGlobal("fetch", fetchMock);

      await expect(clearCurrentCart()).rejects.toThrow();
    });
  });

  describe("createCheckoutFromCart", () => {
    it("retorna o checkoutId da resposta", async () => {
      const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : input.toString();
        if (url === `${WIX_API_BASE}/ecom/v1/carts/current/create-checkout`) {
          return jsonResponse({ checkoutId: "abc-123" });
        }
        throw new Error(`unexpected url: ${url}`);
      });
      vi.stubGlobal("fetch", fetchMock);

      await expect(createCheckoutFromCart({} as never)).resolves.toBe("abc-123");
    });

    it("lança quando a resposta não tem checkoutId", async () => {
      const fetchMock = vi.fn(async () => jsonResponse({}));
      vi.stubGlobal("fetch", fetchMock);

      await expect(createCheckoutFromCart({} as never)).rejects.toThrow();
    });
  });

  describe("redirectToCheckoutPayment", () => {
    it("lança quando a resposta não tem redirectSession.fullUrl", async () => {
      const fetchMock = vi.fn(async () => jsonResponse({}));
      vi.stubGlobal("fetch", fetchMock);

      await expect(
        redirectToCheckoutPayment("checkout-1", {
          thankYouPageUrl: "https://example.com/checkout/confirmacao",
          postFlowUrl: "https://example.com/checkout",
        }),
      ).rejects.toThrow();
    });
  });

  describe("startWixCheckout", () => {
    const callbacks = {
      thankYouPageUrl: "https://example.com/checkout/confirmacao",
      postFlowUrl: "https://example.com/checkout",
    };

    it("executa clear → add → create → redirect em sequência", async () => {
      const calledUrls: string[] = [];
      const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === "string" ? input : input.toString();
        calledUrls.push(`${init?.method ?? "POST"} ${url}`);
        if (url === `${WIX_API_BASE}/ecom/v1/carts/current`) return jsonResponse({ message: "not found" }, 404);
        if (url === `${WIX_API_BASE}/ecom/v1/carts/current/add-to-cart`) return jsonResponse({ cart: {} });
        if (url === `${WIX_API_BASE}/ecom/v1/carts/current/create-checkout`) {
          return jsonResponse({ checkoutId: "checkout-1" });
        }
        if (url === `${WIX_API_BASE}/_api/redirects-api/v1/redirect-session`) {
          return jsonResponse({ redirectSession: { fullUrl: "https://wix.example/pay" } });
        }
        throw new Error(`unexpected url: ${url}`);
      });
      // `window.location` mockado como objeto plano: sem isso, a atribuição
      // real de `redirectToCheckoutPayment` dispara "Not implemented:
      // navigation" no jsdom. Com o mock, dá pra afirmar o href final também.
      const locationMock = { href: "" };
      vi.stubGlobal("location", locationMock);
      vi.stubGlobal("fetch", fetchMock);

      await startWixCheckout([{ catalogItemId: "prod-1", quantity: 1 }], {} as never, callbacks);

      expect(calledUrls).toEqual([
        `DELETE ${WIX_API_BASE}/ecom/v1/carts/current`,
        `POST ${WIX_API_BASE}/ecom/v1/carts/current/add-to-cart`,
        `POST ${WIX_API_BASE}/ecom/v1/carts/current/create-checkout`,
        `POST ${WIX_API_BASE}/_api/redirects-api/v1/redirect-session`,
      ]);
      expect(locationMock.href).toBe("https://wix.example/pay");
    });

    it("para a sequência sem chamar create-checkout nem redirect quando add-to-cart falha", async () => {
      const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : input.toString();
        if (url === `${WIX_API_BASE}/ecom/v1/carts/current`) return jsonResponse({ message: "not found" }, 404);
        if (url === `${WIX_API_BASE}/ecom/v1/carts/current/add-to-cart`) {
          return jsonResponse({ message: "server error" }, 500);
        }
        throw new Error(`unexpected url: ${url}`);
      });
      vi.stubGlobal("fetch", fetchMock);

      await expect(
        startWixCheckout([{ catalogItemId: "prod-1", quantity: 1 }], {} as never, callbacks),
      ).rejects.toThrow();

      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });
});
