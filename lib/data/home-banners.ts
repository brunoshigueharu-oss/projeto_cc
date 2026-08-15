import { BOOKS_BY_SLUG } from "./books";
import { homeBannerSchema, type HomeBanner } from "./schemas";

/**
 * Banners de vídeo do Hero da Home, na ordem de exibição do carrossel.
 * Cada banner linka para a página do livro correspondente.
 */
const RAW_HOME_BANNERS = [
  {
    slug: "necroplanta",
    videoSrc: "/videos/home/necroplanta.mp4",
    href: "/catalogo/necroplanta",
  },
  {
    slug: "os-contos-do-planta-2",
    videoSrc: "/videos/home/os-contos-do-planta-2.mp4",
    href: "/catalogo/os-contos-do-planta-2",
  },
] as const;

export const HOME_BANNERS: readonly HomeBanner[] = RAW_HOME_BANNERS.map((raw) => {
  const banner = homeBannerSchema.parse(raw);
  if (!BOOKS_BY_SLUG.has(banner.slug)) {
    throw new Error(`Banner da Home aponta para um livro que não existe em books.ts: ${banner.slug}`);
  }
  return banner;
});
