import { CAMPAIGN } from "@/lib/data/campaigns";
import type { Campaign } from "@/lib/data/schemas";

/**
 * Banner do Hero = a campanha do site, exceto quando ela já encerrou (aí o
 * Hero some em vez de anunciar algo que não dá mais pra apoiar). Declarada
 * `async` de propósito, mesmo sem I/O: é o ponto de troca para um CMS no
 * futuro.
 */
export async function getHeroBanners(): Promise<readonly Campaign[]> {
  return CAMPAIGN.status === "encerrada" ? [] : [CAMPAIGN];
}
