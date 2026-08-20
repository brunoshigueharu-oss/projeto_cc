import Link from "next/link";
import { Bell } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Book, Locale, Universe } from "@/lib/data/schemas";

import { AddToCartButton } from "./add-to-cart-button";
import { UniverseShowcaseImage } from "./universe-showcase-image";

type UniverseSectionProps = {
  universe: Universe;
  book: Book;
};

const LABELS: Record<
  Locale,
  {
    reserve: string;
    buy: string;
    added: string;
    soldOutEdition: string;
    preOrderEdition: string;
    availableEdition: string;
    notifyMe: string;
  }
> = {
  pt: {
    reserve: "Reservar",
    buy: "Comprar",
    added: "Adicionado!",
    soldOutEdition: "Esgotado nesta edição",
    preOrderEdition: "Em pré-venda",
    availableEdition: "Disponível nesta edição",
    notifyMe: "Avise-me quando estiver disponível",
  },
  en: {
    reserve: "Reserve",
    buy: "Buy",
    added: "Added!",
    soldOutEdition: "Sold out in this edition",
    preOrderEdition: "Pre-order",
    availableEdition: "Available in this edition",
    notifyMe: "Notify me when available",
  },
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
    const labels = LABELS[book.locale];
    const description =
      book.locale === "en" ? (universe.descriptionEn ?? universe.description) : universe.description;
    const isSoldOut = book.status === "esgotado";
    const isPreOrder = book.status === "pre-venda";
    const ctaLabel = isPreOrder ? labels.reserve : labels.buy;

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
              {description}
            </p>

            <div className="flex flex-col items-start gap-3">
              <span className="text-xs font-medium uppercase tracking-[0.15em] text-foreground/40">
                {isSoldOut
                  ? labels.soldOutEdition
                  : isPreOrder
                    ? labels.preOrderEdition
                    : labels.availableEdition}
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
                  {labels.notifyMe}
                </Link>
              ) : (
                <AddToCartButton
                  type="book"
                  slug={book.slug}
                  label={ctaLabel}
                  addedLabel={labels.added}
                />
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return null;
}
