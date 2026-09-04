import { BOOKS_BY_SLUG } from "./books";
import { homeBannerSchema, type HomeBanner } from "./schemas";

/**
 * Banners de vídeo do Hero da Home, na ordem de exibição do carrossel.
 * Cada banner linka para a página do livro correspondente.
 */
const RAW_HOME_BANNERS = [
  {
    slug: "robo-de-madeira-atlas-cianus-art-edition",
    videoSrc: "/videos/home/robo-de-madeira-atlas-cianus-art-edition.mp4",
    videoSrcMobile: "/videos/home/robo-de-madeira-atlas-cianus-art-edition-square.mp4",
    href: "/catalogo/robo-de-madeira-atlas-cianus-art-edition",
  },
  {
    slug: "os-contos-do-planta-caixa-de-reliquias",
    videoSrc: "/videos/home/os-contos-do-planta-caixa-de-reliquias.mp4",
    videoSrcMobile: "/videos/home/os-contos-do-planta-caixa-de-reliquias-square.mp4",
    href: "/catalogo/os-contos-do-planta-caixa-de-reliquias",
  },
  {
    slug: "os-contos-do-planta-1",
    videoSrc: "/videos/home/os-contos-do-planta-1.mp4",
    videoSrcMobile: "/videos/home/os-contos-do-planta-1-square.mp4",
    href: "/catalogo/os-contos-do-planta-1",
  },
  {
    slug: "os-contos-do-planta-2",
    videoSrc: "/videos/home/os-contos-do-planta-2.mp4",
    videoSrcMobile: "/videos/home/os-contos-do-planta-2-square.mp4",
    href: "/catalogo/os-contos-do-planta-2",
  },
  {
    // Edição em inglês: ocupa o lugar de destaque no catálogo (a edição em
    // português, `um-bipede-entre-plantas`, está esgotada — ver nota em books.ts).
    slug: "mr-plant-a-biped-among-plants",
    videoSrc: "/videos/home/mr-plant-a-biped-among-plants.mp4",
    videoSrcMobile: "/videos/home/mr-plant-a-biped-among-plants-square.mp4",
    href: "/catalogo/mr-plant-a-biped-among-plants",
  },
  {
    slug: "necroplanta",
    videoSrc: "/videos/home/necroplanta.mp4",
    videoSrcMobile: "/videos/home/necroplanta-square.mp4",
    href: "/catalogo/necroplanta",
  },
  {
    slug: "robo-de-madeira-atlas-cianus",
    videoSrc: "/videos/home/robo-de-madeira-atlas-cianus.mp4",
    videoSrcMobile: "/videos/home/robo-de-madeira-atlas-cianus-square.mp4",
    href: "/catalogo/robo-de-madeira-atlas-cianus",
  },
  {
    // Variante noturna do banner de Yanayag — mesmo livro do slug "yanayag"
    // abaixo, dois vídeos diferentes no carrossel (ver `slug` como
    // identificador do banner, não do livro).
    slug: "yanayag-lua",
    videoSrc: "/videos/home/yanayag-lua.mp4",
    videoSrcMobile: "/videos/home/yanayag-lua-square.mp4",
    href: "/catalogo/yanayag",
    bookSlug: "yanayag",
  },
  {
    slug: "yanayag-solar",
    videoSrc: "/videos/home/yanayag-solar.mp4",
    videoSrcMobile: "/videos/home/yanayag-solar-square.mp4",
    href: "/catalogo/yanayag",
    bookSlug: "yanayag",
  },
] as const;

export const HOME_BANNERS: readonly HomeBanner[] = RAW_HOME_BANNERS.flatMap((raw) => {
  const bookSlug = "bookSlug" in raw ? raw.bookSlug : raw.slug;
  const book = BOOKS_BY_SLUG.get(bookSlug);
  if (!book) {
    throw new Error(`Banner da Home aponta para um livro que não existe em books.ts: ${bookSlug}`);
  }

  const banner = homeBannerSchema.parse({ ...raw, bookTitle: book.title });
  // Livro despublicado ou fora da vitrine geral do catálogo (`catalogVisible`
  // false — ex. título só de campanha por enquanto): some do carrossel sem
  // precisar remover o banner daqui.
  return book.published && book.catalogVisible ? [banner] : [];
});
