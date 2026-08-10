import { BOOKS, BOOKS_BY_SLUG, BOOKS_BY_UNIVERSE } from "@/lib/data/books";
import type { Book, Universe } from "@/lib/data/schemas";
import { UNIVERSES_BY_SLUG } from "@/lib/data/universes";

export type BookDetail = {
  book: Book;
  universe: Universe;
};

/**
 * Retorna `undefined` em vez de chamar `notFound()`.
 *
 * O motivo é concreto: `generateMetadata` também faz este lookup, e não deve
 * disparar 404 de dentro da camada de dados. Quem decide o 404 é a page.
 */
export async function getBookBySlug(slug: string): Promise<BookDetail | undefined> {
  const book = BOOKS_BY_SLUG.get(slug);
  if (!book) {
    return undefined;
  }

  const universe = UNIVERSES_BY_SLUG.get(book.universeSlug);
  if (!universe) {
    // Inalcançável: o `.refine()` em lib/data/books.ts já garante a integridade
    // no boot. O guard existe para satisfazer o tipo sem recorrer a `!`.
    return undefined;
  }

  return { book, universe };
}

/** Outros livros do mesmo universo, excluindo o atual. */
export async function getRelatedBooks(book: Book): Promise<readonly Book[]> {
  const sameUniverse = BOOKS_BY_UNIVERSE.get(book.universeSlug) ?? [];
  return sameUniverse.filter((candidate) => candidate.slug !== book.slug);
}

/** Alimenta `generateStaticParams` — todas as páginas de livro são estáticas. */
export function getAllBookSlugs(): readonly string[] {
  return BOOKS.map((book) => book.slug);
}
