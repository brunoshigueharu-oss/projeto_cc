import { BookCard } from "@/components/book-card";
import type { Book, Universe } from "@/lib/data/schemas";

type RelatedBooksProps = {
  books: readonly Book[];
  universe: Universe;
};

export function RelatedBooks({ books, universe }: RelatedBooksProps) {
  if (books.length === 0) {
    return null;
  }

  return (
    <section className="border-t border-border bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <span className="text-[11px] font-medium uppercase tracking-[0.3em] text-primary">
          {universe.name}
        </span>
        <h2 className="mt-3 font-display text-2xl text-foreground sm:text-3xl">
          Do mesmo universo
        </h2>

        <ul className="mt-10 grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
          {books.map((book) => (
            <li key={book.slug}>
              <BookCard book={book} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
