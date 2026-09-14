"use client";

import { useRef } from "react";
import Link from "next/link";

import type { Book } from "@/lib/data/schemas";
import { formatPrice } from "@/lib/format-price";
import { BookCover, type BookCoverHandle } from "./book-cover";
import { BookStatusBadge } from "./book-status-badge";

type BookCardProps = {
  book: Book;
};

/**
 * Card de livro — usado no Catálogo, nos relacionados e na estante do Perfil.
 *
 * Só o título é link; ele se estica sobre o card inteiro com `after:inset-0`.
 * Assim o card todo é clicável, mas existe uma única parada de tabulação, e o
 * leitor de tela anuncia o link pelo título (não pela descrição da capa).
 *
 * Esse mesmo link esticado fica por cima do vídeo da capa na pilha de
 * empilhamento, então o hover precisa ser detectado aqui no `<article>` (que
 * o recebe normalmente, por ser ancestral do link) e repassado ao vídeo via
 * ref — o próprio `BookCover` nunca veria o mouseenter/mouseleave.
 */
export function BookCard({ book }: BookCardProps) {
  const coverRef = useRef<BookCoverHandle>(null);

  return (
    <article
      className="group relative flex flex-col"
      onMouseEnter={() => coverRef.current?.play()}
      onMouseLeave={() => coverRef.current?.pause()}
      onFocus={() => coverRef.current?.play()}
      onBlur={() => coverRef.current?.pause()}
    >
      <BookCover
        ref={coverRef}
        title={book.title}
        alt={book.coverAlt}
        videoSrc={book.coverVideoSrc}
        videoScale={book.coverVideoScale}
        videoFit={book.coverVideoFit}
      />

      <div className="mt-4 flex flex-1 flex-col items-center text-center">
        <span className="font-serif text-xs italic uppercase tracking-[0.1em] text-muted-foreground">
          {book.author.name}
        </span>

        <h3 className="mt-1 font-display text-xl leading-tight text-foreground">
          <Link
            href={`/catalogo/${book.slug}`}
            className="rounded underline underline-offset-4 outline-none after:absolute after:inset-0 after:content-[''] group-hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {book.title}
          </Link>
        </h3>

        {book.subtitle ? (
          <p className="mt-1 font-serif text-sm text-muted-foreground">
            {book.subtitle}
          </p>
        ) : null}

        <div className="mt-3 flex items-center justify-center gap-3">
          <span className="font-mono text-sm text-foreground tabular-nums">
            {formatPrice(book.price.amount)}
          </span>
          {book.status !== "disponivel" ? (
            <BookStatusBadge status={book.status} locale={book.locale} />
          ) : null}
        </div>
      </div>
    </article>
  );
}
