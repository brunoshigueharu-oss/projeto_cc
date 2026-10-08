import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";

const getPlacedOrder = vi.hoisted(() => vi.fn());
vi.mock("@/lib/wix/ecom", () => ({ getPlacedOrder }));

import { CartProvider } from "@/lib/cart/cart-context";
import { savePendingCheckout } from "@/lib/cart/pending-checkout";
import { BOOKS_BY_SLUG } from "@/lib/data/books";
import { ConfirmationContent } from "./confirmation-content";

const CART_KEY = "hocus-pocus:cart";
const [slugA, slugB] = [...BOOKS_BY_SLUG.keys()];
const lineA = { type: "book", slug: slugA, quantity: 2 } as const;
const lineB = { type: "book", slug: slugB, quantity: 1 } as const;

const cart = () => JSON.parse(localStorage.getItem(CART_KEY) ?? "[]");
const setCart = (lines: unknown[]) => localStorage.setItem(CART_KEY, JSON.stringify(lines));

let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;

async function mount(orderId?: string) {
  root = createRoot(container);
  await act(async () =>
    root.render(
      <CartProvider>
        <ConfirmationContent orderId={orderId} />
      </CartProvider>,
    ),
  );
}

async function remount(orderId?: string) {
  await act(() => root.unmount());
  await mount(orderId);
}

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  vi.spyOn(console, "error").mockImplementation(() => {});
  getPlacedOrder.mockReset();
  container = document.createElement("div");
  document.body.append(container);
});

afterEach(async () => {
  await act(() => root.unmount());
  container.remove();
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("ConfirmationContent", () => {
  it("confirma o pedido aprovado e remove só o que foi comprado", async () => {
    setCart([lineA, lineB]);
    savePendingCheckout("checkout-1", [lineA]);
    getPlacedOrder.mockResolvedValue({ checkoutId: "checkout-1", number: "1042", status: "APPROVED" });

    await mount("order-1");

    expect(container.textContent).toContain("Pedido confirmado!");
    expect(container.textContent).toContain("1042");
    expect(cart()).toEqual([lineB]);
  });

  it("reabrir a confirmação antiga não apaga um carrinho novo", async () => {
    setCart([lineA]);
    savePendingCheckout("checkout-1", [lineA]);
    getPlacedOrder.mockResolvedValue({ checkoutId: "checkout-1", number: "1042", status: "APPROVED" });
    await mount("order-1");
    expect(cart()).toEqual([]);

    setCart([lineA, lineB]);
    await remount("order-1");

    expect(container.textContent).toContain("Pedido confirmado!");
    expect(cart()).toEqual([lineA, lineB]);
  });

  it("não usa a confirmação antiga para conciliar um checkout novo em andamento", async () => {
    setCart([lineA]);
    savePendingCheckout("checkout-2", [lineA]);
    getPlacedOrder.mockResolvedValue({ checkoutId: "checkout-1", number: "1042", status: "APPROVED" });

    await mount("order-1");

    expect(cart()).toEqual([lineA]);
  });

  it("não confirma nem mexe no carrinho quando o pedido não é desta pessoa", async () => {
    setCart([lineA]);
    savePendingCheckout("checkout-1", [lineA]);
    getPlacedOrder.mockResolvedValue(null);

    await mount("order-inventado");

    expect(container.textContent).toContain("Não encontramos este pedido");
    expect(container.textContent).not.toContain("Pedido confirmado!");
    expect(cart()).toEqual([lineA]);
  });

  it("preserva o carrinho quando o pagamento foi cancelado ou recusado", async () => {
    setCart([lineA]);
    savePendingCheckout("checkout-1", [lineA]);
    getPlacedOrder.mockResolvedValue({ checkoutId: "checkout-1", number: "1042", status: "CANCELED" });

    await mount("order-1");

    expect(container.textContent).toContain("Este pedido não foi concluído");
    expect(cart()).toEqual([lineA]);
  });

  it("não declara pagamento aprovado enquanto o pedido aguarda pagamento", async () => {
    setCart([lineA]);
    savePendingCheckout("checkout-1", [lineA]);
    getPlacedOrder.mockResolvedValue({ checkoutId: "checkout-1", number: "1042", status: "PENDING" });

    await mount("order-1");

    expect(container.textContent).toContain("Pedido recebido");
    expect(container.textContent).not.toContain("Pedido confirmado!");
    expect(cart()).toEqual([]);
  });

  it("em falha de consulta mantém o carrinho e deixa tentar de novo", async () => {
    setCart([lineA]);
    savePendingCheckout("checkout-1", [lineA]);
    getPlacedOrder.mockRejectedValueOnce(new Error("network down"));

    await mount("order-1");

    expect(container.textContent).toContain("Não conseguimos conferir seu pedido");
    expect(cart()).toEqual([lineA]);

    getPlacedOrder.mockResolvedValue({ checkoutId: "checkout-1", number: "1042", status: "APPROVED" });
    await act(async () => container.querySelector("button")!.click());

    expect(container.textContent).toContain("Pedido confirmado!");
    expect(cart()).toEqual([]);
  });

  it("sem orderId não consulta nada nem mexe no carrinho", async () => {
    setCart([lineA]);
    savePendingCheckout("checkout-1", [lineA]);

    await mount(undefined);

    expect(container.textContent).toContain("Nenhum pedido para confirmar");
    expect(getPlacedOrder).not.toHaveBeenCalled();
    expect(cart()).toEqual([lineA]);
  });
});
