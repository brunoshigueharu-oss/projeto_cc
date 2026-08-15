import Link from "next/link";
import { Bell, ExternalLink } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
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
 * Só renderiza quando o livro traz `universeShowcase` (ilustração real +
 * título originais do material da editora) — ver `um-bipede-entre-plantas` em
 * `lib/data/books.ts`. Sem essa arte a seção some: o antigo placeholder
 * genérico ("Sobre o Universo X" com painel de `coverTone` e selo) foi
 * removido, porque em títulos como Robô de Madeira ele repetia a descrição do
 * universo sem acrescentar nada visualmente.
 */
export function UniverseSection({ universe, book }: UniverseSectionProps) {
  const { universeShowcase } = book;

  if (universeShowcase) {
    const isSoldOut = book.status === "esgotado";
    const isPreOrder = book.status === "pre-venda";
    const ctaLabel = isPreOrder ? "Reservar" : "Comprar";
    const ctaClassName = cn(
      buttonVariants({ size: "lg" }),
      "h-11 gap-2 rounded-full bg-primary px-7 text-primary-foreground hover:bg-primary/85",
    );

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

            <div className="flex flex-col items-start gap-3">
              <span className="text-xs font-medium uppercase tracking-[0.15em] text-foreground/40">
                {isSoldOut
                  ? "Esgotado nesta edição"
                  : isPreOrder
                    ? "Em pré-venda"
                    : "Disponível nesta edição"}
              </span>

              {isSoldOut ? (
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
              ) : book.buyUrl ? (
                <a
                  href={book.buyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={ctaClassName}
                >
                  {ctaLabel}
                  <ExternalLink className="size-4" aria-hidden="true" />
                  <span className="sr-only">(abre em nova aba)</span>
                </a>
              ) : (
                // Sem `buyUrl` ainda — mesmo tratamento do CTA do hero: botão
                // na forma final, desabilitado até a loja existir, mas ainda
                // focável (ver nota em `book-hero.tsx`).
                <button
                  type="button"
                  aria-disabled="true"
                  title="Link de compra em breve"
                  className={cn(
                    ctaClassName,
                    "cursor-not-allowed opacity-50 hover:bg-primary",
                  )}
                >
                  {ctaLabel}
                  <span className="sr-only">— link de compra em breve</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return null;
}
