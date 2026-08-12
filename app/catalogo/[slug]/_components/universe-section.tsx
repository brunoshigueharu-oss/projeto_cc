import Link from "next/link";

import { Seal } from "@/components/seal";
import { TONE_BACKGROUND } from "@/lib/tone";
import type { Universe } from "@/lib/data/schemas";

/**
 * Bloco de destaque do universo, na casca clara, equivalente ao
 * "UniverseSection" do Figma. Painel decorativo usa a cor do próprio universo
 * (`coverTone`) em vez da imagem cinza do mock — não existe asset de universo
 * no catálogo hoje.
 */
export function UniverseSection({ universe }: { universe: Universe }) {
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
            <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
              Expansão Narrativa
            </span>
            <h2 className="font-display text-3xl leading-tight sm:text-4xl">
              Sobre o Universo {universe.name}
            </h2>
          </div>

          <p className="max-w-xl font-serif text-lg leading-relaxed text-foreground/70">
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
