import type { Metadata } from "next";

import { BookCard } from "@/components/book-card";
import { PageHeader } from "@/components/page-header";
import { getCatalog } from "./_data-access/get-catalog";

export const metadata: Metadata = {
  title: "Catálogo",
  description:
    "Todos os títulos da Hocus Pocus — tiragens curtas, sem reimpressão automática.",
};

export default async function CatalogoPage() {
  const { books, totalBooks, totalUniverses } = await getCatalog();

  return (
    <>
      <PageHeader
        eyebrow="Catálogo"
        title="Hocus Pocus"
        intro="Venha conhecer nossos universos ilustrados — a história em quadrinhos nunca esteve tão viva."
      >
        <p className="mt-2 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground tabular-nums">
          {totalBooks} títulos · {totalUniverses} universos
        </p>
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
