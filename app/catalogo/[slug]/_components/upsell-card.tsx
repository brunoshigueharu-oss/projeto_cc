import { Seal } from "@/components/seal";
import { buttonVariants } from "@/components/ui/button";
import type { Book } from "@/lib/data/schemas";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Card de item avulso (ex. exemplar autografado), equivalente ao
 * "UpsellCardSection" do Figma. Retorna `null` quando `book.upsell` não
 * existe — nenhum título tem esse dado hoje, fica pronto pra editora enviar.
 */
export function UpsellCard({ book }: { book: Book }) {
  if (!book.upsell) {
    return null;
  }

  const { upsell } = book;

  return (
    <section className="border-t border-border bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="flex flex-col items-center gap-12 rounded-3xl border border-border bg-card p-8 sm:p-12 lg:flex-row">
          <div className="flex flex-1 flex-col items-start gap-6">
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
                Exclusivo Hocus Pocus
              </span>
              <h2 className="font-display text-2xl text-foreground sm:text-3xl">
                {upsell.title}
              </h2>
            </div>

            <p className="font-serif leading-relaxed text-muted-foreground">
              {upsell.description}
            </p>

            <div className="flex flex-col items-start gap-4">
              <span className="font-mono text-2xl font-bold text-foreground tabular-nums">
                + {formatPrice(upsell.price.amount)}
              </span>
              <span
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-11 rounded-full bg-primary px-7 text-primary-foreground",
                )}
              >
                {upsell.ctaLabel}
              </span>
            </div>
          </div>

          <div
            aria-hidden="true"
            className="relative flex h-64 w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted lg:h-full lg:w-64"
          >
            <Seal className="size-24 opacity-[0.08]" />
          </div>
        </div>
      </div>
    </section>
  );
}
