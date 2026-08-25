/**
 * @vitest-environment node
 */
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/wix/resolve-member", () => ({ resolveMemberFromRequest: vi.fn() }));
vi.mock("@/lib/wix/admin", () => ({ isAdminEmail: vi.fn() }));
vi.mock("@/lib/wix/orders", () => ({ searchOrders: vi.fn() }));

import { isAdminEmail } from "@/lib/wix/admin";
import { searchOrders } from "@/lib/wix/orders";
import { resolveMemberFromRequest } from "@/lib/wix/resolve-member";

import { POST } from "./route";

const mockedResolveMember = vi.mocked(resolveMemberFromRequest);
const mockedIsAdminEmail = vi.mocked(isAdminEmail);
const mockedSearchOrders = vi.mocked(searchOrders);

function buildRequest() {
  return new Request("http://localhost/api/admin/orders", { method: "POST" });
}

describe("POST /api/admin/orders", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("retorna 401 sem chamar isAdminEmail/searchOrders quando não há membro autenticado", async () => {
    mockedResolveMember.mockResolvedValue(null);

    const res = await POST(buildRequest());

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "unauthorized" });
    expect(mockedIsAdminEmail).not.toHaveBeenCalled();
    expect(mockedSearchOrders).not.toHaveBeenCalled();
  });

  it("retorna 403 sem chamar searchOrders quando o membro não é admin", async () => {
    mockedResolveMember.mockResolvedValue({ email: "user@example.com", id: "member-1" });
    mockedIsAdminEmail.mockResolvedValue(false);

    const res = await POST(buildRequest());

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "forbidden" });
    expect(mockedSearchOrders).not.toHaveBeenCalled();
  });

  it("retorna 200 com a lista de pedidos quando o membro é admin", async () => {
    mockedResolveMember.mockResolvedValue({ email: "admin@example.com", id: "member-1" });
    mockedIsAdminEmail.mockResolvedValue(true);
    const orders = [
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
    ];
    mockedSearchOrders.mockResolvedValue(orders);

    const res = await POST(buildRequest());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ orders });
  });

  it("retorna 500 sem vazar o erro cru quando searchOrders lança", async () => {
    mockedResolveMember.mockResolvedValue({ email: "admin@example.com", id: "member-1" });
    mockedIsAdminEmail.mockResolvedValue(true);
    mockedSearchOrders.mockRejectedValue(new Error("Wix Orders search falhou: 500"));

    const res = await POST(buildRequest());

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "internal" });
  });
});
