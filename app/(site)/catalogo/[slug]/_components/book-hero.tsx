import Link from "next/link";

import { AddToCartButton } from "@/components/add-to-cart-button";
import { BookCover } from "@/components/book-cover";
import { BookStatusBadge } from "@/components/book-status-badge";
import { BookSynopsis } from "@/components/book-synopsis";
import { isInStock, isPurchasable as isBookPurchasable } from "@/lib/data/book-availability";
import type { Book, Locale, Universe } from "@/lib/data/schemas";
import { formatPrice } from "@/lib/format";

import { BookGallery } from "./book-gallery";

type BookHeroProps = {
  book: Book;
  universe: Universe;
};

const LABELS: Record<
  Locale,
  {
    breadcrumbNav: string;
    catalog: string;
    byAuthor: (name: string) => string;
    buy: string;
    reserve: string;
    added: string;
    soldOut: string;
    seeUniverse: (name: string) => string;
  }
> = {
  pt: {
    breadcrumbNav: "Trilha de navegação",
    catalog: "Catálogo",
    byAuthor: (name) => `Por ${name}`,
    buy: "Comprar",
    reserve: "Reservar",
    added: "Adicionado!",
    soldOut: "Tiragem esgotada",
    seeUniverse: (name) => `Ver o universo ${name}`,
  },
  en: {
    breadcrumbNav: "Breadcrumb",
    catalog: "Catalog",
    byAuthor: (name) => `By ${name}`,
    buy: "Buy",
    reserve: "Reserve",
    added: "Added!",
    soldOut: "Sold out",
    seeUniverse: (name) => `See the ${name} universe`,
  },
};

/**
 * Abertura da página de livro, na casca clara (fundo branco).
 */
export function BookHero({ book, universe }: BookHeroProps) {
  const isAvailable = isInStock(book.status);
  const isPurchasable = isBookPurchasable(book.status);
  const labels = LABELS[book.locale];

  return (
    <section className="relative overflow-hidden bg-background text-foreground">
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 sm:py-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <div className="mx-auto w-full max-w-xs lg:mx-0">
          <BookCover
            title={book.title}
            alt={book.coverAlt}
            videoSrc={book.coverVideoSrc}
            videoScale={book.coverVideoScale}
            videoFit={book.coverVideoFit}
            showPauseControl
            size="lg"
            className="w-full"
          />

          {book.gallery && book.gallery.length > 0 ? (
            <BookGallery images={book.gallery} bookTitle={book.title} />
          ) : null}
        </div>

        <div>
          <nav aria-label={labels.breadcrumbNav}>
            <ol className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-foreground/50">
              <li>
                <Link href="/" className="hover:text-foreground">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/catalogo" className="hover:text-foreground">
                  {labels.catalog}
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
            {labels.byAuthor(book.author.name)}
          </p>

          {book.synopsis ? <BookSynopsis text={book.synopsis} locale={book.locale} /> : null}

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <span className="font-mono text-2xl font-bold text-foreground tabular-nums">
              {formatPrice(book.price.amount)}
            </span>
            <BookStatusBadge status={book.status} locale={book.locale} />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-5">
            {isPurchasable ? (
              <AddToCartButton
                type="book"
                slug={book.slug}
                label={isAvailable ? labels.buy : labels.reserve}
                addedLabel={labels.added}
              />
            ) : (
              <span className="rounded-full border border-border px-7 py-3 text-sm font-medium text-foreground/50">
                {labels.soldOut}
              </span>
            )}

            <Link
              href={`/catalogo?universo=${universe.slug}`}
              className="text-sm font-medium text-foreground/70 underline-offset-4 hover:text-foreground hover:underline"
            >
              {labels.seeUniverse(universe.name)}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
