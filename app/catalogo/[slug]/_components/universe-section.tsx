import Link from "next/link";
import { Bell } from "lucide-react";

import { Seal } from "@/components/seal";
import { buttonVariants } from "@/components/ui/button";
import { TONE_BACKGROUND } from "@/lib/tone";
import { cn } from "@/lib/utils";
import type { Book, Universe } from "@/lib/data/schemas";

import { UniverseShowcaseImage } from "./universe-showcase-image";

type UniverseSectionProps = {
  universe: Universe;
  book: Book;
};

/**
 * Bloco de destaque do universo, na casca clara, equivalente ao
 * "UniverseSection" do Figma.
 *
 * Quando o livro traz `universeShowcase` (ilustração real + título originais
 * do material da editora), a seção usa esse conteúdo em vez do placeholder
 * genérico — ver `um-bipede-entre-plantas` em `lib/data/books.ts`. Os demais
 * títulos continuam com o painel de cor (`coverTone`) e o selo, já que ainda
 * não existe arte de universo para eles.
 */
export function UniverseSection({ universe, book }: UniverseSectionProps) {
  const { universeShowcase } = book;

  if (universeShowcase) {
    const isSoldOut = book.status === "esgotado";

    return (
      <section className="relative overflow-hidden bg-background text-foreground border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-12 px-4 py-20 sm:px-6 lg:flex-row lg:py-28">
          <UniverseShowcaseImage
            src={universeShowcase.image.src}
            alt={universeShowcase.image.alt}
          />

          <div className="flex flex-col items-start gap-6 text-left">
            <div className="flex flex-col gap-3">
              <h2 className="font-display text-2xl leading-tight text-foreground sm:text-3xl">
                {universeShowcase.title}
              </h2>
              <div className="h-px w-full max-w-xl bg-border" />
            </div>

            <p className="max-w-xl whitespace-pre-line font-serif leading-relaxed text-foreground/70">
              {universe.description}
            </p>

            {isSoldOut ? (
              <div className="flex flex-col items-start gap-3">
                <span className="text-xs font-medium uppercase tracking-[0.15em] text-foreground/40">
                  Esgotado nesta edição
                </span>
                <Link
                  href="/contato"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "h-11 gap-2 rounded-full border-foreground/25 px-7 text-foreground hover:border-primary hover:bg-primary/5 hover:text-primary",
                  )}
                >
                  <Bell className="size-4" aria-hidden="true" />
                  Avise-me quando estiver disponível
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden bg-background text-foreground border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-12 px-4 py-20 sm:px-6 lg:flex-row lg:py-28">
        <div
          aria-hidden="true"
          className={`relative flex h-64 w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl lg:h-96 lg:w-[420px] ${TONE_BACKGROUND[universe.tone]}`}
        >
          <Seal className="size-24 opacity-20" />
        </div>

        <div className="flex flex-col items-start gap-6 text-left lg:items-end lg:text-right">
          <div className="flex flex-col gap-3 lg:items-end">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
              Expansão Narrativa
            </span>
            <h2 className="font-display text-2xl leading-tight text-foreground sm:text-3xl">
              Sobre o Universo {universe.name}
            </h2>
          </div>

          <p className="max-w-xl font-serif leading-relaxed text-foreground/70">
            {universe.description}
          </p>

          <Link
            href={`/catalogo?universo=${universe.slug}`}
            className="text-sm font-bold text-primary underline-offset-4 hover:underline"
          >
            Ver todos os livros de {universe.name} →
          </Link>
        </div>
      </div>
    </section>
  );
}
