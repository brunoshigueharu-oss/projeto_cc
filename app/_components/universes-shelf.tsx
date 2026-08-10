import Link from "next/link";

import { UniverseCard } from "@/components/universe-card";
import { getUniverses } from "../_data-access/get-universes";

export async function UniversesShelf() {
  const universes = await getUniverses();

  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
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

        <Link
          href="/catalogo"
          className="text-xs font-medium uppercase tracking-[0.2em] text-primary underline-offset-4 hover:underline"
        >
          Ver catálogo completo
        </Link>
      </div>

      <ul className="mt-10 grid grid-cols-2 gap-5 lg:grid-cols-4">
        {universes.map((universe) => (
          <li key={universe.slug}>
            <UniverseCard universe={universe} />
          </li>
        ))}
      </ul>
    </section>
  );
}
