# Seção "Universo da Família" — página de detalhe do livro

**Data:** 2026-08-12
**Página afetada:** `app/catalogo/[slug]/page.tsx` (inicialmente só `um-bipede-entre-plantas`)

## Contexto

O usuário forneceu 4 artes (PNGs 1920×1080, fundo transparente, cada uma com a
capa de um livro posicionada em um ponto diferente do quadro) e um SVG
decorativo de folhas/vinhas (`folhas fundo.svg`), com uma imagem de
referência mostrando como devem ficar compostos: título do universo + autor
à esquerda, e as 4 capas "flutuando" sobre o fundo de folhas, cada uma com
uma legenda abaixo.

Os 4 livros retratados já existem no catálogo e já compartilham
`universeSlug: "necroplanta"` (nome de exibição do universo: **"O Planta"**):

| Arte  | Livro                                 | slug                          |
|-------|----------------------------------------|-------------------------------|
| 4.png | Um Bípede Entre Plantas (livro atual)  | `um-bipede-entre-plantas`     |
| 5.png | Os Contos do Planta — Vol. 1           | `os-contos-do-planta-1`       |
| 6.png | Necroplanta                            | `necroplanta`                 |
| 7.png | Os Contos do Planta — Vol. 2           | `os-contos-do-planta-2`       |

Um 5º livro do mesmo universo (`os-contos-do-planta-caixa-de-reliquias`) não
tem arte nessa composição — decisão do usuário: ele simplesmente não aparece
nesta seção (fica só no catálogo geral).

A página já tem uma seção `RelatedBooks` (grid simples com todos os livros do
universo, exceto o atual) logo depois de `CollectionsGuideSection`. A nova
seção **substitui** `RelatedBooks` nesta página, quando o livro tiver os
dados da composição.

## Objetivo

Criar uma seção decorativa, data-driven, que reproduza a composição de
referência: fundo de folhas, "Universo {nome}" + autor à esquerda, e as
capas posicionadas exatamente como na arte original — clicáveis (exceto a do
livro atual), com legenda abaixo de cada uma. Deve se comportar bem em
qualquer largura de tela, encolhendo a composição inteira proporcionalmente
(sem virar um layout diferente no mobile).

## Modelo de dados

Novo campo opcional em `bookSchema` (`lib/data/schemas.ts`), seguindo o
padrão já usado por `universeShowcase`/`upsell`: cada seção decide sozinha se
renderiza, verificando a presença do dado.

```ts
/** Opcional: composição decorativa "família do universo" — fundo de folhas
 * + capas dos livros do mesmo universo posicionadas como numa ilustração,
 * substituindo o grid genérico de RelatedBooks nesta página. Preencher só
 * quando a editora enviar a arte composta (fundo + capas recortadas). */
universeFamily: z
  .object({
    /** SVG decorativo de fundo (vinhas/folhas), sem alinhamento fino com as
     * capas — é só atmosfera, não guia pixel-perfect. */
    backgroundSrc: z.string().min(1),
    covers: z
      .array(
        z.object({
          /** Omitido = capa do livro atual (não vira link). */
          bookSlug: slug.optional(),
          caption: z.string().min(1),
          image: z.object({
            src: z.string().min(1),
            alt: z.string().min(1),
            /** Dimensões reais do PNG já recortado na bounding box (sem
             * a margem transparente do canvas 1920×1080 original) —
             * usadas só para o Next/Image calcular a proporção. */
            width: z.number().int().positive(),
            height: z.number().int().positive(),
          }),
          /** Posição em % dentro do "palco" da composição (aspect 1920/1080),
           * extraída da bounding box real de cada arte original. */
          position: z.object({
            top: z.number().min(0).max(100),
            left: z.number().min(0).max(100),
            width: z.number().min(0).max(100),
          }),
        }),
      )
      .min(1),
  })
  .optional(),
```

Título ("Universo {universe.name}") e autor (`book.author.name`) **não**
entram nesse campo — já existem em `Universe`/`Book` e a seção os lê
diretamente, evitando duplicação.

### Dados concretos para `um-bipede-entre-plantas`

Bounding boxes extraídas via Pillow (`Image.getbbox()`) dos 4 PNGs originais
(canvas 1920×1080):

| Arte  | bbox (l,t,r,b)          | dimensões (w×h) | left% | top%  | width% |
|-------|--------------------------|------------------|-------|-------|--------|
| 4.png | 926, 58, 1233, 476       | 307×418          | 48.2  | 5.4   | 16.0   |
| 5.png | 1242, 596, 1544, 998     | 302×402          | 64.7  | 55.2  | 15.7   |
| 6.png | 568, 593, 865, 995       | 297×402          | 29.6  | 54.9  | 15.5   |
| 7.png | 1540, 596, 1836, 998     | 296×402          | 80.2  | 55.2  | 15.4   |

Legendas (texto livre, não derivado de `book.title` — são o texto de
marketing da arte original, como na referência):

- 4.png → `"O Planta — Um Bípede Entre Plantas"`, `bookSlug: "um-bipede-entre-plantas"` (livro atual — link para a própria página, mantém hover/zoom igual aos demais)
- 6.png → `"Necroplanta"`, `bookSlug: "necroplanta"`
- 5.png → `"Os Contos do Planta — Vol. 1"`, `bookSlug: "os-contos-do-planta-1"`
- 7.png → `"Os Contos do Planta — Vol. 2"`, `bookSlug: "os-contos-do-planta-2"`

## Assets

Os 4 PNGs são recortados na bounding box (sem padding extra — a sombra já
está incluída no alfa) e copiados, junto com o SVG, para:

```
public/images/universo/familia/um-bipede-entre-plantas/
  fundo.svg
  um-bipede-entre-plantas.png
  necroplanta.png
  os-contos-do-planta-1.png
  os-contos-do-planta-2.png
```

## Componente `universe-family-section.tsx`

`app/catalogo/[slug]/_components/universe-family-section.tsx` — Server
Component (não precisa de estado/eventos, então sem `"use client"`).

Props: `{ book: Book; universe: Universe }` (só renderiza se
`book.universeFamily` existir — o `null` guard fica dentro do componente,
como as demais seções opcionais).

Estrutura:

```
<section className="border-t border-border bg-background">
  <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
    <div className="@container relative aspect-[1920/1080] w-full">
      {/* fundo decorativo */}
      <Image src={backgroundSrc} fill aria-hidden className="object-cover opacity-70" alt="" />

      {/* título, posicionado na área vazia à esquerda da composição original */}
      <div className="absolute" style={{ top: "38%", left: "5%", width: "20%" }}>
        <h2 className="font-display text-[5.2cqw] leading-tight text-foreground sm:text-[3.4cqw]">
          Universo {universe.name}
        </h2>
        <p className="mt-2 font-serif text-[2.6cqw] italic text-foreground/60 sm:text-[1.6cqw]">
          {book.author.name}
        </p>
      </div>

      {/* capas */}
      {covers.map((cover) => {
        const content = (
          <>
            <Image src={cover.image.src} width={cover.image.width} height={cover.image.height}
                   alt={cover.image.alt} className="h-auto w-full drop-shadow-md transition-transform group-hover:scale-[1.03]" />
            <span className="mt-2 block text-center text-[2.4cqw] text-foreground/80 sm:text-[1.3cqw]">
              {cover.caption}
            </span>
          </>
        );

        const style = { top: `${cover.position.top}%`, left: `${cover.position.left}%`, width: `${cover.position.width}%` };

        return cover.bookSlug ? (
          <Link key={cover.caption} href={`/catalogo/${cover.bookSlug}`} className="group absolute" style={style}>
            {content}
          </Link>
        ) : (
          <div key={cover.caption} className="absolute" style={style}>
            {content}
          </div>
        );
      })}
    </div>
  </div>
</section>
```

Pontos técnicos:

- **`aspect-[1920/1080]`** mantém a proporção da composição original em
  qualquer largura — as posições em `%` continuam batendo com a arte.
- **`@container` + unidades `cqw`** (Tailwind 4 tem suporte nativo, sem
  plugin) fazem o texto (título, autor, legendas) escalar junto com a
  composição, para que o encolhimento no mobile seja proporcional, e não
  quebre o layout com texto grande demais para o espaço disponível.
- O fundo de folhas usa `object-cover` dentro do mesmo palco 16:9 — a arte
  original tem proporção diferente (~1.5:1), então há um leve corte nas
  bordas; aceitável porque é puramente decorativo (confirmado com o
  usuário).
- Cada capa usa `Image` sem `fill` (com `width`/`height` intrínsecos do
  arquivo recortado + `className="h-auto w-full"`), padrão recomendado do
  Next.js para imagens responsivas com proporção preservada.
- Efeito de hover replica o já usado em `BookCard`/`UniverseShowcaseImage`
  (leve scale + sombra), só nas capas que são link.

## Wiring em `page.tsx`

```tsx
{book.universeFamily ? (
  <UniverseFamilySection book={book} universe={universe} />
) : (
  <RelatedBooks books={relatedBooks} universe={universe} />
)}
```

Substitui a linha atual `<RelatedBooks books={relatedBooks} universe={universe} />`.
Livros sem `universeFamily` continuam com o comportamento atual, sem
mudança visual.

## Acessibilidade

- SVG de fundo: decorativo, `alt=""` + `aria-hidden="true"`.
- Cada capa: `alt` descritivo (ex: "Capa de Necroplanta") vindo do dado.
- Links de capa: `<Link>` normal, focável via teclado, com `focus-visible`
  herdado do estilo global de link/botão do projeto.
- Heading da seção é `h2` (mesmo nível usado por `UniverseSection` e
  `RelatedBooks`), mantendo a hierarquia da página.

## Fora de escopo / simplificações conscientes

- Sem alinhamento fino entre o SVG de fundo e a posição das capas — é um
  único traço decorativo, não uma "trilha" desenhada por capa.
- Legenda é um único texto simples (sem markup misto normal+itálico dentro
  da mesma legenda, como a referência sugere para "Vol. 1"/"Vol. 2") — texto
  livre no dado já resolve a diferença tipográfica sem precisar de rich
  text no schema.
- Nenhum tratamento de mobile alternativo (grid): a composição só encolhe
  proporcionalmente, por decisão explícita do usuário.
- Campo novo (`universeFamily`) só é preenchido para
  `um-bipede-entre-plantas` nesta entrega; os demais livros do catálogo
  continuam com `RelatedBooks`.

## Plano de verificação

- `npm run type-check && npm run lint` depois das mudanças.
- Visualizar `/catalogo/um-bipede-entre-plantas` no navegador (dev server já
  costuma estar de pé neste projeto) em pelo menos 3 larguras (mobile ~375px,
  tablet ~768px, desktop ~1280px+), conferindo:
  - fundo de folhas visível atrás das capas;
  - as 4 capas nas posições esperadas, com legenda logo abaixo;
  - texto do título/autor legível e na área vazia à esquerda;
  - clique em cada capa (exceto a do livro atual) navega para o livro certo;
  - nenhuma regressão nas seções vizinhas (`CollectionsGuideSection` antes,
    fim da página depois).
