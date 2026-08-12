import { CAMPAIGNS } from "@/lib/data/campaigns";
import type { Campaign } from "@/lib/data/schemas";

/**
 * Banners do Hero = campanhas ativas (fallback para "em breve" se nenhuma
 * campanha estiver ativa, pra nunca deixar o Hero vazio). Declarada `async`
 * de propósito, mesmo sem I/O: é o ponto de troca para um CMS no futuro.
 */
export async function getHeroBanners(): Promise<readonly Campaign[]> {
  const active = CAMPAIGNS.filter((campaign) => campaign.status === "ativa");
  return active.length > 0
    ? active
    : CAMPAIGNS.filter((campaign) => campaign.status === "em-breve");
}
