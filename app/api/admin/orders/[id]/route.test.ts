/**
 * @vitest-environment node
 */
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/wix/resolve-member", () => ({ resolveMemberFromRequest: vi.fn() }));
vi.mock("@/lib/wix/admin", () => ({ isAdminEmail: vi.fn() }));
vi.mock("@/lib/wix/orders", () => ({ getOrder: vi.fn() }));

import { isAdminEmail } from "@/lib/wix/admin";
import { getOrder } from "@/lib/wix/orders";
import { resolveMemberFromRequest } from "@/lib/wix/resolve-member";

import { POST } from "./route";

const mockedResolveMember = vi.mocked(resolveMemberFromRequest);
const mockedIsAdminEmail = vi.mocked(isAdminEmail);
const mockedGetOrder = vi.mocked(getOrder);

function buildRequest() {
  return new Request("http://localhost/api/admin/orders/order-1", { method: "POST" });
}

function buildContext(id = "order-1") {
  return { params: Promise.resolve({ id }) };
}

describe("POST /api/admin/orders/[id]", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("retorna 401 sem chamar isAdminEmail/getOrder quando não há membro autenticado", async () => {
    mockedResolveMember.mockResolvedValue(null);

    const res = await POST(buildRequest(), buildContext());

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "unauthorized" });
    expect(mockedIsAdminEmail).not.toHaveBeenCalled();
    expect(mockedGetOrder).not.toHaveBeenCalled();
  });

  it("retorna 403 sem chamar getOrder quando o membro não é admin", async () => {
    mockedResolveMember.mockResolvedValue({ email: "user@example.com", id: "member-1" });
    mockedIsAdminEmail.mockResolvedValue(false);

    const res = await POST(buildRequest(), buildContext());

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "forbidden" });
    expect(mockedGetOrder).not.toHaveBeenCalled();
  });

  it("retorna 404 quando o pedido não existe", async () => {
    mockedResolveMember.mockResolvedValue({ email: "admin@example.com", id: "member-1" });
    mockedIsAdminEmail.mockResolvedValue(true);
    mockedGetOrder.mockResolvedValue(null);

    const res = await POST(buildRequest(), buildContext("inexistente"));

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "not_found" });
    expect(mockedGetOrder).toHaveBeenCalledWith("inexistente");
  });

  it("retorna 200 com o pedido quando o membro é admin", async () => {
    mockedResolveMember.mockResolvedValue({ email: "admin@example.com", id: "member-1" });
    mockedIsAdminEmail.mockResolvedValue(true);
    const order = {
      id: "order-1",
      number: 1001,
      createdDate: "2026-08-20T12:00:00.000Z",
      buyerEmail: "cliente@example.com",
      totalFormatted: "R$ 189,99",
      paymentStatusLabel: "Pago",
      fulfillmentStatusLabel: "Entregue",
      orderStatusLabel: null,
      lineItems: [],
      shippingAddress: null,
      priceSummary: {
        subtotalFormatted: "R$ 169,99",
        shippingFormatted: "R$ 20,00",
        taxFormatted: "R$ 0,00",
        totalFormatted: "R$ 189,99",
      },
    };
    mockedGetOrder.mockResolvedValue(order);

    const res = await POST(buildRequest(), buildContext());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ order });
  });

  it("retorna 500 sem vazar o erro cru quando getOrder lança", async () => {
    mockedResolveMember.mockResolvedValue({ email: "admin@example.com", id: "member-1" });
    mockedIsAdminEmail.mockResolvedValue(true);
    mockedGetOrder.mockRejectedValue(new Error("Wix Orders get falhou: 500"));

    const res = await POST(buildRequest(), buildContext());

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "internal" });
  });
});
