import { BOOKS_BY_SLUG } from "./books";
import { campaignSchema, type Campaign } from "./schemas";

/**
 * A campanha do site.
 *
 * Hocus Pocus roda uma campanha por vez — sem listagem, sem histórico
 * navegável — então este módulo guarda um registro único em vez de um array.
 * Trocar de campanha é editar os campos abaixo; não há slug de rota
 * envolvido, `/campanhas` sempre mostra este registro.
 *
 * ATENÇÃO: `startsAt`/`endsAt`/`status` e os números de `funding` abaixo são
 * fictícios — placeholder de layout enquanto a editora não confirma as datas
 * e os valores reais da campanha de financiamento coletivo do Yanayag no
 * Catarse. Substituir antes de publicar de verdade.
 */
const RAW_CAMPAIGN = {
  slug: "lancamento-yanayag",
  title: "Lançamento: Yanayag",
  kicker: "Yanayag",
  description:
    "Um jovem amaldiçoado por um bruxo poderoso precisa enfrentar, um a um, os 19 mestres das artes sombrias que sustentam seu suplício.",
  kind: "lancamento",
  startsAt: "2026-09-01",
  endsAt: "2026-10-31",
  status: "ativa",
  tone: "forest",
  ctaLabel: "Reservar exemplar",
  ctaHref: "/catalogo/yanayag",
  relatedBookSlugs: ["yanayag"],
  bannerVideo: {
    src: "/videos/faixas/yanayag.mp4",
    alt: "Faixa animada do universo de Yanayag",
  },
  funding: {
    goal: { amount: 4_000_000, currency: "BRL" },
    raised: { amount: 1_150_000, currency: "BRL" },
    backers: 187,
  },
  /**
   * Abertura do projeto, um parágrafo por item, na ordem em que a página é
   * lida:
   *
   *   [0] abre a página logo abaixo do CTA (`campaign-progress`) — o convite
   *       que justifica a reserva;
   *   [1] acompanha a capa na vitrine, logo depois da sinopse do título
   *       principal, completando o que a premissa não diz.
   *
   * Só esses dois (2026-09): o resto do texto da editora foi para o bloco a
   * que pertence, na ordem do documento "YANAYAG — CATARSE", em vez de
   * escorrer numa seção de texto corrido depois do parallax. A linhagem
   * literária fecha "Sobre o Autor" (`authorNote`), o que a obra é e a edição
   * argentina abrem "O Livro" (`bookIntro`), e a construção de mundo abre a
   * galeria (`galleryIntro`).
   *
   * Nada aqui repete o que a própria página já mostra em bloco próprio: a
   * premissa sai da sinopse do título principal (`books.ts`) e a bio de
   * Alcatena e Mazzitelli sai de "Sobre o Autor" (`author.bio`). Ao trazer
   * texto novo da editora, cortar antes o que duplicar alguma dessas fontes.
   */
  about: [
    "Entre no Reino dos Bruxos. Atravesse os limites do mundo conhecido: existem histórias que nos levam para outros lugares — e existem histórias que criam mundos inteiros diante dos nossos olhos. YANAYAG, de Enrique Alcatena e Eduardo Mazzitelli, pertence à segunda categoria: prepare-se para atravessar terras desconhecidas, encontrar feiticeiros e criaturas extraordinárias, desvendar maldições, conhecer civilizações estranhas e mergulhar em uma fantasia tão exuberante quanto misteriosa.",
    "Em volta dessa jornada há um universo onde a magia é uma força poderosa, os bruxos exercem influência sobre reinos inteiros e o fantástico se mistura ao estranho, ao grotesco e ao maravilhoso: demônios familiares, reis, criaturas impossíveis, povos misteriosos e histórias ancestrais — seres que parecem ter saído de um sonho, ou de um pesadelo, em territórios muito além das fronteiras da realidade que conhecemos. Mas Yanayag não é apenas uma aventura de fantasia — é uma viagem pelos \"mundos perdidos\" que sempre fascinaram Alcatena.",
  ],
  // Abre "O Livro", antes da lista: o que a obra é e de onde ela vem. O
  // segundo parágrafo nomeia a edição argentina de propósito — as 288 páginas
  // são as dela, não as da "Ficha Técnica Estimada" da edição brasileira, que
  // aparece na coluna ao lado com outro número.
  bookIntro: [
    "YANAYAG não é simplesmente uma fantasia medieval convencional — não espere apenas castelos, cavaleiros e dragões. Aqui, a imaginação pode assumir qualquer forma: há bruxos e confrarias misteriosas, seres de aparência impossível, criaturas grotescas, entidades sobrenaturais, povos estranhos e lugares que parecem ter sido arrancados de algum antigo livro de mitologia que nunca existiu. É uma fantasia que convida o leitor a fazer aquilo que Alcatena faz tão bem: explorar o desconhecido.",
    "A edição original argentina, Yanayag: En el Reino de los Brujos, foi publicada em 2016 e possui 288 páginas — uma obra substancial, que oferece ao leitor uma experiência completa e imersiva.",
  ],
  // Só a ponte para a lista: o parágrafo que ficava aqui ("uma fantasia
  // heroica construída do zero...") era um resumo do que `bookIntro[0]` agora
  // diz logo acima, com as palavras da editora.
  recommendedIntro: "Yanayag é leitura indicada para quem gosta de:",
  // ATENÇÃO: como as datas e os números acima, o texto da tiragem limitada é
  // placeholder — a editora ainda não confirmou o tamanho da tiragem nem o
  // preço da Edição Noite (ver a nota de preço em `yanayag-noite` no
  // `books.ts`). Por isso a seção sai sem preço e sem número de exemplares.
  specialEdition: {
    bookSlug: "yanayag-noite",
    kicker: "Edição Noite",
    headline: "Adquira a versão limitada",
    description:
      "A mesma jornada pelo Reino dos Bruxos, sob outra lua: nesta variante de capa em tiragem limitada, a lua dourada dá lugar a uma lua vermelha e o bruxo sentado no cubo de símbolos aparece recortado contra um céu noturno. São poucos exemplares — quando esta tiragem acabar, resta a capa da edição padrão.",
    ctaLabel: "Reservar Edição Noite",
  },
  recommendedFor: [
    "Fantasia heroica",
    "Espada e feitiçaria",
    "Mundos imaginários",
    "Mitologia e magia",
    "Criaturas fantásticas",
    "Horror e fantasia sombria",
    "Literatura fantástica",
    "Quadrinhos autorais",
    "A arte inconfundível de Enrique Alcatena",
  ],
  // Fecha o bloco "O Livro", depois da lista: o argumento emocional da compra.
  recommendedOutro:
    "Acima de tudo, é uma obra para quem ainda gosta de abrir um quadrinho e sentir aquela velha e maravilhosa sensação de: \"Eu nunca vi nada parecido com isso antes.\"",
  // Fecha "Sobre o Autor", logo depois da bio da dupla: no documento da
  // editora a linhagem literária vem exatamente aí, emendada na apresentação
  // de Alcatena e Mazzitelli — é o repertório do artista que explica a
  // atmosfera da obra, não um assunto novo.
  authorNote:
    "A inspiração de YANAYAG passa por uma tradição literária muito particular: Alcatena já revelou que a obra foi influenciada pelo universo fantástico de Lord Dunsany, especialmente por sua capacidade de criar terras imaginárias e mundos que parecem existir \"além dos campos que conhecemos\". O artista também reconhece ecos de autores como Clark Ashton Smith e o primeiro H. P. Lovecraft nesse tipo de imaginário — uma influência que ajuda a compreender a atmosfera da obra.",
  // Dois parágrafos, não um bloco só: a seção empilha cada um como parágrafo
  // próprio na coluna de leitura, e a quebra aqui é o que decide onde um
  // termina e o outro começa. O assunto é o que a fileira logo abaixo mostra —
  // a construção de mundo página a página —, não a linhagem literária da obra,
  // que já foi lida em "Sobre o Autor" (`authorNote`).
  galleryIntro: [
    "Uma das grandes forças de YANAYAG está justamente em sua construção de mundo: Alcatena não se limita a desenhar personagens — ele cria culturas, religiões, arquitetura, criaturas, símbolos e mitologias. É uma obra em que cada página esconde um novo mundo.",
    "Em determinado momento da narrativa, Yanayag chega a uma comunidade cujos habitantes apresentam suas crenças, deuses e tradições por meio de histórias em quadrinhos que funcionam como uma espécie de \"livros sagrados\" dentro daquele próprio universo: uma história em quadrinhos dentro de outra, usada para apresentar a cosmogonia de um povo fictício. É esse tipo de detalhe que faz de YANAYAG uma obra tão especial — você não está apenas acompanhando uma aventura, está descobrindo um mundo.",
  ],
} as const;

export const CAMPAIGN: Campaign = campaignSchema
  .refine(
    (campaign) =>
      campaign.relatedBookSlugs.every((slug) => BOOKS_BY_SLUG.has(slug)),
    { message: "Campanha aponta para um livro que não existe em books.ts" },
  )
  .refine(
    (campaign) =>
      !campaign.specialEdition ||
      BOOKS_BY_SLUG.has(campaign.specialEdition.bookSlug),
    {
      message:
        "Edição especial da campanha aponta para um livro que não existe em books.ts",
    },
  )
  .parse(RAW_CAMPAIGN);
