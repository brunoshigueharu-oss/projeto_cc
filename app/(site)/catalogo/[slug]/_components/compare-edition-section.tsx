import type { Book } from "@/lib/data/schemas";
import { TiltingPaper } from "./tilting-paper";

type CompareEditionSectionProps = {
  book: Book;
  baseBook: Book | undefined;
};

/**
 * "Contos do Planta 2 × Necroplanta": a mesma prancha do miolo na cor de
 * cada edição (`basePageSrc`/`pageSrc`, quando houver) — só a ilustração,
 * com sombra leve, ver `TiltingPaper` —, lado a lado com um "X" entre elas, inclinando levemente ao sabor do mouse, seguidas do destaque
 * de tiragem. Só renderiza quando `book.compareEdition` existe e o
 * `baseBookSlug` resolve para um livro real do catálogo.
 *
 * Lado a lado a partir do `sm`, não empilhadas: a prancha de miolo é sempre
 * uma página em paisagem, então a prancha é mais larga que alta — duas delas
 * de peito ao peito no tamanho usado antes (empilhado) estourariam o
 * `max-w-4xl` da seção, por isso encolhem (`sm:w-56` até `lg:w-80`) para
 * caber junto com o "X" e os vãos. Abaixo do `sm` continuam empilhadas, já
 * que não há largura de tela para as duas em pé.
 */
export function CompareEditionSection({ book, baseBook }: CompareEditionSectionProps) {
  const { compareEdition } = book;

  if (!compareEdition || !baseBook) {
    return null;
  }

  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
        <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-center sm:justify-center sm:gap-6">
          <figure className="flex flex-col items-center gap-4">
            <TiltingPaper
              className="w-72 sm:w-56 md:w-64 lg:w-80"
              page={
                compareEdition.basePageSrc
                  ? { src: compareEdition.basePageSrc, alt: `Página do miolo de ${baseBook.title}` }
                  : undefined
              }
            />
            <figcaption className="font-display text-sm uppercase tracking-wide text-foreground/70 sm:text-base">
              {baseBook.title}
            </figcaption>
          </figure>

          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-8 w-8 shrink-0 text-foreground/40 md:h-10 md:w-10"
          >
            <path d="M4 4 L20 20 M20 4 L4 20" stroke="currentColor" strokeWidth="1.25" fill="none" />
          </svg>

          <figure className="flex flex-col items-center gap-4">
            <TiltingPaper
              className="w-72 sm:w-56 md:w-64 lg:w-80"
              page={
                compareEdition.pageSrc
                  ? { src: compareEdition.pageSrc, alt: `Página do miolo de ${book.title}` }
                  : undefined
              }
            />
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
