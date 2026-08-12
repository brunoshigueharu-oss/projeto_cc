"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

type UniverseShowcaseImageProps = {
  src: string;
  alt: string;
};

const MAX_TILT_DEGREES = 6;

/**
 * Ilustração do universo com leve tilt 3D que reage à posição do cursor em
 * qualquer ponto da tela — não precisa o mouse estar em cima da imagem, ela
 * "percebe" o cursor à distância e vira sutilmente na direção dele. Zoom e
 * sombra extra continuam reservados pro hover direto (`group-hover`, puro
 * CSS), como uma resposta a mais quando o cursor chega perto.
 *
 * Ângulo escrito direto via CSS custom property (não `useState`) pra não
 * re-renderizar a cada `mousemove`; throttle por `requestAnimationFrame`
 * segue o mesmo padrão de `parallax-section.tsx`.
 */
export function UniverseShowcaseImage({ src, alt }: UniverseShowcaseImageProps) {
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let frameId = 0;

    function update(clientX: number, clientY: number) {
      frameId = 0;
      const rect = frame!.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const px = Math.max(-1, Math.min(1, (clientX - centerX) / (window.innerWidth / 2)));
      const py = Math.max(-1, Math.min(1, (clientY - centerY) / (window.innerHeight / 2)));

      frame!.style.setProperty("--tilt-x", `${(-py * MAX_TILT_DEGREES).toFixed(2)}deg`);
      frame!.style.setProperty("--tilt-y", `${(px * MAX_TILT_DEGREES).toFixed(2)}deg`);
    }

    function onMouseMove(event: MouseEvent) {
      if (frameId !== 0) return;
      const { clientX, clientY } = event;
      frameId = requestAnimationFrame(() => update(clientX, clientY));
    }

    window.addEventListener("mousemove", onMouseMove, { passive: true });

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <div className="w-full max-w-md shrink-0 lg:w-[420px] [perspective:1200px]">
      <div
        ref={frameRef}
        className="group relative aspect-[4/5] w-full overflow-hidden rounded-2xl shadow-lg shadow-foreground/10 transition-[transform,box-shadow] duration-300 ease-out [transform:rotateX(var(--tilt-x,0deg))_rotateY(var(--tilt-y,0deg))] hover:shadow-2xl hover:shadow-foreground/20"
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(min-width: 1024px) 420px, 100vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
        />
      </div>
    </div>
  );
}
