"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
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
  /** Ajusta o zoom do vídeo dentro do quadro. <1 reduz — usa em capas de
   *  caixa/estojo, cujo enquadramento original é mais largo que o dos livros
   *  e por isso lê como "maior" que os vizinhos quando preenche o quadro
   *  inteiro. >1 amplia — usa quando o enquadramento original deixa o livro
   *  pequeno no quadro em relação aos vizinhos. */
  videoScale?: number;
  /** Como o vídeo preenche o quadro. "cover" (padrão) recorta as bordas;
   *  "contain" nunca corta — usa quando a animação faz o objeto encostar na
   *  borda do próprio vídeo em algum ponto do loop (ver `coverVideoFit` em
   *  lib/data/schemas.ts). */
  videoFit?: "cover" | "contain";
  /** Mostra um botão glass de pausar/reproduzir sobre o vídeo. Só faz sentido
   *  no destaque grande do hero — nas miniaturas do catálogo/relacionados
   *  fica desligado por padrão. */
  showPauseControl?: boolean;
};

/** Métodos expostos por ref para iniciar/parar o vídeo no hover.
 *
 *  O BookCover nunca decide sozinho quando tocar: quem o envolve (o card, o
 *  carrossel de combos) é quem detecta o hover e chama isso. Não dá pra deixar
 *  o próprio BookCover escutar mouseenter/mouseleave no seu quadro — em cards
 *  com link esticado (`after:inset-0`, ver components/book-card.tsx) esse
 *  link fica por cima do vídeo na pilha de empilhamento e o quadro nunca
 *  chegaria a receber o evento; centralizar o controle aqui evita ter dois
 *  caminhos (um deles morto, dependendo de quem envolve o componente). */
export type BookCoverHandle = {
  play: () => void;
  pause: () => void;
};

// Frame mínimo (não 0) para o navegador decodificar e exibir uma imagem de
// repouso em vez de um retângulo preto quando o vídeo não está tocando.
const REST_FRAME_TIME = 0.01;

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
export const BookCover = forwardRef<BookCoverHandle, BookCoverProps>(function BookCover({
  title,
  alt,
  size = "sm",
  className,
  videoSrc,
  videoScale,
  videoFit = "cover",
  showPauseControl,
}, ref) {
  const isLarge = size === "lg";
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const hasPauseControl = Boolean(videoSrc) && showPauseControl;

  // Miniaturas (catálogo, relacionados, estante, combos) só tocam o vídeo no
  // hover/foco — dezenas delas com autoplay simultâneo é o que deixava essas
  // páginas pesadas. O destaque grande (showPauseControl) mantém o autoplay
  // contínuo de sempre, com o controle manual de pausar/reproduzir.
  const playsOnHover = Boolean(videoSrc) && !showPauseControl;

  function handleToggle() {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }

  function handleHoverStart() {
    if (!playsOnHover) return;
    videoRef.current?.play();
  }

  function handleHoverEnd() {
    if (!playsOnHover) return;
    // Só pausa — sem voltar o currentTime ao frame de repouso. Resetar aqui
    // fazia a capa "recomeçar" a cada hover, denunciando que é um vídeo; o
    // efeito 3D pretendido é a capa congelar exatamente onde o mouse saiu.
    videoRef.current?.pause();
  }

  function handleLoadedMetadata() {
    if (!playsOnHover) return;
    const video = videoRef.current;
    if (video) video.currentTime = REST_FRAME_TIME;
  }

  useImperativeHandle(ref, () => ({
    play: handleHoverStart,
    pause: handleHoverEnd,
  }));

  const frameStyle = videoScale ? { transform: `scale(${videoScale})` } : undefined;

  // Nas miniaturas com vídeo, sem folga extra o zoom de hover (scale-105
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
          <div className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-105 group-focus-within:scale-105">
            {videoSrc ? (
              <video
                ref={videoRef}
                aria-hidden="true"
                className={cn(
                  "size-full",
                  videoFit === "contain" ? "object-contain" : "object-cover",
                )}
                src={videoSrc}
                autoPlay={!playsOnHover}
                loop
                muted
                playsInline
                preload={playsOnHover ? "metadata" : "auto"}
                onLoadedMetadata={handleLoadedMetadata}
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
});
