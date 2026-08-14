# Seção de combos (banners rotativos) — design

## Contexto

Pedido: adicionar, no final da página de detalhe do livro
(`/catalogo/[slug]`), uma seção de "combos" — kits promocionais de 2+ livros
com preço com desconto, exibidos como banners rotativos (carousel).

Sem referência de Figma para essa seção; o layout segue o design system já
usado nas demais seções da página (`upsell-card`, `related-books` etc.).

## Dado: `Combo`

Combos são **gerais do catálogo**, não específicos de um livro — cadastrados
em `lib/data/combos.ts` (mesmo padrão de `books.ts`/`universes.ts`: array
`RAW_COMBOS` validado com `comboSchema.parse` no topo do módulo, uma vez por
processo). A página de um livro mostra os combos cujo kit inclui aquele
livro.

Novo schema em `lib/data/schemas.ts`:

```ts
export const comboSchema = z.object({
  slug,
  title: z.string().min(1),
  description: z.string().min(1),
  /** Opcional: banner dedicado (arte da editora). Sem ele, o card cai no
   * fallback de capas dos livros do kit lado a lado. */
  image: z.object({ src: z.string().min(1), alt: z.string().min(1) }).optional(),
  /** Slugs dos livros que compõem o kit. */
  bookSlugs: z.array(slug).min(2),
  /** Preço promocional final do combo, em centavos. */
  price: z.object({ amount: z.number().int().nonnegative(), currency: z.literal("BRL") }),
  ctaLabel: z.string().min(1).default("Comprar combo"),
  buyUrl: z.url().optional(),
});
export type Combo = z.infer<typeof comboSchema>;
```

**Preço original (riscado) não é campo do schema.** É calculado no
data-access somando o `price.amount` de cada livro resolvido do kit — evita
o combo divergir do preço real do livro se este mudar depois.

`lib/data/combos.ts` recebe **1 combo de exemplo** com livros reais do
catálogo (`um-bipede-entre-plantas` + `os-contos-do-planta-1`), preço de
placeholder. O usuário vai enviar os combos e preços reais depois — o
registro fica fácil de editar/substituir, seguindo o padrão de "preencher
quando a editora enviar o dado" já usado em `upsell`/`gallery`/`parallax`.

## Data access

Nova função em `app/catalogo/[slug]/_data-access/get-book.ts`:

```ts
export type ResolvedCombo = {
  combo: Combo;
  books: Book[];       // livros do kit resolvidos, na ordem de bookSlugs
  originalPrice: number; // soma de books[].price.amount, em centavos
};

export function getCombosForBook(book: Book): ResolvedCombo[]
```

Filtra `combos` (de `lib/data/combos.ts`) cujo `bookSlugs` inclui
`book.slug`, resolve os livros do kit via `books.ts` (ignora slugs que não
existam — mesma tolerância defensiva de `universeFamily.covers`) e calcula
`originalPrice`.

## Componentes

`app/catalogo/[slug]/_components/`:

- **`combos-section.tsx`** (Server Component) — recebe `combos:
  ResolvedCombo[]`; retorna `null` quando vazio (mesmo padrão de
  `upsell-card`/`related-books`). Renderiza o cabeçalho da seção (kicker +
  título "Combos especiais" ou similar) e `<CombosCarousel combos={combos} />`.
- **`combos-carousel.tsx`** (Client Component — único ponto com JS extra
  nesta seção, mesma exceção documentada para `parallax-section`) — usa
  `Carousel`/`CarouselContent`/`CarouselItem`/`CarouselPrevious`/`CarouselNext`
  do shadcn (`components/ui/carousel.tsx`, baseado em `embla-carousel-react`)
  com o plugin `embla-carousel-autoplay` (delay ~5s, pausa no hover/interação
  — comportamento default do plugin) e dots de navegação abaixo do carousel.

Cada slide é um banner full-width dentro do card:

- **Com `combo.image`**: imagem de fundo (`object-cover`), overlay escuro
  gradiente, título + descrição + preço (promocional em destaque, original
  riscado ao lado) + CTA sobrepostos.
- **Sem imagem (fallback)**: fundo sólido usando o `coverTone` do primeiro
  livro do kit (mapeado pra classe literal, como em `lib/tone.ts` — nunca
  `bg-${tone}` dinâmico) + capas dos livros do kit lado a lado (reaproveita
  o componente de capa já usado no site) + o mesmo bloco de texto/preço/CTA.

Preços formatados com `formatPrice` (`lib/format.ts`), Server Component só —
igual ao resto do site.

## Dependências novas

- `npx shadcn@latest add carousel` (instala `embla-carousel-react` e
  `components/ui/carousel.tsx`)
- `npm install embla-carousel-autoplay`

## Integração em `page.tsx`

```tsx
const combos = getCombosForBook(book);
// ...
<CombosSection combos={combos} />
```

Renderizada por último, depois do bloco condicional
`UniverseFamilySection`/`RelatedBooks`.

## Fora de escopo

- Página/rota própria de combos ou listagem no catálogo geral — só a seção
  na página de livro.
- Checkout/carrinho real: CTA é link (`buyUrl`), mesmo tratamento de
  "placeholder de link" já usado em `book.buyUrl`.
- Preços e kits reais: ficam com 1 exemplo até o usuário enviar os dados
  definitivos.
