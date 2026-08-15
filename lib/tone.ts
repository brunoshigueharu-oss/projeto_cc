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

/**
 * Mesmas tonalidades em versão lavada, para áreas grandes (faixa de campanha,
 * placeholders). A cor cheia satura demais quando ocupa meia tela — o site
 * antigo abria a campanha num pastel dessaturado, não no tom cheio. O valor
 * com alpha precisa vir literal pelo mesmo motivo do mapa acima.
 */
export const TONE_BACKGROUND_SOFT: Record<Tone, string> = {
  garnet: "bg-universe-garnet/20",
  navy: "bg-universe-navy/20",
  brown: "bg-universe-brown/20",
  forest: "bg-universe-forest/20",
};

export const TONE_TEXT: Record<Tone, string> = {
  garnet: "text-universe-garnet",
  navy: "text-universe-navy",
  brown: "text-universe-brown",
  forest: "text-universe-forest",
};
