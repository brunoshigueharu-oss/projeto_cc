"use client";

import { useEffect, useRef, useState } from "react";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";
import { Star, Truck } from "lucide-react";

import { AddToCartButton } from "@/components/add-to-cart-button";
import { BookCover } from "@/components/book-cover";
import { LazyVideo } from "@/components/lazy-video";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import type { Book, Combo } from "@/lib/data/schemas";
import { cn } from "@/lib/utils";

/**
 * Preço já formatado por `combos-section.tsx` (Server Component): `formatPrice`
 * é `server-only` e não pode ser chamado daqui, que é Client Component.
 */
export type CombosCarouselItem = {
  combo: Combo;
  books: readonly Book[];
  formattedPrice: string;
  /** `null` quando o combo não tem preço "de" (sem `originalPrice`). */
  formattedOriginalPrice: string | null;
  /** Faixa de vídeo que roda atrás do título, escolhida em
   *  `combos-section.tsx`. `null` quando nenhum livro envolvido tem faixa. */
  videoSrc: string | null;
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
        {combos.map((item) => (
          <CarouselItem key={item.combo.slug}>
            <ComboBanner item={item} />
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

/**
 * Banner em duas colunas: a faixa de vídeo com o nome do combo por cima à
 * esquerda e o painel branco da oferta (o que vem no kit, preço e CTA) à
 * direita — empilha no mobile, vídeo primeiro.
 */
function ComboBanner({ item }: { item: CombosCarouselItem }) {
  const { combo, books, formattedPrice, formattedOriginalPrice, videoSrc } = item;

  return (
    // Fundo da seção e painel da oferta são os dois brancos, então quem
    // recorta o banner é a `border-border` bege — o `ring-foreground/10` do
    // padrão de Card é escuro demais pra ficar rente ao vídeo e claro demais
    // pra segurar o painel, e some contra o branco da seção.
    <div className="grid overflow-hidden rounded-[28px] border border-border shadow-lg shadow-foreground/10 lg:grid-cols-[3fr_2fr]">
      <ComboStage combo={combo} videoSrc={videoSrc} />
      <ComboOffer
        combo={combo}
        books={books}
        formattedPrice={formattedPrice}
        formattedOriginalPrice={formattedOriginalPrice}
      />
    </div>
  );
}

/**
 * Painel da esquerda: faixa de vídeo em loop (mudo, como as demais faixas do
 * site — ver `video-banner-section.tsx`), escurecida por um degradê para o
 * nome do combo em branco ficar legível em qualquer frame.
 *
 * Sem vídeo, cai na arte dedicada do combo (`combo.image`) e, sem ela, no
 * marrom sólido — o título branco funciona nos três casos.
 */
function ComboStage({ combo, videoSrc }: { combo: Combo; videoSrc: string | null }) {
  return (
    // No mobile a altura é só dessa faixa (o painel vem embaixo), e o título
    // de combo mais longo ocupa três linhas — daí o piso mais alto que o
    // `min-h-64` que bastaria para o vídeo sozinho.
    <div className="relative min-h-72 overflow-hidden bg-primary sm:min-h-80 lg:min-h-[26rem]">
      {videoSrc ? (
        // `LazyVideo` porque o embla monta TODOS os slides do carrossel de
        // uma vez: com `<video src>` cru, os combos fora de tela baixavam a
        // faixa inteira cada um, em paralelo com o resto da página.
        <LazyVideo
          aria-hidden="true"
          className="absolute inset-0 size-full object-cover"
          src={videoSrc}
          autoPlay
          loop
          muted
          playsInline
        />
      ) : combo.image ? (
        <Image
          src={combo.image.src}
          alt={combo.image.alt}
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 690px, 100vw"
        />
      ) : null}

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-t from-foreground/85 via-foreground/30 to-foreground/5"
      />

      <h3 className="absolute inset-x-0 bottom-0 p-6 font-display text-2xl leading-tight font-bold text-balance text-white sm:p-8 sm:text-3xl lg:text-4xl">
        {combo.title}
      </h3>
    </div>
  );
}

/**
 * Painel da direita: o que vem no kit (uma linha por livro, capa parada), o
 * preço e o CTA largo em amarelo da marca. Fundo branco igual ao da seção —
 * quem recorta o banner é a borda arredondada de `ComboBanner`.
 */
function ComboOffer({
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
  return (
    <div className="flex flex-col gap-6 bg-background p-6 sm:p-8">
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-bold tracking-[0.2em] text-primary uppercase">
          {books.length} títulos no kit
        </span>
        <p className="font-serif text-sm leading-relaxed text-foreground/70">
          {combo.description}
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {books.map((book) => (
          <ComboBookRow key={book.slug} book={book} />
        ))}
      </ul>

      <div className="mt-auto flex flex-col gap-4 border-t border-border pt-5">
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <div className="flex flex-col">
            {formattedOriginalPrice ? (
              <ComboOriginalPrice formattedOriginalPrice={formattedOriginalPrice} />
            ) : null}
            <span className="flex items-center gap-2 font-display text-3xl font-bold text-foreground tabular-nums sm:text-4xl">
              {formattedOriginalPrice ? <span className="sr-only">Por </span> : null}
              {formattedPrice}
              {formattedOriginalPrice ? (
                <Star
                  aria-hidden="true"
                  className="size-6 animate-combo-star fill-brand-yellow text-brand-yellow sm:size-7"
                />
              ) : null}
            </span>
          </div>

          {combo.freeShipping ? (
            <span className="flex items-center gap-1.5 pb-1 text-xs font-bold tracking-[0.08em] text-primary uppercase">
              <Truck aria-hidden="true" className="size-4" />
              Frete grátis
            </span>
          ) : null}
        </div>

        <AddToCartButton
          type="combo"
          slug={combo.slug}
          label={combo.ctaLabel}
          addedLabel="Adicionado!"
          variant="brand"
          className="h-12 w-full text-base"
        />
      </div>
    </div>
  );
}

/**
 * Preço "de" que se risca sozinho: o traço cresce da esquerda pra direita
 * quando o banner entra em cena, e refaz o gesto toda vez que o slide volta
 * (o `overflow-hidden` do carousel tira os slides parados de vista, então o
 * observer já devolve `false` pra eles).
 *
 * O `<s>` perde o `line-through` nativo (`no-underline`) porque
 * `text-decoration` não anima — quem risca é o `<span>` posicionado. Esse
 * traço nasce sem `transform`, ou seja, já riscado: sem JS, ou com
 * reduced-motion, o preço antigo continua cortado. A animação mostra o
 * gesto, nunca é ela que informa o desconto.
 */
function ComboOriginalPrice({
  formattedOriginalPrice,
}: {
  formattedOriginalPrice: string;
}) {
  const priceRef = useRef<HTMLElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const node = priceRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 1 },
    );
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return (
    <s
      ref={priceRef}
      className="relative w-fit font-display text-sm text-muted-foreground no-underline tabular-nums"
    >
      <span className="sr-only">De </span>
      {formattedOriginalPrice}
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-x-0 top-1/2 h-px origin-left bg-muted-foreground",
          isInView && "animate-combo-strike",
        )}
      />
    </s>
  );
}

/** Uma linha do kit: capa pequena + título e autor, a linha inteira levando
 *  à página do livro. O link sai do título e se estica sobre a linha com
 *  `after:inset-0` (mesmo padrão de `components/book-card.tsx`): o card todo
 *  fica clicável, mas com uma única parada de tabulação, e o leitor de tela
 *  anuncia o link pelo título, não pela descrição da capa.
 *
 *  A capa continua parada no frame frontal (`still`) — aqui ela é referência
 *  visual do item da lista, não o objeto em destaque —, mas o `group` liga o
 *  zoom de hover/foco do BookCover, que é o sinal de que dá pra clicar. */
function ComboBookRow({ book }: { book: Book }) {
  return (
    <li className="group relative flex items-center gap-3">
      <BookCover
        title={book.title}
        alt={book.coverAlt}
        videoSrc={book.coverVideoSrc}
        videoScale={book.coverVideoScale}
        videoFit={book.coverVideoFit}
        still
        className="w-12 shrink-0 sm:w-14"
      />
      <div className="min-w-0">
        <p className="font-display text-sm leading-snug font-semibold text-foreground">
          <Link
            href={`/catalogo/${book.slug}`}
            className="rounded underline-offset-4 outline-none after:absolute after:inset-0 after:content-[''] group-hover:text-primary group-hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {book.title}
          </Link>
        </p>
        <p className="text-xs text-muted-foreground">{book.author.name}</p>
      </div>
    </li>
  );
}
