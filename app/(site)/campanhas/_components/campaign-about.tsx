import { AddToCartButton } from "@/components/add-to-cart-button";
import { BookCover } from "@/components/book-cover";
import { BookSpecs } from "@/components/book-specs";
import { BookSynopsis } from "@/components/book-synopsis";
import { ParallaxSection } from "@/components/parallax-section";
import { Badge } from "@/components/ui/badge";
import { isPurchasable as isBookPurchasable } from "@/lib/data/book-availability";
import type { Book, Campaign } from "@/lib/data/schemas";
import { formatPrice } from "@/lib/format";
import { CampaignPagesGallery } from "./campaign-pages-gallery";

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
 * Ao lado da capa vai a premissa da história — a sinopse do próprio título,
 * que é o que decide a compra — seguida do parágrafo de ambientação da
 * campanha (`about[1]`), emendados num bloco só atrás do mesmo "Leia mais".
 * O parágrafo de abertura (`about[0]`) subiu para `campaign-progress`. Logo
 * abaixo, a faixa de parallax do livro (`book.parallax`) entra como divisor
 * full-width.
 *
 * Depois do parallax a campanha adota o mesmo modelo das páginas de livro
 * (`AboutBookSection` do catálogo): duas colunas, "O Livro" à esquerda e
 * "Sobre o Autor" + ficha técnica à direita — o mesmo `BookSpecs` de
 * `components/`, não uma ficha paralela. O que muda é a fonte do texto da
 * coluna esquerda: na página de livro é o `excerpt`, aqui é o texto da
 * campanha (`bookIntro`, depois `recommendedIntro` + `recommendedFor`,
 * fechado por `recommendedOutro`), que é o argumento de venda do
 * financiamento. À direita, `authorNote` emenda na bio: a linhagem literária
 * da obra lida logo depois de quem são Alcatena e Mazzitelli. A galeria de
 * páginas internas fecha o bloco, com `galleryIntro` entre o título e a
 * fileira — a construção de mundo da obra, que é o que a fileira logo abaixo
 * mostra. Sem `primaryBook` não há capa, autor nem ficha: sobra o cabeçalho.
 *
 * Entre o parallax e esse bloco não existe mais uma seção de texto corrido
 * (2026-09). Ela recebia `about[2]` em diante — a linhagem literária, o tipo
 * de fantasia que a obra é e a edição argentina — e era o único trecho da
 * página sem função de venda: três parágrafos soltos numa coluna de leitura,
 * logo depois de uma faixa de imagem. Cada um desses textos passou a viver no
 * bloco de que fala, na ordem do documento da editora, e `about` está travado
 * em dois parágrafos no schema para não voltar a sobrar texto sem lugar.
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
  // `campaign-progress`, logo abaixo do CTA. Sobra o segundo — ao lado da
  // capa, ou logo abaixo do cabeçalho quando a campanha não tem livro.
  const [, ...restParagraphs] = campaign.about ?? [campaign.description];
  // A vitrine abre pela premissa — a sinopse do título principal, lida direto
  // de `books.ts` em vez de copiada para o registro da campanha — e emenda o
  // parágrafo seguinte da campanha, que amplia o mundo sem repetir a trama.
  // Sem sinopse no título, a descrição curta da campanha faz as vezes dela.
  // Os dois vão juntos numa string só com quebra dupla porque `BookSynopsis` é
  // um `<p>` com `whitespace-pre-line`: assim o "Leia mais" recolhe os dois de
  // uma vez, em vez de deixar um segundo bloco solto ao lado da capa.
  const showcaseParagraphs = primaryBook
    ? [primaryBook.synopsis ?? campaign.description, ...restParagraphs]
    : [];
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

              {showcaseParagraphs.length > 0 ? (
                <BookSynopsis
                  text={showcaseParagraphs.join("\n\n")}
                  locale={primaryBook.locale}
                />
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
          /* Sem título principal não há vitrine — e é aqui que `about[1]`
             precisa ser lido: ele ia na seção de texto corrido depois do
             parallax, que não existe mais. Fica abaixo do cabeçalho, na mesma
             medida de leitura, em vez de sumir da página. */
          <div className="max-w-3xl">
            {heading}
            {restParagraphs.map((paragraph) => (
              <p
                key={paragraph}
                className="mt-6 font-serif leading-relaxed text-foreground/70"
              >
                {paragraph}
              </p>
            ))}
          </div>
        )}
      </section>

      <ParallaxSection layers={primaryBook?.parallax ?? []} />

      {primaryBook ? (
        <section className="border-t border-border">
          <div className="mx-auto grid max-w-6xl gap-16 px-4 py-20 sm:px-6 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-2xl text-foreground sm:text-3xl">O Livro</h2>

              {/* Abre a coluna: o que a obra é e de onde ela vem, antes da
                  ponte que apresenta a lista. */}
              {campaign.bookIntro?.map((paragraph) => (
                <p
                  key={paragraph}
                  className="mt-6 font-serif leading-relaxed text-muted-foreground"
                >
                  {paragraph}
                </p>
              ))}

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

              {campaign.recommendedOutro ? (
                <p className="mt-6 font-serif leading-relaxed text-muted-foreground">
                  {campaign.recommendedOutro}
                </p>
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

                {/* Emenda na bio, com o mesmo corpo de texto: a bio termina na
                    dupla voltando à "fantasia pura", e a nota da campanha diz
                    de que tradição literária essa fantasia vem. */}
                {campaign.authorNote ? (
                  <p className="mt-6 font-serif leading-relaxed text-muted-foreground">
                    {campaign.authorNote}
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
            {/* Duas colunas a partir do `lg`: numa coluna só o texto virava um
                bloco alto e apertado com a metade direita da seção vazia,
                destoando da fileira full-width logo abaixo. Espalhado, cada
                coluna fica em ~544px — dentro da medida de leitura do guia,
                e o bloco cai para metade da altura. Abaixo do `lg` volta a ser
                uma coluna só, presa no `max-w-3xl` do texto corrido da página.

                `mb` no parágrafo em vez de `mt`, e `break-inside-avoid`: com
                margem no topo o primeiro parágrafo da segunda coluna desceria
                sozinho, e sem o `break-inside` um parágrafo se partiria no meio
                ao virar de coluna. */}
            {campaign.galleryIntro?.length ? (
              <div className="mt-6 max-w-3xl font-serif leading-relaxed text-foreground/70 lg:max-w-none lg:columns-2 lg:gap-x-16">
                {campaign.galleryIntro.map((paragraph) => (
                  <p key={paragraph} className="mb-6 break-inside-avoid last:mb-0">
                    {paragraph}
                  </p>
                ))}
              </div>
            ) : null}
            {/* Sem `mt` aqui: o trilho do carrossel já reserva o próprio
                respiro vertical para a página subir no hover. */}
            <CampaignPagesGallery images={gallery} />
          </div>
        </section>
      ) : null}
    </>
  );
}
