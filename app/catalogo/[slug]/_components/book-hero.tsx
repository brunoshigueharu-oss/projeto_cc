import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { BookCover } from "@/components/book-cover";
import { BookStatusBadge } from "@/components/book-status-badge";
import { buttonVariants } from "@/components/ui/button";
import type { Book, Universe } from "@/lib/data/schemas";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

type BookHeroProps = {
  book: Book;
  universe: Universe;
};

/**
 * Abertura da página de livro, no bloco escuro.
 *
 * A classe `dark` é aplicada localmente (mesma técnica da hero da Home), então
 * os tokens de cor viram a variante escura só dentro desta seção — o resto da
 * página continua na casca clara.
 */
export function BookHero({ book, universe }: BookHeroProps) {
  const isAvailable = book.status === "disponivel";

  return (
    <section className="dark relative overflow-hidden bg-background text-foreground">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 [background:radial-gradient(60%_60%_at_75%_20%,color-mix(in_oklab,var(--primary)_18%,transparent),transparent_70%)]"
      />

      <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <BookCover
          title={book.title}
          tone={book.coverTone}
          alt={book.coverAlt}
          size="lg"
          className="mx-auto w-full max-w-xs lg:mx-0"
        />

        <div>
          <nav aria-label="Trilha de navegação">
            <ol className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-foreground/50">
              <li>
                <Link href="/catalogo" className="hover:text-foreground">
                  Catálogo
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link
                  href={`/catalogo?universo=${universe.slug}`}
                  className="hover:text-foreground"
                >
                  {universe.name}
                </Link>
              </li>
            </ol>
          </nav>

          <h1 className="mt-6 text-balance font-display text-4xl leading-tight sm:text-5xl">
            {book.title}
          </h1>
          {book.subtitle ? (
            <p className="mt-2 font-serif text-lg text-foreground/60">
              {book.subtitle}
            </p>
          ) : null}

          <p className="mt-4 text-sm text-foreground/70">
            por {book.author.name}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <span className="font-mono text-2xl text-foreground tabular-nums">
              {formatPrice(book.price.amount)}
            </span>
            <BookStatusBadge status={book.status} />
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-5">
            {isAvailable || book.status === "pre-venda" ? (
              <a
                href={book.buyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-11 gap-2 rounded-full bg-primary px-7 text-primary-foreground hover:bg-primary/85",
                )}
              >
                {isAvailable ? "Comprar" : "Reservar"}
                <ExternalLink className="size-4" aria-hidden="true" />
                <span className="sr-only">(abre em nova aba)</span>
              </a>
            ) : (
              <span className="rounded-full border border-border px-7 py-3 text-sm font-medium text-foreground/50">
                Tiragem esgotada
              </span>
            )}

            <Link
              href={`/catalogo?universo=${universe.slug}`}
              className="text-sm font-medium text-foreground/70 underline-offset-4 hover:text-foreground hover:underline"
            >
              Ver o universo {universe.name}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
