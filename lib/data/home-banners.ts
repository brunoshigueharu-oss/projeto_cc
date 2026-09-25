import { BOOKS_BY_SLUG } from "./books";
import { homeBannerSchema, type HomeBanner } from "./schemas";

/**
 * Banners de vídeo do Hero da Home, na ordem de exibição do carrossel — o
 * primeiro é o que aparece ao abrir o site. Cada banner linka para a página do
 * livro correspondente, exceto os de chamada de campanha (com `label` próprio).
 *
 * Vídeos: desktop em 2560×932 (H.264 + HEVC) a partir do master 3570×1300, e
 * mobile em 1080×1080 (H.264) a partir do master 1400×1400. Ao trocar um vídeo,
 * suba o sufixo (`-v2` → `-v3`): `/videos/*` vai com cache `immutable` (ver
 * `next.config.ts`), então o mesmo nome nunca chegaria a quem já visitou.
 */
const RAW_HOME_BANNERS = [
  {
    // Chamada de campanha: não pertence a um livro, então não passa pelo
    // filtro de publicação abaixo e leva para `/campanhas`.
    slug: "chamada-novos-quadrinhos",
    videoSrc: "/videos/home/chamada-novos-quadrinhos-v2.mp4",
    videoSrcHevc: "/videos/home/chamada-novos-quadrinhos-v2.hevc.mp4",
    videoSrcMobile: "/videos/home/chamada-novos-quadrinhos-v2-square.mp4",
    href: "/campanhas",
    label: "campanhas de novos quadrinhos",
  },
  {
    slug: "robo-de-madeira-atlas-cianus-art-edition",
    videoSrc: "/videos/home/robo-de-madeira-atlas-cianus-art-edition-v2.mp4",
    videoSrcHevc: "/videos/home/robo-de-madeira-atlas-cianus-art-edition-v2.hevc.mp4",
    videoSrcMobile: "/videos/home/robo-de-madeira-atlas-cianus-art-edition-v2-square.mp4",
    href: "/catalogo/robo-de-madeira-atlas-cianus-art-edition",
  },
  {
    slug: "os-contos-do-planta-caixa-de-reliquias",
    videoSrc: "/videos/home/os-contos-do-planta-caixa-de-reliquias-v2.mp4",
    videoSrcHevc: "/videos/home/os-contos-do-planta-caixa-de-reliquias-v2.hevc.mp4",
    videoSrcMobile: "/videos/home/os-contos-do-planta-caixa-de-reliquias-v2-square.mp4",
    href: "/catalogo/os-contos-do-planta-caixa-de-reliquias",
  },
  {
    slug: "os-contos-do-planta-1",
    videoSrc: "/videos/home/os-contos-do-planta-1-v2.mp4",
    videoSrcHevc: "/videos/home/os-contos-do-planta-1-v2.hevc.mp4",
    videoSrcMobile: "/videos/home/os-contos-do-planta-1-v2-square.mp4",
    href: "/catalogo/os-contos-do-planta-1",
  },
  {
    slug: "os-contos-do-planta-2",
    videoSrc: "/videos/home/os-contos-do-planta-2-v2.mp4",
    videoSrcHevc: "/videos/home/os-contos-do-planta-2-v2.hevc.mp4",
    videoSrcMobile: "/videos/home/os-contos-do-planta-2-v2-square.mp4",
    href: "/catalogo/os-contos-do-planta-2",
  },
  {
    // Edição em inglês: ocupa o lugar de destaque no catálogo (a edição em
    // português, `um-bipede-entre-plantas`, está esgotada — ver nota em books.ts).
    slug: "mr-plant-a-biped-among-plants",
    videoSrc: "/videos/home/mr-plant-a-biped-among-plants-v2.mp4",
    videoSrcHevc: "/videos/home/mr-plant-a-biped-among-plants-v2.hevc.mp4",
    videoSrcMobile: "/videos/home/mr-plant-a-biped-among-plants-v2-square.mp4",
    href: "/catalogo/mr-plant-a-biped-among-plants",
  },
  {
    slug: "necroplanta",
    videoSrc: "/videos/home/necroplanta-v4.mp4",
    videoSrcHevc: "/videos/home/necroplanta-v4.hevc.mp4",
    videoSrcMobile: "/videos/home/necroplanta-v4-square.mp4",
    href: "/catalogo/necroplanta",
  },
  {
    slug: "robo-de-madeira-atlas-cianus",
    videoSrc: "/videos/home/robo-de-madeira-atlas-cianus-v2.mp4",
    videoSrcHevc: "/videos/home/robo-de-madeira-atlas-cianus-v2.hevc.mp4",
    videoSrcMobile: "/videos/home/robo-de-madeira-atlas-cianus-v2-square.mp4",
    href: "/catalogo/robo-de-madeira-atlas-cianus",
  },
  {
    // Variante noturna do banner de Yanayag — mesmo livro do slug "yanayag"
    // abaixo, dois vídeos diferentes no carrossel (ver `slug` como
    // identificador do banner, não do livro).
    slug: "yanayag-lua",
    videoSrc: "/videos/home/yanayag-lua-v2.mp4",
    videoSrcHevc: "/videos/home/yanayag-lua-v2.hevc.mp4",
    videoSrcMobile: "/videos/home/yanayag-lua-v2-square.mp4",
    href: "/catalogo/yanayag",
    bookSlug: "yanayag",
  },
  {
    slug: "yanayag-solar",
    videoSrc: "/videos/home/yanayag-solar-v2.mp4",
    videoSrcHevc: "/videos/home/yanayag-solar-v2.hevc.mp4",
    videoSrcMobile: "/videos/home/yanayag-solar-v2-square.mp4",
    href: "/catalogo/yanayag",
    bookSlug: "yanayag",
  },
] as const;

export const HOME_BANNERS: readonly HomeBanner[] = RAW_HOME_BANNERS.flatMap((raw) => {
  if ("label" in raw) return [homeBannerSchema.parse(raw)];

  const bookSlug = "bookSlug" in raw ? raw.bookSlug : raw.slug;
  const book = BOOKS_BY_SLUG.get(bookSlug);
  if (!book) {
    throw new Error(`Banner da Home aponta para um livro que não existe em books.ts: ${bookSlug}`);
  }

  const banner = homeBannerSchema.parse({ ...raw, label: book.title });
  // Livro despublicado ou fora da vitrine geral do catálogo (`catalogVisible`
  // false — ex. título só de campanha por enquanto): some do carrossel sem
  // precisar remover o banner daqui.
  return book.published && book.catalogVisible ? [banner] : [];
});
