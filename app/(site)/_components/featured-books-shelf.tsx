import Link from "next/link";

import { getFeaturedBooks } from "../_data-access/get-featured-books";
import { FeaturedBooksShelfScroller } from "./featured-books-shelf-scroller";

export async function FeaturedBooksShelf() {
  const books = await getFeaturedBooks();
  if (books.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-xl">
          <span className="text-[11px] font-medium uppercase tracking-[0.3em] text-primary">
            Catálogo
          </span>
          <h2 className="mt-3 font-display text-3xl text-foreground sm:text-4xl">
            Conheça os nossos livros
          </h2>
          <p className="mt-3 font-serif text-muted-foreground">
            Não existe ordem certa para começar. Escolha uma e deixe-se levar.
          </p>
        </div>

        <Link
          href="/catalogo"
          className="text-xs font-medium uppercase tracking-[0.2em] text-primary underline-offset-4 hover:underline"
        >
          Ver catálogo completo
        </Link>
      </div>

      <FeaturedBooksShelfScroller books={books} />
    </section>
  );
}
