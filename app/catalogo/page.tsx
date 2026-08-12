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
        intro="Tiragens curtas, capas desenhadas antes do texto terminar e nenhuma reimpressão automática. O que acaba, acaba."
      >
        <p className="mt-6 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground tabular-nums">
          {totalBooks} títulos · {totalUniverses} universos
        </p>
      </PageHeader>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <ul className="grid grid-cols-2 gap-x-10 gap-y-16 lg:grid-cols-3 lg:gap-x-20 lg:gap-y-20">
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
