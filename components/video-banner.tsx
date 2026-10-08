"use client";

import { useEffect, useRef, useState } from "react";
import { Maximize, Minimize, Moon, Pause, Play, Sun } from "lucide-react";

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
  const containerRef = useRef<HTMLElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenError, setFullscreenError] = useState("");
  const dayRef = useRef<HTMLVideoElement>(null);
  const nightRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isNight, setIsNight] = useState(false);

  useEffect(() => {
    function syncFullscreen() {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    }
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  async function handleToggleFullscreen() {
    setFullscreenError("");
    const video = (isNight ? nightRef.current : dayRef.current) as
      | (HTMLVideoElement & { webkitEnterFullscreen?: () => void })
      | null;
    try {
      if (document.fullscreenElement === containerRef.current) {
        await document.exitFullscreen();
      } else if (containerRef.current?.requestFullscreen) {
        await containerRef.current.requestFullscreen();
      } else if (video?.webkitEnterFullscreen) {
        video.webkitEnterFullscreen();
      } else {
        setFullscreenError("Tela cheia indisponível neste navegador.");
      }
    } catch {
      setFullscreenError("Não foi possível abrir a tela cheia. Tente novamente.");
    }
  }

  function handleTogglePlay() {
    const shouldPlay = (isNight ? nightRef.current : dayRef.current)?.paused;
    for (const ref of [dayRef, nightRef]) {
      const video = ref.current;
      if (!video) continue;
      if (shouldPlay) {
        void video.play().catch(() => {});
      } else {
        video.pause();
      }
    }
  }

  const dimensionClassName =
    isFullscreen || size === "hero"
      ? "absolute inset-0 size-full"
      : "h-56 w-full sm:h-72 md:h-80 lg:h-96";

  return (
    <section
      ref={containerRef}
      className={cn(
        "group/video relative border-t border-border bg-background",
        isFullscreen && "!h-screen !w-screen !aspect-auto border-0 !bg-black",
        size === "hero" && "aspect-[16/9] sm:aspect-[1440/540]",
      )}
    >
      {/* Faixa fica no meio da página: só baixa quando o usuário chega nela. */}
      <LazyVideo
        ref={dayRef}
        aria-hidden="true"
        className={cn(dimensionClassName, isFullscreen ? "object-contain" : "object-cover transition-opacity duration-500")}
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
            isFullscreen || size === "hero" ? "size-full" : "h-56 w-full sm:h-72 md:h-80 lg:h-96",
            isFullscreen ? "object-contain" : "object-cover transition-opacity duration-500",
          )}
          style={{ opacity: isNight ? 1 : 0 }}
          src={nightSrc}
          autoPlay
          loop
          muted
          playsInline
        />
      ) : null}
      <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
        <button
          type="button"
          onClick={handleTogglePlay}
          aria-label={isPlaying ? "Pausar vídeo" : "Reproduzir vídeo"}
          className="flex size-8 items-center justify-center rounded-full border border-white/25 bg-black/20 text-white opacity-50 backdrop-blur-[2px] transition-all duration-200 hover:opacity-100 hover:bg-black/30 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 group-hover/video:opacity-80"
        >
          {isPlaying ? (
            <Pause className="size-3.5 fill-current" />
          ) : (
            <Play className="size-3.5 fill-current" />
          )}
        </button>
        <button
          type="button"
          onClick={handleToggleFullscreen}
          aria-label={isFullscreen ? "Sair da tela cheia" : "Ampliar vídeo em tela cheia"}
          className="flex size-8 items-center justify-center rounded-full border border-white/25 bg-black/20 text-white opacity-50 backdrop-blur-[2px] transition-all duration-200 hover:opacity-100 hover:bg-black/30 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 group-hover/video:opacity-80"
        >
          {isFullscreen ? <Minimize className="size-3.5" /> : <Maximize className="size-3.5" />}
        </button>
        {nightSrc ? (
          <button
            type="button"
            onClick={() => setIsNight((prev) => !prev)}
            aria-label={isNight ? "Ver versão diurna" : "Ver versão noturna"}
            className="flex size-8 items-center justify-center rounded-full border border-white/25 bg-black/20 text-white opacity-50 backdrop-blur-[2px] transition-all duration-200 hover:opacity-100 hover:bg-black/30 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 group-hover/video:opacity-80"
          >
            {isNight ? (
              <Moon className="size-3.5 fill-current" />
            ) : (
              <Sun className="size-3.5 fill-current" />
            )}
          </button>
        ) : null}
      </div>
      {fullscreenError ? (
        <p role="status" className="absolute right-3 top-14 z-10 rounded bg-black/75 px-3 py-2 text-sm text-white">
          {fullscreenError}
        </p>
      ) : null}
    </section>
  );
}
