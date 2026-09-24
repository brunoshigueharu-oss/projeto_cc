"use client";

import { useRef, useState } from "react";
import { Moon, Pause, Play, Sun } from "lucide-react";

import { LazyVideo } from "@/components/lazy-video";
import { cn } from "@/lib/utils";

/**
 * Faixa de vídeo em largura cheia. No tamanho `"default"` a altura separa
 * duas seções sem virar um segundo hero (`h-56` → `lg:h-96`) — é o que o
 * catálogo usa, entre o card de exemplar avulso e o destaque do universo
 * (`video-banner-section.tsx`). Mesmo padrão mudo/loop/autoplay do vídeo de
 * capa (ver `components/book-cover.tsx`).
 *
 * `size="hero"` troca a altura fixa pelo mesmo `aspect-[16/9] sm:aspect-
 * [1440/540]` da faixa de abertura da campanha (`campaign-banner.tsx`): é o
 * usado por `campaign-special-edition.tsx`, onde a faixa da Edição Noite
 * precisa ler como um segundo hero (a arte da variante), não como divisor.
 *
 * Com `nightSrc`, os dois vídeos ficam empilhados e sempre tocando (ambos
 * mudos, custo de decode desprezível numa faixa desse tamanho) — alternar só
 * troca a opacidade, sem recarregar o vídeo nem perder o ponto do loop.
 */
export function VideoBanner({
  src,
  nightSrc,
  size = "default",
}: {
  src: string;
  nightSrc?: string;
  size?: "default" | "hero";
}) {
  const dayRef = useRef<HTMLVideoElement>(null);
  const nightRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isNight, setIsNight] = useState(false);

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

  const dimensionClassName =
    size === "hero"
      ? "absolute inset-0 size-full"
      : "h-56 w-full sm:h-72 md:h-80 lg:h-96";

  return (
    <section
      className={cn(
        "group/video relative border-t border-border bg-background",
        size === "hero" && "aspect-[16/9] sm:aspect-[1440/540]",
      )}
    >
      {/* Faixa fica no meio da página: só baixa quando o usuário chega nela. */}
      <LazyVideo
        ref={dayRef}
        aria-hidden="true"
        className={cn(dimensionClassName, "object-cover transition-opacity duration-500")}
        style={nightSrc ? { opacity: isNight ? 0 : 1 } : undefined}
        src={src}
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
          className={cn(
            "absolute inset-0",
            size === "hero" ? "size-full" : "h-56 w-full sm:h-72 md:h-80 lg:h-96",
            "object-cover transition-opacity duration-500",
          )}
          style={{ opacity: isNight ? 1 : 0 }}
          src={nightSrc}
          autoPlay
          loop
          muted
          playsInline
        />
      ) : null}
      {/* Canto superior esquerdo — aqui não tem livro pra cobrir, então
       pode ficar sobre a faixa mesmo; o canto direito fica livre para o
       toggle dia/noite logo abaixo. */}
      <button
        type="button"
        onClick={handleTogglePlay}
        aria-label={isPlaying ? "Pausar vídeo" : "Reproduzir vídeo"}
        className="absolute left-3 top-3 z-10 flex size-8 items-center justify-center rounded-full border border-white/20 bg-black/15 text-white opacity-50 backdrop-blur-[2px] transition-all duration-200 hover:opacity-100 hover:bg-black/25 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 group-hover/video:opacity-80"
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
