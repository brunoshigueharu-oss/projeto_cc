import { BOOKS_BY_SLUG } from "./books";
import { campaignSchema, type Campaign } from "./schemas";

/**
 * A campanha do site.
 *
 * Hocus Pocus roda uma campanha por vez — sem listagem, sem histórico
 * navegável — então este módulo guarda um registro único em vez de um array.
 * Trocar de campanha é editar os campos abaixo; não há slug de rota
 * envolvido, `/campanhas` sempre mostra este registro.
 *
 * ATENÇÃO: os números de `funding` abaixo são de demonstração, seguindo o
 * layout do Figma (node 211:1340). Substituir pelos valores reais da
 * plataforma de arrecadação antes de publicar.
 */
const RAW_CAMPAIGN = {
  slug: "pre-venda-um-bipede",
  title: "Pré-venda: Um Bípede Entre Plantas",
  kicker: "O Planta",
  description:
    "Quem reservar até o fechamento do lote recebe o marcador serigrafado da estufa e o nome impresso na página de agradecimentos.",
  kind: "pre-venda",
  startsAt: "2026-08-01",
  endsAt: "2026-09-30",
  status: "ativa",
  tone: "garnet",
  ctaLabel: "Reservar exemplar",
  // Edição em português está esgotada — a campanha aponta para a edição em
  // inglês, que ocupa o lugar de destaque no catálogo (ver nota em books.ts).
  ctaHref: "/catalogo/mr-plant-a-biped-among-plants",
  relatedBookSlugs: ["mr-plant-a-biped-among-plants", "necroplanta"],
  funding: {
    goal: { amount: 3_500_000, currency: "BRL" },
    raised: { amount: 1_245_000, currency: "BRL" },
    backers: 310,
  },
  about: [
    "A estufa da Mansão Silverwood não dorme: ao cair da noite, as espécies híbridas catalogadas por Gustavo Ravaglio despertam e reescrevem o próprio jardim. Este é o volume que abre o universo O Planta em edição definitiva.",
    "Esta campanha viabiliza a tiragem em papel offset de alta gramatura, com capa dura em relevo, corte serigrafado e as ilustrações originais a nanquim revisadas pelo autor para esta edição.",
  ],
} as const;

export const CAMPAIGN: Campaign = campaignSchema
  .refine(
    (campaign) =>
      campaign.relatedBookSlugs.every((slug) => BOOKS_BY_SLUG.has(slug)),
    { message: "Campanha aponta para um livro que não existe em books.ts" },
  )
  .parse(RAW_CAMPAIGN);
