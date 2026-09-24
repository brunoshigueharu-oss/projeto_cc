"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

const MAX_TILT_DEG = 8;

type TiltingPaperProps = {
  className?: string;
  /** Opcional: prancha do miolo exibida sozinha, sem folha de papel por
   * trás. Deve vir já em paisagem (1400×989) — a caixa usa essa proporção.
   * Sem blend mode nem filtro: a prancha serve para comparar cor entre
   * edições, e qualquer efeito alteraria a cor da arte. Sem ela, a caixa
   * fica com um fundo neutro no lugar. */
  page?: { src: string; alt: string };
};

/**
 * Prancha do miolo (a ilustração sozinha, sem mockup de papel) que inclina
 * levemente seguindo o mouse — `rotateX`/`rotateY` via `perspective`,
 * aplicado direto em `ref.style.transform` para não re-renderizar a cada
 * pixel de movimento. Uma sombra leve embaixo dá o ar de folha solta sobre
 * a página. Rastreio em `window`, não no elemento: a prancha reage ao mouse
 * na página inteira, não só quando o cursor está sobre ela. Desabilitado sem
 * mouse fino ou com `prefers-reduced-motion`.
 *
 * Junto com o tilt, uma luz difusa segue o cursor. É uma luz só para todas
 * as pranchas da tela: o centro do gradiente fica na posição do cursor
 * relativa a cada prancha, com raio fixo em px (não relativo ao tamanho
 * dela), então duas pranchas na mesma tela mostram pedaços do mesmo feixe em
 * vez de cada uma ter o seu. Posição via CSS vars (`--glare-x`/`--glare-y`) no
 * próprio elemento, sem re-render; aparece no primeiro movimento e some
 * quando o mouse sai da janela.
 */
export function TiltingPaper({ className, page }: TiltingPaperProps) {
  const paperRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const paper = paperRef.current;
    const glare = glareRef.current;
    if (!paper || !glare) return;

    const isInteractive =
      window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!isInteractive) return;

    // Último cursor visto: rolar a página com a roda não dispara `mousemove`,
    // mas move a folha sob o cursor — sem reposicionar no `scroll`, a luz
    // "grudaria" na folha e pularia no próximo movimento do mouse.
    let lastPointer: { x: number; y: number } | null = null;

    function positionGlare(clientX: number, clientY: number) {
      if (!glare) return;
      const glareBox = glare.getBoundingClientRect();
      glare.style.setProperty("--glare-x", `${Math.round(clientX - glareBox.left)}px`);
      glare.style.setProperty("--glare-y", `${Math.round(clientY - glareBox.top)}px`);
    }

    function handleMouseMove(event: MouseEvent) {
      if (!paper || !glare) return;

      lastPointer = { x: event.clientX, y: event.clientY };
      // Posiciona a luz (que lê a caixa da folha) antes de escrever o
      // transform: ler depois da escrita forçaria recalcular o estilo.
      positionGlare(event.clientX, event.clientY);

      const nx = (event.clientX / window.innerWidth) * 2 - 1;
      const ny = (event.clientY / window.innerHeight) * 2 - 1;
      const rotateX = (-ny * MAX_TILT_DEG).toFixed(2);
      const rotateY = (nx * MAX_TILT_DEG).toFixed(2);

      paper.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      glare.style.opacity = "1";
    }

    function handleScroll() {
      if (lastPointer) positionGlare(lastPointer.x, lastPointer.y);
    }

    function handleMouseLeave() {
      if (!paper || !glare) return;
      lastPointer = null;
      paper.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg)";
      glare.style.opacity = "0";
    }

    // `mouseleave` não borbulha e seu comportamento em `document` é
    // inconsistente entre navegadores para detectar "mouse saiu da janela".
    // `mouseout` borbulha até a raiz; checar `relatedTarget === null` filtra
    // só a transição para fora da viewport.
    function handlePointerLeaveWindow(event: MouseEvent) {
      if (!event.relatedTarget) handleMouseLeave();
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.documentElement.addEventListener("mouseout", handlePointerLeaveWindow);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
      document.documentElement.removeEventListener("mouseout", handlePointerLeaveWindow);
    };
  }, []);

  return (
    <div
      ref={paperRef}
      className={className}
      style={{
        transitionProperty: "transform",
        transitionDuration: "120ms",
        transitionTimingFunction: "ease-out",
      }}
    >
      <div className="relative aspect-[1400/989] overflow-hidden bg-muted shadow-[0_12px_28px_-10px_rgb(0_0_0/0.35)]">
        {page && (
          <Image
            src={page.src}
            alt={page.alt}
            fill
            sizes="(min-width: 1024px) 320px, (min-width: 768px) 256px, (min-width: 640px) 224px, 288px"
            className="object-cover"
          />
        )}
        <div
          ref={glareRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-radial-[circle_600px_at_var(--glare-x)_var(--glare-y)] from-white/9 via-white/3 via-45% to-white/0 opacity-0 transition-opacity"
        />
      </div>
    </div>
  );
}
