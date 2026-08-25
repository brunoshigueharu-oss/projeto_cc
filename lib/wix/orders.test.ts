/**
 * @vitest-environment node
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// `server-only`'s default export throws unconditionally on import (it only
// resolves to a no-op via the `react-server` export condition, which Vitest's
// module resolution doesn't set) — mock it regardless of test environment
// (jsdom or node) so this server-only module can be imported here at all.
vi.mock("server-only", () => ({}));

import {
  getOrder,
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

  it("mapeia totalFormatted como \"—\" quando priceSummary vem ausente da Wix", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          orders: [
            {
              id: "order-4",
              number: 1004,
              createdDate: "2026-08-23T09:00:00.000Z",
              buyerInfo: { email: "sem-preco@example.com" },
              paymentStatus: "PAID",
              fulfillmentStatus: "NOT_FULFILLED",
              status: "APPROVED",
              lineItems: [],
            },
          ],
        }),
      ),
    );

    const [order] = await searchOrders();
    expect(order.totalFormatted).toBe("—");
  });

  it("lança com mensagem sobre a chave ausente quando WIX_ADMIN_API_KEY não está configurada", async () => {
    vi.stubEnv("WIX_ADMIN_API_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(searchOrders()).rejects.toThrow(/WIX_ADMIN_API_KEY/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("getOrder", () => {
  beforeEach(() => {
    vi.stubEnv("WIX_ADMIN_API_KEY", "test-admin-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("busca GET /ecom/v1/orders/{id} e mapeia itens, endereço e resumo de preço", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      expect(url).toBe(`${WIX_API_BASE}/ecom/v1/orders/order-1`);
      expect(init?.method).toBe("GET");
      return jsonResponse({
        order: {
          id: "order-1",
          number: 1001,
          createdDate: "2026-08-20T12:00:00.000Z",
          buyerInfo: { email: "cliente@example.com" },
          paymentStatus: "PAID",
          fulfillmentStatus: "FULFILLED",
          status: "APPROVED",
          priceSummary: {
            total: { formattedAmount: "R$ 189,99" },
            subtotal: { formattedAmount: "R$ 169,99" },
            shipping: { formattedAmount: "R$ 20,00" },
            tax: { formattedAmount: "R$ 0,00" },
          },
          lineItems: [
            {
              id: "item-1",
              productName: { original: "A Bruxa do Vale Sombrio" },
              quantity: 2,
              price: { formattedAmount: "R$ 84,99" },
            },
          ],
          recipientInfo: {
            address: {
              streetAddress: { name: "Rua das Flores", number: "123" },
              addressLine2: "Apto 45",
              city: "São Paulo",
              subdivision: "BR-SP",
              postalCode: "01310-000",
              country: "BR",
            },
            contactDetails: { firstName: "Maria", lastName: "Silva", phone: "11999999999" },
          },
        },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const order = await getOrder("order-1");

    expect(order).toEqual({
      id: "order-1",
      number: 1001,
      createdDate: "2026-08-20T12:00:00.000Z",
      buyerEmail: "cliente@example.com",
      totalFormatted: "R$ 189,99",
      paymentStatusLabel: "Pago",
      fulfillmentStatusLabel: "Entregue",
      orderStatusLabel: null,
      lineItems: [
        { id: "item-1", name: "A Bruxa do Vale Sombrio", quantity: 2, priceFormatted: "R$ 84,99" },
      ],
      shippingAddress: {
        recipientName: "Maria Silva",
        phone: "11999999999",
        street: "Rua das Flores",
        number: "123",
        addressLine2: "Apto 45",
        city: "São Paulo",
        subdivision: "BR-SP",
        postalCode: "01310-000",
        country: "BR",
      },
      priceSummary: {
        subtotalFormatted: "R$ 169,99",
        shippingFormatted: "R$ 20,00",
        taxFormatted: "R$ 0,00",
        totalFormatted: "R$ 189,99",
      },
    });
  });

  it("retorna null quando a Wix responde 404 (ORDER_NOT_FOUND)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ message: "not found" }, 404)));

    expect(await getOrder("inexistente")).toBeNull();
  });

  it("retorna shippingAddress null quando o pedido não tem recipientInfo.address", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          order: {
            id: "order-3",
            number: 1003,
            createdDate: "2026-08-22T09:00:00.000Z",
            buyerInfo: { email: "sem-endereco@example.com" },
            paymentStatus: "PAID",
            fulfillmentStatus: "NOT_FULFILLED",
            status: "APPROVED",
            priceSummary: {
              total: { formattedAmount: "R$ 30,00" },
              subtotal: { formattedAmount: "R$ 30,00" },
              shipping: { formattedAmount: "R$ 0,00" },
              tax: { formattedAmount: "R$ 0,00" },
            },
            lineItems: [],
          },
        }),
      ),
    );

    const order = await getOrder("order-3");
    expect(order?.shippingAddress).toBeNull();
  });

  it("propaga outros erros", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ message: "boom" }, 500)));

    await expect(getOrder("order-1")).rejects.toThrow();
  });

  it("codifica o orderId na URL", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      expect(url).toBe(`${WIX_API_BASE}/ecom/v1/orders/order%2Fwith%20slash`);
      return jsonResponse({ message: "not found" }, 404);
    });
    vi.stubGlobal("fetch", fetchMock);

    await getOrder("order/with slash");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("mapeia priceSummary.shipping/tax ausentes como \"—\" ao invés de lançar", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          order: {
            id: "order-5",
            number: 1005,
            createdDate: "2026-08-24T09:00:00.000Z",
            buyerInfo: { email: "preco-parcial@example.com" },
            paymentStatus: "PAID",
            fulfillmentStatus: "NOT_FULFILLED",
            status: "APPROVED",
            priceSummary: {
              total: { formattedAmount: "R$ 40,00" },
              subtotal: { formattedAmount: "R$ 40,00" },
              // shipping e tax ausentes de propósito
            },
            lineItems: [],
          },
        }),
      ),
    );

    const order = await getOrder("order-5");
    expect(order?.priceSummary).toEqual({
      subtotalFormatted: "R$ 40,00",
      shippingFormatted: "—",
      taxFormatted: "—",
      totalFormatted: "R$ 40,00",
    });
  });

  it("mapeia line item sem price/productName com fallback seguro ao invés de lançar", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          order: {
            id: "order-6",
            number: 1006,
            createdDate: "2026-08-24T10:00:00.000Z",
            buyerInfo: { email: "item-incompleto@example.com" },
            paymentStatus: "PAID",
            fulfillmentStatus: "NOT_FULFILLED",
            status: "APPROVED",
            priceSummary: {
              total: { formattedAmount: "R$ 10,00" },
              subtotal: { formattedAmount: "R$ 10,00" },
              shipping: { formattedAmount: "R$ 0,00" },
              tax: { formattedAmount: "R$ 0,00" },
            },
            lineItems: [{ id: "item-2", quantity: 1 }],
          },
        }),
      ),
    );

    const order = await getOrder("order-6");
    expect(order?.lineItems).toEqual([
      { id: "item-2", name: "", quantity: 1, priceFormatted: "—" },
    ]);
  });
});
