import Image from "next/image";

import { AddToCartButton } from "@/components/add-to-cart-button";
import { BookCover } from "@/components/book-cover";
import { BookSpecs } from "@/components/book-specs";
import { BookSynopsis } from "@/components/book-synopsis";
import { ParallaxSection } from "@/components/parallax-section";
import { Badge } from "@/components/ui/badge";
import { isPurchasable as isBookPurchasable } from "@/lib/data/book-availability";
import type { Book, Campaign } from "@/lib/data/schemas";
import { formatPrice } from "@/lib/format";

/**
 * "Sobre o projeto" (node 211:1425 do Figma, com o miolo revisado a partir de
 * referência visual do usuário): a abertura do livro da campanha usa a mesma
 * diagramação do topo das páginas de livro (`BookHero`, no catálogo) — grade
 * `0.8fr_1.2fr` com a capa à esquerda e, à direita, a ficha de leitura na
 * mesma ordem: kicker no lugar do breadcrumb, título, subtítulo, autoria,
 * sinopse com "Leia mais", preço + selo e CTA.
 *
 * Antes o cabeçalho (kicker + título + autoria) vivia numa seção própria
 * acima da vitrine: o título ficava solto no topo da página e sobrava um vazio
 * grande ao lado da capa, porque a coluna direita — só sinopse, preço e botão
 * — era curta demais para acompanhá-la. Juntando os dois, a campanha lê igual
 * a qualquer outra página de livro do site.
 *
 * Ao lado da capa vai só o parágrafo seguinte ao de abertura (o primeiro subiu
 * para `campaign-progress`); do terceiro em diante o texto continua na seção
 * depois do parallax, onde tem largura de leitura. Entre os dois, a faixa de
 * parallax do livro (`book.parallax`) entra como divisor full-width.
 *
 * Depois do parallax a campanha adota o mesmo modelo das páginas de livro
 * (`AboutBookSection` do catálogo): duas colunas, "O Livro" à esquerda e
 * "Sobre o Autor" + ficha técnica à direita — o mesmo `BookSpecs` de
 * `components/`, não uma ficha paralela. O que muda é a fonte do texto da
 * coluna esquerda: na página de livro é o `excerpt`, aqui é o convite da
 * campanha (`recommendedIntro` + `recommendedFor`), que é o argumento de
 * venda do financiamento. A galeria de páginas internas fecha o bloco. Sem
 * `primaryBook` não há capa, autor nem ficha: sobra o cabeçalho e o texto
 * corrido.
 *
 * A ficha sai do título principal da campanha, não de campos próprios:
 * `books.ts` já é a fonte de verdade de páginas, formato e ISBN, e duplicar
 * isso no registro da campanha só criaria divergência. Por isso o rótulo do
 * Figma — "Ficha Técnica Estimada" — só vale enquanto a campanha está aberta;
 * com o livro já publicado, cai no título padrão do `BookSpecs`.
 */
export function CampaignAbout({
  campaign,
  primaryBook,
}: {
  campaign: Campaign;
  primaryBook: Book | undefined;
}) {
  // O parágrafo de abertura (`about[0]`) não fica mais aqui: subiu para
  // `campaign-progress`, logo abaixo do CTA. Esta seção começa no parágrafo
  // seguinte.
  const [, ...restParagraphs] = campaign.about ?? [campaign.description];
  // A vitrine acompanha só o parágrafo seguinte ao de abertura — o bastante
  // para apresentar o livro ao lado da capa. O resto do texto continua na
  // seção depois do parallax, onde tem largura de leitura.
  const showcaseParagraph = primaryBook ? restParagraphs.at(0) : undefined;
  const storyParagraphs = primaryBook ? restParagraphs.slice(1) : restParagraphs;
  const gallery = campaign.gallery ?? primaryBook?.gallery ?? [];
  // "Estimada" só faz sentido enquanto o exemplar ainda não foi impresso —
  // numa campanha de evento ou assinatura o livro já existe, com ficha fechada.
  const isEstimated =
    campaign.status !== "encerrada" &&
    (campaign.kind === "pre-venda" || campaign.kind === "lancamento");

  // Kicker + título ocupam o lugar do breadcrumb + H1 da página de livro, e
  // são os mesmos com ou sem capa ao lado — por isso saem daqui, e não
  // repetidos nos dois ramos do JSX.
  const heading = (
    <>
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
        Sobre o projeto
      </p>
      <h1 className="mt-4 text-balance font-display text-4xl leading-[1.1] text-foreground sm:text-5xl">
        {campaign.title}
      </h1>
    </>
  );

  return (
    <>
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        {primaryBook ? (
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-16">
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
              {heading}

              {primaryBook.subtitle ? (
                <p className="mt-2 font-serif text-lg text-foreground/60">
                  {primaryBook.subtitle}
                </p>
              ) : null}

              <p className="mt-1 font-serif text-base italic text-primary">
                Por {primaryBook.author.name}
              </p>

              {showcaseParagraph ? (
                <BookSynopsis text={showcaseParagraph} locale={primaryBook.locale} />
              ) : null}

              <div className="mt-6 flex flex-wrap items-center gap-4">
                <span className="font-mono text-2xl font-bold text-foreground tabular-nums">
                  {formatPrice(primaryBook.price.amount)}
                </span>
                {campaign.kind === "lancamento" ? <Badge>Lançamento</Badge> : null}
              </div>

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
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl">{heading}</div>
        )}
      </section>

      <ParallaxSection layers={primaryBook?.parallax ?? []} />

      {storyParagraphs.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="flex max-w-3xl flex-col gap-6 font-serif leading-relaxed text-foreground/70">
            {storyParagraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>
      ) : null}

      {primaryBook ? (
        <section className="border-t border-border">
          <div className="mx-auto grid max-w-6xl gap-16 px-4 py-20 sm:px-6 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-2xl text-foreground sm:text-3xl">O Livro</h2>

              {campaign.recommendedIntro ? (
                <p className="mt-6 font-serif leading-relaxed text-muted-foreground">
                  {campaign.recommendedIntro}
                </p>
              ) : null}

              {campaign.recommendedFor?.length ? (
                <ul className="ml-5 mt-6 flex list-disc flex-col gap-2 font-serif leading-relaxed text-muted-foreground">
                  {campaign.recommendedFor.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className="flex flex-col gap-12">
              <div>
                <h2 className="font-display text-2xl text-foreground sm:text-3xl">Sobre o Autor</h2>
                <p className="mt-2 font-display text-lg text-foreground">
                  {primaryBook.author.name}
                </p>
                {primaryBook.author.bio ? (
                  /* `whitespace-pre-line`: a bio vem em parágrafos separados por
                     quebra dupla em `books.ts`. */
                  <p className="mt-6 whitespace-pre-line font-serif leading-relaxed text-muted-foreground">
                    {primaryBook.author.bio}
                  </p>
                ) : null}
              </div>

              <BookSpecs
                book={primaryBook}
                heading={isEstimated ? "Ficha Técnica Estimada" : undefined}
              />
            </div>
          </div>
        </section>
      ) : null}

      {gallery.length > 0 ? (
        <section className="border-t border-border">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <h2 className="font-display text-2xl text-foreground sm:text-3xl">
              Visualização das páginas internas
            </h2>
            <ul className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
        </section>
      ) : null}
    </>
  );
}
