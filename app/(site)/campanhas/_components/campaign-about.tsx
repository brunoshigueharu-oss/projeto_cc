import Image from "next/image";
import Link from "next/link";

import { AddToCartButton } from "@/components/add-to-cart-button";
import { BookCover } from "@/components/book-cover";
import { BookSynopsis } from "@/components/book-synopsis";
import { ParallaxSection } from "@/components/parallax-section";
import { Badge } from "@/components/ui/badge";
import { isPurchasable as isBookPurchasable } from "@/lib/data/book-availability";
import type { Book, Campaign } from "@/lib/data/schemas";

/**
 * "Sobre o projeto" (node 211:1425 do Figma, com o miolo revisado a partir de
 * referência visual do usuário): título, primeiro parágrafo isolado, a faixa
 * de parallax do livro (`book.parallax`) como divisor full-width — mesma
 * seção usada na página de catálogo — e o restante do texto na mesma vibe do
 * `BookHero`: capa com a prévia em vídeo rodando à esquerda, texto truncado
 * ("leia mais") e CTA de reserva à direita, em vez de um bloco corrido de
 * parágrafos. Sem `primaryBook`, cai de volta no texto corrido simples — não
 * há capa nem exemplar para reservar.
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
  const [firstParagraph, ...restParagraphs] = paragraphs;
  const specs = buildSpecs(primaryBook);
  const gallery = campaign.gallery ?? primaryBook?.gallery ?? [];
  // "Estimada" só faz sentido enquanto o exemplar ainda não foi impresso —
  // numa campanha de evento ou assinatura o livro já existe, com ficha fechada.
  const isEstimated =
    campaign.status !== "encerrada" &&
    (campaign.kind === "pre-venda" || campaign.kind === "lancamento");

  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pt-16 sm:px-6 sm:pt-20">
        <div className="flex flex-col items-start gap-6 pb-12 sm:pb-16">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-primary">
            Sobre o projeto
          </p>
          <h1 className="text-balance font-display text-3xl font-bold leading-[1.15] text-foreground sm:text-4xl">
            {campaign.title}
          </h1>
          <p className="font-serif text-base leading-relaxed text-foreground/70 sm:text-lg">
            {firstParagraph}
          </p>
        </div>
      </section>

      <ParallaxSection layers={primaryBook?.parallax ?? []} />

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20">
        {primaryBook ? (
          <div className="grid gap-10 pt-12 sm:pt-16 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-16">
            <div className="mx-auto w-full max-w-xs lg:mx-0">
              <BookCover
                title={primaryBook.title}
                alt={primaryBook.coverAlt}
                videoSrc={primaryBook.coverVideoSrc}
                videoScale={primaryBook.coverVideoScale}
                videoFit={primaryBook.coverVideoFit}
                showPauseControl
                size="lg"
                className="w-full"
              />
            </div>

            <div>
              {campaign.kind === "lancamento" ? <Badge>Lançamento</Badge> : null}

              {restParagraphs.length > 0 ? (
                <BookSynopsis text={restParagraphs.join("\n\n")} locale={primaryBook.locale} />
              ) : null}

              <div className="mt-6 flex flex-wrap items-center gap-5">
                {isBookPurchasable(primaryBook.status) ? (
                  <AddToCartButton
                    type="book"
                    slug={primaryBook.slug}
                    label={campaign.ctaLabel}
                    addedLabel="Adicionado!"
                  />
                ) : (
                  <span className="rounded-full border border-border px-7 py-3 text-sm font-medium text-foreground/50">
                    Tiragem esgotada
                  </span>
                )}

                <Link
                  href={`/catalogo/${primaryBook.slug}`}
                  className="text-sm font-medium text-foreground/70 underline-offset-4 hover:text-foreground hover:underline"
                >
                  Ver o livro no catálogo →
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6 pt-12 font-serif text-base leading-relaxed text-foreground/70 sm:pt-16 sm:text-lg">
            {restParagraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        )}

        {specs.length > 0 || campaign.recommendedFor?.length ? (
          <div className="mt-12 flex flex-col gap-6 sm:mt-16 sm:flex-row sm:flex-wrap">
            {specs.length > 0 ? (
              <div className="w-full rounded-3xl border border-border bg-card p-7 sm:w-[420px]">
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
              </div>
            ) : null}

            {campaign.recommendedFor?.length ? (
              <div className="w-full rounded-3xl border border-border bg-card p-7 sm:w-[420px]">
                <h2 className="font-display text-lg font-bold text-foreground">
                  Indicada para quem gosta de
                </h2>

                <ul className="ml-4 mt-4 flex list-disc flex-col gap-2 font-serif text-[13px] text-foreground/70">
                  {campaign.recommendedFor.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}

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
    </>
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
