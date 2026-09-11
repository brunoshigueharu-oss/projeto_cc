"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

const MAX_TILT_DEG = 10;
const FRONT_SHEET_ROTATE_DEG = -6;
const BACK_SHEET_ROTATE_DEG = 9;

/** Área opaca da folha dentro de `paper.png` (656×900: folha em x 11→607,
 * y 11→855; o resto é a sombra embutida). O desenho vai só sobre essa área —
 * na caixa inteira, o fundo branco do vídeo cobria a sombra e deslocava a
 * folha. */
const SHEET_AREA_CLASS = "absolute left-[1.68%] top-[1.22%] h-[93.89%] w-[91.01%]";

/**
 * Duas folhas "jogadas" sobre a mesa, ambas inclinando levemente seguindo o
 * mouse (`rotateX`/`rotateY` via `perspective`, aplicado direto em
 * `ref.style.transform` — não `useState`, pra não re-renderizar a cada
 * pixel de movimento). O rastreio é em `window`, não no elemento da folha:
 * a posição do cursor relativa à janela inteira normaliza pra -1..1, então
 * o tilt reage ao mouse em qualquer lugar da página, não só quando o
 * cursor está bem em cima da caixa das folhas. Ao sair da janela, a
 * rotação de ambas volta a 0.
 *
 * Folha da frente: vídeo (`paper-sketch.mp4`, um take real de mão
 * desenhando em papel branco) sobreposto ao `paper.png` com
 * `mix-blend-mode: multiply` — o fundo claro do vídeo multiplica pra
 * "sumir" contra o papel, sobrando só o traço escuro do desenho, como se
 * tivesse sido desenhado direto na folha.
 *
 * Folha de trás: a arte estática (`paper-sketch-art.png`) sobreposta ao
 * `paper.png`. Sem blend mode — o PNG já tem canal alpha real (traços
 * escuros semi-transparentes sobre fundo transparente), então a
 * composição normal já basta.
 *
 * Sem canvas de rastro e sem lápis desenhado à mão — ver
 * docs/superpowers/specs/2026-08-12-upsell-paper-pencil-effect-design.md
 * (Revisão 3) para o porquê de terem sido removidos, Revisão 4 pro tilt
 * global, e Revisão 5 pro vídeo/arte.
 */
export function PaperTiltEffect() {
  const frontPaperRef = useRef<HTMLDivElement>(null);
  const backPaperRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.pause();
    }
  }, []);

  useEffect(() => {
    const frontPaper = frontPaperRef.current;
    const backPaper = backPaperRef.current;
    if (!frontPaper || !backPaper) return;

    const isInteractive =
      window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!isInteractive) return;

    function handleMouseMove(event: MouseEvent) {
      const nx = (event.clientX / window.innerWidth) * 2 - 1;
      const ny = (event.clientY / window.innerHeight) * 2 - 1;
      const rotateX = (-ny * MAX_TILT_DEG).toFixed(2);
      const rotateY = (nx * MAX_TILT_DEG).toFixed(2);

      frontPaper!.style.transform =
        `rotate(${FRONT_SHEET_ROTATE_DEG}deg) perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      backPaper!.style.transform =
        `rotate(${BACK_SHEET_ROTATE_DEG}deg) perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    }

    function handleMouseLeave() {
      frontPaper!.style.transform =
        `rotate(${FRONT_SHEET_ROTATE_DEG}deg) perspective(900px) rotateX(0deg) rotateY(0deg)`;
      backPaper!.style.transform =
        `rotate(${BACK_SHEET_ROTATE_DEG}deg) perspective(900px) rotateX(0deg) rotateY(0deg)`;
    }

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div className="relative h-[380px] w-full max-w-[460px] select-none sm:h-[430px]">
      {/* Folha de trás — decorativa, mas agora também inclina com o mouse */}
      <div
        aria-hidden="true"
        className="absolute right-0 top-2 h-[300px] w-[230px] sm:h-[340px] sm:w-[260px]"
      >
        <div
          ref={backPaperRef}
          className="absolute inset-0"
          style={{
            transform: `rotate(${BACK_SHEET_ROTATE_DEG}deg)`,
            transitionProperty: "transform",
            transitionDuration: "120ms",
            transitionTimingFunction: "ease-out",
          }}
        >
          <div className="relative mx-auto aspect-[656/900] h-full">
            <Image
              src="/images/upsell/paper.png"
              alt=""
              fill
              sizes="260px"
              className="object-contain drop-shadow-md"
            />
            <div className={SHEET_AREA_CLASS}>
              <Image
                src="/images/upsell/paper-sketch-art.png"
                alt=""
                fill
                sizes="260px"
                className="pointer-events-none object-contain"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Folha da frente — mesma inclinação, em primeiro plano */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 h-[300px] w-[230px] sm:h-[340px] sm:w-[260px]"
      >
        <div
          ref={frontPaperRef}
          className="absolute inset-0"
          style={{
            transform: `rotate(${FRONT_SHEET_ROTATE_DEG}deg)`,
            transitionProperty: "transform",
            transitionDuration: "120ms",
            transitionTimingFunction: "ease-out",
          }}
        >
          <div className="relative mx-auto aspect-[656/900] h-full">
            <Image
              src="/images/upsell/paper.png"
              alt=""
              fill
              sizes="260px"
              className="object-contain drop-shadow-xl"
            />
            {/* clip-path corta a coluna preta de 1px nas bordas laterais do vídeo */}
            <video
              ref={videoRef}
              src="/videos/upsell/paper-sketch.mp4"
              autoPlay
              loop
              muted
              playsInline
              className={`${SHEET_AREA_CLASS} pointer-events-none object-cover mix-blend-multiply [clip-path:inset(0_1px)]`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
