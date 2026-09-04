import { bookSchema, type Book } from "./schemas";
import { UNIVERSE_SLUGS } from "./universes";

const GUSTAVO = {
  name: "Gustavo Ravaglio",
  bio: "Gustavo Ravaglio é um premiado autor de quadrinhos, vencedor dos prêmios Troféu HQ Mix e Prêmio Jabuti, reconhecido pela criação de universos e personagens originais, além de projetos gráficos sofisticados que elevam a experiência do livro a outro patamar. Ravaglio é designer, escritor, ilustrador, quadrinista, antropólogo — mestre pela UFPR — e analista técnico do mercado financeiro. Atualmente, dirige seu próprio estúdio de design, atuando nas áreas de entretenimento e educação com soluções estratégicas e criativas para esses setores. Também leciona na Pontifícia Universidade Católica do Paraná, nos cursos de graduação e pós-graduação lato sensu em Design.",
};

const MAZZITIELLI_E_ALCATENA = {
  name: "Mazzitielli e Alcatena",
  // PLACEHOLDER — substituir pela bio real assim que a editora enviar.
  bio: "Mazzitielli e Alcatena formam uma dupla de autores dedicada a histórias que cruzam natureza e fantasia, com um traço que valoriza texturas orgânicas e composições densas de página. Yanayag é o primeiro trabalho da dupla publicado pela Hocus Pocus.",
};

/**
 * Arte do universo O Planta: ilustração do bloco "Sobre o Universo" e
 * composição decorativa "família" (fundo + capas).
 *
 * O material é do universo, não de um título — por isso vive aqui, compartilhado
 * por toda página de livro de O Planta, em vez de repetido livro a livro. Só as
 * páginas com a arte já recebida da editora referenciam essas constantes; as
 * demais continuam caindo no bloco genérico e no grid de `RelatedBooks`.
 */
const PLANTA_UNIVERSE_SHOWCASE = {
  title: "Sobre o Universo do Planta",
  image: {
    src: "/images/universo/o-planta.png",
    alt: "Ilustração do universo de Planta, com objetos do dia a dia de Planta espalhados sobre uma folha",
  },
};

const PLANTA_UNIVERSE_FAMILY = {
  backgroundSrc: "/images/universo/familia/o-planta/fundo.svg",
  covers: [
    {
      bookSlug: "um-bipede-entre-plantas",
      caption: "O Planta — Um Bípede Entre Plantas",
      image: {
        src: "/images/universo/familia/o-planta/um-bipede-entre-plantas.png",
        alt: "Capa de O Planta — Um Bípede Entre Plantas",
        width: 307,
        height: 418,
      },
      position: { top: 5.4, left: 48.2, width: 16.0 },
    },
    {
      bookSlug: "necroplanta",
      caption: "Necroplanta",
      image: {
        src: "/images/universo/familia/o-planta/necroplanta.png",
        alt: "Capa de Necroplanta",
        width: 297,
        height: 402,
      },
      position: { top: 54.9, left: 29.6, width: 15.5 },
    },
    {
      bookSlug: "os-contos-do-planta-1",
      caption: "Os Contos do Planta — Vol. 1",
      image: {
        src: "/images/universo/familia/o-planta/os-contos-do-planta-1.png",
        alt: "Capa de Os Contos do Planta — Vol. 1",
        width: 302,
        height: 402,
      },
      position: { top: 55.2, left: 64.7, width: 15.7 },
    },
    {
      bookSlug: "os-contos-do-planta-2",
      caption: "Os Contos do Planta — Vol. 2",
      image: {
        src: "/images/universo/familia/o-planta/os-contos-do-planta-2.png",
        alt: "Capa de Os Contos do Planta — Vol. 2",
        width: 296,
        height: 402,
      },
      position: { top: 55.2, left: 80.2, width: 15.4 },
    },
  ],
};

/**
 * Catálogo real da Hocus Pocus (fonte: PDF da editora).
 *
 * Preço, autor, título e (na maioria) o vídeo de capa já vieram; sinopse,
 * ficha técnica (ISBN, dimensões etc.) e link de compra ainda não — ver
 * campos opcionais em ./schemas.ts. Completar assim que a editora enviar.
 *
 * PLACEHOLDER: em todo título além de `um-bipede-entre-plantas`,
 * `mr-plant-a-biped-among-plants`, `os-contos-do-planta-1`,
 * `os-contos-do-planta-2`, `robo-de-madeira-atlas-cianus`,
 * `robo-de-madeira-atlas-cianus-art-edition`,
 * `os-contos-do-planta-caixa-de-reliquias` e `necroplanta`
 * (esses oito já com a ficha real da editora), os
 * campos `synopsis`, `excerpt`, `specs` e `upsell` abaixo são texto de
 * preenchimento (ISBN incluso) só para exercitar o template da página de
 * livro com todas as seções visíveis — substituir pelo conteúdo real assim
 * que a editora enviar a ficha de cada título. `parallax`, `videoBannerSrc`,
 * `universeShowcase` e `universeFamily` ficam de fora por dependerem de arte
 * que ainda não existe para esses livros.
 */
const RAW_BOOKS = [
  {
    // Edição em inglês de `um-bipede-entre-plantas` (ficha em
    // "Graphic Novel - Plant_EN version.DOCX"): mesma sinopse e mesma arte de
    // universo/parallax da edição canônica em português — só ficha técnica e
    // vídeo de capa mudam, refletindo a impressão em inglês. O texto da
    // página em si continua em português, como no resto do site — só o
    // idioma real do livro impresso (título, `specs.language` etc.) reflete
    // a edição em inglês. À venda, por isso ocupa o lugar de destaque no
    // catálogo que era da edição em português (agora esgotada — ver bloco no
    // fim do array).
    slug: "mr-plant-a-biped-among-plants",
    title: "Mr. Plant — A Biped Among Plants",
    subtitle: "Graphic Novel — Vol. 1",
    universeSlug: "necroplanta",
    author: GUSTAVO,
    synopsis:
      "Nesta edição canônica, acompanhamos Planta desde seu nascimento até o início de sua maior aventura. Durante um experimento, Planta acaba sendo lançado para fora de sua própria realidade e cai em uma espécie de \"fresta\" entre mundos, um \"não lugar\" formado por corredores infinitesimais que conectam diferentes dimensões. É nesse labirinto impossível que vive o solitário Arruard, uma raposa violinista que carrega consigo uma misteriosa caixa de chaves mágicas, cada uma capaz de abrir passagem para diferentes dimensões. Uma ameaça silenciosa, muito maior e mais antiga do que eles poderiam imaginar, começa a cercá-los enquanto Planta e Arruard atravessam dimensões desconhecidas em uma longa jornada de volta para casa, enfrentando mundos cada vez mais estranhos, perigosos e imprevisíveis.",
    excerpt:
      "Aqui, o leitor encontra a edição canônica do personagem Planta, dando início à coleção Graphic Novel, responsável por desenvolver a grande saga principal deste universo. Este é o primeiro volume de uma série mais ampla.\n\nLivro finalista em duas categorias do Prêmio Jabuti, a mais importante premiação literária do Brasil.\n\nNesta edição, a capa foi produzida com papel italiano e ornamentada com ilustrações metálicas em cobre, aplicadas em hot stamp e estendidas também para a contra capa, criando um acabamento marcado por detalhes, brilho e textura.\n\nEsta edição foi publicada em Nova York e é inteiramente em inglês. A tradução é assinada por Adriano Scandolara, profissional que já trabalhou com grandes editoras do mercado. O texto foi supervisionado diretamente pelo autor para preservar o tom, o ritmo e a personalidade da escrita original. Os quadrinhos também oferecem uma das formas mais envolventes e naturais de praticar e manter contato com outro idioma.\n\nO livro também conta com acabamentos especiais além da capa, incluindo aplicações de tinta dourada nas páginas internas e trechos impressos em papel vegetal, ampliando as possibilidades visuais e materiais da leitura.",
    awardBadge: {
      src: "/images/livros/um-bipede-entre-plantas/selo-jabuti.png",
      alt: "Selo de Livro Finalista do Prêmio Jabuti",
    },
    coverAlt:
      "Capa do livro Mr. Plant — A Biped Among Plants, edição em inglês, de Gustavo Ravaglio",
    coverTone: "garnet",
    coverVideoSrc: "/videos/livros/mr-plant-a-biped-among-plants.mp4",
    // Sem faixa própria enviada para a edição em inglês — reaproveita a faixa
    // já existente da edição em português (cena genérica, sem texto).
    videoBannerSrc: "/videos/faixas/um-bipede-entre-plantas.mp4",
    // Mesma arte de parallax da edição em português — ver nota de gramática de
    // shift/origin no bloco `um-bipede-entre-plantas`, no fim deste array.
    parallax: [
      {
        src: "/images/parallax/um-bipede-entre-plantas/1-fundo.png",
        shift: 16,
        zoom: 0.1,
      },
      {
        src: "/images/parallax/um-bipede-entre-plantas/2-arbusto-fundo.png",
        shift: 28,
        shiftX: -8,
        zoom: 0.06,
        origin: "bottom",
      },
      {
        src: "/images/parallax/um-bipede-entre-plantas/3-arbusto-frente.png",
        shift: 62,
        shiftX: 10,
        zoom: 0.14,
        origin: "bottom",
      },
      {
        src: "/images/parallax/um-bipede-entre-plantas/4-copa-fundo.png",
        shift: -40,
        shiftX: 8,
        zoom: 0.08,
        origin: "top",
      },
      {
        src: "/images/parallax/um-bipede-entre-plantas/5-copa-frente.png",
        shift: -78,
        shiftX: -10,
        zoom: 0.2,
        origin: "top",
      },
    ],
    specs: {
      pages: 178,
      isbn: "978-8591748440",
      format: "Capa dura",
      dimensions: "28,7 cm • 20,4 cm • 1,9 cm",
      weight: "980 g",
      language: "Inglês",
      edition: "1a. edição",
      publishedAt: "2019-11-01",
    },
    price: { amount: 16999, currency: "BRL" },
    wixProductId: "d8562fa9-53ef-44ac-97ec-6babc709fc4d",
    status: "disponivel",
    upsell: {
      title: "Mr. Plant — A Biped Among Plants + Assinatura + Sketch",
      description:
        "Você pode receber seu exemplar de Mr. Plant — A Biped Among Plants autografado pelo autor e acompanhado de um sketch personalizado, produzido em folha separada especialmente para ser emoldurada e incorporada à sua coleção.\n\nUma oportunidade de possuir não apenas o livro, mas também uma obra original ligada ao universo da obra. Garanta seu livro assinado e seu sketch aqui.",
      price: { amount: 4999, currency: "BRL" },
    },
    universeShowcase: PLANTA_UNIVERSE_SHOWCASE,
    // Reaproveita a composição do universo, mas substitui a capa que
    // corresponderia a esta própria página: a versão compartilhada aponta
    // para `um-bipede-entre-plantas` (esgotada) — aqui ela precisa apontar
    // para si mesma (self-link, ver nota em `universeFamily` em schemas.ts).
    universeFamily: {
      ...PLANTA_UNIVERSE_FAMILY,
      covers: PLANTA_UNIVERSE_FAMILY.covers.map((cover) =>
        cover.bookSlug === "um-bipede-entre-plantas"
          ? {
              ...cover,
              bookSlug: "mr-plant-a-biped-among-plants",
              caption: "Mr. Plant — A Biped Among Plants",
            }
          : cover,
      ),
    },
  },
  {
    slug: "os-contos-do-planta-1",
    title: "Os Contos do Planta — Vol. 1",
    universeSlug: "necroplanta",
    author: GUSTAVO,
    synopsis:
      "Mørkskov é a lendária e proibida Floresta Escura, um território onde mitologia, lendas e forças profanas se confundem entre as sombras. Temida pelos seres da floresta, sua existência atravessa gerações como um lugar do qual ninguém deveria se aproximar.\n\nQuando Biche-Biche, o cão impulsivo e inconsequente, entra na floresta atrás de sua bolinha e desaparece sem deixar rastros, Planta decide ignorar todos os avisos para resgatar o amigo.\n\nEm uma narrativa visualmente marcante, Gustavo Ravaglio conduz o leitor por um cenário carregado de simbolismo, mistério e fantasia, onde cada caminho esconde algo inquietante e nada é exatamente o que parece.",
    excerpt:
      "Esta edição marca o início da coleção Contos do Planta, apresentando a primeira aparição e a aventura inaugural do personagem Planta.\n\nLançada originalmente em 2015, a obra destacou-se por trazer uma capa integralmente produzida com efeitos holográficos. Além da capa, a quarta capa também recebeu aplicações especiais, com detalhes animados e tridimensionais que revelam novas formas e elementos conforme o livro é movimentado nas mãos do leitor.\n\nO projeto chamou a atenção do lendário desenhista de V de Vingança, David Lloyd, parceiro de Alan Moore, que fez grandes elogios à obra. Confira no vídeo.\n\nA história foi inteiramente desenhada a lápis e colorizada com estilo de lápis de cor, produzindo uma arte agradável e orgânica para todas as idades.\n\nNesta segunda edição revisada, o leitor encontrará uma excelente porta de entrada para o universo de Planta.",
    coverAlt: "Capa do livro Os Contos do Planta, Volume 1, de Gustavo Ravaglio",
    coverTone: "garnet",
    coverVideoSrc: "/videos/livros/os-contos-do-planta-1.mp4",
    videoBannerSrc: "/videos/faixas/os-contos-do-planta-1.mp4",
    // Mesma gramática do parallax de `um-bipede-entre-plantas` (ver nota lá):
    // a folhagem da base desce e sai por baixo, o Planta sobe e sai pelo topo,
    // cada camada mais à frente com deslocamento e zoom maiores. O sinal do
    // `shift` é preso à borda do `origin` — invertê-lo descola o recorte e
    // expõe o corte reto da arte.
    parallax: [
      {
        src: "/images/parallax/os-contos-do-planta-1/1-fundo.png",
        shift: 16,
        zoom: 0.1,
      },
      {
        src: "/images/parallax/os-contos-do-planta-1/2-galhos.png",
        shift: 34,
        shiftX: -8,
        zoom: 0.08,
        origin: "bottom",
      },
      {
        src: "/images/parallax/os-contos-do-planta-1/3-folhagem-frente.png",
        shift: 70,
        shiftX: 10,
        zoom: 0.16,
        origin: "bottom",
      },
      {
        src: "/images/parallax/os-contos-do-planta-1/4-planta.png",
        shift: -44,
        shiftX: -6,
        zoom: 0.12,
        origin: "top",
      },
    ],
    specs: {
      pages: 40,
      isbn: "978-6500858730",
      format: "Capa Holográfica Plástica",
      dimensions: "27,5 cm • 20,5 cm • 0,4 cm",
      weight: "200 g",
      language: "Português (Brasil)",
      edition: "Tiragem Única – 2a. edição",
      publishedAt: "2023-11-01",
    },
    price: { amount: 11999, currency: "BRL" },
    wixProductId: "e80b58a4-d293-4446-9f8b-e87dc200c04e",
    status: "disponivel",
    featured: true,
    featuredCardImage: {
      src: "/images/livros/home/os-contos-do-planta-1.png",
      alt: "Capa do livro Os Contos do Planta, Volume 1, de Gustavo Ravaglio",
    },
    universeShowcase: PLANTA_UNIVERSE_SHOWCASE,
    universeFamily: PLANTA_UNIVERSE_FAMILY,
  },
  {
    slug: "os-contos-do-planta-2",
    title: "Os Contos do Planta — Vol. 2",
    universeSlug: "necroplanta",
    author: GUSTAVO,
    synopsis:
      "Os projetos do Dr. Mantis para a construção do corpo do Planta foram roubados.\n\nPlanta, Fausto, o cachorro mago, Dr. Mantis, cientista criador do protagonista, e os demais integrantes do grupo se envolvem em uma investigação que revelará o passado sombrio do cientista. A trama revisita momentos dolorosos de sua trajetória e traz à tona segredos que ele preferiria esquecer.\n\nEm uma narrativa envolvente, todos correm contra o tempo para solucionar o mistério enquanto são perseguidos pelo enigmático vilão Necroplanta.",
    excerpt:
      "Na segunda edição da coleção Contos do Planta, o universo da série se expande ainda mais, aprofundando as relações entre os personagens, apresentando novos mistérios e revelando detalhes inéditos deste universo narrativo. A edição também marca a primeira aparição do icônico vilão Necroplanta.\n\nCom mais do que o dobro de páginas de Contos do Planta 1, esta edição também amplia a proposta gráfica da coleção. A nova capa tridimensional passou por um extenso processo de design e desenvolvimento técnico, permitindo evoluir ainda mais a tecnologia utilizada nas aplicações holográficas. O resultado é uma capa e contra capa repletas de cenas animadas, profundidade visual e efeitos tridimensionais que transformam o livro em uma experiência interativa.\n\nA história foi inteiramente desenhada a lápis e colorizada com uma estética inspirada em lápis de cor, criando uma arte orgânica, expressiva e agradável para leitores de diferentes idades.\n\nA estrutura da edição também foi pensada para proporcionar maior conforto durante a leitura: é possível remover as páginas internas da capa para facilitar o manuseio e reacoplá-las posteriormente.",
    coverAlt: "Capa do livro Os Contos do Planta, Volume 2, de Gustavo Ravaglio",
    coverTone: "garnet",
    coverVideoSrc: "/videos/livros/os-contos-do-planta-2.mp4",
    videoBannerSrc: "/videos/faixas/os-contos-do-planta-2.mp4",
    // Noite de tempestade: o fundo da cena sobe de leve, a colina da igreja e a
    // vegetação da base descem e saem por baixo, os galhos sobem e saem pelo
    // topo. Mesma gramática dos outros dois livros (ver nota em
    // `um-bipede-entre-plantas`): o sinal do `shift` é preso à borda do
    // `origin`. A chuva cobre a moldura inteira e é a única sem deslocamento —
    // qualquer `shift` a descolaria de uma das bordas, deixando uma faixa seca;
    // só o `zoom`, que sempre amplia, aproxima a cortina de água.
    parallax: [
      {
        src: "/images/parallax/os-contos-do-planta-2/1-fundo.png",
        shift: 16,
        zoom: 0.1,
      },
      {
        src: "/images/parallax/os-contos-do-planta-2/2-colina-igreja.png",
        shift: 26,
        shiftX: -6,
        zoom: 0.06,
        origin: "bottom",
      },
      {
        src: "/images/parallax/os-contos-do-planta-2/3-galhos.png",
        shift: -52,
        shiftX: 8,
        zoom: 0.1,
        origin: "top",
      },
      {
        src: "/images/parallax/os-contos-do-planta-2/4-arbustos.png",
        shift: 48,
        shiftX: -10,
        zoom: 0.12,
        origin: "bottom",
      },
      {
        src: "/images/parallax/os-contos-do-planta-2/5-rochas.png",
        shift: 76,
        shiftX: 10,
        zoom: 0.18,
        origin: "bottom",
      },
      {
        src: "/images/parallax/os-contos-do-planta-2/6-chuva.png",
        shift: 0,
        zoom: 0.12,
      },
    ],
    specs: {
      pages: 88,
      isbn: "978-6500762990",
      format: "Capa Holográfica Plástica",
      dimensions: "27,5 cm • 20,5 cm • 0,7 cm",
      weight: "294 g",
      language: "Português (Brasil)",
      edition: "1a. edição",
      publishedAt: "2023-08-01",
    },
    price: { amount: 14999, currency: "BRL" },
    wixProductId: "8c934c49-de32-404a-abb2-63b2a3085b0e",
    status: "disponivel",
    featured: true,
    featuredCardImage: {
      src: "/images/livros/home/os-contos-do-planta-2.png",
      alt: "Capa do livro Os Contos do Planta, Volume 2, de Gustavo Ravaglio",
    },
    upsell: {
      title: "Os Contos do Planta — Vol. 2 + Assinatura + Sketch",
      description:
        "Você pode receber seu exemplar de Os Contos do Planta 2 autografado pelo autor e acompanhado de um sketch personalizado, produzido em folha separada especialmente para ser emoldurada e incorporada à sua coleção.\n\nUma oportunidade de possuir não apenas o livro, mas também uma obra original ligada ao universo da obra. Garanta seu livro assinado e seu sketch aqui.",
      price: { amount: 4999, currency: "BRL" },
    },
    universeShowcase: PLANTA_UNIVERSE_SHOWCASE,
    universeFamily: PLANTA_UNIVERSE_FAMILY,
  },
  {
    slug: "robo-de-madeira-atlas-cianus",
    title: "Robô de Madeira",
    subtitle: "Atlas Cianus",
    universeSlug: "robo-de-madeira",
    author: GUSTAVO,
    synopsis:
      "O mundo destes personagens é dividido em duas grandes metades. De um lado está a Faccia Incógnita, território oculto habitado por criaturas míticas e forças desconhecidas. Do outro, o Atlas Cianus, o lado azul onde vivem os humanos. Separados por uma fronteira cercada de lendas e medo, poucos ousam atravessar para o lado obscuro, e ninguém jamais retornou de lá.\n\nA duologia Robô de Madeira acompanha uma expedição rumo ao lado oculto, liderada por um capitão consumido pela vingança e por um misterioso autômato. Juntos, eles partem para matar Leviatã, a mais nefasta das bestas bíblicas.\n\nO autômato foi construído por Sacaglione, antigo amigo do capitão, morto pelo Leviatã. Agora, a máquina permanece como a última lembrança \"viva\" daquele que perdeu a vida para o demônio oceânico.\n\nEm uma narrativa repleta de simbolismo, mistério e múltiplas camadas, acompanhe a tripulação do navio Lagosta Negra em uma jornada rumo ao impossível.",
    excerpt:
      "Neste primeiro volume, você será apresentado a uma sombria jornada de navegação rumo aos territórios proibidos da Faccia Incógnita, onde uma tripulação marcada pela perda e pela obsessão atravessa mares desconhecidos em busca da lendária criatura Leviatã.\n\nO livro em capa dura foi desenvolvido para remeter visualmente a um antigo artefato náutico. A capa combina relevos, hot stamp e aplicações de verniz que simulam madeira entalhada, enquanto a lombada em tecido, no formato meia casaca, recebe acabamento serigráfico. O projeto gráfico busca transformar o objeto físico do livro em uma extensão da atmosfera da narrativa.\n\nA edição também utiliza mais de três tipos de papel nas páginas, além de aplicações de tinta dourada.",
    coverAlt: "Capa do livro Robô de Madeira — Atlas Cianus, de Gustavo Ravaglio",
    coverTone: "navy",
    coverVideoSrc: "/videos/livros/robo-de-madeira-atlas-cianus.mp4",
    videoBannerSrc: "/videos/faixas/robo-de-madeira-atlas-cianus.mp4",
    // Fundo do mar da Faccia Incógnita: rolando a página, o leitor desce até o
    // leito — os corais e as pedras do primeiro plano descem e saem pela base,
    // enquanto a estrela-do-mar sobe pela coluna d'água. Mesma gramática dos
    // livros de O Planta (ver nota em `um-bipede-entre-plantas`): o sinal do
    // `shift` é preso à borda do `origin`, e camada mais à frente leva
    // deslocamento e zoom maiores. A estrela e a lagosta são recortes soltos
    // no meio da cena, sem borda a que se prender — ficam em `center`.
    parallax: [
      {
        src: "/images/parallax/robo-de-madeira-atlas-cianus/1-fundo.png",
        shift: 16,
        zoom: 0.1,
      },
      {
        src: "/images/parallax/robo-de-madeira-atlas-cianus/2-corais.png",
        shift: 30,
        shiftX: -8,
        zoom: 0.06,
        origin: "bottom",
      },
      {
        src: "/images/parallax/robo-de-madeira-atlas-cianus/3-estrela.png",
        shift: -34,
        shiftX: 10,
        zoom: 0.08,
      },
      {
        src: "/images/parallax/robo-de-madeira-atlas-cianus/4-lagosta.png",
        shift: 54,
        shiftX: -6,
        zoom: 0.14,
      },
      {
        src: "/images/parallax/robo-de-madeira-atlas-cianus/5-pedras.png",
        shift: 76,
        shiftX: 10,
        zoom: 0.18,
        origin: "bottom",
      },
    ],
    specs: {
      pages: 188,
      isbn: "978-6500212501",
      format: "Capa dura — lombada de tecido",
      dimensions: "26,7 cm • 18,7 cm • 2,5 cm",
      weight: "1010 g",
      language: "Português (Brasil)",
      edition: "1a. edição",
      publishedAt: "2022-06-01",
    },
    price: { amount: 18999, currency: "BRL" },
    wixProductId: "0d1a13af-c4c7-4865-ad37-65ad9e0b995f",
    status: "disponivel",
    featured: true,
    featuredCardImage: {
      src: "/images/livros/home/robo-de-madeira-atlas-cianus.png",
      alt: "Capa do livro Robô de Madeira — Atlas Cianus, de Gustavo Ravaglio",
    },
  },
  {
    slug: "robo-de-madeira-atlas-cianus-art-edition",
    title: "Robô de Madeira — Art Edition",
    subtitle: "Atlas Cianus",
    universeSlug: "robo-de-madeira",
    author: GUSTAVO,
    synopsis:
      "O mundo destes personagens é dividido em duas grandes metades. De um lado está a Faccia Incógnita, território oculto habitado por criaturas míticas e forças desconhecidas. Do outro, o Atlas Cianus, o lado azul onde vivem os humanos. Separados por uma fronteira cercada de lendas e medo, poucos ousam atravessar para o lado obscuro, e ninguém jamais retornou de lá.\n\nA duologia Robô de Madeira acompanha uma expedição rumo ao lado oculto, liderada por um capitão consumido pela vingança e por um misterioso autômato. Juntos, eles partem para matar Leviatã, a mais nefasta das bestas bíblicas.\n\nO autômato foi construído por Sacaglione, antigo amigo do capitão, morto pelo Leviatã. Agora, a máquina permanece como a última lembrança \"viva\" daquele que perdeu a vida para o demônio oceânico.\n\nEm uma narrativa repleta de simbolismo, mistério e múltiplas camadas, acompanhe a tripulação do navio Lagosta Negra em uma jornada rumo ao impossível.",
    excerpt:
      "Esta edição faz parte de uma tiragem limitada e numerada. O livro é \"enquadrado\" em uma caixa com acabamentos metalizados e ornamentações inspiradas na estética náutica, enquanto uma luva de acetato envolve o exemplar numa espécie de \"relicário\".\n\nA edição acompanha ainda um card dourado, certificado numerado e uma experiência em realidade aumentada que faz surgir, em 3D, o navio Lagosta Negra, sobre a capa do livro. Ao utilizar o aplicativo no celular Android, o leitor poderá visualizar a embarcação emergindo diretamente sobre a edição física.\n\nNeste primeiro volume, você será apresentado a uma sombria jornada de navegação rumo aos territórios proibidos da Faccia Incógnita, onde uma tripulação marcada pela perda e pela obsessão atravessa mares desconhecidos em busca da lendária criatura Leviatã. O livro em capa dura foi desenvolvido para remeter visualmente a um antigo artefato náutico. A capa combina relevos, hot stamp e aplicações de verniz que simulam madeira entalhada, enquanto a lombada em tecido, no formato meia casaca, recebe acabamento serigráfico. O projeto gráfico busca transformar o objeto físico do livro em uma extensão da atmosfera da narrativa.\n\nA edição também utiliza mais de três tipos de papel nas páginas, além de aplicações de tinta dourada.",
    coverAlt:
      "Capa do livro Robô de Madeira — Atlas Cianus, Art Edition, de Gustavo Ravaglio",
    coverTone: "navy",
    coverVideoSrc: "/videos/livros/robo-de-madeira-atlas-cianus-art-edition.mp4",
    // Vídeo mostra o estojo por inteiro, bem mais largo que o de um livro solto.
    coverVideoScale: 0.8,
    videoBannerSrc: "/videos/faixas/robo-de-madeira-atlas-cianus-art-edition.mp4",
    // Mergulho no fundo do mar da Faccia Incógnita: mesma gramática dos livros
    // de O Planta (ver nota em `um-bipede-entre-plantas`) — o sinal do `shift`
    // é preso à borda do `origin`. Bolhas e algas sobem e saem pelo topo; o
    // rochedo, o Leviatã e os corais da frente descem e saem pela base, cada
    // camada mais à frente com deslocamento e zoom maiores. As duas criaturas
    // encostam nas duas bordas horizontais, então descem pouco e contam com o
    // `zoom` ancorado na base, que as estica para cima e mantém o recorte
    // colado no topo o percurso inteiro.
    parallax: [
      {
        src: "/images/parallax/robo-de-madeira-atlas-cianus-art-edition/1-fundo.png",
        shift: 16,
        zoom: 0.1,
      },
      {
        src: "/images/parallax/robo-de-madeira-atlas-cianus-art-edition/2-bolhas.png",
        shift: -20,
        shiftX: 6,
        zoom: 0.05,
        origin: "top",
      },
      {
        src: "/images/parallax/robo-de-madeira-atlas-cianus-art-edition/3-algas.png",
        shift: -30,
        shiftX: -8,
        zoom: 0.08,
        origin: "top",
      },
      {
        src: "/images/parallax/robo-de-madeira-atlas-cianus-art-edition/4-rochedo-criatura.png",
        shift: 26,
        shiftX: 8,
        zoom: 0.14,
        origin: "bottom",
      },
      {
        src: "/images/parallax/robo-de-madeira-atlas-cianus-art-edition/5-leviata.png",
        shift: 40,
        shiftX: -10,
        zoom: 0.2,
        origin: "bottom",
      },
      {
        src: "/images/parallax/robo-de-madeira-atlas-cianus-art-edition/6-corais-frente.png",
        shift: 72,
        shiftX: 10,
        zoom: 0.18,
        origin: "bottom",
      },
    ],
    specs: {
      pages: 188,
      isbn: "978-6500212501",
      format:
        "Moldura cartonada com laminação metálica, luva em acetato. Livro — capa dura e lombada de tecido.",
      dimensions: "34,2 cm • 42,6 cm • 9,2 cm",
      weight: "1450 g",
      language: "Português (Brasil)",
      edition: "1a. edição",
      publishedAt: "2022-06-01",
    },
    price: { amount: 43999, currency: "BRL" },
    wixProductId: "9d1a6081-7973-46f1-9539-33bf432686c6",
    status: "disponivel",
    featured: true,
    featuredCardImage: {
      src: "/images/livros/home/robo-de-madeira-atlas-cianus-art-edition.png",
      alt: "Capa do livro Robô de Madeira — Atlas Cianus, Art Edition, de Gustavo Ravaglio",
    },
  },
  {
    slug: "os-contos-do-planta-caixa-de-reliquias",
    title: "Os Contos do Planta – Caixa de Relíquias",
    universeSlug: "necroplanta",
    author: GUSTAVO,
    // A caixa acompanha Contos do Planta 2, então a história é a mesma do
    // volume — texto igual ao de `os-contos-do-planta-2`, como na ficha da
    // editora.
    synopsis:
      "Os projetos do Dr. Mantis para a construção do corpo do Planta foram roubados.\n\nPlanta, Fausto, o cachorro mago, Dr. Mantis, cientista criador do protagonista, e os demais integrantes do grupo se envolvem em uma investigação que revelará o passado sombrio do cientista. A trama revisita momentos dolorosos de sua trajetória e traz à tona segredos que ele preferiria esquecer.\n\nEm uma narrativa envolvente, todos correm contra o tempo para solucionar o mistério enquanto são perseguidos pelo enigmático vilão Necroplanta.",
    excerpt:
      "A Caixa de Relíquias dos Contos do Planta foi projetada não apenas para armazenar sua coleção, mas também para ampliar a experiência do leitor com o universo da obra por meio de itens interativos, gráficos e narrativos que se conectam diretamente à história e aos personagens.\n\nVeja abaixo os itens que você encontra na caixa:\n\nCaixa — fechamento magnético, acabamento em capa dura, aplicação de tinta dourada, relevos na arte e ornamentos em verniz localizado. A lombada em tecido recebe impressão serigráfica, enquanto toda a caixa é ornamentada interna e externamente.\n\nContos do Planta 2 — nesta edição ocorre a aparição de um dos grandes vilões da série: Necroplanta. Livro com 88 páginas, capa e contra capa inteiramente holográfica repletas de cenas animadas, profundidade visual e efeitos tridimensionais que transformam o livro em uma experiência interativa.\n\nJornal — no início de Contos do Planta 2, Dr. Mantis lê uma matéria sobre o assalto ao museu, acontecimento que dá início à narrativa do livro. Este item reproduz integralmente o jornal do universo de Planta. O Noticiarista Oculto é um jornal alternativo e enigmático, cujo editor permanece desconhecido. Apesar de seu tom sensacionalista, é um dos poucos veículos que realmente relata a verdade.\n\nTabuleiro — este misterioso tabuleiro apresenta uma interação gráfica entre diversos personagens do universo de Planta. No verso, o leitor encontra um mapa de Curytiba na década de 1930, indicando a localização da casa de Dr. Mantis, Planta e Lupus Fausto.\n\nCards e Postais — a caixa acompanha dois postais com ilustrações inéditas e dois cards dourados em formato de cartas de tarô: um de Planta e outro de Necroplanta.",
    coverAlt: "Capa da Caixa de Relíquias de Os Contos do Planta, de Gustavo Ravaglio",
    coverTone: "garnet",
    coverVideoSrc: "/videos/livros/os-contos-do-planta-caixa-de-reliquias.mp4",
    // Vídeo mostra a caixa por inteiro, mais larga que a de um livro solto.
    coverVideoScale: 0.8,
    videoBannerSrc: "/videos/faixas/os-contos-do-planta-caixa-de-reliquias.mp4",
    // Jardim de esculturas: mesma gramática dos outros livros (ver nota em
    // `um-bipede-entre-plantas`) — o sinal do `shift` é preso à borda do
    // `origin`. A folhagem e o Planta da frente descem e saem pela base;
    // o Planta do martelo e a folha são recortes soltos no meio da cena, sem
    // borda a que se prender, e sobem em `center`. Dr. Mantis e Fausto
    // encostam nas duas bordas horizontais: descem pouco e contam com o
    // `zoom` ancorado na base, que os estica para cima e mantém o recorte
    // colado no topo o percurso inteiro.
    parallax: [
      {
        src: "/images/parallax/os-contos-do-planta-caixa-de-reliquias/1-fundo.png",
        shift: 16,
        zoom: 0.1,
      },
      {
        src: "/images/parallax/os-contos-do-planta-caixa-de-reliquias/2-planta-martelo.png",
        shift: -30,
        shiftX: 8,
        zoom: 0.06,
      },
      {
        src: "/images/parallax/os-contos-do-planta-caixa-de-reliquias/3-folha.png",
        shift: -44,
        shiftX: -10,
        zoom: 0.08,
      },
      {
        src: "/images/parallax/os-contos-do-planta-caixa-de-reliquias/4-mantis-dourado.png",
        shift: 24,
        shiftX: 8,
        zoom: 0.12,
        origin: "bottom",
      },
      {
        src: "/images/parallax/os-contos-do-planta-caixa-de-reliquias/5-fausto-dourado.png",
        shift: 30,
        shiftX: -8,
        zoom: 0.14,
        origin: "bottom",
      },
      {
        src: "/images/parallax/os-contos-do-planta-caixa-de-reliquias/6-folhagem.png",
        shift: 56,
        shiftX: 10,
        zoom: 0.16,
        origin: "bottom",
      },
      {
        src: "/images/parallax/os-contos-do-planta-caixa-de-reliquias/7-planta-frente.png",
        shift: 78,
        shiftX: -10,
        zoom: 0.2,
        origin: "bottom",
      },
    ],
    specs: {
      pages: 88,
      // Mesmo ISBN de `os-contos-do-planta-2`, como veio na ficha da editora:
      // o registro é do livro que acompanha a caixa.
      isbn: "978-6500762990",
      format:
        "Caixa — capa dura, lombada de tecido. Livro — capa holográfica plástica.",
      dimensions: "31,9 cm • 24,5 cm • 8,8 cm",
      weight: "1042 g",
      language: "Português (Brasil)",
      edition: "1a. edição",
      publishedAt: "2023-08-01",
    },
    boxContents: {
      items: [
        {
          videoSrc:
            "/videos/livros/os-contos-do-planta-caixa-de-reliquias/item-1.mp4",
          label: "Contos do Planta 2",
        },
        {
          videoSrc:
            "/videos/livros/os-contos-do-planta-caixa-de-reliquias/item-2.mp4",
          label: "Jornal",
        },
        {
          videoSrc:
            "/videos/livros/os-contos-do-planta-caixa-de-reliquias/item-3.mp4",
          label: "Tabuleiro",
        },
        {
          videoSrc:
            "/videos/livros/os-contos-do-planta-caixa-de-reliquias/item-4.mp4",
          label: "Cards e Postais",
        },
      ],
      // openingVideoSrc: adicionar quando o vídeo da caixa abrindo for enviado
    },
    price: { amount: 35999, currency: "BRL" },
    wixProductId: "31186e71-4a54-4e84-b244-0b66f0f51975",
    status: "disponivel",
    featured: true,
    featuredCardImage: {
      src: "/images/livros/home/os-contos-do-planta-caixa-de-reliquias.png",
      alt: "Capa da Caixa de Relíquias de Os Contos do Planta, de Gustavo Ravaglio",
    },
    upsell: {
      title: "Os Contos do Planta — Vol. 2 + Assinatura + Sketch",
      description:
        "Você pode receber seu exemplar de Os Contos do Planta 2 autografado pelo autor e acompanhado de um sketch personalizado, produzido em folha separada especialmente para ser emoldurada e incorporada à sua coleção.\n\nUma oportunidade de possuir não apenas o livro, mas também uma obra original ligada ao universo da obra. Garanta seu livro assinado e seu sketch aqui.",
      price: { amount: 4999, currency: "BRL" },
    },
    universeShowcase: PLANTA_UNIVERSE_SHOWCASE,
    universeFamily: PLANTA_UNIVERSE_FAMILY,
  },
  {
    slug: "necroplanta",
    title: "Necroplanta",
    universeSlug: "necroplanta",
    author: GUSTAVO,
    synopsis:
      "Os projetos do Dr. Mantis para a construção do corpo do Planta foram roubados.\n\nPlanta, Fausto, o cachorro mago, Dr. Mantis, cientista criador do protagonista, e os demais integrantes do grupo se envolvem em uma investigação que revelará o passado sombrio do cientista. A trama revisita momentos dolorosos de sua trajetória e traz à tona segredos que ele preferiria esquecer.\n\nEm uma narrativa envolvente, todos correm contra o tempo para solucionar o mistério enquanto são perseguidos pelo enigmático vilão Necroplanta.\n\nNesta edição, o universo de Planta é expandido de maneira significativa, aprofundando as relações entre os personagens e explorando ainda mais este rico universo narrativo.",
    excerpt:
      "O livro do Necroplanta é uma edição variante de Contos do Planta 2. O projeto gráfico e a colorização foram inteiramente refeitos para esta versão, concebida como a edição do vilão. Além disso, o livro traz páginas extras com detalhes inéditos da história, que não aparecem na edição original de Contos do Planta 2.\n\nA capa apresenta a aplicação de uma tecnologia inédita no universo dos quadrinhos: um material especial capaz de fixar diferentes texturas de dourado, do cromado ao fosco, criando uma composição visual e tátil com variações de brilho, relevo e acabamento.\n\nNos projetos editoriais de Gustavo Ravaglio, o conceito de joalheria é transportado para o design editorial, fazendo com que a capa seja pensada também como objeto material. Para viabilizar esta edição, foram necessários meses de negociações e testes com fornecedores no Oriente. O material precisou ser desenvolvido especificamente para o projeto, já que os fabricantes nunca haviam realizado esse tipo de aplicação em capas de livros, transformando a produção em um processo de pesquisa e experimentação técnica.\n\nO papel amarelado reforça a atmosfera vintage da narrativa e proporciona uma leitura mais confortável. Já a estrutura do livro permite remover as páginas internas da capa para facilitar o manuseio e reacoplá-las posteriormente.\n\nTiragem única e limitada. Todos os exemplares são numerados. Ao adquirir esta obra, você leva para sua coleção uma edição que não será republicada.",
    coverAlt: "Capa do livro Necroplanta, de Gustavo Ravaglio",
    coverTone: "garnet",
    coverVideoSrc: "/videos/livros/necroplanta.mp4",
    videoBannerSrc: "/videos/faixas/necroplanta.mp4",
    // Poção do Necroplanta: mesma gramática dos outros livros (ver nota em
    // `um-bipede-entre-plantas`) — o sinal do `shift` é preso à borda do
    // `origin`. O portal encosta no topo e sobe por lá; o núcleo é recorte
    // solto no meio da cena e acompanha o portal, um pouco mais rápido, como
    // se emergisse do vaso. Os fragmentos flutuantes tocam as duas bordas
    // horizontais ao mesmo tempo: qualquer `shift` descolaria metade deles de
    // uma das bordas, então só o `zoom` os anima — ele sempre amplia e abre o
    // anel para fora da moldura.
    parallax: [
      {
        src: "/images/parallax/necroplanta/1-fundo.png",
        shift: 16,
        zoom: 0.1,
      },
      {
        src: "/images/parallax/necroplanta/2-fragmentos.png",
        shift: 0,
        zoom: 0.14,
      },
      {
        src: "/images/parallax/necroplanta/3-portal.png",
        shift: -30,
        shiftX: 6,
        zoom: 0.08,
        origin: "top",
      },
      {
        src: "/images/parallax/necroplanta/4-nucleo.png",
        shift: -38,
        shiftX: 6,
        zoom: 0.12,
      },
    ],
    specs: {
      pages: 96,
      isbn: "978-6501222516",
      format: "Capa Plástica Dourada",
      dimensions: "27,5 cm • 20,5 cm • 0,8 cm",
      weight: "300 g",
      language: "Português (Brasil)",
      edition: "1a. Edição — Tiragem Única Numerada",
      publishedAt: "2024-10-01",
    },
    // PLACEHOLDER: preço não veio na ficha da editora — mantido o valor já
    // cadastrado até a confirmação.
    price: { amount: 16999, currency: "BRL" },
    wixProductId: "4ffede71-97be-4b6f-b434-57acb965c09e",
    status: "disponivel",
    compareEdition: {
      baseBookSlug: "os-contos-do-planta-2",
      headline: "Tiragem Única e Limitada.",
      description:
        "Todos os exemplares são numerados. Ao adquirir esta obra, você leva para sua coleção uma edição, que não será republicada.",
    },
    upsell: {
      title: "Necroplanta + Assinatura + Sketch",
      description:
        "Você pode receber seu exemplar de Necroplanta autografado pelo autor e acompanhado de um sketch personalizado, produzido em folha separada especialmente para ser emoldurada e incorporada à sua coleção.\n\nUma oportunidade de possuir não apenas o livro, mas também uma obra original ligada ao universo da obra. Garanta seu livro assinado e seu sketch aqui.",
      price: { amount: 4999, currency: "BRL" },
    },
    universeShowcase: PLANTA_UNIVERSE_SHOWCASE,
    universeFamily: PLANTA_UNIVERSE_FAMILY,
  },
  {
    slug: "yanayag",
    title: "Yanayag",
    published: true,
    // Por enquanto o título só deve aparecer na campanha de lançamento
    // (/campanhas) — a página do livro segue no ar pro CTA "Ver na loja",
    // mas some do grid geral do catálogo até a campanha decidir o contrário.
    catalogVisible: false,
    universeSlug: "yanayag",
    author: MAZZITIELLI_E_ALCATENA,
    synopsis:
      "Yanayag acompanha uma expedição perdida em uma floresta que parece se reorganizar a cada noite. Entre mito e sobrevivência, a tripulação precisa decifrar os sinais da mata antes que ela decida que eles não pertencem mais àquele lugar.",
    excerpt:
      "Ambientado em uma floresta densa e quase consciente, Yanayag mistura aventura e horror ecológico, com um traço que alterna entre o realismo e o onírico conforme a mata avança sobre a narrativa.\n\nÉ a primeira colaboração de Mazzitielli e Alcatena publicada pela Hocus Pocus, e inaugura um universo autoral independente do restante do catálogo.",
    coverAlt: "Capa do livro Yanayag, de Mazzitielli e Alcatena",
    coverTone: "forest",
    coverVideoSrc: "/videos/livros/yanayag.mp4",
    coverVideoScale: 1.2,
    videoBannerSrc: "/videos/faixas/yanayag.mp4",
    videoBannerNightSrc: "/videos/faixas/yanayag-noite.mp4",
    // Astrolábio suspenso sobre a névoa: a lua ao fundo quase não se move, o
    // arco de raízes no meio cresce a partir do centro (esconde o corte reto
    // dos dois lados), o medalhão central paira livre, e o anel externo
    // (lateral + topo) é a camada mais à frente — o de topo sai por cima,
    // ancorado onde é cortado.
    parallax: [
      {
        src: "/images/parallax/yanayag/1-fundo.png",
        shift: 10,
        zoom: 0.05,
      },
      {
        src: "/images/parallax/yanayag/2-raizes.png",
        shift: 14,
        zoom: 0.08,
      },
      {
        src: "/images/parallax/yanayag/3-astrolabio.png",
        shift: -20,
        zoom: 0.14,
      },
      {
        src: "/images/parallax/yanayag/4-anel-lateral.png",
        shift: 8,
        shiftX: 10,
        zoom: 0.18,
      },
      {
        src: "/images/parallax/yanayag/5-anel-topo.png",
        shift: -32,
        zoom: 0.24,
        origin: "top",
      },
    ],
    specs: {
      pages: 132,
      isbn: "978-0000000007",
      format: "Capa dura",
      dimensions: "23,5 cm • 16,5 cm • 1,4 cm",
      language: "Português (Brasil)",
      edition: "1a. edição",
      publishedAt: "2023-04-01",
    },
    price: { amount: 11999, currency: "BRL" },
  },
  {
    // Edição canônica em português — esgotada. A edição em inglês
    // (`mr-plant-a-biped-among-plants`, à venda) ocupa agora o lugar de
    // destaque no catálogo que era desta; ver nota no início do array.
    slug: "um-bipede-entre-plantas",
    title: "Um Bípede Entre Plantas",
    subtitle: "Graphic Novel — Vol. 1",
    universeSlug: "necroplanta",
    author: GUSTAVO,
    synopsis:
      "Nesta edição canônica, acompanhamos Planta desde seu nascimento até o início de sua maior aventura. Durante um experimento, Planta acaba sendo lançado para fora de sua própria realidade e cai em uma espécie de \"fresta\" entre mundos, um \"não lugar\" formado por corredores infinitesimais que conectam diferentes dimensões. É nesse labirinto impossível que vive o solitário Arruard, uma raposa violinista que carrega consigo uma misteriosa caixa de chaves mágicas, cada uma capaz de abrir passagem para diferentes dimensões. Uma ameaça silenciosa, muito maior e mais antiga do que eles poderiam imaginar, começa a cercá-los enquanto Planta e Arruard atravessam dimensões desconhecidas em uma longa jornada de volta para casa, enfrentando mundos cada vez mais estranhos, perigosos e imprevisíveis.",
    excerpt:
      "Aqui, o leitor encontra a edição canônica do personagem Planta, dando início à coleção Graphic Novel, responsável por desenvolver a grande saga principal deste universo. Este é o primeiro volume de uma série mais ampla.\n\nLivro finalista em duas categorias do Prêmio Jabuti, a mais importante premiação literária do Brasil.\n\nNesta edição, a capa foi produzida com papel italiano e ornamentada com ilustrações metálicas em cobre, aplicadas em hot stamp e estendidas também para a contra capa, criando um acabamento marcado por detalhes, brilho e textura.\n\nO livro também conta com acabamentos especiais além da capa, incluindo aplicações de tinta dourada nas páginas internas e trechos impressos em papel vegetal, ampliando as possibilidades visuais e materiais da leitura.",
    awardBadge: {
      src: "/images/livros/um-bipede-entre-plantas/selo-jabuti.png",
      alt: "Selo de Livro Finalista do Prêmio Jabuti",
    },
    coverAlt: "Capa do livro Um Bípede Entre Plantas, de Gustavo Ravaglio",
    coverTone: "garnet",
    coverVideoSrc: "/videos/livros/um-bipede-entre-plantas.mp4",
    videoBannerSrc: "/videos/faixas/um-bipede-entre-plantas.mp4",
    // Câmera atravessando a mata: rolando a página, as copas sobem pelo topo
    // e os arbustos descem pela base — a vegetação se abre em torno do
    // leitor, cada camada mais à frente com deslocamento e zoom maiores.
    // Os sinais não são livres: cada recorte só pode sair pela borda em que
    // está ancorado (copa negativa, arbusto positivo). Na direção contrária
    // ele se descola da borda e aparece o corte reto da arte.
    parallax: [
      {
        src: "/images/parallax/um-bipede-entre-plantas/1-fundo.png",
        shift: 16,
        zoom: 0.1,
      },
      {
        src: "/images/parallax/um-bipede-entre-plantas/2-arbusto-fundo.png",
        shift: 28,
        shiftX: -8,
        zoom: 0.06,
        origin: "bottom",
      },
      {
        src: "/images/parallax/um-bipede-entre-plantas/3-arbusto-frente.png",
        shift: 62,
        shiftX: 10,
        zoom: 0.14,
        origin: "bottom",
      },
      {
        src: "/images/parallax/um-bipede-entre-plantas/4-copa-fundo.png",
        shift: -40,
        shiftX: 8,
        zoom: 0.08,
        origin: "top",
      },
      {
        src: "/images/parallax/um-bipede-entre-plantas/5-copa-frente.png",
        shift: -78,
        shiftX: -10,
        zoom: 0.2,
        origin: "top",
      },
    ],
    specs: {
      pages: 178,
      isbn: "978-8591748433",
      format: "Capa dura",
      dimensions: "28,7 cm • 20,4 cm • 1,9 cm",
      language: "Português (Brasil)",
      edition: "1a. edição",
      publishedAt: "2017-11-01",
    },
    price: { amount: 16999, currency: "BRL" },
    status: "esgotado",
    upsell: {
      title: "Exemplar de O Planta autografado pelo autor e sketch personalizado!",
      description:
        "Você pode receber seu exemplar de O Planta – Um bípede entre plantas autografado pelo autor e acompanhado de um sketch personalizado, produzido em folha separada especialmente para ser emoldurada e incorporada à sua coleção.\n\nUma oportunidade de possuir não apenas o livro, mas também uma obra original ligada ao universo da obra. Garanta seu livro assinado e seu sketch aqui.",
      price: { amount: 4999, currency: "BRL" },
    },
    universeShowcase: PLANTA_UNIVERSE_SHOWCASE,
    universeFamily: PLANTA_UNIVERSE_FAMILY,
  },
];

export const BOOKS: readonly Book[] = bookSchema
  .array()
  // Integridade referencial: um universeSlug inexistente explode aqui, no boot,
  // em vez de virar um link morto em produção.
  .refine(
    (books) => books.every((book) => UNIVERSE_SLUGS.has(book.universeSlug)),
    { message: "Livro aponta para um universo que não existe em universes.ts" },
  )
  // Um livro featured sem featuredCardImage vira um buraco silencioso na
  // prateleira de destaque da Home — melhor quebrar o build.
  .refine((books) => books.every((book) => !book.featured || book.featuredCardImage), {
    message: "Livro featured precisa de featuredCardImage (ver Home)",
  })
  // Um compareEdition.baseBookSlug inexistente não quebra nada sozinho — só faz
  // CompareEditionSection sumir em silêncio (ver getCompareEditionBaseBook) —
  // melhor quebrar o build.
  .refine(
    (books) => {
      const slugs = new Set(books.map((book) => book.slug));
      return books.every(
        (book) => !book.compareEdition || slugs.has(book.compareEdition.baseBookSlug),
      );
    },
    { message: "compareEdition.baseBookSlug aponta para um livro que não existe" },
  )
  // Slug duplicado sobrescreveria silenciosamente uma entrada em BOOKS_BY_SLUG.
  .refine((books) => new Set(books.map((book) => book.slug)).size === books.length, {
    message: "Slug de livro duplicado em books.ts",
  })
  .parse(RAW_BOOKS);

/** `BOOKS` filtrado para `published !== false` — o que a vitrine pública usa. */
export const PUBLISHED_BOOKS: readonly Book[] = BOOKS.filter((book) => book.published);

/** `PUBLISHED_BOOKS` filtrado para `catalogVisible !== false` — a vitrine
 * geral do catálogo (grid e "outros livros do universo"). Título com página
 * própria no ar mas fora daqui só aparece dentro de uma campanha. */
export const CATALOG_VISIBLE_BOOKS: readonly Book[] = PUBLISHED_BOOKS.filter(
  (book) => book.catalogVisible,
);

export const BOOKS_BY_SLUG: ReadonlyMap<string, Book> = new Map(
  BOOKS.map((book) => [book.slug, book]),
);

export const BOOKS_BY_UNIVERSE: ReadonlyMap<string, readonly Book[]> = new Map(
  BOOKS.reduce((groups, book) => {
    const current = groups.get(book.universeSlug) ?? [];
    current.push(book);
    groups.set(book.universeSlug, current);
    return groups;
  }, new Map<string, Book[]>()),
);
