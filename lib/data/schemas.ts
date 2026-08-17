import { z } from "zod";

/**
 * Contrato de dados de todo o site.
 *
 * Os arrays em `universes.ts` / `books.ts` / `campaigns.ts` são validados no
 * topo do módulo (`schema.parse(...)`), que roda uma única vez por processo —
 * em rota estática, roda no `next build` e nunca mais. Um slug digitado errado
 * derruba o boot em vez de virar página em branco.
 */

const slug = z
  .string()
  .regex(/^[a-z0-9-]+$/, "Slug deve ser ASCII em kebab-case (sem acentos)");

/** Tonalidades dos universos. Vira classe literal no componente (ver nota abaixo). */
export const toneSchema = z.enum(["garnet", "navy", "brown", "forest"]);
export type Tone = z.infer<typeof toneSchema>;

export const universeSchema = z.object({
  slug,
  /** Ordena os universos na prateleira da Home. */
  order: z.number().int().positive(),
  name: z.string().min(1),
  tagline: z.string().min(1),
  description: z.string().min(1),
  /** Opcional: versão em inglês de `description`, usada em páginas de livro
   * com `locale: "en"` (ver `UniverseSection`). Sem ela, a seção cai no texto
   * em português mesmo numa página em inglês — preencher assim que o
   * universo tiver algum título impresso em outro idioma. */
  descriptionEn: z.string().min(1).optional(),
  tone: toneSchema,
  /** Opcional: arte de fundo do card do universo (Home/Catálogo), sobre o
   * gradiente de `tone`. Preencher só quando a editora enviar a ilustração.
   * Quando a arte retrata uma edição específica (ex. Art Edition), `title` e
   * `author` sobrepõem o nome do universo e a tagline no card. */
  image: z
    .object({
      src: z.string().min(1),
      alt: z.string().min(1),
      title: z.string().min(1).optional(),
      author: z.string().min(1).optional(),
    })
    .optional(),
});
export type Universe = z.infer<typeof universeSchema>;

export const bookSchema = z.object({
  slug,
  title: z.string().min(1),
  subtitle: z.string().optional(),
  universeSlug: slug,
  /** Idioma da edição impressa: define em que idioma a página do livro
   * renderiza os rótulos fixos de UI (botões, cabeçalhos de seção etc.).
   * Default "pt": só edições impressas em outro idioma (ex.
   * `mr-plant-a-biped-among-plants`) precisam declarar "en". */
  locale: z.enum(["pt", "en"]).default("pt"),
  author: z.object({
    name: z.string().min(1),
    /** Opcional: nem todo autor cadastrado já tem bio recebida da editora. */
    bio: z.string().min(1).optional(),
  }),
  /** Opcional: ficha de catálogo pode chegar antes da sinopse final. */
  synopsis: z.string().min(1).optional(),
  /** Trecho curto do livro, exibido em destaque na página de detalhe. */
  excerpt: z.string().optional(),
  /** Opcional: selo de premiação (ex. "Finalista Jabuti"), exibido junto de
   * "O Livro" na página de detalhe. Preencher só quando o título tiver prêmio
   * a divulgar. */
  awardBadge: z.object({ src: z.string().min(1), alt: z.string().min(1) }).optional(),
  coverAlt: z.string().min(1),
  coverTone: toneSchema,
  /** Preview em vídeo (mudo, loop) que substitui a capa estática no card. */
  coverVideoSrc: z.string().optional(),
  /** Ajusta o zoom do vídeo dentro do quadro: <1 reduz (capas de caixa/estojo,
   *  mais largas que um livro), >1 amplia (vídeo cujo enquadramento original
   *  deixa o livro pequeno no quadro). */
  coverVideoScale: z.number().positive().max(2).optional(),
  /** Opcional: vídeo em faixa cheia (mudo, loop), entre a seção de exemplar e a do universo. */
  videoBannerSrc: z.string().optional(),
  /** Opcional: variante noturna de `videoBannerSrc` — quando presente, a faixa
   * ganha um botão sol/lua para alternar entre as duas versões (ex.: uma
   * floresta que muda de dia para noite). Preencher só quando a editora
   * enviar as duas versões do mesmo plano. */
  videoBannerNightSrc: z.string().optional(),
  /** Opcional: comparação com a edição-base da qual este título deriva (ex.:
   * Necroplanta é uma variante de "Os Contos do Planta — Vol. 2"). Renderiza
   * duas folhas de sulfite lado a lado com um "X" entre elas — a mesma arte
   * de `paper.png` do upsell, sem capa real —, cada uma com o título embaixo,
   * seguidas de um texto de destaque sobre a tiragem/edição. Preencher só
   * quando o livro for uma variante/edição especial de outro título já
   * cadastrado em `books.ts`. */
  compareEdition: z
    .object({
      baseBookSlug: slug,
      headline: z.string().min(1),
      description: z.string().min(1),
    })
    .optional(),
  /** Opcional: conteúdo de uma caixa/kit — vídeo da caixa abrindo seguido dos
   * itens individuais em vídeo, exibido logo abaixo da ficha técnica.
   * `openingVideoSrc` pode chegar depois dos itens; a seção renderiza só com
   * os itens até lá. Preencher apenas quando o título for uma caixa/edição
   * especial com múltiplos itens fotografados em vídeo pela editora. */
  boxContents: z
    .object({
      openingVideoSrc: z.string().optional(),
      items: z
        .array(
          z.object({
            videoSrc: z.string().min(1),
            label: z.string().min(1).optional(),
          }),
        )
        .min(1),
    })
    .optional(),
  /** Opcional: outras fotos do livro (miolo, verso, detalhes), exibidas como galeria abaixo da capa. */
  gallery: z
    .array(
      z.object({
        src: z.string().min(1),
        alt: z.string().min(1),
      }),
    )
    .optional(),
  /** Opcional: camadas de imagem da seção de parallax entre o hero e "O Livro",
   * ordenadas de trás pra frente (fundo → primeiro plano). Cada camada reage
   * ao scroll de um jeito próprio: `shift`/`shiftX` são o deslocamento
   * acumulado em px do início ao fim do percurso (o sinal define a direção —
   * negativo sobe / vai pra esquerda), `zoom` é a escala extra acumulada no
   * fim do percurso (`0.1` = 10% maior) e `origin` é a borda em que a camada
   * está ancorada (copa no topo, arbusto na base). O `shift` precisa levar a
   * camada para fora pela borda do `origin`: no sentido contrário o recorte
   * descola e aparece o corte reto da arte. Camada com tudo em `0` fica
   * estática. */
  parallax: z
    .array(
      z.object({
        src: z.string().min(1),
        shift: z.number(),
        shiftX: z.number().optional(),
        zoom: z.number().min(0).optional(),
        origin: z.enum(["top", "center", "bottom"]).optional(),
      }),
    )
    .min(1)
    .optional(),
  /** Opcional: ficha técnica completa (ISBN, dimensões etc.) chega depois do cadastro inicial. */
  specs: z
    .object({
      pages: z.number().int().positive(),
      isbn: z.string().regex(/^\d{3}-\d{10}$/, "ISBN-13 no formato 978-XXXXXXXXXX"),
      /** Encadernação e acabamentos, como vem na ficha da editora. Texto livre
       * de propósito: além de "Capa dura"/"Brochura", a editora descreve
       * acabamentos específicos por título (ex. "Capa Holográfica Plástica"). */
      format: z.string().min(1),
      dimensions: z.string().min(1),
      /** Opcional: peso do exemplar, como na ficha da editora (ex. "200 g"). */
      weight: z.string().min(1).optional(),
      language: z.string().default("Português"),
      edition: z.string().min(1),
      publishedAt: z.iso.date(),
    })
    .optional(),
  /** Em centavos, para não carregar float. Formatação só em lib/format.ts. */
  price: z.object({
    amount: z.number().int().nonnegative(),
    currency: z.literal("BRL"),
  }),
  /** Opcional: link de compra chega junto da ficha técnica. */
  buyUrl: z.url().optional(),
  /** Default "disponivel": status real por título chega junto da ficha técnica. */
  status: z.enum(["disponivel", "pre-venda", "esgotado"]).default("disponivel"),
  /** Default `true`. `false` tira a página do ar (404) sem apagar os dados —
   * usado para títulos que ainda não devem ir ao público. */
  published: z.boolean().default(true),
  /** Título exibido na prateleira de destaque da Home (ver `featured`). */
  featured: z.boolean().default(false),
  /** Obrigatório quando `featured`: still da capa usado no card da Home —
   * arte própria para essa vitrine, distinta do preview em vídeo do
   * catálogo (`coverVideoSrc`). */
  featuredCardImage: z.object({ src: z.string().min(1), alt: z.string().min(1) }).optional(),
  /** Opcional: item avulso (ex. exemplar autografado) vendido junto do livro. */
  upsell: z
    .object({
      title: z.string().min(1),
      description: z.string().min(1),
      price: z.object({ amount: z.number().int().nonnegative(), currency: z.literal("BRL") }),
      ctaLabel: z.string().min(1).default("Adicionar ao pedido"),
    })
    .optional(),
  /** Opcional: sobrepõe o bloco "Sobre o Universo" com a ilustração real e o
   * título originais deste título, em vez do bloco genérico derivado de
   * `universe` (placeholder de cor + selo). Preencher só quando a editora
   * já enviou a arte. */
  universeShowcase: z
    .object({
      title: z.string().min(1),
      image: z.object({ src: z.string().min(1), alt: z.string().min(1) }),
    })
    .optional(),
  /** Opcional: composição decorativa "família do universo" — fundo
   * ilustrado + capas dos livros do mesmo universo posicionadas como numa
   * arte só, substituindo o grid genérico de `RelatedBooks` nesta página.
   * Preencher só quando a editora enviar a arte composta (fundo + capas já
   * recortadas). Toda capa leva `bookSlug` — inclusive a do livro atual, cujo
   * link aponta para a própria página, mantendo o hover/zoom consistente com
   * as demais; `position` é em % dentro do palco (razão 1920/1080 da arte
   * original), extraída da bounding box real de cada capa. */
  universeFamily: z
    .object({
      backgroundSrc: z.string().min(1),
      covers: z
        .array(
          z.object({
            bookSlug: slug.optional(),
            caption: z.string().min(1),
            image: z.object({
              src: z.string().min(1),
              alt: z.string().min(1),
              width: z.number().int().positive(),
              height: z.number().int().positive(),
            }),
            position: z.object({
              top: z.number().min(0).max(100),
              left: z.number().min(0).max(100),
              width: z.number().min(0).max(100),
            }),
          }),
        )
        .min(1),
    })
    .optional(),
});
export type Book = z.infer<typeof bookSchema>;
export type Locale = Book["locale"];

export const comboSchema = z.object({
  slug,
  title: z.string().min(1),
  description: z.string().min(1),
  /** Opcional: banner dedicado (arte da editora). Sem ele, o card cai no
   * fallback de capas dos livros do kit lado a lado. */
  image: z.object({ src: z.string().min(1), alt: z.string().min(1) }).optional(),
  /** Slugs dos livros que compõem o kit. */
  bookSlugs: z.array(slug).min(2),
  /** Preço promocional final do combo, em centavos. O preço "de" (riscado)
   * não é campo daqui — é calculado somando o preço de cada livro do kit,
   * pra nunca divergir do preço real do livro. */
  price: z.object({ amount: z.number().int().nonnegative(), currency: z.literal("BRL") }),
  ctaLabel: z.string().min(1).default("Comprar combo"),
  buyUrl: z.url().optional(),
});
export type Combo = z.infer<typeof comboSchema>;

/** Valor monetário em centavos, para não carregar float (ver `Book.price`). */
const money = z.object({
  amount: z.number().int().nonnegative(),
  currency: z.literal("BRL"),
});

export const campaignSchema = z.object({
  slug,
  title: z.string().min(1),
  kicker: z.string().min(1),
  description: z.string().min(1),
  kind: z.enum(["lancamento", "pre-venda", "evento", "assinatura"]),
  startsAt: z.iso.date(),
  endsAt: z.iso.date().nullable(),
  /**
   * Status é dado explícito, não derivado de `new Date()`: em Server Component
   * estático a data congela no build e a campanha ficaria "ativa" para sempre.
   */
  status: z.enum(["ativa", "em-breve", "encerrada"]),
  tone: toneSchema,
  ctaLabel: z.string().min(1),
  ctaHref: z.string().min(1),
  /**
   * O primeiro slug é o título principal da campanha: dele saem a ficha
   * técnica estimada, o criador e a galeria de páginas internas da página de
   * detalhe, sem duplicar dado que já vive em `books.ts`.
   */
  relatedBookSlugs: z.array(slug).default([]),
  /** Opcional: banner de abertura da página da campanha. Sem ele, a faixa cai
   * no gradiente do `tone`. */
  banner: z.object({ src: z.string().min(1), alt: z.string().min(1) }).optional(),
  /**
   * Opcional: números do financiamento coletivo. Sem eles a página de detalhe
   * omite a barra de progresso e mostra só o CTA — campanha de evento ou
   * assinatura não tem meta em dinheiro.
   */
  funding: z
    .object({
      goal: money,
      raised: money,
      backers: z.number().int().nonnegative(),
    })
    .optional(),
  /** Opcional: parágrafos de "Sobre o projeto". Sem eles, a página usa
   * `description` como parágrafo único. */
  about: z.array(z.string().min(1)).min(1).optional(),
  /** Opcional: amostras do miolo ("Visualização das páginas internas"). Sem
   * elas, a seção cai na galeria do título principal. */
  gallery: z
    .array(z.object({ src: z.string().min(1), alt: z.string().min(1) }))
    .optional(),
});
export type Campaign = z.infer<typeof campaignSchema>;

/** Banner de vídeo do Hero da Home — mudo/loop/autoplay, sem texto sobreposto. */
export const homeBannerSchema = z.object({
  slug,
  videoSrc: z.string().min(1),
  /** Opcional: recorte quadrado (700x700) do mesmo plano, usado no lugar de
   * `videoSrc` em telas mobile (abaixo do breakpoint `sm`). Sem ele, o hero
   * cai no vídeo widescreen também no mobile. */
  videoSrcMobile: z.string().min(1).optional(),
  /** Página do livro para onde o banner leva ao ser clicado. */
  href: z.string().min(1),
});
export type HomeBanner = z.infer<typeof homeBannerSchema>;
