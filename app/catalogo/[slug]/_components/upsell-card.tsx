import { buttonVariants } from "@/components/ui/button";
import type { Book } from "@/lib/data/schemas";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

import { PaperTiltEffect } from "./paper-tilt-effect";

/**
 * Card de item avulso (ex. exemplar autografado), equivalente ao
 * "UpsellCardSection" do Figma. Retorna `null` quando `book.upsell` não
 * existe — nenhum título tem esse dado hoje, fica pronto pra editora enviar.
 *
 * Layout simples: card de texto (borda + fundo branco, igual ao resto do
 * site) ao lado das folhas soltas, sem nenhum painel colorido por trás delas
 * — nada muda no fundo da seção. CTA usa `variant="accent"` (dourado): agora
 * é o único CTA de compra do site que usa cor forte, então precisa ser
 * consistente com os demais mesmo sobre fundo claro.
 */
export function UpsellCard({ book }: { book: Book }) {
  if (!book.upsell) {
    return null;
  }

  const { upsell } = book;

  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-center lg:gap-16">
          <div className="flex flex-col items-start gap-5 rounded-[28px] border border-border bg-card p-6 shadow-sm sm:p-10 lg:max-w-md lg:shrink-0">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
              Exclusivo Hocus Pocus
            </span>

            <h2 className="font-display text-2xl text-foreground sm:text-3xl">
              {upsell.title}
            </h2>

            <p className="font-serif leading-relaxed text-muted-foreground">
              {upsell.description}
            </p>

            <div className="mt-2 flex flex-col items-start gap-3">
              <span className="font-mono text-2xl font-bold text-foreground tabular-nums">
                + {formatPrice(upsell.price.amount)}
              </span>
              <span
                className={cn(
                  buttonVariants({ variant: "accent", size: "lg" }),
                  "h-11 rounded-full px-7",
                )}
              >
                {upsell.ctaLabel}
              </span>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center lg:justify-end">
            <PaperTiltEffect />
          </div>
        </div>
      </div>
    </section>
  );
}
