import { BOOKS } from "@/lib/data/books";
import type { Book } from "@/lib/data/schemas";

export type Catalog = {
  books: readonly Book[];
  totalBooks: number;
  /** Só universos com pelo menos um livro publicado — 6 dos 9 cadastrados em
   *  lib/data/universes.ts ainda não têm título. */
  totalUniverses: number;
};

/**
 * Declarada `async` de propósito, mesmo sem I/O — mesmo padrão de
 * app/_data-access/get-hero-banners.ts: ponto de troca para CMS/DB futuro sem
 * alterar o call site.
 */
export async function getCatalog(): Promise<Catalog> {
  const universeSlugsWithBooks = new Set(BOOKS.map((book) => book.universeSlug));

  return {
    books: BOOKS,
    totalBooks: BOOKS.length,
    totalUniverses: universeSlugsWithBooks.size,
  };
}
