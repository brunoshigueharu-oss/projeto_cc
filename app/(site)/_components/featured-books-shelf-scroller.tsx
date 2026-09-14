"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import type { Book } from "@/lib/data/schemas";
import { cn } from "@/lib/utils";
import { FeaturedBookCard } from "./featured-book-card";

type FeaturedBooksShelfScrollerProps = {
  books: readonly Book[];
};

/**
 * Prateleira horizontal com arrasto do mouse em telas grandes —
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

  // Arrasto só para mouse — toque já ganha scroll nativo com inércia. NÃO
  // usar `setPointerCapture`: capturar o ponteiro no <ul> redireciona o
  // "click" para o próprio <ul> em vez do Link do card, e clicar no card
  // deixa de abrir o livro. Mesmo padrão (e mesmo motivo) de
  // `catalogo/[slug]/_components/book-gallery.tsx`.
  function handlePointerDown(event: ReactPointerEvent<HTMLUListElement>) {
    // Zera para qualquer ponteiro: num aparelho híbrido, um toque no card
    // depois de um arrasto com mouse não pode herdar o bloqueio do clique.
    dragDistance.current = 0;
    if (event.pointerType !== "mouse") return;
    const track = trackRef.current;
    if (!track) return;

    isDragging.current = true;
    dragOrigin.current = { x: event.clientX, scrollLeft: track.scrollLeft };

    window.addEventListener("pointermove", handleWindowPointerMove);
    window.addEventListener("pointerup", handleWindowPointerUp);
  }

  function handleWindowPointerMove(event: globalThis.PointerEvent) {
    const track = trackRef.current;
    if (!track || !isDragging.current) return;

    const delta = event.clientX - dragOrigin.current.x;
    dragDistance.current = Math.abs(delta);
    track.scrollLeft = dragOrigin.current.scrollLeft - delta;
  }

  function handleWindowPointerUp() {
    isDragging.current = false;
    window.removeEventListener("pointermove", handleWindowPointerMove);
    window.removeEventListener("pointerup", handleWindowPointerUp);
  }

  function handleDragStart(event: React.DragEvent) {
    // O card é um <a> (com <img> dentro): sem isso o navegador inicia o
    // drag nativo do link no primeiro movimento, dispara `pointercancel` e o
    // arrasto da prateleira para depois de poucos pixels.
    event.preventDefault();
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
        onDragStart={handleDragStart}
        onClickCapture={handleClickCapture}
        className="grid grid-cols-2 gap-5 lg:relative lg:flex lg:cursor-grab lg:gap-6 lg:overflow-x-auto lg:scroll-smooth lg:pb-1 lg:active:cursor-grabbing lg:[scrollbar-width:none] lg:[&::-webkit-scrollbar]:hidden"
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
