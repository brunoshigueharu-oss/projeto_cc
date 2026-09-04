import { CATALOG_VISIBLE_BOOKS } from "@/lib/data/books";
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
 *
 * `universeSlug` filtra o catálogo para um único universo (ver
 * `/catalogo?universo=<slug>` em `book-hero.tsx`) — omitido ou sem
 * correspondência, devolve o catálogo completo.
 */
export async function getCatalog(universeSlug?: string): Promise<Catalog> {
  const books = universeSlug
    ? CATALOG_VISIBLE_BOOKS.filter((book) => book.universeSlug === universeSlug)
    : CATALOG_VISIBLE_BOOKS;
  const universeSlugsWithBooks = new Set(books.map((book) => book.universeSlug));

  return {
    books,
    totalBooks: books.length,
    totalUniverses: universeSlugsWithBooks.size,
  };
}
