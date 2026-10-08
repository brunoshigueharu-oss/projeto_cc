import { afterEach, describe, expect, it } from "vitest";

import { reconcilePendingCheckout, savePendingCheckout } from "./pending-checkout";

const CART_KEY = "hocus-pocus:cart";
const cart = () => JSON.parse(localStorage.getItem(CART_KEY) ?? "[]");
const setCart = (lines: unknown[]) => localStorage.setItem(CART_KEY, JSON.stringify(lines));

const bookA = { type: "book", slug: "a", quantity: 2 } as const;
const bookB = { type: "book", slug: "b", quantity: 1 } as const;

afterEach(() => localStorage.clear());

describe("reconcilePendingCheckout", () => {
  it("remove só a composição do checkout confirmado", () => {
    setCart([bookA, bookB]);
    savePendingCheckout("checkout-1", [bookA, bookB]);

    expect(reconcilePendingCheckout("checkout-1")).toBe(true);
    expect(cart()).toEqual([]);
  });

  it("preserva itens e unidades acrescentados depois de o checkout começar", () => {
    savePendingCheckout("checkout-1", [bookA]);
    setCart([{ ...bookA, quantity: 3 }, bookB]);

    reconcilePendingCheckout("checkout-1");

    expect(cart()).toEqual([{ ...bookA, quantity: 1 }, bookB]);
  });

  it("é idempotente: repetir a confirmação não desconta de novo", () => {
    setCart([bookA]);
    savePendingCheckout("checkout-1", [bookA]);
    reconcilePendingCheckout("checkout-1");
    setCart([bookA]);

    expect(reconcilePendingCheckout("checkout-1")).toBe(false);
    expect(cart()).toEqual([bookA]);
  });

  it("não toca no carrinho quando o pedido é de outro checkout", () => {
    setCart([bookA]);
    savePendingCheckout("checkout-2", [bookA]);

    expect(reconcilePendingCheckout("checkout-1")).toBe(false);
    expect(cart()).toEqual([bookA]);
    // O checkout em andamento continua conciliável.
    expect(reconcilePendingCheckout("checkout-2")).toBe(true);
  });

  it("não toca no carrinho sem checkout pendente ou com registro corrompido", () => {
    setCart([bookA]);
    expect(reconcilePendingCheckout("checkout-1")).toBe(false);

    localStorage.setItem("hocus-pocus:pending-checkout", "{not json");
    expect(reconcilePendingCheckout("checkout-1")).toBe(false);
    expect(cart()).toEqual([bookA]);
  });
});
