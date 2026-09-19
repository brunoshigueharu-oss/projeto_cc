import { AddToCartButton } from "@/components/add-to-cart-button";
import { BookCover } from "@/components/book-cover";
import { Badge } from "@/components/ui/badge";
import { isPurchasable as isBookPurchasable } from "@/lib/data/book-availability";
import type { Book, Campaign } from "@/lib/data/schemas";

/**
 * Edição especial do título da campanha (`campaign.specialEdition`), fechando
 * a página — hoje a Edição Noite do Yanayag, variante de capa em tiragem
 * limitada.
 *
 * Repete de propósito a vitrine de `campaign-about`: mesma grade
 * `0.8fr_1.2fr`, mesma capa em vídeo tocando com controle de pausa, mesmo CTA
 * de carrinho. A página já ensinou o leitor a ler esse bloco como "o
 * exemplar"; a edição limitada é o mesmo exemplar com outra capa, então mudar
 * o layout aqui só sugeriria um produto de outra natureza. O que separa as
 * duas é o kicker e a posição — esta vem depois de tudo, atrás de uma
 * `border-t`, como último passo da leitura.
 *
 * Sem preço: enquanto a editora não fechar o valor da tiragem (ver a nota em
 * `specialEdition`, em `lib/data/campaigns.ts`), mostrar o preço espelhado da
 * edição padrão prometeria um número que pode mudar.
 */
export function CampaignSpecialEdition({
  campaign,
  book,
}: {
  campaign: Campaign;
  book: Book | undefined;
}) {
  const { specialEdition } = campaign;

  if (!specialEdition || !book) {
    return null;
  }

  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-16">
          <div className="mx-auto w-full max-w-xs lg:mx-0">
            <BookCover
              title={book.title}
              alt={book.coverAlt}
              videoSrc={book.coverVideoSrc}
              videoScale={book.coverVideoScale}
              videoFit={book.coverVideoFit}
              showPauseControl
              size="lg"
              className="w-full"
            />
          </div>

          <div className="flex flex-col items-start gap-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
              {specialEdition.kicker}
            </p>

            <div className="flex flex-col gap-4">
              <h2 className="text-balance font-display text-2xl text-foreground sm:text-3xl">
                {specialEdition.headline}
              </h2>
              <p className="font-serif leading-relaxed text-foreground/70">
                {specialEdition.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-5">
              {isBookPurchasable(book.status) ? (
                <AddToCartButton
                  type="book"
                  slug={book.slug}
                  label={specialEdition.ctaLabel}
                  addedLabel="Adicionado!"
                />
              ) : (
                <span className="rounded-full border border-border px-7 py-3 text-sm font-medium text-foreground/50">
                  Tiragem esgotada
                </span>
              )}
              <Badge variant="secondary">Tiragem limitada</Badge>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
