"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Book, Locale } from "@/lib/data/schemas";

const DIALOG_LABELS: Record<Locale, string> = {
  pt: "Itens da caixa",
  en: "Box contents",
};

/**
 * Faixa horizontal com os vídeos dos itens da caixa (sem título nem legendas
 * — puramente visual) — só renderiza quando `book.boxContents` existe.
 * Primeiro e último item aparecem maiores para dar ritmo à faixa. Passar o
 * mouse destaca o item sob o cursor e esmaece os demais ("spotlight");
 * clicar abre o vídeo em modo expandido, com navegação entre eles.
 */
export function BoxContentsSection({ book }: { book: Book }) {
  const { boxContents } = book;

  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const items = boxContents?.items ?? [];

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

      <div
        className="flex snap-x snap-mandatory items-center gap-4 overflow-x-auto px-4 pb-2 sm:gap-6 sm:px-6"
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {items.map((item, index) => {
          const isEdge = index === 0 || index === items.length - 1;
          const isDimmed = hoveredIndex !== null && hoveredIndex !== index;

          return (
            <button
              key={item.videoSrc}
              type="button"
              onClick={() => setOpenIndex(index)}
              onMouseEnter={() => setHoveredIndex(index)}
              onFocus={() => setHoveredIndex(index)}
              onBlur={() => setHoveredIndex(null)}
              aria-label={item.label ? `Ver em tela cheia: ${item.label}` : "Ver em tela cheia"}
              className={cn(
                "group relative aspect-[1670/1970] shrink-0 snap-center overflow-hidden rounded-2xl transition-all duration-300 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                isEdge ? "h-72 sm:h-96" : "h-56 sm:h-72",
                hoveredIndex === index ? "scale-105 shadow-2xl" : "scale-100",
                isDimmed ? "opacity-50" : "opacity-100",
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
              <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/20">
                <Expand
                  className="size-8 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  aria-hidden="true"
                />
              </span>
            </button>
          );
        })}
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
