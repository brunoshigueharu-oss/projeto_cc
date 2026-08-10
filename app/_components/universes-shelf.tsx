import { Seal } from "./seal";

type Universe = {
  number: string;
  title: string;
  description: string;
  swatchClassName: string;
};

/**
 * Dados de vitrine (placeholder) — conteúdo real do catálogo entra em
 * lib/data/universes.ts quando o schema Zod for definido (ver docs/site).
 */
const UNIVERSES: Universe[] = [
  {
    number: "01",
    title: "Universo I",
    description: "Horror botânico contado em capítulos ilustrados.",
    swatchClassName: "bg-[#6e1423]",
  },
  {
    number: "02",
    title: "Universo II",
    description: "Mitologia mecânica e relíquias esquecidas.",
    swatchClassName: "bg-[#141b36]",
  },
  {
    number: "03",
    title: "Universo III",
    description: "Curiosidades e artefatos de um gabinete impossível.",
    swatchClassName: "bg-[#4a2d0a]",
  },
  {
    number: "04",
    title: "Universo IV",
    description: "Contos noturnos, para colecionar um a um.",
    swatchClassName: "bg-[#101913]",
  },
];

export function UniversesShelf() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="max-w-xl">
        <span className="text-[11px] font-medium uppercase tracking-[0.3em] text-primary">
          Catálogo
        </span>
        <h2 className="mt-3 font-display text-3xl text-foreground sm:text-4xl">
          Conheça os nossos universos
        </h2>
        <p className="mt-3 font-serif text-muted-foreground">
          Cada selo reúne uma mitologia própria — comece por qualquer um deles.
        </p>
      </div>

      <ul className="mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4">
        {UNIVERSES.map((universe) => (
          <li key={universe.number} className="shrink-0 basis-64 snap-start">
            <article
              className={`group relative flex aspect-3/4 flex-col justify-end overflow-hidden rounded-xl border border-border p-5 text-white shadow-sm transition-transform hover:-translate-y-1 ${universe.swatchClassName}`}
            >
              <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_40%,rgba(0,0,0,0.55)_100%)]" />
              <div className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-black/30 text-white/90 backdrop-blur-sm">
                <Seal className="size-6" />
              </div>
              <span className="relative font-mono text-[11px] tracking-[0.2em] text-white/60">
                Nº {universe.number}
              </span>
              <h3 className="relative mt-1 font-display text-2xl leading-tight">
                {universe.title}
              </h3>
              <p className="relative mt-2 line-clamp-2 font-serif text-sm text-white/75">
                {universe.description}
              </p>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
