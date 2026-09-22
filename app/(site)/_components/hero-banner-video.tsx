"use client";

import { useEffect, useRef } from "react";

import type { HomeBanner } from "@/lib/data/schemas";

/** Breakpoint do vídeo quadrado — o mesmo `sm:` em que o container do
 * banner deixa de ser quadrado e vira a faixa 1785/650. */
const MOBILE_BANNER_MEDIA = "(max-width: 639px)";

type HeroBannerVideoProps = {
  banner: HomeBanner;
  /** Posição do slide, em telas: `0` está em cena, `-1` espera encostado fora
   * pela esquerda e `1` pela direita. Mudar esse número é o que desliza. */
  offset: number;
  isActive: boolean;
  onPlaying?: () => void;
};

/**
 * Um slide do carrossel da Home: o vídeo do banner ocupando o quadro inteiro,
 * deslocado na horizontal pelo `offset`. Só o slide em cena toca — os
 * vizinhos ficam montados e pausados fora da tela, já carregados, para a
 * troca não começar num retângulo preto.
 */
export function HeroBannerVideo({ banner, offset, isActive, onPlaying }: HeroBannerVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // O <video> escolhe a fonte UMA vez, quando entra no documento, e nunca
  // reavalia o `media` dos <source>. No Safari do iPhone o primeiro slide (o
  // único que vem pronto no HTML do servidor) caía no vídeo widescreen mesmo
  // com o CSS já em modo mobile — provavelmente porque a media query é testada
  // antes de o `meta viewport` valer, contra os 980px iniciais. Chrome,
  // Firefox e Safari do macOS acertam. Aqui a escolha é refeita no cliente com
  // `matchMedia`, sem depender do `media`, e repetida quando o breakpoint muda
  // (girar o aparelho).
  useEffect(() => {
    const query = window.matchMedia(MOBILE_BANNER_MEDIA);

    function syncVideoSource() {
      const video = videoRef.current;
      if (!video) return;

      const wanted =
        query.matches && banner.videoSrcMobile ? banner.videoSrcMobile : banner.videoSrc;
      const current = video.currentSrc ? new URL(video.currentSrc).pathname : "";
      if (current === wanted) return;

      // `src` no elemento tem precedência sobre os <source> filhos, então não
      // depende mais do `media` ter sido avaliado na viewport certa.
      video.src = wanted;
      video.load();
    }

    syncVideoSource();
    query.addEventListener("change", syncVideoSource);
    return () => query.removeEventListener("change", syncVideoSource);
  }, [banner]);

  // Quem está fora de cena fica parado: três vídeos decodificando ao mesmo
  // tempo por nada. Ao entrar, o banner recomeça do primeiro quadro — ele
  // desliza para dentro já contando a cena do início, como uma página virada.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!isActive) {
      video.pause();
      return;
    }

    // Sem nenhum dado carregado não há para onde buscar, e mexer em
    // `currentTime` aí dá erro no Safari — recém-carregado ele já está no zero.
    if (video.readyState > 0) video.currentTime = 0;
    video.play().catch(() => {});
  }, [isActive]);

  return (
    <video
      ref={videoRef}
      aria-hidden="true"
      className="absolute inset-0 size-full object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.32,0.72,0,1)]"
      style={{ transform: `translateX(${offset * 100}%)` }}
      // Só o slide em cena começa sozinho; os vizinhos carregam parados,
      // prontos para deslizar (`preload`).
      autoPlay={isActive}
      preload="auto"
      loop
      muted
      playsInline
      onPlaying={onPlaying}
    >
      {banner.videoSrcMobile && <source src={banner.videoSrcMobile} media={MOBILE_BANNER_MEDIA} />}
      <source src={banner.videoSrc} />
    </video>
  );
}
