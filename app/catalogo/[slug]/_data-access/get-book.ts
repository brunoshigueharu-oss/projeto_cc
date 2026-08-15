import { BOOKS, BOOKS_BY_SLUG, BOOKS_BY_UNIVERSE } from "@/lib/data/books";
import { COMBOS } from "@/lib/data/combos";
import type { Book, Combo, Universe } from "@/lib/data/schemas";
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

export type ResolvedCombo = {
  combo: Combo;
  /** Livros do kit, resolvidos e na ordem de `combo.bookSlugs`. */
  books: readonly Book[];
  /** Soma do preço de cada livro do kit, em centavos — o preço "de" (riscado). */
  originalPrice: number;
};

/** Combos do catálogo cujo kit inclui `book`, com os livros já resolvidos. */
export async function getCombosForBook(book: Book): Promise<readonly ResolvedCombo[]> {
  return COMBOS.filter((combo) => combo.bookSlugs.includes(book.slug)).map((combo) => {
    const books = combo.bookSlugs
      .map((slug) => BOOKS_BY_SLUG.get(slug))
      .filter((candidate): candidate is Book => candidate !== undefined);

    return {
      combo,
      books,
      originalPrice: books.reduce((total, candidate) => total + candidate.price.amount, 0),
    };
  });
}
