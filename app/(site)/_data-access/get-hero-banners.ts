import { HOME_BANNERS } from "@/lib/data/home-banners";
import type { HomeBanner } from "@/lib/data/schemas";

/**
 * Banners do Hero = carrossel de vídeos da Home, sem texto sobreposto.
 * Declarada `async` de propósito, mesmo sem I/O: é o ponto de troca para um
 * CMS no futuro.
 */
export async function getHeroBanners(): Promise<readonly HomeBanner[]> {
  return HOME_BANNERS;
}
