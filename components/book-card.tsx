import Link from "next/link";

import type { Book } from "@/lib/data/schemas";
import { formatPrice } from "@/lib/format";
import { BookCover } from "./book-cover";
import { BookStatusBadge } from "./book-status-badge";

type BookCardProps = {
  book: Book;
  universeName?: string;
};

/**
 * Card de livro — usado no Catálogo, nos relacionados e na estante do Perfil.
 *
 * Só o título é link; ele se estica sobre o card inteiro com `after:inset-0`.
 * Assim o card todo é clicável, mas existe uma única parada de tabulação, e o
 * leitor de tela anuncia o link pelo título (não pela descrição da capa).
 */
export function BookCard({ book, universeName }: BookCardProps) {
  return (
    <article className="group relative flex flex-col">
      <BookCover
        title={book.title}
        tone={book.coverTone}
        alt={book.coverAlt}
        className="transition-transform group-hover:-translate-y-1 group-focus-within:-translate-y-1"
      />

      <div className="mt-4 flex flex-1 flex-col">
        {universeName ? (
          <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-primary">
            {universeName}
          </span>
        ) : null}

        <h3 className="mt-1 font-display text-xl leading-tight text-foreground">
          <Link
            href={`/catalogo/${book.slug}`}
            className="rounded outline-none after:absolute after:inset-0 after:content-[''] group-hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {book.title}
          </Link>
        </h3>

        {book.subtitle ? (
          <p className="mt-1 font-serif text-sm text-muted-foreground">
            {book.subtitle}
          </p>
        ) : null}

        <p className="mt-1 text-sm text-muted-foreground">{book.author.name}</p>

        <div className="mt-3 flex items-center gap-3">
          <span className="font-mono text-sm text-foreground tabular-nums">
            {formatPrice(book.price.amount)}
          </span>
          <BookStatusBadge status={book.status} />
        </div>
      </div>
    </article>
  );
}
