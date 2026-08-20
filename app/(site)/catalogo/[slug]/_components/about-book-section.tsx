import Image from "next/image";

import type { Book, Locale } from "@/lib/data/schemas";
import { BookSpecs } from "./book-specs";

const LABELS: Record<Locale, { theBook: string; aboutAuthor: string }> = {
  pt: { theBook: "O Livro", aboutAuthor: "Sobre o Autor" },
  en: { theBook: "The Book", aboutAuthor: "About the Author" },
};

/**
 * Duas colunas na casca clara: "O Livro" (texto corrido) à esquerda,
 * "Sobre o Autor" + "Especificações Técnicas" à direita — mesmo agrupamento
 * do `AboutBookSection` do Figma.
 *
 * `book.excerpt` (schema) muda de papel aqui: em vez de citação em destaque,
 * vira o texto corrido de "O Livro". Nome do autor é obrigatório no schema,
 * então a coluna direita sempre aparece; bio e specs continuam opcionais.
 */
export function AboutBookSection({ book }: { book: Book }) {
  const hasBookColumn = Boolean(book.excerpt);
  const labels = LABELS[book.locale];

  return (
    <section className="border-t border-border">
      <div
        className={
          hasBookColumn
            ? "mx-auto grid max-w-6xl gap-16 px-4 py-20 sm:px-6 lg:grid-cols-2"
            : "mx-auto grid max-w-6xl gap-16 px-4 py-20 sm:px-6"
        }
      >
        {hasBookColumn ? (
          <div>
            <h2 className="font-display text-2xl text-foreground sm:text-3xl">{labels.theBook}</h2>
            <p className="mt-6 whitespace-pre-line font-serif leading-relaxed text-muted-foreground">
              {book.excerpt}
            </p>

            {book.awardBadge ? (
              <Image
                src={book.awardBadge.src}
                alt={book.awardBadge.alt}
                width={120}
                height={120}
                className="mt-8"
              />
            ) : null}
          </div>
        ) : null}

        <div className={hasBookColumn ? "flex flex-col gap-12" : "flex max-w-prose flex-col gap-12"}>
          <div>
            <h2 className="font-display text-2xl text-foreground sm:text-3xl">
              {labels.aboutAuthor}
            </h2>
            {book.author.bio ? (
              <p className="mt-6 font-serif leading-relaxed text-muted-foreground">
                {book.author.bio}
              </p>
            ) : (
              <p className="mt-6 font-serif text-muted-foreground">{book.author.name}</p>
            )}
          </div>

          <BookSpecs book={book} />
        </div>
      </div>
    </section>
  );
}
