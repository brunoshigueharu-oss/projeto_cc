"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import type { Book } from "@/lib/data/schemas";
import { cn } from "@/lib/utils";

type BookGalleryProps = {
  images: NonNullable<Book["gallery"]>;
  bookTitle: string;
};

/**
 * Faixa horizontal com miniaturas de outras fotos do livro (miolo, verso,
 * detalhes), abaixo da capa em vídeo — rola por toque/trackpad em qualquer
 * tela, e também por arrasto do mouse no desktop (mesmo padrão do carrossel
 * de destaques da home, `featured-books-shelf-scroller.tsx`), com bolinhas de
 * progresso clicáveis embaixo. Clicar numa foto abre em tela cheia, com
 * navegação entre elas.
 */
export function BookGallery({ images, bookTitle }: BookGalleryProps) {
  const trackRef = useRef<HTMLUListElement>(null);
  const dragOrigin = useRef({ x: 0, scrollLeft: 0 });
  const dragDistance = useRef(0);
  const isDragging = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

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

  // Arrasto só para mouse — toque já ganha scroll nativo com inércia, e
  // simular o drag também para touch tiraria essa inércia. Importante: NÃO
  // usar `setPointerCapture` aqui — capturar o ponteiro no <ul> redireciona
  // o pointerup (e o "click" nativo sintetizado a partir dele) para o
  // próprio <ul> em vez do <button> da miniatura sob o cursor, então o
  // onClick de abrir a foto nunca dispara. Ouvir pointermove/pointerup no
  // `window` dá o mesmo alcance (arrasto continua mesmo se o cursor sair do
  // track) sem desviar o clique.
  function handlePointerDown(event: ReactPointerEvent<HTMLUListElement>) {
    if (event.pointerType !== "mouse") return;
    const track = trackRef.current;
    if (!track) return;

    isDragging.current = true;
    dragDistance.current = 0;
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

  function handleClickCapture(event: React.MouseEvent) {
    // Arrasto de verdade não deve abrir o lightbox da foto.
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

  const close = useCallback(() => setOpenIndex(null), []);
  const showPrevious = useCallback(
    () => setOpenIndex((current) => (current === null ? current : (current - 1 + images.length) % images.length)),
    [images.length],
  );
  const showNext = useCallback(
    () => setOpenIndex((current) => (current === null ? current : (current + 1) % images.length)),
    [images.length],
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

  return (
    <div className="mt-4">
      {/* `overscroll-x-contain`: ao chegar na última foto, o arrasto para
          na tira em vez de escapar para o gesto de "voltar" do navegador. */}
      <ul
        ref={trackRef}
        role="list"
        aria-label={`Outras fotos de ${bookTitle}`}
        onPointerDown={handlePointerDown}
        onClickCapture={handleClickCapture}
        className="flex cursor-grab snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain scroll-smooth pb-1 active:cursor-grabbing [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((image, index) => (
          <li key={image.src} className="w-[88px] shrink-0 snap-start">
            <button
              type="button"
              onClick={() => setOpenIndex(index)}
              aria-label={`Ver foto maior: ${image.alt}`}
              className="block aspect-[3/4] w-full select-none overflow-hidden rounded-md border border-border transition hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Image
                src={image.src}
                alt=""
                width={176}
                height={235}
                draggable={false}
                className="size-full object-cover"
              />
            </button>
          </li>
        ))}
      </ul>

      {images.length > 1 ? (
        <div className="mt-3 flex items-center justify-center gap-2">
          {images.map((image, index) => (
            <button
              key={image.src}
              type="button"
              aria-label={`Ir para foto ${index + 1}`}
              aria-current={index === activeIndex}
              onClick={() => scrollToIndex(index)}
              className={cn(
                "h-1.5 rounded-full bg-foreground/15 transition-all",
                index === activeIndex ? "w-6 bg-primary" : "w-1.5 hover:bg-foreground/30",
              )}
            />
          ))}
        </div>
      ) : null}

      {openIndex !== null ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={images[openIndex].alt}
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

          {images.length > 1 ? (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  showPrevious();
                }}
                aria-label="Foto anterior"
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
                aria-label="Próxima foto"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 transition hover:text-white sm:right-6"
              >
                <ChevronRight className="size-10" aria-hidden="true" />
              </button>
            </>
          ) : null}

          <div
            className="relative h-[85vh] w-[90vw]"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={images[openIndex].src}
              alt={images[openIndex].alt}
              fill
              sizes="90vw"
              className="object-contain"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
