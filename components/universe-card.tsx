import Link from "next/link";

import type { Universe } from "@/lib/data/schemas";
import { TONE_BACKGROUND } from "@/lib/tone";
import { cn } from "@/lib/utils";
import { Seal } from "./seal";

type UniverseCardProps = {
  universe: Universe;
  className?: string;
};

/** Card de universo — usado na prateleira da Home, no Catálogo e em Sobre. */
export function UniverseCard({ universe, className }: UniverseCardProps) {
  return (
    <Link
      href={`/catalogo?universo=${universe.slug}`}
      className={cn(
        "group relative flex aspect-3/4 flex-col justify-end overflow-hidden rounded-xl border border-border p-5 text-white shadow-sm transition-transform hover:-translate-y-1 focus-visible:-translate-y-1",
        TONE_BACKGROUND[universe.tone],
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(180deg,transparent_40%,rgba(0,0,0,0.55)_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-black/30 text-white/90 backdrop-blur-sm"
      >
        <Seal className="size-6" />
      </div>

      <span className="relative font-mono text-[11px] tracking-[0.2em] text-white/60 tabular-nums">
        Nº {String(universe.order).padStart(2, "0")}
      </span>
      <h3 className="relative mt-1 font-display text-2xl leading-tight">
        {universe.name}
      </h3>
      <p className="relative mt-2 line-clamp-2 font-serif text-sm text-white/75">
        {universe.tagline}
      </p>
    </Link>
  );
}
