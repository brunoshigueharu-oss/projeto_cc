import { Seal } from "@/components/seal";

/**
 * Seção institucional estática ("Entenda as Coleções" no Figma) — mesmo texto
 * em toda página de livro, não depende de dado por título nem por universo.
 */
export function CollectionsGuideSection() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-16 px-4 py-20 sm:px-6 lg:flex-row">
        <div className="flex flex-1 flex-col gap-6">
          <h2 className="font-display text-2xl text-foreground sm:text-3xl">
            Entenda as Coleções
          </h2>
          <p className="max-w-lg font-serif leading-relaxed text-muted-foreground">
            Nossa linha editorial é dividida de forma conceitual: as Novelas
            Gráficas exploram o universo visual bruto, enquanto as Coletâneas
            de Contos expandem a lore em detalhes literários minuciosos.
          </p>
          <p className="max-w-lg font-serif leading-relaxed text-muted-foreground">
            Seja você um colecionador focado em estética tátil ou um
            desbravador de enredos densos, o catálogo Hocus Pocus oferece
            portais perfeitamente delineados para sua próxima obsessão de
            leitura.
          </p>
        </div>

        <div
          aria-hidden="true"
          className="relative flex h-64 w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted lg:h-80 lg:w-[520px]"
        >
          <Seal className="size-24 opacity-[0.08]" />
        </div>
      </div>
    </section>
  );
}
