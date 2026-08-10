import Link from "next/link";

import type { Universe } from "@/lib/data/schemas";
import { cn } from "@/lib/utils";

type UniverseFilterProps = {
  universes: readonly Universe[];
  activeSlug?: string;
};

const CHIP_BASE =
  "rounded-full border px-4 py-2 text-xs font-medium uppercase tracking-[0.15em] transition-colors";

/**
 * Filtro sem JavaScript de cliente: cada opção é um link que troca o
 * `?universo=` da URL, e a página relê o `searchParams` no servidor. O estado
 * fica na URL (compartilhável, navegável pelo histórico), como pedem as regras
 * do projeto.
 */
export function UniverseFilter({ universes, activeSlug }: UniverseFilterProps) {
  return (
    <nav aria-label="Filtrar por universo" className="flex flex-wrap gap-2">
      <Link
        href="/catalogo"
        aria-current={activeSlug ? undefined : "true"}
        className={cn(
          CHIP_BASE,
          activeSlug
            ? "border-border text-muted-foreground hover:border-primary hover:text-primary"
            : "border-primary bg-primary text-primary-foreground",
        )}
      >
        Todos
      </Link>

      {universes.map((universe) => {
        const isActive = universe.slug === activeSlug;
        return (
          <Link
            key={universe.slug}
            href={`/catalogo?universo=${universe.slug}`}
            aria-current={isActive ? "true" : undefined}
            className={cn(
              CHIP_BASE,
              isActive
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-primary hover:text-primary",
            )}
          >
            {universe.name}
          </Link>
        );
      })}
    </nav>
  );
}
