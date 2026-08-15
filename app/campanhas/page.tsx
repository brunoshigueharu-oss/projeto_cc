import type { Metadata } from "next";

import { getCampaign } from "./_data-access/get-campaign";
import { CampaignBanner } from "./_components/campaign-banner";
import { CampaignProgress } from "./_components/campaign-progress";
import { CampaignAbout } from "./_components/campaign-about";
import { CampaignCreator } from "./_components/campaign-creator";
import { CampaignBooks } from "./_components/campaign-books";

/**
 * ============================================================================
 * PÁGINA DE CAMPANHAS
 * ============================================================================
 *
 * Hocus Pocus roda uma campanha por vez: `/campanhas` é a única página do
 * módulo, sem listagem nem rota dinâmica — ela renderiza direto o registro
 * único de `lib/data/campaigns.ts`. Trocar de campanha é editar aquele
 * arquivo; nada aqui muda.
 *
 * Estrutura, seguindo o "campanha-detalhe-desktop" do Figma (node 211:1340):
 *
 *   _data-access/get-campaign.ts   resolve a campanha e o título principal
 *   lib/funding.ts                 cálculo da barra de arrecadação
 *   _components/campaign-banner    faixa de abertura (arte ou cor do universo)
 *   _components/campaign-progress  arrecadação, prazo e CTA
 *   _components/campaign-about     "Sobre o projeto" + ficha + páginas internas
 *   _components/campaign-creator   "O criador" — autor do título principal
 *   _components/campaign-books     demais títulos citados (fora do Figma)
 *
 * Decisões que valem manter ao evoluir a página:
 *
 * 1. Nada de dado duplicado. Ficha técnica, autor e galeria saem do título
 *    principal (`relatedBookSlugs[0]`) em `books.ts`; a campanha só acrescenta
 *    o que é dela — meta, arrecadação, apoiadores e o texto do projeto.
 * 2. Toda seção decide sozinha se renderiza. Campanha de evento não tem meta,
 *    autor sem bio não vira seção de criador, e a maioria dos títulos ainda
 *    não tem galeria — o layout precisa fechar em todos esses casos.
 * 3. O contador de dias é o único Client Component (ver `campaign-countdown`):
 *    a página é estática, e uma data calculada no servidor congelaria no build.
 */

export async function generateMetadata(): Promise<Metadata> {
  const { campaign } = await getCampaign();

  return {
    title: campaign.title,
    description: campaign.description.slice(0, 155),
  };
}

export default async function CampanhasPage() {
  const { campaign, primaryBook, otherBooks } = await getCampaign();

  return (
    <>
      <CampaignBanner campaign={campaign} />
      <CampaignProgress campaign={campaign} />
      <CampaignAbout campaign={campaign} primaryBook={primaryBook} />
      <CampaignCreator primaryBook={primaryBook} tone={campaign.tone} />
      <CampaignBooks books={otherBooks} />
    </>
  );
}
