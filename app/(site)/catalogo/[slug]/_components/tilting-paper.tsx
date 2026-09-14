"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { SHEET_AREA_CLASS } from "./paper-sheet-area";

const MAX_TILT_DEG = 8;

type TiltingPaperProps = {
  className?: string;
  /** Opcional: página "impressa" na folha, recortada à área opaca de
   * `paper.png`. Deve vir já em retrato (proporção ~0.7) — página de miolo
   * em paisagem precisa ser girada no arquivo, não via CSS. Sem blend mode:
   * a folha serve para comparar cor entre edições, e `multiply` alteraria
   * a cor da arte. */
  page?: { src: string; alt: string };
};

/**
 * Folha de sulfite (`paper.png`, mesma arte do `PaperTiltEffect` do upsell)
 * que inclina levemente seguindo o mouse — `rotateX`/`rotateY` via
 * `perspective`, aplicado direto em `ref.style.transform` para não
 * re-renderizar a cada pixel de movimento. Rastreio em `window`, não no
 * elemento: a folha reage ao mouse na página inteira, não só quando o
 * cursor está sobre ela. Desabilitado sem mouse fino ou com
 * `prefers-reduced-motion`.
 *
 * Junto com o tilt, uma luz difusa segue o cursor. É uma luz só para todas
 * as folhas da tela: o centro do gradiente fica na posição do cursor
 * relativa a cada folha, com raio fixo em px (não relativo ao tamanho da
 * folha), então duas folhas lado a lado mostram pedaços do mesmo feixe em vez
 * de cada uma ter o seu. Posição via CSS vars (`--glare-x`/`--glare-y`) no
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
      <div className="relative">
        <Image
          src="/images/upsell/paper.png"
          alt=""
          aria-hidden="true"
          width={656}
          height={900}
          sizes="(min-width: 640px) 288px, 224px"
          className="h-auto w-full drop-shadow-xl"
        />
        {page && (
          <div className={`${SHEET_AREA_CLASS} overflow-hidden`}>
            <Image
              src={page.src}
              alt={page.alt}
              fill
              sizes="(min-width: 640px) 262px, 204px"
              className="object-cover"
            />
          </div>
        )}
        <div
          ref={glareRef}
          aria-hidden="true"
          className={`${SHEET_AREA_CLASS} pointer-events-none bg-radial-[circle_600px_at_var(--glare-x)_var(--glare-y)] from-white/40 via-white/15 via-45% to-white/0 opacity-0 transition-opacity`}
        />
      </div>
    </div>
  );
}
