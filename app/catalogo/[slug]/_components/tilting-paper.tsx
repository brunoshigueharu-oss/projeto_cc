"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

const MAX_TILT_DEG = 8;

/**
 * Folha de sulfite (`paper.png`, mesma arte do `PaperTiltEffect` do upsell)
 * que inclina levemente seguindo o mouse — `rotateX`/`rotateY` via
 * `perspective`, aplicado direto em `ref.style.transform` para não
 * re-renderizar a cada pixel de movimento. Rastreio em `window`, não no
 * elemento: a folha reage ao mouse na página inteira, não só quando o
 * cursor está sobre ela. Desabilitado sem mouse fino ou com
 * `prefers-reduced-motion`.
 */
export function TiltingPaper({ className }: { className?: string }) {
  const paperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const paper = paperRef.current;
    if (!paper) return;

    const isInteractive =
      window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!isInteractive) return;

    function handleMouseMove(event: MouseEvent) {
      if (!paper) return;

      const nx = (event.clientX / window.innerWidth) * 2 - 1;
      const ny = (event.clientY / window.innerHeight) * 2 - 1;
      const rotateX = (-ny * MAX_TILT_DEG).toFixed(2);
      const rotateY = (nx * MAX_TILT_DEG).toFixed(2);

      paper.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    }

    function handleMouseLeave() {
      if (!paper) return;
      paper.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg)";
    }

    // `mouseleave` não borbulha e seu comportamento em `document` é
    // inconsistente entre navegadores para detectar "mouse saiu da janela".
    // `mouseout` borbulha até a raiz; checar `relatedTarget === null` filtra
    // só a transição para fora da viewport.
    function handlePointerLeaveWindow(event: MouseEvent) {
      if (!event.relatedTarget) handleMouseLeave();
    }

    window.addEventListener("mousemove", handleMouseMove);
    document.documentElement.addEventListener("mouseout", handlePointerLeaveWindow);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
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
      <Image
        src="/images/upsell/paper.png"
        alt=""
        aria-hidden="true"
        width={656}
        height={900}
        sizes="(min-width: 640px) 288px, 224px"
        className="h-auto w-full drop-shadow-xl"
      />
    </div>
  );
}
