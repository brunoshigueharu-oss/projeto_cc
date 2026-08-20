import type { Metadata } from "next";
import Link from "next/link";

import { BookCard } from "@/components/book-card";
import { PageHeader } from "@/components/page-header";
import { UNIVERSES_BY_SLUG } from "@/lib/data/universes";
import { getCatalog } from "./_data-access/get-catalog";

export const metadata: Metadata = {
  title: "Catálogo",
  description:
    "Todos os títulos da Hocus Pocus — tiragens curtas, sem reimpressão automática.",
};

export default async function CatalogoPage({ searchParams }: PageProps<"/catalogo">) {
  const { universo } = await searchParams;
  const universeSlug = typeof universo === "string" ? universo : undefined;
  const universe = universeSlug ? UNIVERSES_BY_SLUG.get(universeSlug) : undefined;

  const { books, totalBooks, totalUniverses } = await getCatalog(universeSlug);

  return (
    <>
      <PageHeader
        eyebrow="Catálogo"
        title="Hocus Pocus"
        intro={
          universe
            ? `Filtrando por ${universe.name} — ${universe.tagline}`
            : "Venha conhecer nossos universos ilustrados — a história em quadrinhos nunca esteve tão viva."
        }
      >
        <p className="mt-2 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground tabular-nums">
          {totalBooks} títulos · {totalUniverses} universos
        </p>
        {universe ? (
          <Link
            href="/catalogo"
            className="mt-1 inline-block text-xs font-medium uppercase tracking-[0.2em] text-primary underline-offset-4 hover:underline"
          >
            Ver catálogo completo
          </Link>
        ) : null}
      </PageHeader>

      <section className="mx-auto max-w-6xl px-4 pt-6 pb-16 sm:px-6">
        <ul className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-3 md:gap-x-10 md:gap-y-16 lg:gap-x-20 lg:gap-y-20">
          {books.map((book) => (
            <li key={book.slug}>
              <BookCard book={book} />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
