import { formatPrice } from "@/lib/format";

import type { ResolvedCombo } from "../_data-access/get-book";
import { CombosCarousel, type CombosCarouselItem } from "./combos-carousel";

type CombosSectionProps = {
  combos: readonly ResolvedCombo[];
};

/**
 * Seção de combos promocionais (kits de livros com desconto), equivalente ao
 * pedido de "banners rotativos" no final da página. Retorna `null` quando
 * `combos` está vazio — combos são gerais do catálogo (ver
 * `lib/data/combos.ts`), então nem todo livro tem um combo que o inclua.
 *
 * Formata os preços aqui (Server Component) e passa strings prontas pro
 * carousel — `formatPrice` é `server-only`, não pode rodar no Client
 * Component que precisa do embla pro autoplay/setas.
 */
export function CombosSection({ combos }: CombosSectionProps) {
  if (combos.length === 0) {
    return null;
  }

  const items: CombosCarouselItem[] = combos.map(({ combo, books, originalPrice }) => ({
    combo,
    books,
    formattedPrice: formatPrice(combo.price.amount),
    formattedOriginalPrice:
      originalPrice > combo.price.amount ? formatPrice(originalPrice) : null,
  }));

  return (
    <section className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
          Combos especiais
        </span>
        <h2 className="mt-3 font-display text-2xl text-foreground sm:text-3xl">
          Leve mais e economize
        </h2>

        <div className="mt-10">
          <CombosCarousel combos={items} />
        </div>
      </div>
    </section>
  );
}
