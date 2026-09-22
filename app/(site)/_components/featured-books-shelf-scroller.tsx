"use client";

import { useEffect, useState } from "react";

import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import type { Book } from "@/lib/data/schemas";
import { cn } from "@/lib/utils";
import { FeaturedBookCard } from "./featured-book-card";

type FeaturedBooksShelfScrollerProps = {
  books: readonly Book[];
};

/** Mesma pílula de vidro das setas do resto do site (`box-contents-section.tsx`,
 * `campaign-pages-gallery.tsx`): sobre fundo claro o vidro é `background/80`
 * com blur, não o `white/8` que o Hero usa sobre vídeo. Aqui ela corre por
 * cima da arte dos cards, que é escura — daí o chevron `foreground` sobre o
 * disco claro, e não o contrário. */
const NAV_BUTTON_CLASSNAME =
  "hidden size-11 border-border bg-background/80 text-foreground shadow-sm backdrop-blur-[10px] hover:bg-background disabled:opacity-40 sm:flex";

/**
 * Prateleira de livros da Home, em carrossel infinito (embla) — o mesmo
 * sistema dos itens da caixa e da galeria de páginas da campanha, no lugar do
 * scroller de arrasto próprio que existia aqui.
 *
 * `loop` faz a fileira dar a volta: depois do último livro vem o primeiro, e a
 * seta anterior já nasce ativa. Só é ligado com mais de um livro porque o
 * embla desliga o loop sozinho (e avisa no console) quando os slides não
 * enchem o viewport.
 *
 * Sem `dragFree`, com `skipSnaps: true`: o card é médio e as bolinhas embaixo
 * precisam de um índice estável, então todo gesto termina alinhado num livro.
 * O `skipSnaps` é o que tira o puxão de volta no fim do gesto — sem ele o
 * embla volta o trilho para um snap adiante de **onde o gesto começou**, não
 * de onde ele parou, e um swipe de trackpad ia e voltava. Mesmo motivo (e
 * mesma explicação longa) de `campaign-pages-gallery.tsx`. `duration: 30` é a
 * constante do tween do embla, não milissegundos — um fio mais lenta que o
 * padrão (25) para o encaixe não ficar seco.
 *
 * `basis` cresce em degraus para o ritmo não mudar: ~1,6 cards no telefone,
 * ~2,4 no tablet e ~3,5 no desktop — sempre com um card cortado na borda,
 * que é o que conta que a fileira continua. O `WheelGesturesPlugin` dá o
 * scroll horizontal de trackpad, que o embla não traz de fábrica.
 */
export function FeaturedBooksShelfScroller({ books }: FeaturedBooksShelfScrollerProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [wheelGesturesPlugin] = useState(() => WheelGesturesPlugin());

  useEffect(() => {
    if (!api) return;

    const handleSelect = () => setSelectedIndex(api.selectedScrollSnap());

    // Sincroniza já na montagem: o embla não emite "select" ao inicializar, e
    // sem isso a primeira bolinha só acenderia no primeiro gesto. Mesmo
    // padrão (e mesmo motivo) do `onSelect` em `components/ui/carousel.tsx`.
    handleSelect();
    api.on("select", handleSelect);
    api.on("reInit", handleSelect);

    return () => {
      api.off("select", handleSelect);
      api.off("reInit", handleSelect);
    };
  }, [api]);

  return (
    <div className="mt-10">
      <Carousel
        setApi={setApi}
        opts={{ loop: books.length > 1, align: "start", skipSnaps: true, duration: 30 }}
        plugins={[wheelGesturesPlugin]}
        className="w-full"
      >
        <CarouselContent className="-ml-5 cursor-grab active:cursor-grabbing sm:-ml-6">
          {books.map((book) => (
            <CarouselItem
              key={book.slug}
              className="basis-[62%] pl-5 sm:basis-[42%] sm:pl-6 lg:basis-[28%]"
            >
              <FeaturedBookCard book={book} className="select-none" />
            </CarouselItem>
          ))}
        </CarouselContent>

        {books.length > 1 ? (
          <>
            {/* `aria-label` em português: o `sr-only` dentro do primitivo
                shadcn é fixo em inglês e não dá para substituir por children,
                e o aria-label tem precedência sobre ele. O Hero, que monta os
                próprios botões, já rotula as setas assim. */}
            <CarouselPrevious
              aria-label="Livro anterior"
              className={cn(NAV_BUTTON_CLASSNAME, "left-2 sm:left-4")}
            />
            <CarouselNext
              aria-label="Próximo livro"
              className={cn(NAV_BUTTON_CLASSNAME, "right-2 sm:right-4")}
            />
          </>
        ) : null}
      </Carousel>

      {/* As bolinhas moram fora do `<Carousel>` de propósito: as setas se
          centram na altura do elemento do carrossel (`inset-y-0 my-auto`), e
          com elas dentro o eixo desceria meia fileira de bolinhas. */}
      {books.length > 1 ? (
        <div className="mt-6 flex items-center justify-center gap-2">
          {books.map((book, index) => (
            <button
              key={book.slug}
              type="button"
              aria-label={`Ir para ${book.title}`}
              aria-current={index === selectedIndex}
              onClick={() => api?.scrollTo(index)}
              className={cn(
                "h-1.5 rounded-full bg-foreground/15 transition-all",
                index === selectedIndex ? "w-6 bg-primary" : "w-1.5 hover:bg-foreground/30",
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
