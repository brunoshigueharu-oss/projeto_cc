import type { Metadata } from "next";

import { getCampaign } from "./_data-access/get-campaign";
import { CampaignBanner } from "./_components/campaign-banner";
import { CampaignProgress } from "./_components/campaign-progress";
import { CampaignAbout } from "./_components/campaign-about";
import { CampaignBooks } from "./_components/campaign-books";
import { CampaignSpecialEdition } from "./_components/campaign-special-edition";

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
 *   _components/campaign-about     "Sobre o projeto", o parallax e, depois
 *                                  dele, o mesmo bloco das páginas de livro:
 *                                  "O Livro" + "Sobre o Autor" + ficha
 *                                  técnica, e as páginas internas
 *   _components/campaign-books     demais títulos citados (fora do Figma)
 *   _components/campaign-special-edition
 *                                  edição limitada do título, fechando a
 *                                  página (fora do Figma)
 *
 * Decisões que valem manter ao evoluir a página:
 *
 * 1. Nada de dado duplicado. Ficha técnica, autor e galeria saem do título
 *    principal (`relatedBookSlugs[0]`) em `books.ts`; a campanha só acrescenta
 *    o que é dela — meta, arrecadação, apoiadores e o texto do projeto. Pelo
 *    mesmo motivo a antiga seção "O criador" saiu (2026-09): a bio do autor
 *    agora vive em "Sobre o Autor", dentro do `campaign-about`, no mesmo
 *    formato da página de livro — duas vezes a mesma bio na mesma página era
 *    só repetição.
 * 2. Toda seção decide sozinha se renderiza. Campanha de evento não tem meta,
 *    autor sem bio mostra só o nome, e a maioria dos títulos ainda não tem
 *    galeria — o layout precisa fechar em todos esses casos.
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
  const { campaign, primaryBook, otherBooks, specialEditionBook } =
    await getCampaign();

  return (
    <>
      <CampaignBanner campaign={campaign} />
      <CampaignProgress campaign={campaign} />
      <CampaignAbout campaign={campaign} primaryBook={primaryBook} />
      <CampaignBooks books={otherBooks} />
      <CampaignSpecialEdition campaign={campaign} book={specialEditionBook} />
    </>
  );
}
