import Link from "next/link";
import { Bell, ExternalLink } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Book, Locale, Universe } from "@/lib/data/schemas";

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
    soldOutEdition: string;
    preOrderEdition: string;
    availableEdition: string;
    notifyMe: string;
    opensInNewTab: string;
    buyLinkSoonTitle: string;
    buyLinkSoonSr: string;
  }
> = {
  pt: {
    reserve: "Reservar",
    buy: "Comprar",
    soldOutEdition: "Esgotado nesta edição",
    preOrderEdition: "Em pré-venda",
    availableEdition: "Disponível nesta edição",
    notifyMe: "Avise-me quando estiver disponível",
    opensInNewTab: "(abre em nova aba)",
    buyLinkSoonTitle: "Link de compra em breve",
    buyLinkSoonSr: "— link de compra em breve",
  },
  en: {
    reserve: "Reserve",
    buy: "Buy",
    soldOutEdition: "Sold out in this edition",
    preOrderEdition: "Pre-order",
    availableEdition: "Available in this edition",
    notifyMe: "Notify me when available",
    opensInNewTab: "(opens in a new tab)",
    buyLinkSoonTitle: "Purchase link coming soon",
    buyLinkSoonSr: "— purchase link coming soon",
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
    const ctaClassName = cn(
      buttonVariants({ variant: "accent", size: "lg" }),
      "h-11 gap-2 rounded-full px-7",
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
              ) : book.buyUrl ? (
                <a
                  href={book.buyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={ctaClassName}
                >
                  {ctaLabel}
                  <ExternalLink className="size-4" aria-hidden="true" />
                  <span className="sr-only">{labels.opensInNewTab}</span>
                </a>
              ) : (
                // Sem `buyUrl` ainda — mesmo tratamento do CTA do hero: botão
                // na forma final, desabilitado até a loja existir, mas ainda
                // focável (ver nota em `book-hero.tsx`).
                <button
                  type="button"
                  aria-disabled="true"
                  title={labels.buyLinkSoonTitle}
                  className={cn(
                    ctaClassName,
                    "cursor-not-allowed opacity-50 hover:bg-[color-mix(in_oklch,var(--accent),var(--foreground)_25%)]",
                  )}
                >
                  {ctaLabel}
                  <span className="sr-only">{labels.buyLinkSoonSr}</span>
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
