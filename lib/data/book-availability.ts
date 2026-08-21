import type { Book } from "./schemas";

type BookStatus = Book["status"];

/** Fonte única do predicado "esse status permite compra?" — antes reimplementado de forma independente na vitrine, no carrinho e no checkout. */
export function isSoldOut(status: BookStatus): boolean {
  return status === "esgotado";
}

export function isPreOrder(status: BookStatus): boolean {
  return status === "pre-venda";
}

export function isInStock(status: BookStatus): boolean {
  return status === "disponivel";
}

export function isPurchasable(status: BookStatus): boolean {
  return !isSoldOut(status);
}
