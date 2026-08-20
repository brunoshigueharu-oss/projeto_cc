const priceFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/**
 * Versão client-safe de `lib/format.ts#formatPrice` — aquele módulo é
 * `server-only` de propósito (evita erro de hidratação em conteúdo
 * renderizado no servidor). O carrinho/checkout são client-only
 * (localStorage), sem SSR do conteúdo dinâmico para divergir, mas ainda
 * assim não podem importar um módulo `server-only`.
 */
export function formatPriceClient(amountInCents: number): string {
  return priceFormatter.format(amountInCents / 100);
}
