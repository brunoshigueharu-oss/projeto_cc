"use client";

import { useEffect, useRef, useState } from "react";
import { Moon, Pause, Play, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Book } from "@/lib/data/schemas";

/** Fração da distância até o alvo consumida a cada frame (0–1) — mesmo
 * padrão de inércia de `components/parallax-section.tsx`. */
const EASING = 0.12;
const SETTLE_THRESHOLD = 0.0005;

/** Quanto o vídeo excede a altura da faixa quando `videoBannerTall` está
 * ativo (0.4 = 40% maior, 20% de folga acima e abaixo) — precisa bater com
 * as classes `h-[140%] top-[-20%]` abaixo, que dão essa mesma folga em CSS
 * puro para o frame inicial (antes do JS calcular o scroll). */
const TALL_VIDEO_OVERSCAN = 0.4;

/**
 * Faixa de vídeo em largura cheia, entre o card de exemplar avulso e o
 * destaque do universo. Mesmo padrão mudo/loop/autoplay do vídeo de capa
 * (`coverVideoSrc`, ver `components/book-cover.tsx`). Retorna `null` quando
 * o título não tem esse asset — a maioria do catálogo ainda não tem.
 *
 * Quando o livro também tem `videoBannerNightSrc`, os dois vídeos ficam
 * empilhados e sempre tocando (ambos mudos, custo de decode desprezível numa
 * faixa desse tamanho) — alternar só troca a opacidade, sem recarregar o
 * vídeo nem perder o ponto do loop.
 *
 * `videoBannerTall`: faixa mais alta + vídeo com folga extra que desliza
 * verticalmente por dentro dela conforme o scroll (mesma técnica de
 * scroll+rAF do `ParallaxSection`, não CSS `animation-timeline` — Safari não
 * suporta scroll-driven animations). Usado quando o vídeo em si precisa de
 * mais altura pra ficar legível (ex.: a caixa abrindo, que numa faixa baixa
 * de `object-cover` mostra sempre o mesmo recorte central e corta o
 * movimento).
 */
export function VideoBannerSection({ book }: { book: Book }) {
  const dayRef = useRef<HTMLVideoElement>(null);
  const nightRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isNight, setIsNight] = useState(false);

  const isTall = Boolean(book.videoBannerTall);
  const scale = book.videoBannerScale ?? 1;
  const scaleTransform = scale !== 1 ? `scaleX(${scale})` : "";

  useEffect(() => {
    if (!isTall) return;

    const section = sectionRef.current;
    if (!section) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const videos = [dayRef.current, nightRef.current].filter(
      (video): video is HTMLVideoElement => Boolean(video),
    );

    let frameId = 0;
    // Posição renderizada (persegue `target` com inércia) e alvo, ambas em
    // [0, 1]: 0 quando a faixa entra por baixo da viewport, 1 quando sai por
    // cima. `range` é o deslocamento máximo (px) pra cada lado, derivado da
    // altura real da faixa.
    let current = 0;
    let target = 0;
    let range = 0;

    function readTarget() {
      const rect = section!.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const progress =
        1 - (rect.top + rect.height) / (viewportHeight + rect.height);
      target = Math.min(1, Math.max(0, progress));
      range = (rect.height * TALL_VIDEO_OVERSCAN) / 2;
    }

    function render() {
      // current=0 -> +range (topo do vídeo); current=1 -> -range (base do
      // vídeo): a faixa "escaneia" o vídeo de cima pra baixo ao longo do
      // scroll, em vez de mostrar sempre o mesmo recorte central.
      const offset = range * (1 - 2 * current);
      const transform = `translate3d(0, ${offset.toFixed(2)}px, 0) ${scaleTransform}`.trim();
      for (const video of videos) {
        video.style.transform = transform;
      }
    }

    function tick() {
      readTarget();
      current += (target - current) * EASING;
      if (Math.abs(target - current) < SETTLE_THRESHOLD) {
        current = target;
        frameId = 0;
      } else {
        frameId = requestAnimationFrame(tick);
      }
      render();
    }

    function onScrollOrResize() {
      if (frameId === 0) {
        frameId = requestAnimationFrame(tick);
      }
    }

    readTarget();
    current = target;
    render();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [isTall, scaleTransform]);

  if (!book.videoBannerSrc) {
    return null;
  }

  const hasDayNight = Boolean(book.videoBannerNightSrc);

  function handleTogglePlay() {
    for (const ref of [dayRef, nightRef]) {
      const video = ref.current;
      if (!video) continue;
      if (video.paused) {
        video.play();
      } else {
        video.pause();
      }
    }
  }

  const videoClassName = cn(
    "absolute inset-x-0 w-full object-cover transition-opacity duration-500 will-change-transform",
    isTall ? "top-[-20%] h-[140%]" : "top-0 h-full",
  );

  return (
    <section
      ref={sectionRef}
      className={cn(
        "group/video relative overflow-hidden border-t border-border bg-background",
        isTall ? "h-48 sm:h-64 md:h-72 lg:h-80" : "h-40 sm:h-56 md:h-64 lg:h-72",
      )}
    >
      <video
        ref={dayRef}
        aria-hidden="true"
        className={videoClassName}
        style={{
          opacity: hasDayNight ? (isNight ? 0 : 1) : undefined,
          transform: scaleTransform || undefined,
        }}
        src={book.videoBannerSrc}
        autoPlay
        loop
        muted
        playsInline
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      {hasDayNight ? (
        <video
          ref={nightRef}
          aria-hidden="true"
          className={videoClassName}
          style={{ opacity: isNight ? 1 : 0, transform: scaleTransform || undefined }}
          src={book.videoBannerNightSrc}
          autoPlay
          loop
          muted
          playsInline
        />
      ) : null}
      <button
        type="button"
        onClick={handleTogglePlay}
        aria-label={isPlaying ? "Pausar vídeo" : "Reproduzir vídeo"}
        className="absolute left-1/2 top-1/2 z-10 flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/15 text-white opacity-50 backdrop-blur-[2px] transition-all duration-200 hover:opacity-100 hover:bg-black/25 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 group-hover/video:opacity-80"
      >
        {isPlaying ? (
          <Pause className="size-3.5 fill-current" />
        ) : (
          <Play className="size-3.5 fill-current" />
        )}
      </button>
      {hasDayNight ? (
        <button
          type="button"
          onClick={() => setIsNight((prev) => !prev)}
          aria-label={isNight ? "Ver versão diurna" : "Ver versão noturna"}
          className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-full border border-white/20 bg-black/15 text-white opacity-50 backdrop-blur-[2px] transition-all duration-200 hover:opacity-100 hover:bg-black/25 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 group-hover/video:opacity-80"
        >
          {isNight ? (
            <Moon className="size-3.5 fill-current" />
          ) : (
            <Sun className="size-3.5 fill-current" />
          )}
        </button>
      ) : null}
    </section>
  );
}
