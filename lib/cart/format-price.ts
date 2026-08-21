import { formatPrice } from "@/lib/format-price";

/**
 * Alias client-safe de `formatPrice` — `lib/format.ts` é `server-only` de
 * propósito (ver comentário lá), e o carrinho/checkout são client-only
 * (localStorage), então não podem importar aquele módulo.
 */
export const formatPriceClient = formatPrice;
