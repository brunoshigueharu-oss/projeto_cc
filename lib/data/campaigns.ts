import { BOOKS_BY_SLUG } from "./books";
import { campaignSchema, type Campaign } from "./schemas";

const RAW_CAMPAIGNS = [
  {
    slug: "pre-venda-jardineiro",
    title: "Pré-venda: O Jardineiro Não Dorme",
    kicker: "Necroplanta",
    description:
      "Quem reservar até o fechamento do lote recebe o marcador serigrafado da estufa e o nome impresso na página de agradecimentos.",
    kind: "pre-venda",
    startsAt: "2026-02-01",
    endsAt: "2026-03-15",
    status: "ativa",
    tone: "garnet",
    ctaLabel: "Reservar exemplar",
    ctaHref: "/catalogo/o-jardineiro-nao-dorme",
    relatedBookSlugs: ["o-jardineiro-nao-dorme", "os-contos-do-planta"],
  },
  {
    slug: "assinatura-noturnos",
    title: "Assinatura Contos Noturnos",
    kicker: "Quatro volumes por ano",
    description:
      "Um volume fino a cada trimestre, sempre inédito, sempre numerado. A assinatura fecha quando a tiragem esgota.",
    kind: "assinatura",
    startsAt: "2026-01-10",
    endsAt: null,
    status: "ativa",
    tone: "forest",
    ctaLabel: "Ver planos",
    ctaHref: "/contato",
    relatedBookSlugs: ["sete-noites-sem-lua"],
  },
  {
    slug: "feira-do-livro-2026",
    title: "Feira do Livro 2026",
    kicker: "Encontro presencial",
    description:
      "Estande com a tiragem completa, sessão de assinatura e a Art Edition disponível para folhear — a única forma de ver a edição esgotada de perto.",
    kind: "evento",
    startsAt: "2026-09-04",
    endsAt: "2026-09-13",
    status: "em-breve",
    tone: "navy",
    ctaLabel: "Receber aviso",
    ctaHref: "/contato",
    relatedBookSlugs: ["art-edition-robo-de-madeira"],
  },
  {
    slug: "lancamento-caixa-de-reliquias",
    title: "Lançamento: Caixa de Relíquias",
    kicker: "Encerrada",
    description:
      "O primeiro volume do gabinete saiu em agosto de 2025 e a tiragem de lançamento acabou em onze dias.",
    kind: "lancamento",
    startsAt: "2025-08-16",
    endsAt: "2025-08-27",
    status: "encerrada",
    tone: "brown",
    ctaLabel: "Ver o livro",
    ctaHref: "/catalogo/caixa-de-reliquias-vol-i",
    relatedBookSlugs: ["caixa-de-reliquias-vol-i", "inventario-incompleto"],
  },
];

export const CAMPAIGNS: readonly Campaign[] = campaignSchema
  .array()
  .refine(
    (campaigns) =>
      campaigns.every((campaign) =>
        campaign.relatedBookSlugs.every((slug) => BOOKS_BY_SLUG.has(slug)),
      ),
    { message: "Campanha aponta para um livro que não existe em books.ts" },
  )
  .parse(RAW_CAMPAIGNS);
