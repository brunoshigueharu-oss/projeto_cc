import type { Tone } from "./data/schemas";

/**
 * Mapa de tonalidade → classe Tailwind.
 *
 * Precisa ser literal: o Tailwind 4 varre o código-fonte em busca de nomes de
 * classe completos, então `bg-universe-${tone}` seria descartado no build.
 * Os tokens `--color-universe-*` vivem em `app/globals.css`.
 */
export const TONE_BACKGROUND: Record<Tone, string> = {
  garnet: "bg-universe-garnet",
  navy: "bg-universe-navy",
  brown: "bg-universe-brown",
  forest: "bg-universe-forest",
};

export const TONE_TEXT: Record<Tone, string> = {
  garnet: "text-universe-garnet",
  navy: "text-universe-navy",
  brown: "text-universe-brown",
  forest: "text-universe-forest",
};
