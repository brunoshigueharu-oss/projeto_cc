"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Book, Locale } from "@/lib/data/schemas";

const DIALOG_LABELS: Record<Locale, string> = {
  pt: "Itens da caixa",
  en: "Box contents",
};

const NAV_BUTTON_CLASSNAME =
  "absolute top-1/2 z-10 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/80 text-foreground shadow-sm backdrop-blur-[10px] transition-opacity hover:bg-background disabled:pointer-events-none disabled:opacity-40 sm:flex";

/**
 * Faixa horizontal com os vídeos dos itens da caixa, com scroll manual
 * (arrasto/roda do mouse) e botões de navegação — só renderiza quando
 * `book.boxContents` existe. Primeiro e último item aparecem maiores para
 * dar ritmo à faixa. Clicar abre o vídeo em modo expandido, com navegação
 * entre eles.
 */
export function BoxContentsSection({ book }: { book: Book }) {
  const { boxContents } = book;

  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

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

  const updateScrollState = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanScrollPrev(el.scrollLeft > 8);
    setCanScrollNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    updateScrollState();
    window.addEventListener("resize", updateScrollState);
    return () => window.removeEventListener("resize", updateScrollState);
  }, [updateScrollState, items.length]);

  const scrollByStep = useCallback((direction: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const firstItem = el.firstElementChild as HTMLElement | null;
    const step = firstItem ? firstItem.offsetWidth + 24 : el.clientWidth * 0.8;
    el.scrollBy({ left: direction * step, behavior: "smooth" });
  }, []);

  if (!boxContents) {
    return null;
  }

  return (
    <section className="border-t border-border py-20">
      {boxContents.openingVideoSrc ? (
        <div className="mx-auto mb-12 max-w-2xl overflow-hidden rounded-2xl px-4 sm:px-6">
          <video
            className="h-full w-full object-cover"
            src={boxContents.openingVideoSrc}
            autoPlay
            loop
            muted
            playsInline
          />
        </div>
      ) : null}

      <div className="mx-auto mb-8 max-w-6xl px-4 text-center sm:px-6">
        <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
          confira o que vem dentro da caixa
        </h2>
        {itemLabels.length > 0 ? (
          <p className="mt-2 font-sans text-base font-normal text-muted-foreground sm:text-lg">
            {itemLabels.join(", ")}
          </p>
        ) : null}
      </div>

      <div className="relative">
        {items.length > 1 ? (
          <button
            type="button"
            aria-label="Item anterior"
            onClick={() => scrollByStep(-1)}
            disabled={!canScrollPrev}
            className={cn(NAV_BUTTON_CLASSNAME, "left-2 sm:left-4")}
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
        ) : null}

        <div
          ref={scrollerRef}
          onScroll={updateScrollState}
          className="flex snap-x snap-mandatory items-center gap-4 overflow-x-auto px-4 pb-2 sm:gap-6 sm:px-6"
        >
          {items.map((item, index) => {
            const isEdge = index === 0 || index === items.length - 1;

            return (
              <button
                key={item.videoSrc}
                type="button"
                onClick={() => setOpenIndex(index)}
                aria-label={item.label ? `Ver em tela cheia: ${item.label}` : "Ver em tela cheia"}
                className={cn(
                  "group relative aspect-[1670/1970] shrink-0 snap-center overflow-hidden rounded-2xl transition-shadow duration-300 ease-out hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                  isEdge ? "h-72 sm:h-96" : "h-56 sm:h-72",
                )}
              >
                <video
                  className="h-full w-full object-cover"
                  src={item.videoSrc}
                  autoPlay
                  loop
                  muted
                  playsInline
                />
                <span className="absolute bottom-2 right-2 flex size-7 items-center justify-center rounded-full border border-white/30 bg-black/30 text-white opacity-70 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                  <Expand className="size-3.5" aria-hidden="true" />
                </span>
              </button>
            );
          })}
        </div>

        {items.length > 1 ? (
          <button
            type="button"
            aria-label="Próximo item"
            onClick={() => scrollByStep(1)}
            disabled={!canScrollNext}
            className={cn(NAV_BUTTON_CLASSNAME, "right-2 sm:right-4")}
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {openIndex !== null ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={items[openIndex].label ?? DIALOG_LABELS[book.locale]}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-6"
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
              className="h-full w-full object-contain"
              src={items[openIndex].videoSrc}
              autoPlay
              loop
              muted
              playsInline
              controls
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
