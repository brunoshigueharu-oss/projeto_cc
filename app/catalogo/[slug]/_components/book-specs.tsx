import type { Book } from "@/lib/data/schemas";
import { formatDate } from "@/lib/format";

/**
 * Ficha técnica.
 *
 * Usa `<dl>/<dt>/<dd>` de propósito: leitores de tela anunciam a relação
 * rótulo→valor, o que uma grade de `<div>` não daria. Números em `tabular-nums`
 * para as colunas alinharem.
 */
export function BookSpecs({ book }: { book: Book }) {
  const rows: Array<{ label: string; value: string }> = [
    { label: "Páginas", value: String(book.specs.pages) },
    { label: "Formato", value: book.specs.format },
    { label: "Dimensões", value: book.specs.dimensions },
    { label: "Idioma", value: book.specs.language },
    { label: "Edição", value: book.specs.edition },
    { label: "Publicação", value: formatDate(book.specs.publishedAt) },
    { label: "ISBN", value: book.specs.isbn },
  ];

  return (
    <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
      <h2 className="font-display text-2xl text-foreground">Ficha técnica</h2>

      <dl className="mt-8 grid gap-x-10 gap-y-6 border-t border-border pt-8 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((row) => (
          <div key={row.label}>
            <dt className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {row.label}
            </dt>
            <dd className="mt-1 font-mono text-sm text-foreground tabular-nums">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
