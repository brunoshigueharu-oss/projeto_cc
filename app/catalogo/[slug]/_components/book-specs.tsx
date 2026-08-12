import type { Book } from "@/lib/data/schemas";
import { formatDate } from "@/lib/format";

/**
 * Ficha técnica, para uso dentro de `AboutBookSection`.
 *
 * Usa `<dl>/<dt>/<dd>` de propósito: leitores de tela anunciam a relação
 * rótulo→valor, o que uma lista de `<div>` não daria. Linhas com `border-b`
 * (uma por spec), no lugar da grade multi-coluna anterior — mesmo padrão do
 * "SpecsGrid" do Figma.
 */
export function BookSpecs({ book }: { book: Book }) {
  // Ficha técnica ainda não recebida da editora para este título.
  if (!book.specs) {
    return null;
  }

  const rows: Array<{ label: string; value: string }> = [
    { label: "ISBN", value: book.specs.isbn },
    { label: "Páginas", value: String(book.specs.pages) },
    { label: "Dimensões", value: book.specs.dimensions },
    { label: "Idioma", value: book.specs.language },
    { label: "Encadernação", value: book.specs.format },
    { label: "Edição", value: book.specs.edition },
    { label: "Lançamento", value: formatDate(book.specs.publishedAt) },
  ];

  return (
    <div className="w-full">
      <h3 className="font-display text-xl text-foreground sm:text-2xl">Especificações Técnicas</h3>

      <dl className="mt-6">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between border-b border-border py-4"
          >
            <dt className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              {row.label}
            </dt>
            <dd className="text-sm font-medium text-foreground tabular-nums">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
