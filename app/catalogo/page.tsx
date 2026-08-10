import type { Metadata } from "next";

import { BookCard } from "@/components/book-card";
import { PageHeader } from "@/components/page-header";
import { UniverseCard } from "@/components/universe-card";
import { UNIVERSE_SLUGS } from "@/lib/data/universes";
import { getCatalog } from "./_data-access/get-catalog";
import { UniverseFilter } from "./_components/universe-filter";

export const metadata: Metadata = {
  title: "Catálogo",
  description:
    "Todos os títulos da Hocus Pocus, organizados pelos universos que eles habitam.",
};

export default async function CatalogoPage(props: PageProps<"/catalogo">) {
  const searchParams = await props.searchParams;

  // `?universo=` desconhecido degrada para "todos" em vez de quebrar a página.
  const requested = searchParams.universo;
  const activeSlug =
    typeof requested === "string" && UNIVERSE_SLUGS.has(requested)
      ? requested
      : undefined;

  const { universes, entries, totalBooks } = await getCatalog(activeSlug);
  const activeUniverse = universes.find((universe) => universe.slug === activeSlug);

  return (
    <>
      <PageHeader
        eyebrow="Catálogo"
        title="Cada livro pertence a um universo."
        intro="Tiragens curtas, capas desenhadas antes do texto terminar e nenhuma reimpressão automática. O que acaba, acaba."
      >
        <p className="mt-6 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground tabular-nums">
          {totalBooks} títulos · {universes.length} universos
        </p>
      </PageHeader>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="font-display text-2xl text-foreground sm:text-3xl">
          Os universos
        </h2>
        <ul className="mt-8 grid grid-cols-2 gap-5 lg:grid-cols-4">
          {universes.map((universe) => (
            <li key={universe.slug}>
              <UniverseCard universe={universe} />
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-6 border-t border-border pt-12">
          <h2 className="font-display text-2xl text-foreground sm:text-3xl">
            {activeUniverse ? activeUniverse.name : "Todos os títulos"}
          </h2>
          <UniverseFilter universes={universes} activeSlug={activeSlug} />
        </div>

        {activeUniverse ? (
          <p className="mt-4 max-w-xl font-serif text-muted-foreground">
            {activeUniverse.description}
          </p>
        ) : null}

        {entries.length > 0 ? (
          <ul className="mt-10 grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
            {entries.map(({ book, universeName }) => (
              <li key={book.slug}>
                <BookCard book={book} universeName={universeName} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-10 font-serif text-muted-foreground">
            Nenhum título publicado neste universo ainda. Os próximos são
            anunciados em Campanhas.
          </p>
        )}
      </section>
    </>
  );
}
