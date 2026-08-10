import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Seal } from "@/components/seal";

export function Hero() {
  return (
    <section className="dark relative overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 [background:radial-gradient(60%_60%_at_80%_15%,color-mix(in_oklab,var(--primary)_22%,transparent),transparent_70%)]" />
      <div className="pointer-events-none absolute -left-32 top-1/2 hidden size-[34rem] -translate-y-1/2 text-foreground/[0.035] sm:block">
        <Seal className="size-full" />
      </div>

      <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-32">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.3em] text-accent">
            <Seal className="size-4" />
            Nova edição
          </span>
          <h1 className="mt-6 text-balance font-display text-5xl leading-[1.05] sm:text-6xl">
            Histórias que se recusam a ficar na estante.
          </h1>
          <p className="mt-6 max-w-md font-serif text-lg leading-relaxed text-foreground/70">
            A Hocus Pocus publica ficção sombria ilustrada em pequenas
            tiragens — cada universo com sua própria mitologia, capa e
            edição de colecionador.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-6">
            <Link
              href="/catalogo"
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-11 rounded-full bg-primary px-7 text-primary-foreground hover:bg-primary/85"
              )}
            >
              Ver catálogo
            </Link>
            <Link
              href="/sobre"
              className="text-sm font-medium text-foreground/70 underline-offset-4 hover:text-foreground hover:underline"
            >
              Conhecer a editora
            </Link>
          </div>
        </div>

        <div className="relative mx-auto aspect-3/4 w-full max-w-xs">
          <div className="absolute inset-0 rounded-2xl border border-border bg-card shadow-[0_40px_80px_-30px_rgba(0,0,0,0.7)]" />
          <div className="absolute inset-6 rounded-lg border border-border/70" />
          <div className="absolute right-5 top-5 flex size-14 items-center justify-center rounded-full bg-background text-accent shadow-lg">
            <Seal className="size-8" />
          </div>
          <span className="absolute inset-x-6 bottom-8 font-display text-2xl leading-tight text-primary">
            capa em edição limitada
          </span>
        </div>
      </div>
    </section>
  );
}
