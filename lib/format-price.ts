/**
 * Formatação de preço isomórfica (server e client) — extraída para não
 * duplicar a construção do `Intl.NumberFormat` entre `lib/format.ts`
 * (`server-only`) e `lib/cart/format-price.ts` (client, carrinho/checkout).
 */

const priceFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** Recebe centavos (ver `price.amount` no schema). */
export function formatPrice(amountInCents: number): string {
  return priceFormatter.format(amountInCents / 100);
}
