"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import type { Book, Locale } from "@/lib/data/schemas";

const DIALOG_LABELS: Record<Locale, string> = {
  pt: "Itens da caixa",
  en: "Box contents",
};

const NAV_BUTTON_CLASSNAME =
  "hidden size-11 border-border bg-background/80 text-foreground shadow-sm backdrop-blur-[10px] hover:bg-background disabled:opacity-40 sm:flex";

/**
 * Faixa com os vídeos dos itens da caixa, em carrossel infinito (embla) —
 * todos os itens no mesmo tamanho. No desktop mostra ~3 itens inteiros mais
 * uma fatia do próximo, centralizado dentro do `max-w-6xl` (não ocupa a
 * largura inteira da página); no mobile o item ocupa quase a faixa toda.
 * O plugin `embla-carousel-wheel-gestures` dá suporte a scroll do
 * mouse/trackpad (por padrão o embla só responde a arrasto e aos botões).
 * `dragFree: true` é necessário junto com o plugin — sem ele, cada gesto de
 * scroll é tratado como um arrasto "paginado" que, se não ultrapassar metade
 * da distância até o próximo item, anima de volta pro item atual (sensação
 * de "puxão" na direção contrária). Clicar em um item abre o vídeo em modo
 * expandido, com navegação entre eles.
 */
export function BoxContentsSection({ book }: { book: Book }) {
  const { boxContents } = book;

  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [wheelGesturesPlugin] = useState(() => WheelGesturesPlugin());

  const items = boxContents?.items ?? [];
  const itemLabels = items
    .map((item) => item.label)
    .filter((label): label is string => Boolean(label));

  const close = useCallback(() => setOpenIndex(null), []);
  const showPrevious = useCallback(
    () => setOpenIndex((current) => (current === null ? current : (current - 1 + items.length) % items.length)),
    [items.length],
  );
  const showNext = useCallback(
    () => setOpenIndex((current) => (current === null ? current : (current + 1) % items.length)),
    [items.length],
  );

  useEffect(() => {
    if (openIndex === null) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") showPrevious();
      if (event.key === "ArrowRight") showNext();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openIndex, close, showPrevious, showNext]);

  useEffect(() => {
    // Tira o foco do botão do carrossel (embla também escuta as setas do
    // teclado no elemento focado) — sem isso, navegar na modal com as setas
    // também arrasta o carrossel de fundo.
    if (openIndex !== null) dialogRef.current?.focus();
  }, [openIndex]);

  if (!boxContents) {
    return null;
  }

  return (
    <section className="border-t border-border py-20">
      {boxContents.openingVideoSrc ? (
        <div className="mx-auto mb-12 max-w-2xl overflow-hidden rounded-2xl px-4 sm:px-6">
          <video
            className={cn(
              "h-full w-full object-cover",
              boxContents.openingVideoSrcDark && "dark:hidden",
            )}
            src={boxContents.openingVideoSrc}
            autoPlay
            loop
            muted
            playsInline
          />
          {boxContents.openingVideoSrcDark ? (
            <video
              className="hidden h-full w-full object-cover dark:block"
              src={boxContents.openingVideoSrcDark}
              autoPlay
              loop
              muted
              playsInline
            />
          ) : null}
        </div>
      ) : null}

      <h2
        className={cn(
          "mx-auto max-w-6xl px-4 text-center font-display text-2xl text-foreground sm:px-6 sm:text-3xl",
          itemLabels.length === 0 && "mb-8",
        )}
      >
        Confira o que Vem Dentro da Caixa
      </h2>

      {itemLabels.length > 0 ? (
        <p className="mx-auto mb-8 mt-3 max-w-6xl px-4 text-center font-serif text-muted-foreground sm:px-6">
          {itemLabels.join(" · ")}
        </p>
      ) : null}

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Carousel
          opts={{ loop: items.length > 1, align: "start", dragFree: true }}
          plugins={[wheelGesturesPlugin]}
          className="w-full"
        >
          <CarouselContent className="cursor-grab sm:-ml-6 active:cursor-grabbing">
            {items.map((item, index) => (
              <CarouselItem
                key={item.videoSrc}
                className="basis-[78%] sm:basis-[42%] sm:pl-6 lg:basis-[30%]"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(index)}
                  aria-label={item.label ? `Ver em tela cheia: ${item.label}` : "Ver em tela cheia"}
                  className="group relative aspect-[1670/1970] w-full overflow-hidden rounded-2xl transition-shadow duration-300 ease-out hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <video
                    className={cn(
                      "absolute inset-0 h-full w-full object-cover",
                      item.videoSrcDark && "dark:hidden",
                    )}
                    src={item.videoSrc}
                    autoPlay
                    loop
                    muted
                    playsInline
                    draggable={false}
                  />
                  {item.videoSrcDark ? (
                    <video
                      className="absolute inset-0 hidden h-full w-full object-cover dark:block"
                      src={item.videoSrcDark}
                      autoPlay
                      loop
                      muted
                      playsInline
                      draggable={false}
                    />
                  ) : null}
                </button>
              </CarouselItem>
            ))}
          </CarouselContent>

          {items.length > 1 ? (
            <>
              <CarouselPrevious className={cn(NAV_BUTTON_CLASSNAME, "left-2 sm:left-4")} />
              <CarouselNext className={cn(NAV_BUTTON_CLASSNAME, "right-2 sm:right-4")} />
            </>
          ) : null}
        </Carousel>
      </div>

      {openIndex !== null ? (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={items[openIndex].label ?? DIALOG_LABELS[book.locale]}
          tabIndex={-1}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-6 outline-none"
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            aria-label="Fechar"
            className="absolute right-6 top-6 text-white/80 transition hover:text-white"
          >
            <X className="size-8" aria-hidden="true" />
          </button>

          {items.length > 1 ? (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  showPrevious();
                }}
                aria-label="Item anterior"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 transition hover:text-white sm:left-6"
              >
                <ChevronLeft className="size-10" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  showNext();
                }}
                aria-label="Próximo item"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 transition hover:text-white sm:right-6"
              >
                <ChevronRight className="size-10" aria-hidden="true" />
              </button>
            </>
          ) : null}

          <div
            className="relative h-[85vh] w-auto max-w-[90vw]"
            onClick={(event) => event.stopPropagation()}
          >
            <video
              key={items[openIndex].videoSrc}
              className={cn(
                "h-full w-full object-contain",
                items[openIndex].videoSrcDark && "dark:hidden",
              )}
              src={items[openIndex].videoSrc}
              autoPlay
              loop
              muted
              playsInline
              controls
            />
            {items[openIndex].videoSrcDark ? (
              <video
                key={items[openIndex].videoSrcDark}
                className="absolute inset-0 hidden h-full w-full object-contain dark:block"
                src={items[openIndex].videoSrcDark}
                autoPlay
                loop
                muted
                playsInline
                controls
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
