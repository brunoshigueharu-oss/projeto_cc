"use client";

import { useRef, useState } from "react";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";

import { AddToCartButton } from "@/components/add-to-cart-button";
import { BookCover, type BookCoverHandle } from "@/components/book-cover";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import type { Book, Combo } from "@/lib/data/schemas";
import { TONE_BACKGROUND } from "@/lib/tone";
import { cn } from "@/lib/utils";

/**
 * Preço já formatado por `combos-section.tsx` (Server Component): `formatPrice`
 * é `server-only` e não pode ser chamado daqui, que é Client Component.
 */
export type CombosCarouselItem = {
  combo: Combo;
  books: readonly Book[];
  formattedPrice: string;
  /** `null` quando o combo não tem desconto sobre a soma dos livros. */
  formattedOriginalPrice: string | null;
};

type CombosCarouselProps = {
  combos: readonly CombosCarouselItem[];
};

/**
 * Único ponto com JS de cliente da seção de combos — precisa do embla
 * (`components/ui/carousel.tsx`) pra rodar o autoplay e as setas. O resto da
 * página de livro renderiza no servidor, mesma exceção já documentada em
 * `parallax-section.tsx`.
 */
export function CombosCarousel({ combos }: CombosCarouselProps) {
  const [autoplayPlugin] = useState(() =>
    Autoplay({ delay: 5000, stopOnInteraction: false }),
  );

  return (
    <Carousel
      opts={{ loop: combos.length > 1 }}
      plugins={[autoplayPlugin]}
      className="w-full"
    >
      <CarouselContent>
        {combos.map(({ combo, books, formattedPrice, formattedOriginalPrice }) => (
          <CarouselItem key={combo.slug}>
            <ComboBanner
              combo={combo}
              books={books}
              formattedPrice={formattedPrice}
              formattedOriginalPrice={formattedOriginalPrice}
            />
          </CarouselItem>
        ))}
      </CarouselContent>

      {combos.length > 1 ? (
        <>
          <CarouselPrevious className="left-4" />
          <CarouselNext className="right-4" />
        </>
      ) : null}
    </Carousel>
  );
}

function ComboBanner({
  combo,
  books,
  formattedPrice,
  formattedOriginalPrice,
}: {
  combo: Combo;
  books: readonly Book[];
  formattedPrice: string;
  formattedOriginalPrice: string | null;
}) {
  const tone = books[0]?.coverTone ?? "garnet";

  if (combo.image) {
    return (
      <div className="relative aspect-21/9 w-full overflow-hidden rounded-[28px] border border-border sm:aspect-32/9">
        <Image
          src={combo.image.src}
          alt={combo.image.alt}
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 1152px, 100vw"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent"
        />
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
          <ComboContent
            combo={combo}
            formattedPrice={formattedPrice}
            formattedOriginalPrice={formattedOriginalPrice}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-8 rounded-[28px] border border-border p-8 sm:flex-row sm:items-center sm:gap-12 sm:p-12",
        TONE_BACKGROUND[tone],
      )}
    >
      <div className="flex shrink-0 -space-x-10 sm:-space-x-14">
        {books.map((book) => (
          <ComboBookThumbnail key={book.slug} book={book} />
        ))}
      </div>

      <ComboContent
        combo={combo}
        formattedPrice={formattedPrice}
        formattedOriginalPrice={formattedOriginalPrice}
      />
    </div>
  );
}

/** Dono da ref do vídeo — o BookCover nunca toca sozinho, quem o envolve
 *  detecta o hover e chama play/pause (ver comentário em book-cover.tsx). */
function ComboBookThumbnail({ book }: { book: Book }) {
  const coverRef = useRef<BookCoverHandle>(null);

  return (
    <div
      className="w-28 sm:w-36"
      onMouseEnter={() => coverRef.current?.play()}
      onMouseLeave={() => coverRef.current?.pause()}
    >
      <BookCover
        ref={coverRef}
        title={book.title}
        alt={book.coverAlt}
        videoSrc={book.coverVideoSrc}
        videoScale={book.coverVideoScale}
        videoFit={book.coverVideoFit}
      />
    </div>
  );
}

/** Texto sempre branco: os dois fundos possíveis do banner (overlay escuro
 * sobre `combo.image`, ou `TONE_BACKGROUND` do fallback) são escuros. */
function ComboContent({
  combo,
  formattedPrice,
  formattedOriginalPrice,
}: {
  combo: Combo;
  formattedPrice: string;
  formattedOriginalPrice: string | null;
}) {
  return (
    <div className="flex flex-col items-start gap-3">
      <h3 className="font-display text-2xl text-white sm:text-3xl">{combo.title}</h3>
      <p className="max-w-md font-serif leading-relaxed text-white/85">
        {combo.description}
      </p>

      <div className="mt-1 flex flex-wrap items-center gap-3">
        <span className="font-mono text-2xl font-bold tabular-nums text-white">
          {formattedPrice}
        </span>
        {formattedOriginalPrice ? (
          <span className="font-mono text-sm text-white/60 line-through tabular-nums">
            {formattedOriginalPrice}
          </span>
        ) : null}
      </div>

      <AddToCartButton
        type="combo"
        slug={combo.slug}
        label={combo.ctaLabel}
        addedLabel="Adicionado!"
        className="mt-2"
      />
    </div>
  );
}
