import Image from "next/image";
import Link from "next/link";

import type { Book, Campaign } from "@/lib/data/schemas";

/**
 * "Sobre o projeto" (node 211:1425 do Figma): título, texto em duas colunas
 * com a ficha técnica ao lado e a tira de páginas internas embaixo.
 *
 * A ficha é montada a partir do título principal da campanha, não de campos
 * próprios: `books.ts` já é a fonte de verdade de páginas, formato e ISBN, e
 * duplicar isso no registro da campanha só criaria divergência. Por isso o
 * rótulo do Figma — "Ficha Técnica Estimada" — vira "Ficha Técnica" quando o
 * livro já saiu, e continua "Estimada" enquanto a campanha está aberta.
 */
export function CampaignAbout({
  campaign,
  primaryBook,
}: {
  campaign: Campaign;
  primaryBook: Book | undefined;
}) {
  const paragraphs = campaign.about ?? [campaign.description];
  const specs = buildSpecs(primaryBook);
  const gallery = campaign.gallery ?? primaryBook?.gallery ?? [];
  // "Estimada" só faz sentido enquanto o exemplar ainda não foi impresso —
  // numa campanha de evento ou assinatura o livro já existe, com ficha fechada.
  const isEstimated =
    campaign.status !== "encerrada" &&
    (campaign.kind === "pre-venda" || campaign.kind === "lancamento");

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-primary">
        Sobre o projeto
      </p>
      <h1 className="mt-3 max-w-3xl text-balance font-display text-3xl font-bold leading-[1.15] text-foreground sm:text-4xl">
        {campaign.title}
      </h1>

      <div className="mt-12 flex flex-col gap-12 lg:flex-row lg:gap-16">
        <div className="flex flex-1 flex-col gap-6 text-lg leading-relaxed text-foreground">
          {paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        {specs.length > 0 ? (
          <div className="w-full shrink-0 rounded-3xl border border-border bg-card p-7 lg:w-[420px]">
            <h2 className="font-display text-lg font-bold text-foreground">
              {isEstimated ? "Ficha Técnica Estimada" : "Ficha Técnica"}
            </h2>

            <dl className="mt-4">
              {specs.map((row) => (
                <div
                  key={row.label}
                  className="flex items-start justify-between gap-4 border-b border-border pb-2 pt-3 text-[13px] first:pt-0"
                >
                  <dt className="text-muted-foreground">{row.label}</dt>
                  <dd className="text-right font-bold text-foreground tabular-nums">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>

            {primaryBook ? (
              <Link
                href={`/catalogo/${primaryBook.slug}`}
                className="mt-6 inline-flex text-xs font-medium uppercase tracking-[0.2em] text-primary underline-offset-4 hover:underline"
              >
                Ver o livro no catálogo →
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>

      {gallery.length > 0 ? (
        <div className="mt-16">
          <h2 className="font-display text-xl font-bold text-foreground">
            Visualização das páginas internas
          </h2>
          <ul className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {gallery.map((image) => (
              <li
                key={image.src}
                className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-muted"
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

/** Linhas da ficha, na ordem do Figma. Cada uma some quando o dado não veio. */
function buildSpecs(book: Book | undefined): Array<{ label: string; value: string }> {
  if (!book) {
    return [];
  }

  return [
    { label: "Autor", value: book.author.name },
    { label: "Editora", value: "Hocus Pocus" },
    ...(book.specs
      ? [
          { label: "Páginas", value: String(book.specs.pages) },
          { label: "Formato", value: `${book.specs.dimensions} (${book.specs.format})` },
          { label: "ISBN", value: book.specs.isbn },
        ]
      : []),
  ];
}
