"use client";

import { useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

import { cn } from "@/lib/utils";
import { Seal } from "./seal";

type BookCoverProps = {
  title: string;
  /** Descrição da capa real — vira o rótulo acessível do card. */
  alt: string;
  size?: "sm" | "lg";
  className?: string;
  /** Preview em vídeo (mudo, loop, autoplay) — quando presente, substitui o placeholder. */
  videoSrc?: string;
  /** Reduz o vídeo dentro do quadro (0–1). Usa em capas de caixa/estojo, cujo
   *  enquadramento original é mais largo que o dos livros e por isso lê como
   *  "maior" que os vizinhos quando preenche o quadro inteiro. */
  videoScale?: number;
  /** Mostra um botão glass de pausar/reproduzir sobre o vídeo. Só faz sentido
   *  no destaque grande do hero — nas miniaturas do catálogo/relacionados
   *  fica desligado por padrão. */
  showPauseControl?: boolean;
};

/**
 * Capa do livro: vídeo de preview quando disponível, senão placeholder em CSS.
 *
 * Nem todo título ainda tem vídeo de capa enviado pela editora (ver
 * `coverVideoSrc` em lib/data/schemas.ts); nesses casos mantém o placeholder
 * (painel branco, moldura interna, selo) que já cobria a ausência de
 * qualquer asset de capa.
 *
 * Hover/foco dá um leve zoom (não desloca o card): o quadro externo fica fixo
 * e só o conteúdo interno escala, contido pelo `overflow-hidden`. Depende do
 * `group` do card pai (ver components/book-card.tsx).
 */
export function BookCover({
  title,
  alt,
  size = "sm",
  className,
  videoSrc,
  videoScale,
  showPauseControl,
}: BookCoverProps) {
  const isLarge = size === "lg";
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const hasPauseControl = Boolean(videoSrc) && showPauseControl;

  function handleToggle() {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }

  const frameStyle = videoScale ? { transform: `scale(${videoScale})` } : undefined;

  // Nas miniaturas com vídeo, sem folga extra o zoom de hover (scale-110
  // abaixo) empurra a capa para fora e corta o livro — em vez de parecer um
  // "3D" da capa, parece um vídeo cortado.
  //
  // A caixa de recorte (overflow-hidden) sangra 7% de largura para cada lado
  // além do card; o quadro interno (onde o `frameStyle` acima é aplicado)
  // fica recuado de volta ao tamanho original dentro dela — então o
  // enquadramento em repouso não muda, só ganha margem de manobra para o
  // hover não cortar o livro. O espaçamento maior do grid do catálogo
  // absorve essa sangria.
  const hasVideoBleed = Boolean(videoSrc) && !isLarge;
  const BLEED_PERCENT = 7;
  const frameInsetPercent = (BLEED_PERCENT / (100 + 2 * BLEED_PERCENT)) * 100;

  return (
    <div className={cn("group/cover relative aspect-3/4", className)}>
      <div
        role="img"
        aria-label={alt}
        className={cn(
          "absolute inset-y-0 overflow-hidden rounded-lg bg-white",
          hasVideoBleed ? "-inset-x-[7%]" : "inset-x-0",
        )}
      >
        <div
          className="absolute inset-y-0"
          style={{
            insetInlineStart: hasVideoBleed ? `${frameInsetPercent}%` : 0,
            insetInlineEnd: hasVideoBleed ? `${frameInsetPercent}%` : 0,
            ...frameStyle,
          }}
        >
          <div className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-110 group-focus-within:scale-110">
            {videoSrc ? (
              <video
                ref={videoRef}
                aria-hidden="true"
                className="size-full object-cover"
                src={videoSrc}
                autoPlay
                loop
                muted
                playsInline
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
            ) : (
              <>
                <div
                  aria-hidden="true"
                  className={cn(
                    "absolute rounded border border-border",
                    isLarge ? "inset-5" : "inset-3",
                  )}
                />
                <div
                  aria-hidden="true"
                  className={cn(
                    "absolute flex items-center justify-center rounded-full bg-muted text-foreground/70",
                    isLarge ? "right-5 top-5 size-12" : "right-3 top-3 size-9",
                  )}
                >
                  <Seal className={isLarge ? "size-7" : "size-5"} />
                </div>

                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute font-display leading-tight text-foreground",
                    isLarge ? "inset-x-6 bottom-6 text-3xl" : "inset-x-4 bottom-4 text-lg",
                  )}
                >
                  {title}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {hasPauseControl ? (
        <button
          type="button"
          onClick={handleToggle}
          aria-label={isPlaying ? "Pausar vídeo" : "Reproduzir vídeo"}
          className="absolute left-1/2 top-1/2 z-10 flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/15 text-white opacity-50 backdrop-blur-[2px] transition-all duration-200 hover:opacity-100 hover:bg-black/25 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 group-hover/cover:opacity-80"
        >
          {isPlaying ? (
            <Pause className="size-3.5 fill-current" />
          ) : (
            <Play className="size-3.5 fill-current" />
          )}
        </button>
      ) : null}
    </div>
  );
}
