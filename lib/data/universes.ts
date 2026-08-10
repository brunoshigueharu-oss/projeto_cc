import { universeSchema, type Universe } from "./schemas";

const RAW_UNIVERSES = [
  {
    slug: "necroplanta",
    order: 1,
    name: "Necroplanta",
    tagline: "Horror botânico contado em capítulos ilustrados.",
    description:
      "Uma flora que se alimenta de memória. Cada volume abre uma estufa nova, com suas próprias regras de crescimento e apodrecimento.",
    tone: "garnet",
  },
  {
    slug: "robo-de-madeira",
    order: 2,
    name: "Robô de Madeira",
    tagline: "Mitologia mecânica e relíquias esquecidas.",
    description:
      "Autômatos entalhados por gente que já morreu, ainda cumprindo ordens que ninguém lembra de ter dado.",
    tone: "navy",
  },
  {
    slug: "caixa-de-reliquias",
    order: 3,
    name: "Caixa de Relíquias",
    tagline: "Curiosidades e artefatos de um gabinete impossível.",
    description:
      "Um inventário de objetos que não deveriam existir, catalogados por um arquivista que desconfia do próprio catálogo.",
    tone: "brown",
  },
  {
    slug: "contos-noturnos",
    order: 4,
    name: "Contos Noturnos",
    tagline: "Histórias curtas para colecionar uma a uma.",
    description:
      "Volumes finos, de leitura única, pensados para caber no bolso e não sair da cabeça.",
    tone: "forest",
  },
];

export const UNIVERSES: readonly Universe[] = universeSchema
  .array()
  .parse(RAW_UNIVERSES)
  .sort((a, b) => a.order - b.order);

export const UNIVERSE_SLUGS: ReadonlySet<string> = new Set(
  UNIVERSES.map((universe) => universe.slug),
);

export const UNIVERSES_BY_SLUG: ReadonlyMap<string, Universe> = new Map(
  UNIVERSES.map((universe) => [universe.slug, universe]),
);
