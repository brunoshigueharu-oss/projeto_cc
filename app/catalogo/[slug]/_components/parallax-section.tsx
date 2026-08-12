"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

type ParallaxLayer = {
  src: string;
  /** Deslocamento máximo em px durante o scroll; `0` = camada estática. */
  shift: number;
};

type ParallaxSectionProps = {
  /** Ordenado de trás pra frente (fundo → primeiro plano). */
  layers: ParallaxLayer[];
};

/**
 * Faixa decorativa entre o hero e "O Livro": camadas de imagem empilhadas
 * que se deslocam em velocidades diferentes conforme a página rola, dando
 * sensação de profundidade. Puramente visual — sem conteúdo textual, daí
 * `aria-hidden`.
 *
 * Mesma altura da faixa de vídeo (`video-banner-section.tsx`): uma faixa
 * fina dá mais margem pro parallax cortar/revelar as imagens durante o
 * scroll do que uma faixa alta, onde o deslocamento relativo é pouco
 * perceptível.
 *
 * Movimento calculado em JS (scroll + rAF), não CSS `animation-timeline:
 * view()`: Safari não suporta scroll-driven animations, então a versão
 * anterior (100% CSS) simplesmente não animava nesse navegador — o
 * `@supports` fazia a camada cair pra posição estática, sem erro visível.
 * Esta é a única seção Client Component da rota; todo o resto continua
 * Server Component (ver nota em `page.tsx`).
 */
export function ParallaxSection({ layers }: ParallaxSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const layerEls = Array.from(
      section.querySelectorAll<HTMLElement>("[data-parallax-shift]"),
    );

    let frameId = 0;

    function update() {
      frameId = 0;
      const rect = section!.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      // 0 quando a seção entra por baixo da viewport, 1 quando sai por cima.
      const progress =
        1 - (rect.top + rect.height) / (viewportHeight + rect.height);
      const clamped = Math.min(1, Math.max(0, progress));
      const centered = (clamped - 0.5) * 2;

      for (const el of layerEls) {
        const shift = Number(el.dataset.parallaxShift);
        el.style.transform = `translateY(${centered * shift}px)`;
      }
    }

    function onScrollOrResize() {
      if (frameId === 0) {
        frameId = requestAnimationFrame(update);
      }
    }

    update();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, []);

  if (layers.length === 0) {
    return null;
  }

  return (
    <section
      ref={sectionRef}
      aria-hidden="true"
      className="relative isolate h-40 w-full overflow-hidden sm:h-56 md:h-64 lg:h-72"
    >
      {layers.map((layer) => (
        <div
          key={layer.src}
          data-parallax-shift={layer.shift}
          className="absolute inset-0 will-change-transform"
        >
          <Image
            src={layer.src}
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
          />
        </div>
      ))}
    </section>
  );
}
