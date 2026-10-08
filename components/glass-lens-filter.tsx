"use client";

import { useEffect } from "react";

/**
 * Mapas da lente, um par por formato, gerados por
 * `scripts/generate-glass-lens.py` (perfil de squircle convexo + lei de
 * Snell, receita de kube.io/blog/liquid-glass-css-svg).
 *
 * `lens-*` é o deslocamento: vermelho empurra no eixo X, verde no Y e 128 é
 * o ponto neutro, então o miolo do vidro fica parado e só o bisel dobra a
 * imagem para dentro. `specular-*` é a luz de aro, somada por cima com
 * `screen` (preto não altera nada). `scale` é o que o script imprime. Não
 * são cores de interface, é dado do filtro.
 */
const LENSES = [{ id: "glass-lens", shape: "circle", scale: 0.09 }] as const;

/**
 * Filtros SVG da refração do vidro (`.glass-lens` em
 * `app/globals.css`).
 *
 * Só o Chromium aplica `url()` em `backdrop-filter`; Safari e Firefox aceitam
 * a sintaxe e desenham nada, o que apagaria o blur junto. Por isso a refração
 * é ligada por `data-glass-lens` no `<html>`, e só onde `userAgentData`
 * existe — fora dali o vidro fica no blur do utilitário `glass`.
 */
export function GlassLensFilter() {
  useEffect(() => {
    if ("userAgentData" in navigator) {
      document.documentElement.dataset.glassLens = "";
    }
  }, []);

  return (
    <svg aria-hidden="true" focusable="false" className="pointer-events-none absolute size-0">
      {LENSES.map((lens) => (
        <filter
          key={lens.id}
          id={lens.id}
          x="0"
          y="0"
          width="1"
          height="1"
          primitiveUnits="objectBoundingBox"
          colorInterpolationFilters="sRGB"
        >
          <feImage
            href={`/images/glass/lens-${lens.shape}.png`}
            x="0"
            y="0"
            width="1"
            height="1"
            preserveAspectRatio="none"
            result="map"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="map"
            scale={lens.scale}
            xChannelSelector="R"
            yChannelSelector="G"
            result="refracted"
          />
          <feImage
            href={`/images/glass/specular-${lens.shape}.png`}
            x="0"
            y="0"
            width="1"
            height="1"
            preserveAspectRatio="none"
            result="specular"
          />
          <feBlend in="specular" in2="refracted" mode="screen" />
        </filter>
      ))}
    </svg>
  );
}
