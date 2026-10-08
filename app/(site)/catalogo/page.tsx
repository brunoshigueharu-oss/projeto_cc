import type { Metadata } from "next";
import Link from "next/link";

import { BookCard } from "@/components/book-card";
import { PageHeader } from "@/components/page-header";
import { UNIVERSES_BY_SLUG } from "@/lib/data/universes";
import { getCatalog } from "./_data-access/get-catalog";

export const metadata: Metadata = {
  title: "Catálogo",
  description:
    "Todos os títulos da Hocus Pocus: tiragens curtas, sem reimpressão automática.",
};

export default async function CatalogoPage({ searchParams }: PageProps<"/catalogo">) {
  const query = await searchParams;
  const { universo, ...remainingParams } = query;
  const universeSlug = typeof universo === "string" ? universo : undefined;
  const universe = universeSlug ? UNIVERSES_BY_SLUG.get(universeSlug) : undefined;
  const invalidUniverse = universo !== undefined && !universe;
  const clearFilterHref = { pathname: "/catalogo", query: remainingParams };

  const { books, totalBooks, totalUniverses } = await getCatalog(universe?.slug);

  return (
    <>
      <PageHeader
        eyebrow="Catálogo"
        title="Hocus Pocus"
        intro={
          universe
            ? `Filtrando por ${universe.name}: ${universe.tagline}`
            : "Venha conhecer nossos universos ilustrados: a história em quadrinhos nunca esteve tão viva."
        }
      >
        <p className="mt-2 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground tabular-nums">
          {totalBooks} títulos · {totalUniverses} universos
        </p>
      </PageHeader>

      <section aria-label="Títulos do catálogo" className="mx-auto max-w-6xl px-4 pt-6 pb-16 sm:px-6">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          {universe || invalidUniverse ? (
            <div className="inline-flex max-w-full flex-wrap items-center gap-x-3 rounded-2xl border border-border px-4 text-sm">
              <span className="py-2">Universo: {universe?.name ?? "inválido"}</span>
              <Link
                href={clearFilterHref}
                scroll={false}
                aria-label={`Limpar filtro de universo${universe ? `: ${universe.name}` : " inválido"}`}
                className="inline-flex min-h-11 items-center rounded-sm font-medium text-primary underline underline-offset-4 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Limpar <span aria-hidden="true" className="ml-2">×</span>
              </Link>
            </div>
          ) : null}
          <p role="status" className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground tabular-nums">
            {totalBooks} {totalBooks === 1 ? "resultado" : "resultados"}
          </p>
        </div>
        {invalidUniverse ? (
          <p className="mb-8 text-sm text-muted-foreground">
            Universo não encontrado. Exibindo todos os títulos do catálogo.
          </p>
        ) : null}
        {books.length === 0 ? (
          <div className="border-y border-border py-12 text-center">
            <p className="text-lg font-medium">Nenhum título encontrado</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {universe ? `Ainda não há títulos disponíveis de ${universe.name}.` : "Ainda não há títulos disponíveis no catálogo."}
            </p>
            {universe ? (
              <Link href={clearFilterHref} scroll={false} className="mt-4 inline-flex min-h-11 items-center rounded-sm text-sm font-medium text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                Ver catálogo completo
              </Link>
            ) : null}
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-3 md:gap-x-10 md:gap-y-16 lg:gap-x-20 lg:gap-y-20">
            {books.map((book) => (
              <li key={book.slug}>
                <BookCard book={book} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
