import Image from "next/image";
import Link from "next/link";

import type { Universe } from "@/lib/data/schemas";
import { TONE_BACKGROUND } from "@/lib/tone";
import { cn } from "@/lib/utils";

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
        "group relative flex aspect-3/4 flex-col justify-end overflow-hidden rounded-xl border border-border p-5 text-white shadow-sm",
        TONE_BACKGROUND[universe.tone],
        className,
      )}
    >
      {universe.image ? (
        <Image
          src={universe.image.src}
          alt={universe.image.alt}
          fill
          sizes="(min-width: 1024px) 25vw, 50vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-110 group-focus-within:scale-110"
        />
      ) : null}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(180deg,transparent_40%,rgba(0,0,0,0.55)_100%)]"
      />

      <h3 className="relative font-display text-lg leading-tight">
        {universe.image?.title ?? universe.name}
      </h3>
      {universe.image?.author ? (
        <p className="relative mt-1 font-serif text-xs text-white/75">
          {universe.image.author}
        </p>
      ) : null}
    </Link>
  );
}
