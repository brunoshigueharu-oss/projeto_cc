"use client";

import { useRef, useState, type MouseEvent, type PointerEvent } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import type { HomeBanner } from "@/lib/data/schemas";
import { getSwipeStep } from "../_lib/get-swipe-step";

const CAROUSEL_ARROW_CLASSNAME =
  "absolute top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/24 bg-white/8 text-white backdrop-blur-[10px] transition-colors hover:bg-white/16 lg:size-11";

type HeroProps = {
  banners: readonly HomeBanner[];
};

/**
 * Hero da Home = carrossel de vídeos em faixa cheia (mudo/loop/autoplay),
 * sem texto sobreposto. Cada vídeo é um link para a página do livro
 * correspondente. Troca de banner por setas, bolinhas ou swipe (toque).
 */
export function Hero({ banners }: HeroProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const swipeOrigin = useRef<{ x: number; y: number } | null>(null);
  const hasSwiped = useRef(false);

  if (banners.length === 0) return null;

  const banner = banners[activeIndex];
  const hasMultipleBanners = banners.length > 1;

  function goTo(index: number) {
    setActiveIndex((index + banners.length) % banners.length);
  }

  // Swipe só para toque/caneta — mouse já tem as setas. Sem
  // `setPointerCapture` de propósito: capturar o ponteiro desvia o "click"
  // do toque para o elemento que capturou, e o Link deixa de navegar (ver
  // `book-gallery.tsx`).
  function handlePointerDown(event: PointerEvent<HTMLAnchorElement>) {
    // Zera para qualquer ponteiro: num aparelho híbrido, um clique de mouse
    // depois de um swipe por toque não pode herdar o bloqueio do swipe.
    hasSwiped.current = false;
    if (event.pointerType === "mouse") return;
    swipeOrigin.current = { x: event.clientX, y: event.clientY };
  }

  function handlePointerUp(event: PointerEvent<HTMLAnchorElement>) {
    const origin = swipeOrigin.current;
    swipeOrigin.current = null;
    if (!origin || !hasMultipleBanners) return;

    const step = getSwipeStep(event.clientX - origin.x, event.clientY - origin.y);
    if (step === 0) return;

    hasSwiped.current = true;
    goTo(activeIndex + step);
  }

  function handlePointerCancel() {
    // O navegador assumiu o gesto (scroll vertical da página).
    swipeOrigin.current = null;
  }

  function handleClickCapture(event: MouseEvent<HTMLAnchorElement>) {
    // Swipe de verdade não deve abrir a página do livro. `detail === 0` é
    // clique de teclado (Enter) — nunca vem de um swipe, então não bloqueia.
    if (hasSwiped.current && event.detail > 0) {
      event.preventDefault();
      hasSwiped.current = false;
    }
  }

  return (
    <section className="relative overflow-hidden bg-background">
      {/* `touch-pan-y`: o navegador só assume o arrasto vertical (scroll da
          página); o horizontal chega aos handlers como swipe. */}
      <Link
        href={banner.href}
        aria-label={`Ver ${banner.bookTitle}`}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onClickCapture={handleClickCapture}
        className="block aspect-square w-full touch-pan-y touch-pinch-zoom sm:aspect-[1785/650]"
      >
        <video
          key={banner.slug}
          aria-hidden="true"
          className="size-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        >
          {banner.videoSrcMobile && (
            <source src={banner.videoSrcMobile} media="(max-width: 639px)" />
          )}
          <source src={banner.videoSrc} />
        </video>
      </Link>

      {hasMultipleBanners && (
        <>
          <button
            type="button"
            aria-label="Slide anterior"
            onClick={() => goTo(activeIndex - 1)}
            className={cn(CAROUSEL_ARROW_CLASSNAME, "left-3 lg:left-10")}
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Próximo slide"
            onClick={() => goTo(activeIndex + 1)}
            className={cn(CAROUSEL_ARROW_CLASSNAME, "right-3 lg:right-10")}
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>

          {/* Cada bolinha é um botão de 24px de altura com a pílula de 6px
              centralizada: a pílula continua pequena, mas o alvo de toque
              não. Com alvo de 6px, errar por poucos pixels caía no Link do
              vídeo e abria a página do livro. */}
          <div className="absolute inset-x-0 bottom-4 flex items-center justify-center">
            {banners.map((item, index) => (
              <button
                key={item.slug}
                type="button"
                aria-label={`Ir para banner ${index + 1}`}
                aria-current={index === activeIndex}
                onClick={() => goTo(index)}
                className="group flex h-6 items-center px-1"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "block h-1.5 rounded-full bg-white/30 transition-all",
                    index === activeIndex ? "w-6 bg-primary" : "w-1.5 group-hover:bg-white/50"
                  )}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
