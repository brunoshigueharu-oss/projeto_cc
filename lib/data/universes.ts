import { universeSchema, type Universe } from "./schemas";

const RAW_UNIVERSES = [
  {
    slug: "necroplanta",
    order: 1,
    name: "Necroplanta",
    tagline: "Horror botânico contado em capítulos ilustrados.",
    description:
      "Planta é um vegetal que não queria ser apenas uma planta. Ele queria explorar o mundo, viver aventuras e descobrir o que existia além da cerca que delimitava seu pequeno universo. O protagonista acreditava que o mundo terminava logo ali, até ouvir dos pássaros histórias sobre como tudo era vasto, misterioso e extraordinário. Sem esperança de mudar seu destino, sua vida se transforma ao conhecer Dr. Mantis, um cientista com aparência de louva-a-deus que, ao perceber em Planta uma inteligência e uma vontade incomuns, cria um corpo para que ele pudesse finalmente se expressar e explorar o mundo. E isso é apenas o começo: uma grande saga de fantasia reconhecida pelos principais prêmios do país e elogiada por importantes artistas da indústria dos quadrinhos.",
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
  {
    slug: "mares-de-vidro",
    order: 5,
    name: "Marés de Vidro",
    tagline: "Naufrágios que se recusam a terminar de afundar.",
    description:
      "Um litoral onde a maré devolve mais do que leva. Cada capítulo é um casco diferente, encontrado por gente que não devia ter procurado.",
    tone: "navy",
  },
  {
    slug: "circo-de-sombras",
    order: 6,
    name: "Circo de Sombras",
    tagline: "Uma turnê que nunca anuncia a próxima cidade.",
    description:
      "As luzes se acendem sem aviso, o público some sem se despedir e o número principal muda de nome a cada apresentação.",
    tone: "garnet",
  },
  {
    slug: "biblioteca-submersa",
    order: 7,
    name: "Biblioteca Submersa",
    tagline: "Acervo proibido, catalogado debaixo d'água.",
    description:
      "Um arquivo afundado de propósito, com empréstimos que só podem ser feitos por quem já sabe nadar de volta.",
    tone: "brown",
  },
  {
    slug: "jardim-de-ossos",
    order: 8,
    name: "Jardim de Ossos",
    tagline: "Um cemitério que floresce fora de época.",
    description:
      "Canteiros regados com memória alheia, onde cada muda carrega um nome que ninguém se lembra de ter enterrado.",
    tone: "forest",
  },
  {
    slug: "yanayag",
    order: 9,
    name: "Yanayag",
    // TODO: tagline/descrição provisórias — confirmar copy oficial com a editora.
    tagline: "Quadrinho de Mazzitielli e Alcatena.",
    description:
      "Primeiro título do catálogo assinado fora do universo de Gustavo Ravaglio.",
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
