"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

type ParallaxLayer = {
  src: string;
  /** Deslocamento vertical acumulado no fim do percurso, em px; negativo
   * sobe, `0` = sem movimento. Deve levar a camada para fora pela borda em
   * que ela está ancorada (ver `origin`). */
  shift: number;
  /** Deslocamento horizontal acumulado no fim do percurso, em px; negativo
   * vai pra esquerda. */
  shiftX?: number;
  /** Escala extra acumulada no fim do percurso (`0.1` = 10% maior). */
  zoom?: number;
  /** Borda em que a camada está ancorada: é dela que a escala cresce e é por
   * ela que o deslocamento deve sair. Padrão: `center`. */
  origin?: "top" | "center" | "bottom";
};

type ParallaxSectionProps = {
  /** Ordenado de trás pra frente (fundo → primeiro plano). */
  layers: ParallaxLayer[];
};

/** Fração da distância até o alvo consumida a cada frame (0–1). Valores baixos
 * dão inércia: as camadas continuam se acomodando depois que o scroll para,
 * que é o que separa a sensação de profundidade de um simples deslocamento. */
const EASING = 0.12;

/** Distância restante (em unidades de progresso) abaixo da qual o movimento
 * já é sub-pixel, mesmo na camada de maior deslocamento. */
const SETTLE_THRESHOLD = 0.0005;

/** Altura (px) da faixa em que os `shift` dos dados foram calibrados — a do
 * desktop. Em telas menores a faixa encolhe e os mesmos px pesariam quase o
 * dobro, então o deslocamento acompanha essa proporção. */
const REFERENCE_HEIGHT = 416;

/**
 * Faixa decorativa entre o hero e "O Livro": camadas de imagem empilhadas
 * que reagem ao scroll em velocidades e direções diferentes, dando sensação
 * de atravessar a vegetação. Puramente visual — sem conteúdo textual, daí
 * `aria-hidden`.
 *
 * As camadas não deslizam todas pro mesmo lado: cada uma sai pela borda em
 * que está ancorada — as de cima sobem e crescem a partir do topo, as de
 * baixo descem a partir da base — como quem atravessa a cena em vez de
 * passar por ela de lado. Daí cada camada carregar seus próprios
 * `shift`/`shiftX`/`zoom`/`origin` nos dados do livro.
 *
 * O percurso vai de 0 (seção entrando por baixo da viewport) a 1 (saindo por
 * cima), e não de -1 a 1: se o meio do percurso fosse o repouso, na primeira
 * metade todo deslocamento sairia invertido — a copa desceria em vez de
 * subir, descolando do topo e expondo o corte reto da arte. Com o percurso
 * unidirecional, cada recorte só anda no sentido que o tira pela sua própria
 * borda, e nenhum deles se descola dela. As bordas laterais seguem a mesma
 * lógica:
 * o `shiftX` é pequeno perto da folga que o `zoom` abre dos dois lados
 * (`zoom * largura / 2`), e os dois crescem juntos, então o deslocamento
 * horizontal está sempre coberto.
 *
 * Só a primeira camada ganha folga além da área visível (`bleed`): ela é a
 * única opaca, e sem isso seu deslocamento revelaria o fundo branco da
 * página nas bordas. As demais são recortes transparentes — quando saem do
 * enquadramento, o que aparece atrás é a camada de fundo, então elas ficam em
 * `inset-0` e preservam o enquadramento original da arte (folga muda a
 * proporção da caixa e o `object-cover` responde ampliando a imagem).
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
    // Posição renderizada (persegue `target` com inércia) e posição alvo,
    // ambas em [0, 1]: 0 quando a seção entra por baixo da viewport, 1
    // quando sai por cima. `amplitude` corrige os px dos dados pela altura
    // real da faixa.
    let current = 0;
    let target = 0;
    let amplitude = 1;

    // Só é chamada dentro do rAF: `getBoundingClientRect` força o cálculo de
    // layout, e no handler de scroll isso aconteceria várias vezes por frame.
    function readTarget() {
      const rect = section!.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const progress =
        1 - (rect.top + rect.height) / (viewportHeight + rect.height);
      target = Math.min(1, Math.max(0, progress));
      amplitude = rect.height / REFERENCE_HEIGHT;
    }

    function render() {
      for (const el of layerEls) {
        const shiftY = Number(el.dataset.parallaxShift);
        const shiftX = Number(el.dataset.parallaxShiftX);
        const zoom = Number(el.dataset.parallaxZoom);
        // Deslocamento e escala partem os dois do zero e crescem juntos, o
        // que mantém a camada colada na sua borda o percurso inteiro.
        const scale = 1 + current * zoom;
        el.style.transform = `translate3d(${
          current * shiftX * amplitude
        }px, ${current * shiftY * amplitude}px, 0) scale(${scale})`;
      }
    }

    function tick() {
      readTarget();
      current += (target - current) * EASING;
      // Já convergiu (movimento sub-pixel): encerra o loop até o próximo
      // scroll, em vez de manter um rAF girando à toa.
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

    // Entrada direto na posição correta — sem deslizar de 0 até o alvo em
    // navegações que já chegam com a página rolada.
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
  }, []);

  if (layers.length === 0) {
    return null;
  }

  return (
    <section
      ref={sectionRef}
      aria-hidden="true"
      className="relative isolate h-56 w-full overflow-hidden sm:h-72 md:h-80 lg:h-[26rem]"
    >
      {layers.map((layer, index) => {
        const bleed =
          index === 0
            ? Math.abs(layer.shift) + Math.abs(layer.shiftX ?? 0) + 8
            : 0;

        return (
          <div
            key={layer.src}
            data-parallax-shift={layer.shift}
            data-parallax-shift-x={layer.shiftX ?? 0}
            data-parallax-zoom={layer.zoom ?? 0}
            style={{
              inset: `${-bleed}px`,
              transformOrigin: `center ${layer.origin ?? "center"}`,
            }}
            className="absolute will-change-transform"
          >
            <Image
              src={layer.src}
              alt=""
              fill
              sizes="100vw"
              className="object-cover"
            />
          </div>
        );
      })}
    </section>
  );
}
