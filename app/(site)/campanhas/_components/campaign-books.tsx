import { BookCard } from "@/components/book-card";
import type { Book } from "@/lib/data/schemas";

/**
 * Demais títulos citados pela campanha.
 *
 * Não está no Figma (node 211:1340, que cobre uma campanha de título único),
 * mas `relatedBookSlugs` aceita vários e a listagem já mostra todos — sem esta
 * seção a página de detalhe perderia informação que a de listagem tem.
 */
export function CampaignBooks({ books }: { books: readonly Book[] }) {
  if (books.length === 0) {
    return null;
  }

  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <h2 className="font-display text-xl font-bold text-foreground">
          Também nesta campanha
        </h2>

        <ul className="mt-8 grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-4">
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
