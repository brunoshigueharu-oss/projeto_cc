"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";

import type { Book } from "@/lib/data/schemas";
import { cn } from "@/lib/utils";
import { FeaturedBookCard } from "./featured-book-card";

type FeaturedBooksShelfScrollerProps = {
  books: readonly Book[];
};

/**
 * Prateleira horizontal com arrasto (pointer capture) em telas grandes —
 * espelha o comportamento definido no Figma. Em telas menores vira grade
 * 2 colunas estática (sem necessidade de scroll/dots).
 */
export function FeaturedBooksShelfScroller({ books }: FeaturedBooksShelfScrollerProps) {
  const trackRef = useRef<HTMLUListElement>(null);
  const dragOrigin = useRef({ x: 0, scrollLeft: 0 });
  const dragDistance = useRef(0);
  const isDragging = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const updateActiveIndex = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const cards = Array.from(track.children) as HTMLElement[];
    if (cards.length === 0) return;

    // No fim do scroll, o último card nunca "alcança" seu offsetLeft (o
    // container não rola além do próprio limite) — sem isso a última
    // bolinha nunca acende.
    const maxScrollLeft = track.scrollWidth - track.clientWidth;
    if (maxScrollLeft <= 0) {
      setActiveIndex(0);
      return;
    }
    if (track.scrollLeft >= maxScrollLeft - 1) {
      setActiveIndex(cards.length - 1);
      return;
    }

    const closest = cards.reduce(
      (closestIndex, card, index) =>
        Math.abs(card.offsetLeft - track.scrollLeft) <
        Math.abs(cards[closestIndex].offsetLeft - track.scrollLeft)
          ? index
          : closestIndex,
      0,
    );
    setActiveIndex(closest);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    track.addEventListener("scroll", updateActiveIndex, { passive: true });
    return () => track.removeEventListener("scroll", updateActiveIndex);
  }, [updateActiveIndex]);

  function handlePointerDown(event: PointerEvent<HTMLUListElement>) {
    const track = trackRef.current;
    if (!track) return;

    isDragging.current = true;
    dragDistance.current = 0;
    dragOrigin.current = { x: event.clientX, scrollLeft: track.scrollLeft };
    track.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<HTMLUListElement>) {
    const track = trackRef.current;
    if (!track || !isDragging.current) return;

    const delta = event.clientX - dragOrigin.current.x;
    dragDistance.current = Math.abs(delta);
    track.scrollLeft = dragOrigin.current.scrollLeft - delta;
  }

  function handlePointerUp(event: PointerEvent<HTMLUListElement>) {
    const track = trackRef.current;
    isDragging.current = false;
    track?.releasePointerCapture(event.pointerId);
  }

  function handleClickCapture(event: React.MouseEvent) {
    // Arrasto de verdade não deve disparar a navegação do card (Link).
    if (dragDistance.current > 5) {
      event.preventDefault();
    }
  }

  function scrollToIndex(index: number) {
    const track = trackRef.current;
    const card = track?.children[index] as HTMLElement | undefined;
    if (!track || !card) return;
    track.scrollTo({ left: card.offsetLeft, behavior: "smooth" });
  }

  return (
    <div className="mt-10">
      <ul
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClickCapture={handleClickCapture}
        className="grid grid-cols-2 gap-5 lg:relative lg:flex lg:cursor-grab lg:touch-pan-y lg:gap-6 lg:overflow-x-auto lg:scroll-smooth lg:pb-1 lg:active:cursor-grabbing lg:[scrollbar-width:none] lg:[&::-webkit-scrollbar]:hidden"
      >
        {books.map((book) => (
          <li key={book.slug} className="lg:w-[293px] lg:shrink-0">
            <FeaturedBookCard book={book} className="select-none" />
          </li>
        ))}
      </ul>

      {books.length > 1 && (
        <div className="mt-6 hidden items-center justify-center gap-2 lg:flex">
          {books.map((book, index) => (
            <button
              key={book.slug}
              type="button"
              aria-label={`Ir para ${book.title}`}
              aria-current={index === activeIndex}
              onClick={() => scrollToIndex(index)}
              className={cn(
                "h-1.5 rounded-full bg-foreground/15 transition-all",
                index === activeIndex
                  ? "w-6 bg-primary"
                  : "w-1.5 hover:bg-foreground/30",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
