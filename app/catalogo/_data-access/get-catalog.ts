import { BOOKS } from "@/lib/data/books";
import type { Book, Universe } from "@/lib/data/schemas";
import { UNIVERSES, UNIVERSES_BY_SLUG } from "@/lib/data/universes";

export type CatalogEntry = {
  book: Book;
  universeName: string;
};

export type Catalog = {
  universes: readonly Universe[];
  entries: readonly CatalogEntry[];
  totalBooks: number;
};

/**
 * `universeSlug` já chega validado da page (slug desconhecido vira `undefined`
 * lá, para que `?universo=lixo` degrade para "todos" em vez de quebrar).
 */
export async function getCatalog(universeSlug?: string): Promise<Catalog> {
  const books = universeSlug
    ? BOOKS.filter((book) => book.universeSlug === universeSlug)
    : BOOKS;

  return {
    universes: UNIVERSES,
    totalBooks: BOOKS.length,
    entries: books.map((book) => ({
      book,
      universeName: UNIVERSES_BY_SLUG.get(book.universeSlug)?.name ?? "",
    })),
  };
}
