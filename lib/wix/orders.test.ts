/**
 * @vitest-environment node
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock server-only to allow testing server code in jsdom environment
vi.mock("server-only", () => ({}));

import {
  searchOrders,
  translateFulfillmentStatus,
  translateOrderStatus,
  translatePaymentStatus,
} from "./orders";
import { WIX_API_BASE } from "./client";
import { WIX_METASITE_ID } from "./config";

describe("lib/wix/orders — tradução de status", () => {
  describe("translatePaymentStatus", () => {
    it("traduz um valor mapeado", () => {
      expect(translatePaymentStatus("PAID")).toBe("Pago");
      expect(translatePaymentStatus("NOT_PAID")).toBe("Não pago");
      expect(translatePaymentStatus("PENDING")).toBe("Pagamento pendente");
    });

    it("cai no valor cru quando não mapeado", () => {
      expect(translatePaymentStatus("UNSPECIFIED")).toBe("UNSPECIFIED");
    });
  });

  describe("translateFulfillmentStatus", () => {
    it("traduz um valor mapeado", () => {
      expect(translateFulfillmentStatus("FULFILLED")).toBe("Entregue");
      expect(translateFulfillmentStatus("NOT_FULFILLED")).toBe("Pendente");
    });

    it("cai no valor cru quando não mapeado", () => {
      expect(translateFulfillmentStatus("SOMETHING_NEW")).toBe("SOMETHING_NEW");
    });
  });

  describe("translateOrderStatus", () => {
    it("retorna o label para CANCELED e REJECTED", () => {
      expect(translateOrderStatus("CANCELED")).toBe("Cancelado");
      expect(translateOrderStatus("REJECTED")).toBe("Rejeitado");
    });

    it("retorna null para status normais (não gera badge extra)", () => {
      expect(translateOrderStatus("APPROVED")).toBeNull();
      expect(translateOrderStatus("PENDING")).toBeNull();
      expect(translateOrderStatus("INITIALIZED")).toBeNull();
    });
  });
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("searchOrders", () => {
  beforeEach(() => {
    vi.stubEnv("WIX_ADMIN_API_KEY", "test-admin-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("chama /ecom/v1/orders/search com cursorPaging aninhado sob search e mapeia o payload", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      expect(url).toBe(`${WIX_API_BASE}/ecom/v1/orders/search`);
      expect(init?.headers).toMatchObject({
        Authorization: "test-admin-key",
        "wix-site-id": WIX_METASITE_ID,
      });
      expect(JSON.parse(init?.body as string)).toEqual({
        search: { cursorPaging: { limit: 100 } },
      });
      return jsonResponse({
        orders: [
          {
            id: "order-1",
            number: 1001,
            createdDate: "2026-08-20T12:00:00.000Z",
            buyerInfo: { email: "cliente@example.com" },
            paymentStatus: "PAID",
            fulfillmentStatus: "NOT_FULFILLED",
            status: "APPROVED",
            priceSummary: {
              total: { formattedAmount: "R$ 169,99" },
              subtotal: { formattedAmount: "R$ 169,99" },
              shipping: { formattedAmount: "R$ 0,00" },
              tax: { formattedAmount: "R$ 0,00" },
            },
            lineItems: [],
          },
        ],
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const orders = await searchOrders();

    expect(orders).toEqual([
      {
        id: "order-1",
        number: 1001,
        createdDate: "2026-08-20T12:00:00.000Z",
        buyerEmail: "cliente@example.com",
        totalFormatted: "R$ 169,99",
        paymentStatusLabel: "Pago",
        fulfillmentStatusLabel: "Pendente",
        orderStatusLabel: null,
      },
    ]);
  });

  it("retorna lista vazia quando a Wix não devolve pedidos", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ orders: [] })));

    expect(await searchOrders()).toEqual([]);
  });

  it("marca orderStatusLabel quando o pedido está cancelado", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          orders: [
            {
              id: "order-2",
              number: 1002,
              createdDate: "2026-08-21T09:00:00.000Z",
              buyerInfo: { email: "outro@example.com" },
              paymentStatus: "NOT_PAID",
              fulfillmentStatus: "NOT_FULFILLED",
              status: "CANCELED",
              priceSummary: {
                total: { formattedAmount: "R$ 50,00" },
                subtotal: { formattedAmount: "R$ 50,00" },
                shipping: { formattedAmount: "R$ 0,00" },
                tax: { formattedAmount: "R$ 0,00" },
              },
              lineItems: [],
            },
          ],
        }),
      ),
    );

    const [order] = await searchOrders();
    expect(order.orderStatusLabel).toBe("Cancelado");
  });

  it("lança quando a Wix responde com erro", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ message: "boom" }, 500)));

    await expect(searchOrders()).rejects.toThrow();
  });
});
