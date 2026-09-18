import { comboSchema, type Combo } from "./schemas";

/**
 * Combos do catálogo, como a editora enviou em "combos e precos.XLSX"
 * (aba "Combos", set/2026).
 *
 * Dois campos merecem atenção, porque não são deriváveis do resto:
 *
 * 1. `showOnBookSlugs` — a planilha diz em qual página cada combo aparece, e
 *    não é a página de quem está no kit: o COMBO 2 é divulgado na página da
 *    graphic novel em inglês (que não faz parte dele) e na da Caixa de
 *    Relíquias, enquanto Contos 1 e 2 divulgam o COMBO 1.
 * 2. `originalPrice` — vem da planilha, não da soma dos livros do kit. A Caixa
 *    de Relíquias já traz o Contos do Planta 2 dentro (ver `boxContents` em
 *    lib/data/books.ts), então ele aparece entre as capas do banner sem entrar
 *    na conta: 480 = 360 (caixa) + 120 (Contos 1).
 *
 * O estoque por combo (50 unidades na planilha) não é modelado no site — o
 * catálogo só tem `status` por livro, sem contagem.
 */
const RAW_COMBOS = [
  {
    slug: "caixa-de-reliquias-contos-1-e-2",
    title: "Caixa de Relíquias + Os Contos do Planta 1 e 2",
    description:
      "A Caixa de Relíquias, com o Volume 2 e todos os itens colecionáveis dentro, mais o Volume 1 de Os Contos do Planta — a coleção completa da série.",
    bookSlugs: [
      "os-contos-do-planta-caixa-de-reliquias",
      "os-contos-do-planta-2",
      "os-contos-do-planta-1",
    ],
    showOnBookSlugs: ["os-contos-do-planta-1", "os-contos-do-planta-2"],
    price: { amount: 45500, currency: "BRL" },
    originalPrice: { amount: 48000, currency: "BRL" },
    freeShipping: true,
  },
  {
    slug: "caixa-de-reliquias-contos-1-e-2-necroplanta",
    title: "Caixa de Relíquias + Os Contos do Planta 1 e 2 + Necroplanta",
    description:
      "A coleção completa de Os Contos do Planta somada à edição do vilão: a Caixa de Relíquias com o Volume 2, o Volume 1 e o Necroplanta.",
    bookSlugs: [
      "os-contos-do-planta-caixa-de-reliquias",
      "os-contos-do-planta-2",
      "os-contos-do-planta-1",
      "necroplanta",
    ],
    showOnBookSlugs: [
      "necroplanta",
      "mr-plant-a-biped-among-plants",
      "os-contos-do-planta-caixa-de-reliquias",
    ],
    price: { amount: 61000, currency: "BRL" },
    originalPrice: { amount: 65000, currency: "BRL" },
    freeShipping: true,
  },
  {
    // Sem preço "de": a planilha marca "não colocar nesse caso" porque o
    // combo custa o mesmo que os dois avulsos (190 + 170) — a vantagem aqui
    // é só o frete grátis.
    slug: "robo-de-madeira-graphic-novel-en",
    title: "Robô de Madeira + Plant: Graphic Novel EN",
    description:
      "Robô de Madeira — Atlas Cianus ao lado de Mr. Plant — A Biped Among Plants, a edição em inglês da graphic novel que abre a saga.",
    bookSlugs: ["robo-de-madeira-atlas-cianus", "mr-plant-a-biped-among-plants"],
    showOnBookSlugs: ["robo-de-madeira-atlas-cianus"],
    price: { amount: 36000, currency: "BRL" },
    freeShipping: true,
  },
] as const satisfies readonly unknown[];

export const COMBOS: readonly Combo[] = comboSchema.array().parse(RAW_COMBOS);
