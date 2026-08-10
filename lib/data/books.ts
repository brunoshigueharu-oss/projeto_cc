import { bookSchema, type Book } from "./schemas";
import { UNIVERSE_SLUGS } from "./universes";

const GUSTAVO = {
  name: "Gustavo Ravaglio",
  bio: "Escreve e ilustra ficção sombria desde 2016. Trabalha em tiragens curtas, desenhando cada capa antes de terminar o texto — segundo ele, para saber onde a história precisa chegar.",
};

const RAW_BOOKS = [
  {
    // ─── LIVRO-MODELO ───────────────────────────────────────────────────────
    // Este é o registro completo: todos os campos opcionais preenchidos.
    // Use-o como referência ao cadastrar os próximos títulos.
    slug: "os-contos-do-planta",
    title: "Os Contos do Planta",
    subtitle: "Volume II — com capa holográfica",
    universeSlug: "necroplanta",
    author: GUSTAVO,
    synopsis:
      "Depois que a estufa da família é lacrada, Teodora descobre que as plantas lá dentro continuaram crescendo — e que aprenderam a repetir a voz da avó. Este segundo volume expande o herbário do primeiro livro com nove capítulos novos, cada um dedicado a um espécime que não deveria ter sobrevivido ao inverno.",
    excerpt:
      "A avó dizia que planta não morre, só desiste. Teodora passou dezoito anos achando que era conforto. Era instrução.",
    coverAlt:
      "Capa granada com moldura ornamentada e uma figura vegetal humanoide ao centro",
    coverTone: "garnet",
    specs: {
      pages: 224,
      isbn: "978-8595081512",
      format: "Capa dura",
      dimensions: "16 × 23 cm",
      language: "Português",
      edition: "1ª edição limitada, 500 exemplares numerados",
      publishedAt: "2025-10-14",
    },
    price: { amount: 12900, currency: "BRL" },
    buyUrl: "https://www.amazon.com.br/dp/8595081512",
    status: "disponivel",
    featured: true,
  },
  {
    slug: "herbario-dos-afogados",
    title: "Herbário dos Afogados",
    universeSlug: "necroplanta",
    author: GUSTAVO,
    synopsis:
      "Um catálogo ilustrado das espécies que crescem apenas onde houve naufrágio. Meio guia de campo, meio registro de luto.",
    coverAlt: "Capa granada escura com ilustração de raízes submersas",
    coverTone: "garnet",
    specs: {
      pages: 148,
      isbn: "978-8595081529",
      format: "Brochura",
      dimensions: "14 × 21 cm",
      language: "Português",
      edition: "2ª edição",
      publishedAt: "2024-06-03",
    },
    price: { amount: 8900, currency: "BRL" },
    buyUrl: "https://www.amazon.com.br/dp/8595081529",
    status: "disponivel",
  },
  {
    slug: "o-jardineiro-nao-dorme",
    title: "O Jardineiro Não Dorme",
    universeSlug: "necroplanta",
    author: GUSTAVO,
    synopsis:
      "Novela curta sobre o homem contratado para podar aquilo que a estufa produz durante a noite.",
    coverAlt: "Capa granada com silhueta de tesoura de poda sobre folhagem",
    coverTone: "garnet",
    specs: {
      pages: 96,
      isbn: "978-8595081536",
      format: "Brochura",
      dimensions: "12 × 18 cm",
      language: "Português",
      edition: "1ª edição",
      publishedAt: "2026-03-20",
    },
    price: { amount: 6500, currency: "BRL" },
    buyUrl: "https://www.amazon.com.br/dp/8595081536",
    status: "pre-venda",
  },
  {
    slug: "art-edition-robo-de-madeira",
    title: "Robô de Madeira",
    subtitle: "Art Edition",
    universeSlug: "robo-de-madeira",
    author: GUSTAVO,
    synopsis:
      "A edição de arte reúne o texto integral e mais de oitenta estudos de traço feitos durante a construção do autômato central.",
    coverAlt: "Capa azul-marinho com engrenagens entalhadas em madeira",
    coverTone: "navy",
    specs: {
      pages: 312,
      isbn: "978-8595081543",
      format: "Capa dura",
      dimensions: "21 × 28 cm",
      language: "Português",
      edition: "Edição de arte, 300 exemplares",
      publishedAt: "2025-05-09",
    },
    price: { amount: 21900, currency: "BRL" },
    buyUrl: "https://www.amazon.com.br/dp/8595081543",
    status: "esgotado",
    featured: true,
  },
  {
    slug: "manual-do-entalhador",
    title: "Manual do Entalhador",
    universeSlug: "robo-de-madeira",
    author: GUSTAVO,
    synopsis:
      "Instruções para montar algo que obedece. Escrito na segunda pessoa, o que é parte do problema.",
    coverAlt: "Capa azul-marinho com diagrama técnico de junta de madeira",
    coverTone: "navy",
    specs: {
      pages: 176,
      isbn: "978-8595081550",
      format: "Brochura",
      dimensions: "16 × 23 cm",
      language: "Português",
      edition: "1ª edição",
      publishedAt: "2024-11-28",
    },
    price: { amount: 7900, currency: "BRL" },
    buyUrl: "https://www.amazon.com.br/dp/8595081550",
    status: "disponivel",
  },
  {
    slug: "caixa-de-reliquias-vol-i",
    title: "Caixa de Relíquias",
    subtitle: "Volume I",
    universeSlug: "caixa-de-reliquias",
    author: GUSTAVO,
    synopsis:
      "Trinta e sete objetos, cada um com sua ficha de catálogo e sua contradição. O arquivista assina apenas com iniciais.",
    coverAlt: "Capa marrom-dourada com ilustração de caixa entalhada aberta",
    coverTone: "brown",
    specs: {
      pages: 208,
      isbn: "978-8595081567",
      format: "Capa dura",
      dimensions: "16 × 23 cm",
      language: "Português",
      edition: "1ª edição",
      publishedAt: "2025-08-16",
    },
    price: { amount: 11900, currency: "BRL" },
    buyUrl: "https://www.amazon.com.br/dp/8595081567",
    status: "disponivel",
    featured: true,
  },
  {
    slug: "inventario-incompleto",
    title: "Inventário Incompleto",
    universeSlug: "caixa-de-reliquias",
    author: GUSTAVO,
    synopsis:
      "As fichas que o arquivista rasgou, recuperadas e remontadas fora de ordem.",
    coverAlt: "Capa marrom com fragmentos de papel catalogados",
    coverTone: "brown",
    specs: {
      pages: 132,
      isbn: "978-8595081574",
      format: "Brochura",
      dimensions: "14 × 21 cm",
      language: "Português",
      edition: "1ª edição",
      publishedAt: "2026-01-30",
    },
    price: { amount: 6900, currency: "BRL" },
    buyUrl: "https://www.amazon.com.br/dp/8595081574",
    status: "disponivel",
  },
  {
    slug: "sete-noites-sem-lua",
    title: "Sete Noites Sem Lua",
    universeSlug: "contos-noturnos",
    author: GUSTAVO,
    synopsis:
      "Sete contos, um para cada noite em que a cidade ficou sem céu. Leitura de uma sentada.",
    coverAlt: "Capa verde-quase-preta com recorte de céu vazio",
    coverTone: "forest",
    specs: {
      pages: 88,
      isbn: "978-8595081581",
      format: "Brochura",
      dimensions: "12 × 18 cm",
      language: "Português",
      edition: "3ª edição",
      publishedAt: "2024-02-11",
    },
    price: { amount: 5500, currency: "BRL" },
    buyUrl: "https://www.amazon.com.br/dp/8595081581",
    status: "disponivel",
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
