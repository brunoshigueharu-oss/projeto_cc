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

export type CartAvailability =
  | { available: true; unavailableReason: null; wixProductId: string }
  | { available: false; unavailableReason: "esgotado" | "sem-produto-wix"; wixProductId: string | undefined };

/**
 * Disponibilidade pro carrinho/checkout — mais restrita que `isPurchasable`:
 * além do status local, o item só pode seguir pro checkout se também tiver
 * um produto Wix Stores mapeado (`wixProductId`). Usada por
 * `lib/cart/cart-context.tsx` pra book e combo — combo não tem status, então
 * omite `purchasableByStatus` (default `true`). Retorna união discriminada —
 * o `wixProductId` só é `string` (sem `| undefined`) quando `available` é
 * `true`, então quem consome não precisa de type-cast pra montar o pedido.
 */
export function resolveCartAvailability(
  wixProductId: string | undefined,
  purchasableByStatus = true,
): CartAvailability {
  if (!purchasableByStatus) return { available: false, unavailableReason: "esgotado", wixProductId };
  if (!wixProductId) return { available: false, unavailableReason: "sem-produto-wix", wixProductId: undefined };
  return { available: true, unavailableReason: null, wixProductId };
}
