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
  bannerVideoNight: {
    src: "/videos/faixas/yanayag-noite.mp4",
    alt: "Faixa animada do universo de Yanayag, versão noturna",
  },
  funding: {
    goal: { amount: 4_000_000, currency: "BRL" },
    raised: { amount: 1_150_000, currency: "BRL" },
    backers: 187,
  },
  about: [
    "Entre no Reino dos Bruxos. Atravesse os limites do mundo conhecido: existem histórias que nos levam para outros lugares — e existem histórias que criam mundos inteiros diante dos nossos olhos. YANAYAG, de Enrique Alcatena e Eduardo Mazzitelli, pertence à segunda categoria: prepare-se para atravessar terras desconhecidas, encontrar feiticeiros e criaturas extraordinárias, desvendar maldições, conhecer civilizações estranhas e mergulhar em uma fantasia tão exuberante quanto misteriosa.",
    "Aqui começa uma jornada por um universo onde a magia é uma força poderosa, os bruxos exercem influência sobre reinos inteiros e o fantástico se mistura ao estranho, ao grotesco e ao maravilhoso. No centro dessa aventura está Yanayag, um jovem que percorre um mundo povoado por personagens e seres que parecem ter saído de um sonho — ou de um pesadelo: ordens de feiticeiros, demônios familiares, reis, criaturas fantásticas, povos misteriosos, maldições e histórias ancestrais, em territórios que parecem existir muito além das fronteiras da realidade que conhecemos. Mas Yanayag não é apenas uma aventura de fantasia: é uma viagem pelos \"mundos perdidos\" que sempre fascinaram Alcatena.",
    "Em um mundo dominado por castas de feiticeiros renegados e ordens secretas, uma vingança ritualística altera para sempre o destino de um jovem: ao ser rejeitado por uma princesa, um influente bruxo lança 19 maldições mortais sobre seu filho, o jovem Yanayag. Para sobreviver e romper esse fardo terrível, Yanayag é forçado a cruzar territórios hostis e enfrentar, um a um, os 19 mestres das artes sombrias que sustentam seu suplício.",
    "Enrique Alcatena é um dos grandes nomes da história dos quadrinhos argentinos. Com uma carreira iniciada profissionalmente em 1975, seu trabalho atravessou fronteiras e gêneros, passando por editoras e mercados da Argentina, Itália, França, Reino Unido e Estados Unidos. Seu traço inconfundível deu vida a universos de fantasia, ficção científica e aventura, além de personagens como Batman, Superman, Conan, Predator e Judge Dredd. Alguns trabalhos mais recentes publicados no Brasil: A Fortaleza Móvel & O Mundo Subterrâneo (Pipoca e Nanquim), O Vampiro da Meia-Noite (Skript) e A Torre do Elefante (Pipoca e Nanquim).",
    "Mas é quando Alcatena tem liberdade para criar seus próprios mundos que sua arte alcança uma dimensão particularmente fascinante — e YANAYAG é um dos grandes exemplos disso. Ao lado do roteirista Eduardo Mazzitelli, seu parceiro em algumas das mais importantes obras de fantasia de sua carreira, Alcatena constrói um universo que parece possuir uma história muito mais antiga e profunda do que aquela que encontramos nas páginas. A dupla já havia criado obras marcantes como Acero Líquido, Pesadillas, Shankar e outras narrativas fantásticas. Em Yanayag, eles retornam à chamada \"fantasia pura\", deixando de lado uma abordagem mais documental para mergulhar completamente na imaginação. O resultado é uma obra de fantasia heroica, estranha, misteriosa e profundamente imaginativa.",
    "A inspiração de YANAYAG passa por uma tradição literária muito particular: Alcatena já revelou que a obra foi influenciada pelo universo fantástico de Lord Dunsany, especialmente por sua capacidade de criar terras imaginárias e mundos que parecem existir \"além dos campos que conhecemos\". O artista também reconhece ecos de autores como Clark Ashton Smith e o primeiro H. P. Lovecraft nesse tipo de imaginário — uma influência que ajuda a compreender a atmosfera da obra. YANAYAG não é simplesmente uma fantasia medieval convencional — não espere apenas castelos, cavaleiros e dragões. Aqui, a imaginação pode assumir qualquer forma: há bruxos e confrarias misteriosas, seres de aparência impossível, criaturas grotescas, entidades sobrenaturais, povos estranhos e lugares que parecem ter sido arrancados de algum antigo livro de mitologia que nunca existiu. É uma fantasia que convida o leitor a fazer aquilo que Alcatena faz tão bem: explorar o desconhecido.",
    "Uma das grandes forças de YANAYAG está justamente em sua construção de mundo: Alcatena não se limita a desenhar personagens, ele cria culturas, religiões, arquitetura, criaturas, símbolos e mitologias. Em determinado momento da narrativa, Yanayag chega a uma comunidade cujos habitantes apresentam ao protagonista suas crenças, deuses e tradições por meio de histórias em quadrinhos que funcionam como uma espécie de \"livros sagrados\" dentro daquele próprio universo. É uma ideia fascinante: uma história em quadrinhos dentro de outra história em quadrinhos, usada para apresentar a cosmogonia e as tradições de um povo fictício. O próprio Alcatena comentou que gostaria de desenvolver ainda mais essas \"aventuras cosmogônicas\" que aparecem na obra — é esse tipo de detalhe que faz de YANAYAG uma obra tão especial para quem aprecia quadrinhos de fantasia. Você não está apenas acompanhando uma aventura: está descobrindo um mundo.",
    "A edição original argentina de Yanayag: En el Reino de los Brujos foi publicada em 2016 e possui 288 páginas — uma obra substancial, que oferece ao leitor uma experiência completa e imersiva. Mas, acima de tudo, é uma obra para quem ainda gosta de abrir um quadrinho e sentir aquela velha e maravilhosa sensação de: \"Eu nunca vi nada parecido com isso antes.\"",
    "Há algo especial quando esses dois artistas trabalham juntos: Mazzitelli cria mundos que parecem não ter fim, e Alcatena dá a esses mundos uma aparência que parece impossível. O roteiro abre as portas, o desenho nos faz atravessá-las — e, quando percebemos, já estamos muito longe de casa. YANAYAG é uma celebração da imaginação: uma obra que resgata o prazer de explorar territórios desconhecidos, de conhecer criaturas impossíveis e de acreditar que, em algum lugar além dos mapas, ainda existem reinos que ninguém jamais visitou.",
    "Se você é fã de Enrique Alcatena, esta é uma oportunidade de conhecer uma de suas obras mais fascinantes no campo da fantasia autoral. Se você gosta de Eduardo Mazzitelli, encontrará aqui mais uma demonstração da capacidade do roteirista de construir universos com identidade própria. E se você simplesmente ama quadrinhos de fantasia, prepare-se para uma jornada por um mundo onde a imaginação não conhece fronteiras. YANAYAG está esperando por você: abra o livro, atravesse o portal, entre no Reino dos Bruxos — e descubra o que existe além dos campos que conhecemos.",
  ],
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
} as const;

export const CAMPAIGN: Campaign = campaignSchema
  .refine(
    (campaign) =>
      campaign.relatedBookSlugs.every((slug) => BOOKS_BY_SLUG.has(slug)),
    { message: "Campanha aponta para um livro que não existe em books.ts" },
  )
  .parse(RAW_CAMPAIGN);
