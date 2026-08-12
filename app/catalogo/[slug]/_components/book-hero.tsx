import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { BookCover } from "@/components/book-cover";
import { BookStatusBadge } from "@/components/book-status-badge";
import { buttonVariants } from "@/components/ui/button";
import type { Book, Universe } from "@/lib/data/schemas";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

import { BookGallery } from "./book-gallery";

type BookHeroProps = {
  book: Book;
  universe: Universe;
};

/**
 * Abertura da página de livro, na casca clara (fundo branco).
 */
export function BookHero({ book, universe }: BookHeroProps) {
  const isAvailable = book.status === "disponivel";
  const isPurchasable = (isAvailable || book.status === "pre-venda") && Boolean(book.buyUrl);

  return (
    <section className="relative overflow-hidden bg-background text-foreground">
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 sm:py-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <div className="mx-auto w-full max-w-xs lg:mx-0">
          <BookCover
            title={book.title}
            alt={book.coverAlt}
            videoSrc={book.coverVideoSrc}
            videoScale={book.coverVideoScale}
            size="lg"
            className="w-full"
          />

          {book.gallery && book.gallery.length > 0 ? (
            <BookGallery images={book.gallery} bookTitle={book.title} />
          ) : null}
        </div>

        <div>
          <nav aria-label="Trilha de navegação">
            <ol className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-foreground/50">
              <li>
                <Link href="/" className="hover:text-foreground">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
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

          <h1 className="mt-4 text-balance font-display text-4xl leading-[1.1] sm:text-5xl">
            {book.title}
          </h1>
          {book.subtitle ? (
            <p className="mt-2 font-serif text-lg text-foreground/60">
              {book.subtitle}
            </p>
          ) : null}

          <p className="mt-1 font-serif text-base italic text-primary">
            Por {book.author.name}
          </p>

          {book.synopsis ? (
            <p className="mt-4 line-clamp-4 max-w-xl font-serif leading-relaxed text-foreground/70">
              {book.synopsis}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <span className="font-mono text-2xl text-foreground tabular-nums">
              {formatPrice(book.price.amount)}
            </span>
            <BookStatusBadge status={book.status} />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-5">
            {isPurchasable ? (
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
            ) : isAvailable || book.status === "pre-venda" ? (
              <span className="rounded-full border border-border px-7 py-3 text-sm font-medium text-foreground/50">
                Link de compra em breve
              </span>
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
