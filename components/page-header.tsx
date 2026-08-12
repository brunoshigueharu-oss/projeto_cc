import type { ReactNode } from "react";

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
 * site. As páginas internas abrem na casca clara, compacta, para não competir
 * com o conteúdo logo abaixo.
 */
export function PageHeader({ eyebrow, title, intro, children }: PageHeaderProps) {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-6">
        <span className="text-[11px] font-medium uppercase tracking-[0.3em] text-primary">
          {eyebrow}
        </span>
        <h1 className="mt-1 max-w-2xl text-balance font-display text-3xl leading-tight text-foreground">
          {title}
        </h1>
        {intro ? (
          <p className="mt-1 max-w-xl font-serif text-base leading-snug text-muted-foreground">
            {intro}
          </p>
        ) : null}
        {children}
      </div>
    </section>
  );
}
