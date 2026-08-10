import type { ReactNode } from "react";

import { Seal } from "./seal";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  intro?: string;
  /** Conteúdo opcional abaixo da introdução (contadores, filtros, CTA). */
  children?: ReactNode;
};

/**
 * Faixa de abertura das páginas internas.
 *
 * A hero escura continua exclusiva da Home — é o único momento de imersão do
 * site. As páginas internas abrem na casca clara, com o selo em marca d'água
 * mantendo a assinatura da marca sem competir com o conteúdo.
 */
export function PageHeader({ eyebrow, title, intro, children }: PageHeaderProps) {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 top-1/2 hidden size-80 -translate-y-1/2 text-foreground/[0.04] sm:block"
      >
        <Seal className="size-full" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <span className="text-[11px] font-medium uppercase tracking-[0.3em] text-primary">
          {eyebrow}
        </span>
        <h1 className="mt-3 max-w-2xl text-balance font-display text-4xl leading-tight text-foreground sm:text-5xl">
          {title}
        </h1>
        {intro ? (
          <p className="mt-5 max-w-xl font-serif text-lg leading-relaxed text-muted-foreground">
            {intro}
          </p>
        ) : null}
        {children}
      </div>
    </section>
  );
}
