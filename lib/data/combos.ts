import { comboSchema, type Combo } from "./schemas";

/**
 * Combos são gerais do catálogo, não específicos de um livro — a página de
 * um livro mostra os que incluem ele (ver `getCombosForBook`).
 *
 * Preço promocional (`price`) abaixo é placeholder até a editora confirmar
 * os combos e valores reais; o preço "de" (riscado) não é cadastrado aqui —
 * é calculado somando o preço de cada livro do kit (ver `get-book.ts`), pra
 * nunca divergir do preço real do livro.
 */
const RAW_COMBOS = [
  {
    slug: "planta-dupla-aventura",
    title: "Dupla Aventura do Planta",
    description:
      "A edição de Mr. Plant — A Biped Among Plants ao lado do primeiro volume de Os Contos do Planta — o início da saga em dose dupla.",
    // Edição em português (um-bipede-entre-plantas) está esgotada — o combo
    // usa a edição em inglês, hoje disponível.
    bookSlugs: ["mr-plant-a-biped-among-plants", "os-contos-do-planta-1"],
    price: { amount: 24999, currency: "BRL" },
  },
] as const satisfies readonly unknown[];

export const COMBOS: readonly Combo[] = comboSchema.array().parse(RAW_COMBOS);
