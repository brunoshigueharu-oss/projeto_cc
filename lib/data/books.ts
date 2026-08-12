import { bookSchema, type Book } from "./schemas";
import { UNIVERSE_SLUGS } from "./universes";

const GUSTAVO = {
  name: "Gustavo Ravaglio",
  bio: "Gustavo Ravaglio é um premiado autor de quadrinhos, vencedor dos prêmios Troféu HQ Mix e Prêmio Jabuti, reconhecido pela criação de universos e personagens originais, além de projetos gráficos sofisticados que elevam a experiência do livro a outro patamar. Ravaglio é designer, escritor, ilustrador, quadrinista, antropólogo — mestre pela UFPR — e analista técnico do mercado financeiro. Atualmente, dirige seu próprio estúdio de design, atuando nas áreas de entretenimento e educação com soluções estratégicas e criativas para esses setores. Também leciona na Pontifícia Universidade Católica do Paraná, nos cursos de graduação e pós-graduação lato sensu em Design.",
};

const MAZZITIELLI_E_ALCATENA = {
  name: "Mazzitielli e Alcatena",
  // bio: ainda não recebida da editora.
};

/**
 * Catálogo real da Hocus Pocus (fonte: PDF da editora).
 *
 * Preço, autor, título e (na maioria) o vídeo de capa já vieram; sinopse,
 * ficha técnica (ISBN, dimensões etc.) e link de compra ainda não — ver
 * campos opcionais em ./schemas.ts. Completar assim que a editora enviar.
 */
const RAW_BOOKS = [
  {
    slug: "um-bipede-entre-plantas",
    title: "Um Bípede Entre Plantas",
    subtitle: "Graphic Novel — Vol. 1",
    universeSlug: "necroplanta",
    author: GUSTAVO,
    synopsis:
      "Nesta edição canônica, acompanhamos Planta desde seu nascimento até o início de sua maior aventura. Durante um experimento, Planta acaba sendo lançado para fora de sua própria realidade e cai em uma espécie de \"fresta\" entre mundos, um \"não lugar\" formado por corredores infinitesimais que conectam diferentes dimensões. É nesse labirinto impossível que vive o solitário Arruard, uma raposa violinista que carrega consigo uma misteriosa caixa de chaves mágicas, cada uma capaz de abrir passagem para diferentes dimensões. Uma ameaça silenciosa, muito maior e mais antiga do que eles poderiam imaginar, começa a cercá-los enquanto Planta e Arruard atravessam dimensões desconhecidas em uma longa jornada de volta para casa, enfrentando mundos cada vez mais estranhos, perigosos e imprevisíveis.",
    excerpt:
      "Aqui, o leitor encontra a edição canônica do personagem Planta, dando início à coleção Graphic Novel, responsável por desenvolver a grande saga principal deste universo. Este é o primeiro volume de uma série mais ampla.\n\nLivro finalista em duas categorias do Prêmio Jabuti, a mais importante premiação literária do Brasil.\n\nNesta edição, a capa foi produzida com papel italiano e ornamentada com ilustrações metálicas em cobre, aplicadas em hot stamp e estendidas também para a contra capa, criando um acabamento marcado por detalhes, brilho e textura.\n\nO livro também conta com acabamentos especiais além da capa, incluindo aplicações de tinta dourada nas páginas internas e trechos impressos em papel vegetal, ampliando as possibilidades visuais e materiais da leitura.",
    coverAlt: "Capa do livro Um Bípede Entre Plantas, de Gustavo Ravaglio",
    coverTone: "garnet",
    coverVideoSrc: "/videos/livros/um-bipede-entre-plantas.mp4",
    videoBannerSrc: "/videos/faixas/um-bipede-entre-plantas.mp4",
    parallax: [
      { src: "/images/parallax/um-bipede-entre-plantas/1-fundo.png", shift: 12 },
      { src: "/images/parallax/um-bipede-entre-plantas/2-movimento-leve.png", shift: 24 },
      { src: "/images/parallax/um-bipede-entre-plantas/3-movimento-forte.png", shift: 48 },
      { src: "/images/parallax/um-bipede-entre-plantas/4-movimento-leve.png", shift: 24 },
      { src: "/images/parallax/um-bipede-entre-plantas/5-estatico.png", shift: 0 },
    ],
    specs: {
      pages: 178,
      isbn: "978-8591748433",
      format: "Capa dura",
      dimensions: "28,7 cm • 20,4 cm • 1,9 cm",
      language: "Português (Brasil)",
      edition: "1a. edição",
      publishedAt: "2017-11-01",
    },
    price: { amount: 16999, currency: "BRL" },
    status: "esgotado",
    upsell: {
      title: "Exemplar de O Planta autografado pelo autor e sketch personalizado!",
      description:
        "Você pode receber seu exemplar de O Planta – Um bípede entre plantas autografado pelo autor e acompanhado de um sketch personalizado, produzido em folha separada especialmente para ser emoldurada e incorporada à sua coleção.\n\nUma oportunidade de possuir não apenas o livro, mas também uma obra original ligada ao universo da obra. Garanta seu livro assinado e seu sketch aqui.",
      price: { amount: 4999, currency: "BRL" },
    },
    universeShowcase: {
      title: "Sobre o Universo do Planta",
      image: {
        src: "/images/universo/um-bipede-entre-plantas.png",
        alt: "Ilustração do universo de Planta, com objetos do dia a dia de Planta espalhados sobre uma folha",
      },
    },
    universeFamily: {
      backgroundSrc: "/images/universo/familia/um-bipede-entre-plantas/fundo.svg",
      covers: [
        {
          bookSlug: "um-bipede-entre-plantas",
          caption: "O Planta — Um Bípede Entre Plantas",
          image: {
            src: "/images/universo/familia/um-bipede-entre-plantas/um-bipede-entre-plantas.png",
            alt: "Capa de O Planta — Um Bípede Entre Plantas",
            width: 307,
            height: 418,
          },
          position: { top: 5.4, left: 48.2, width: 16.0 },
        },
        {
          bookSlug: "necroplanta",
          caption: "Necroplanta",
          image: {
            src: "/images/universo/familia/um-bipede-entre-plantas/necroplanta.png",
            alt: "Capa de Necroplanta",
            width: 297,
            height: 402,
          },
          position: { top: 54.9, left: 29.6, width: 15.5 },
        },
        {
          bookSlug: "os-contos-do-planta-1",
          caption: "Os Contos do Planta — Vol. 1",
          image: {
            src: "/images/universo/familia/um-bipede-entre-plantas/os-contos-do-planta-1.png",
            alt: "Capa de Os Contos do Planta — Vol. 1",
            width: 302,
            height: 402,
          },
          position: { top: 55.2, left: 64.7, width: 15.7 },
        },
        {
          bookSlug: "os-contos-do-planta-2",
          caption: "Os Contos do Planta — Vol. 2",
          image: {
            src: "/images/universo/familia/um-bipede-entre-plantas/os-contos-do-planta-2.png",
            alt: "Capa de Os Contos do Planta — Vol. 2",
            width: 296,
            height: 402,
          },
          position: { top: 55.2, left: 80.2, width: 15.4 },
        },
      ],
    },
  },
  {
    slug: "os-contos-do-planta-1",
    title: "Os Contos do Planta",
    subtitle: "Volume 1",
    universeSlug: "necroplanta",
    author: GUSTAVO,
    coverAlt: "Capa do livro Os Contos do Planta, Volume 1, de Gustavo Ravaglio",
    coverTone: "garnet",
    coverVideoSrc: "/videos/livros/os-contos-do-planta-1.mp4",
    price: { amount: 11999, currency: "BRL" },
    featured: true,
    featuredCardImage: {
      src: "/images/livros/home/os-contos-do-planta-1.png",
      alt: "Capa do livro Os Contos do Planta, Volume 1, de Gustavo Ravaglio",
    },
  },
  {
    slug: "os-contos-do-planta-2",
    title: "Os Contos do Planta",
    subtitle: "Volume 2",
    universeSlug: "necroplanta",
    author: GUSTAVO,
    coverAlt: "Capa do livro Os Contos do Planta, Volume 2, de Gustavo Ravaglio",
    coverTone: "garnet",
    coverVideoSrc: "/videos/livros/os-contos-do-planta-2.mp4",
    price: { amount: 14999, currency: "BRL" },
    featured: true,
    featuredCardImage: {
      src: "/images/livros/home/os-contos-do-planta-2.png",
      alt: "Capa do livro Os Contos do Planta, Volume 2, de Gustavo Ravaglio",
    },
  },
  {
    slug: "robo-de-madeira-atlas-cianus",
    title: "Robô de Madeira",
    subtitle: "Atlas Cianus",
    universeSlug: "robo-de-madeira",
    author: GUSTAVO,
    coverAlt: "Capa do livro Robô de Madeira — Atlas Cianus, de Gustavo Ravaglio",
    coverTone: "navy",
    coverVideoSrc: "/videos/livros/robo-de-madeira-atlas-cianus.mp4",
    price: { amount: 18999, currency: "BRL" },
    featured: true,
    featuredCardImage: {
      src: "/images/livros/home/robo-de-madeira-atlas-cianus.png",
      alt: "Capa do livro Robô de Madeira — Atlas Cianus, de Gustavo Ravaglio",
    },
  },
  {
    slug: "robo-de-madeira-atlas-cianus-art-edition",
    title: "Robô de Madeira",
    subtitle: "Atlas Cianus — Art Edition",
    universeSlug: "robo-de-madeira",
    author: GUSTAVO,
    coverAlt:
      "Capa do livro Robô de Madeira — Atlas Cianus, Art Edition, de Gustavo Ravaglio",
    coverTone: "navy",
    coverVideoSrc: "/videos/livros/robo-de-madeira-atlas-cianus-art-edition.mp4",
    // Vídeo mostra o estojo por inteiro, bem mais largo que o de um livro solto.
    coverVideoScale: 0.72,
    price: { amount: 43999, currency: "BRL" },
    featured: true,
    featuredCardImage: {
      src: "/images/livros/home/robo-de-madeira-atlas-cianus-art-edition.png",
      alt: "Capa do livro Robô de Madeira — Atlas Cianus, Art Edition, de Gustavo Ravaglio",
    },
  },
  {
    slug: "os-contos-do-planta-caixa-de-reliquias",
    title: "Os Contos do Planta",
    subtitle: "Caixa de Relíquias",
    universeSlug: "necroplanta",
    author: GUSTAVO,
    coverAlt: "Capa da Caixa de Relíquias de Os Contos do Planta, de Gustavo Ravaglio",
    coverTone: "garnet",
    coverVideoSrc: "/videos/livros/os-contos-do-planta-caixa-de-reliquias.mp4",
    // Vídeo mostra a caixa por inteiro, mais larga que a de um livro solto.
    coverVideoScale: 0.8,
    price: { amount: 35999, currency: "BRL" },
    featured: true,
    featuredCardImage: {
      src: "/images/livros/home/os-contos-do-planta-caixa-de-reliquias.png",
      alt: "Capa da Caixa de Relíquias de Os Contos do Planta, de Gustavo Ravaglio",
    },
  },
  {
    slug: "necroplanta",
    title: "Necroplanta",
    universeSlug: "necroplanta",
    author: GUSTAVO,
    coverAlt: "Capa do livro Necroplanta, de Gustavo Ravaglio",
    coverTone: "garnet",
    coverVideoSrc: "/videos/livros/necroplanta.mp4",
    price: { amount: 16999, currency: "BRL" },
  },
  {
    slug: "yanayag",
    title: "Yanayag",
    universeSlug: "yanayag",
    author: MAZZITIELLI_E_ALCATENA,
    coverAlt: "Capa do livro Yanayag, de Mazzitielli e Alcatena",
    coverTone: "forest",
    // Sem vídeo de capa ainda — BookCover cai no placeholder em CSS.
    price: { amount: 11999, currency: "BRL" },
  },
];

export const BOOKS: readonly Book[] = bookSchema
  .array()
  // Integridade referencial: um universeSlug inexistente explode aqui, no boot,
  // em vez de virar um link morto em produção.
  .refine(
    (books) => books.every((book) => UNIVERSE_SLUGS.has(book.universeSlug)),
    { message: "Livro aponta para um universo que não existe em universes.ts" },
  )
  // Um livro featured sem featuredCardImage vira um buraco silencioso na
  // prateleira de destaque da Home — melhor quebrar o build.
  .refine((books) => books.every((book) => !book.featured || book.featuredCardImage), {
    message: "Livro featured precisa de featuredCardImage (ver Home)",
  })
  .parse(RAW_BOOKS);

export const BOOKS_BY_SLUG: ReadonlyMap<string, Book> = new Map(
  BOOKS.map((book) => [book.slug, book]),
);

export const BOOKS_BY_UNIVERSE: ReadonlyMap<string, readonly Book[]> = new Map(
  BOOKS.reduce((groups, book) => {
    const current = groups.get(book.universeSlug) ?? [];
    current.push(book);
    groups.set(book.universeSlug, current);
    return groups;
  }, new Map<string, Book[]>()),
);
