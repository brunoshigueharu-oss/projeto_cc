import type { Book } from "@/lib/data/schemas";
import { TiltingPaper } from "./tilting-paper";

type CompareEditionSectionProps = {
  book: Book;
  baseBook: Book | undefined;
};

/**
 * "Contos do Planta 2 × Necroplanta": duas folhas de sulfite lado a lado
 * (sem capa real — mesma arte do `PaperTiltEffect` do upsell) com um "X"
 * entre elas, cada uma inclinando levemente ao sabor do mouse, seguidas do
 * destaque de tiragem — mesma composição do site anterior (Wix). Só
 * renderiza quando `book.compareEdition` existe e o `baseBookSlug` resolve
 * para um livro real do catálogo.
 */
export function CompareEditionSection({ book, baseBook }: CompareEditionSectionProps) {
  const { compareEdition } = book;

  if (!compareEdition || !baseBook) {
    return null;
  }

  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
        <div className="flex flex-col items-center justify-center gap-8 sm:flex-row sm:items-end sm:gap-12">
          <figure className="flex flex-col items-center gap-4">
            <TiltingPaper className="w-56 sm:w-72" />
            <figcaption className="font-display text-sm uppercase tracking-wide text-foreground/70 sm:text-base">
              {baseBook.title}
            </figcaption>
          </figure>

          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-8 w-8 shrink-0 text-foreground/40 sm:h-10 sm:w-10"
          >
            <path d="M4 4 L20 20 M20 4 L4 20" stroke="currentColor" strokeWidth="1.25" fill="none" />
          </svg>

          <figure className="flex flex-col items-center gap-4">
            <TiltingPaper className="w-56 sm:w-72" />
            <figcaption className="font-display text-sm uppercase tracking-wide text-foreground/70 sm:text-base">
              {book.title}
            </figcaption>
          </figure>
        </div>

        <div className="mt-16 flex flex-col items-center gap-4">
          <h2 className="font-display text-2xl text-foreground sm:text-3xl">
            {compareEdition.headline}
          </h2>
          <p className="max-w-2xl font-serif leading-relaxed text-muted-foreground">
            {compareEdition.description}
          </p>
        </div>
      </div>
    </section>
  );
}
