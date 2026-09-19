"use client";

import { useRef, useState } from "react";
import { Moon, Pause, Play, Sun } from "lucide-react";
import type { Book } from "@/lib/data/schemas";
import { LazyVideo } from "@/components/lazy-video";

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
 */
export function VideoBannerSection({ book }: { book: Book }) {
  const dayRef = useRef<HTMLVideoElement>(null);
  const nightRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isNight, setIsNight] = useState(false);

  if (!book.videoBannerSrc) {
    return null;
  }

  // Guardado numa const (em vez de `Boolean(...)`) pro TS estreitar o tipo
  // no JSX: `LazyVideo` exige `src: string`, e o campo é opcional.
  const nightSrc = book.videoBannerNightSrc;

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

  return (
    <section className="group/video relative border-t border-border bg-background">
      {/* Faixa fica no meio da página: só baixa quando o usuário chega nela. */}
      <LazyVideo
        ref={dayRef}
        aria-hidden="true"
        className="h-40 w-full object-cover transition-opacity duration-500 sm:h-56 md:h-64 lg:h-72"
        style={nightSrc ? { opacity: isNight ? 0 : 1 } : undefined}
        src={book.videoBannerSrc}
        autoPlay
        loop
        muted
        playsInline
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      {nightSrc ? (
        <LazyVideo
          ref={nightRef}
          aria-hidden="true"
          className="absolute inset-0 h-40 w-full object-cover transition-opacity duration-500 sm:h-56 md:h-64 lg:h-72"
          style={{ opacity: isNight ? 1 : 0 }}
          src={nightSrc}
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
      {nightSrc ? (
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
