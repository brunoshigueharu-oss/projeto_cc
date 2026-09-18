import Image from "next/image";
import Link from "next/link";

import type { Book, Locale, Universe } from "@/lib/data/schemas";

type UniverseFamilySectionProps = {
  book: Book;
  universe: Universe;
};

const universeHeading: Record<Locale, (name: string) => string> = {
  pt: (name) => `Universo ${name}`,
  en: (name) => `${name} Universe`,
};

/**
 * Composição decorativa do universo: fundo ilustrado + capas dos livros da
 * mesma coleção posicionadas como numa arte só, com legenda abaixo de cada
 * uma. Só renderiza quando `book.universeFamily` existe — os demais livros
 * continuam com o grid genérico (`RelatedBooks`), decidido em `page.tsx`.
 *
 * O palco usa a razão de aspecto original da arte (1920×1080) e unidades
 * `cqw` (Tailwind 4, container query nativa) pro texto escalar junto com a
 * composição em qualquer largura de tela. Abaixo do `sm` a legenda dobra de
 * tamanho relativo (`text-[2.6cqw]`) e não caberia entre a fileira de cima e
 * a de baixo, então o palco fica mais alto ali — o fundo é `object-cover`,
 * logo o que muda é o quanto da arte aparece nas laterais, não a posição das
 * capas, que é % do palco.
 *
 * As capas são PNGs recortados só do livro (ver nota em
 * `PLANTA_UNIVERSE_FAMILY`, em `lib/data/books.ts`) — a sombra é o
 * `drop-shadow` daqui, não arte embutida. Mexer nela é mexer nesta classe.
 * São duas camadas (contato curto + difusa), por isso `[filter:…]` em vez de
 * `drop-shadow-[…]`: duas utilities `drop-shadow` na mesma classe disputam a
 * mesma variável e só a última vale.
 */
export function UniverseFamilySection({ book, universe }: UniverseFamilySectionProps) {
  const { universeFamily } = book;

  if (!universeFamily) {
    return null;
  }

  return (
    <section className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="@container relative aspect-[1920/1510] w-full sm:aspect-[1920/1080]">
          <Image
            src={universeFamily.backgroundSrc}
            alt=""
            aria-hidden="true"
            fill
            sizes="(min-width: 1280px) 1152px, 100vw"
            className="object-cover"
          />

          <div className="absolute flex flex-col gap-2" style={{ top: "38%", left: "5%", width: "20%" }}>
            <h2 className="font-display text-[5.6cqw] leading-tight text-foreground sm:text-[3.4cqw]">
              {universeHeading[book.locale](universe.name)}
            </h2>
            <p className="font-serif text-[2.8cqw] italic text-foreground/60 sm:text-[1.6cqw]">
              {book.author.name}
            </p>
          </div>

          {universeFamily.covers.map((cover) => {
            const style = {
              top: `${cover.position.top}%`,
              left: `${cover.position.left}%`,
              width: `${cover.position.width}%`,
            };

            const content = (
              <>
                <Image
                  src={cover.image.src}
                  alt={cover.image.alt}
                  width={cover.image.width}
                  height={cover.image.height}
                  sizes="(min-width: 1280px) 20vw, 30vw"
                  className="block h-auto w-full [filter:drop-shadow(0_1px_2px_color-mix(in_oklch,var(--foreground),transparent_88%))_drop-shadow(0_10px_18px_color-mix(in_oklch,var(--foreground),transparent_88%))] transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                />
                <span className="mt-[0.8cqw] block text-center text-[2.6cqw] leading-snug text-foreground/80 sm:text-[1.3cqw]">
                  {cover.caption}
                </span>
              </>
            );

            if (cover.bookSlug) {
              return (
                <Link
                  key={cover.caption}
                  href={`/catalogo/${cover.bookSlug}`}
                  className="group absolute"
                  style={style}
                >
                  {content}
                </Link>
              );
            }

            return (
              <div key={cover.caption} className="absolute" style={style}>
                {content}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
