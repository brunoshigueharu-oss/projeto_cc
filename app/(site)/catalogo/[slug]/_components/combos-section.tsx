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

  const items: CombosCarouselItem[] = combos.map(({ combo, books }) => ({
    combo,
    books,
    formattedPrice: formatPrice(combo.price.amount),
    formattedOriginalPrice: combo.originalPrice
      ? formatPrice(combo.originalPrice.amount)
      : null,
    // Só as faixas dos livros DO KIT, na ordem de `combo.bookSlugs`: o combo
    // é divulgado também na página de títulos que não fazem parte dele (ver
    // `showOnBookSlugs` em lib/data/combos.ts), e usar a faixa da página
    // colocava no banner o close-up de um livro que não está na oferta.
    // `Set` porque duas edições do kit podem apontar para o mesmo arquivo.
    videoSrcs: [
      ...new Set(
        books
          .map((kitBook) => kitBook.videoBannerSrc)
          .filter((src): src is string => src !== undefined),
      ),
    ],
  }));

  return (
    // Fundo branco como as demais seções da página — quem se destaca aqui é o
    // banner do combo (o vídeo, o amarelo do CTA), não a faixa atrás dele.
    <section className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <span className="text-[11px] font-bold tracking-[0.2em] text-primary uppercase">
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
