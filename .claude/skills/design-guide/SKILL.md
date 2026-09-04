---
name: design-guide
description: >
  Guia de design (brandbook) do site Hocus Pocus — paleta de cores clara e
  escura, tipografia, escala de tamanhos, variantes de botão, componentes
  base (Card/Badge), diagramação, hierarquia de informação, formas/ícones e
  regras de motion/acessibilidade. Use sempre que for criar, ajustar ou
  revisar qualquer página, seção, componente ou classe Tailwind do site —
  novo componente em `_components/`, nova rota, ajuste visual, novo estado
  de botão, nova cor. Também documenta o vínculo com o brandbook editável em
  Word, em `Hocus Pocus Arquivos/Textos/Brandbook - Guia de Design.DOCX`.
---

# Guia de Design — Hocus Pocus

Fonte de verdade viva: os tokens reais estão em `app/globals.css` (bloco
`@theme inline`, `:root` e `.dark`) e nos componentes de
`components/ui/`. Este guia é um resumo navegável desses arquivos — na
dúvida sobre um valor exato, confira o arquivo fonte antes de usar um valor
"de memória".

## 1. Tipografia

Duas famílias no projeto, nunca uma terceira sem atualizar `globals.css` e
este guia:

| Família | Variável CSS | Alias Tailwind | Uso |
|---|---|---|---|
| Poppins (pesos 400/500/600/700) | `--font-poppins` | `font-display` (= `font-heading`) | Todo heading (h1/h2/h3), título de card, número de destaque |
| Nunito Sans (variable) | `--font-nunito-sans` | `font-sans` (padrão do `<html>`), `font-serif`, `font-mono` | Corpo de texto, UI (botões, badges, inputs, nav) |

`font-serif`/`font-mono` continuam existindo como utilitários semânticos no
código mas **apontam para a mesma Nunito Sans** — não introduzem uma
terceira fonte visual. Use `font-serif` para parágrafos de leitura longa
(sinopses, descrições) e o `font-sans` implícito do body para UI.

### Escala por papel (extraída do uso real no código)

| Papel | Classe típica | Exemplo |
|---|---|---|
| H1 de página | `font-display text-2xl sm:text-3xl` (até `text-4xl` em páginas de destaque) | `checkout-content.tsx`, `not-found.tsx` |
| H2 de seção | `font-display text-xl` a `text-3xl sm:text-4xl` | `featured-books-shelf.tsx` |
| H3 / título de card | `font-display text-lg` | `featured-book-card.tsx`, `CardTitle` |
| Número de destaque (contador, progresso) | `font-display text-4xl font-extrabold tabular-nums sm:text-5xl lg:text-[56px]` | `campaign-progress.tsx` |
| Kicker / legenda acima de título | `font-display text-sm font-bold uppercase tracking-[0.11em]`, cor `text-primary` | `campaign-creator.tsx` |
| Corpo / parágrafo longo | `font-serif leading-relaxed text-foreground/70` | `universe-section.tsx` |
| Texto de UI padrão | `text-sm` | maioria dos componentes |
| Metadado / texto pequeno | `text-xs` | badges, legendas |

Regra de hierarquia: a diferença entre níveis vem de **tamanho + opacidade**,
não de uma terceira fonte. Texto de leitura longa nunca é preto puro —
usa `text-foreground/70`.

## 2. Paleta de cores

Tokens semânticos (`app/globals.css`). Sempre usar a classe semântica
(`bg-primary`, `text-muted-foreground`...) — nunca hex direto num
componente.

### Modo claro (`:root`)

| Token | Hex | Uso |
|---|---|---|
| `background` / `card` / `popover` | `#ffffff` | Fundo do chrome do site (header, seções, footer, cards) |
| `foreground` / `card-foreground` | `#17190f` | Texto principal |
| `primary` | `#453f33` | Ações primárias, botão padrão |
| `primary-foreground` | `#f6f1e6` | Texto sobre `primary` |
| `secondary` / `muted` | `#ebe3d1` | Fundos secundários, superfícies neutras |
| `secondary-foreground` | `#17190f` | Texto sobre `secondary` |
| `muted-foreground` | `#726b56` | Texto de apoio / metadado |
| `accent` | `#b08d2b` (dourado) | Destaque pontual, botão `accent` |
| `accent-foreground` | `#17190f` | Texto sobre `accent` |
| `destructive` | `#a3321f` | Erros, ações destrutivas |
| `border` / `input` | `#ded2b0` | Bordas, campos de formulário |
| `ring` | `#453f33` | Anel de foco |

### Modo escuro (`.dark`)

| Token | Hex | Uso |
|---|---|---|
| `background` | `#0b0f0c` | Fundo geral |
| `foreground` | `#ffffff` | Texto principal |
| `card` / `popover` | `#131a14` | Superfícies elevadas |
| `primary` | `#ffc00c` | Amarelo forte da marca (mesmo tom da logo) — ações primárias |
| `primary-foreground` | `#0b0f0c` | Texto sobre `primary` |
| `secondary` / `muted` | `#1c261e` | Fundos secundários |
| `muted-foreground` | `#9aa398` | Texto de apoio |
| `accent` | `#c9a227` | Destaque pontual |
| `destructive` | `#d9553d` | Erros |
| `border` / `input` | branco a 12%/15% via `color-mix` | Bordas translúcidas |
| `ring` | `#ffc00c` | Anel de foco |

### Tons de universo (`lib/tone.ts`, iguais nos dois modos)

| Tom | Hex | Classe (cheia) | Classe (soft, 20%) |
|---|---|---|---|
| Garnet | `#6e1423` | `bg-universe-garnet` | `bg-universe-garnet/20` |
| Navy | `#141b36` | `bg-universe-navy` | `bg-universe-navy/20` |
| Brown | `#4a2d0a` | `bg-universe-brown` | `bg-universe-brown/20` |
| Forest | `#101913` | `bg-universe-forest` | `bg-universe-forest/20` |

A versão "soft" existe porque a cor cheia satura demais em áreas grandes
(faixa de campanha). **Nunca** montar a classe dinamicamente
(`` `bg-universe-${tone}` `` é descartada no build do Tailwind 4) — sempre
mapear via objeto literal, como em `lib/tone.ts`.

## 3. Botões (`components/ui/button.tsx`)

Base: `rounded-lg`, borda transparente, `text-sm font-medium`,
`transition-all`, anel de foco (`focus-visible:ring-3 ring-ring/50`),
pressiona 1px no `active`, `opacity-50` quando `disabled`.

| Variante | Uso | Estilo |
|---|---|---|
| `default` | Ação primária padrão | `bg-primary` / hover 80% opacidade |
| `accent` | CTA de destaque (ex.: comprar) | `accent` misturado com 25% de `foreground`, `shadow-sm` |
| `outline` | Ação secundária | borda + `bg-background`, hover `bg-muted` |
| `secondary` | Ação neutra | `bg-secondary` |
| `ghost` | Ação de baixa ênfase | transparente, hover `bg-muted` |
| `destructive` | Ações destrutivas | `bg-destructive/10`, texto `destructive` (nunca fundo sólido) |
| `link` | Ação inline em texto | só sublinhado |

Tamanhos: `xs` (`h-6`) · `sm` (`h-7`) · `default` (`h-8`) · `lg` (`h-9`), e os
equivalentes quadrados `icon-xs`/`icon-sm`/`icon`/`icon-lg`. Ícone dentro do
botão usa `size-4` por padrão (`size-3.5` no `sm`, `size-3` no `xs`).

## 4. Componentes base

- **Card** (`components/ui/card.tsx`): `rounded-xl`, sem borda tradicional —
  usa `ring-1 ring-foreground/10` (mais sutil que `border`). Espaçamento
  interno via `--card-spacing` (`4` no padrão, `3` em `size="sm"`).
  `CardTitle` usa `font-heading text-base font-medium`.
- **Badge** (`components/ui/badge.tsx`): formato pílula (`rounded-4xl`),
  `h-5 text-xs font-medium`, mesma paleta de variantes do Button.

## 5. Diagramação

- Container padrão de seção: `mx-auto max-w-6xl px-4 sm:px-6`.
- Blocos de texto centralizados: `max-w-3xl`/`max-w-2xl`; colunas de
  descrição: `max-w-xl`.
- Padding vertical de seção: `py-16`/`py-20` no padrão; `py-24`/`py-28` em
  heroes e seções grandes com `lg:flex-row`.
- Espaçamento interno (`gap-*`): `gap-3` entre elementos próximos (kicker +
  título), `gap-6` entre blocos de conteúdo, `gap-12` entre colunas lado a
  lado.
- Separação entre seções: `border-t border-border`.

## 6. Hierarquia da informação

1. **H1** — um por página, `font-display`, sempre `text-foreground`.
2. **H2** — título de seção, mesma família, um degrau abaixo do H1 (pode
   coincidir em tamanho quando o H1 da página já é pequeno, ex. checkout).
3. **Kicker** — legenda curta acima de um H2 (`text-sm uppercase font-bold
   tracking-wide`, cor `primary` ou `muted-foreground`).
4. **Corpo** — `font-serif`, `text-foreground/70` em parágrafos longos.
5. **Metadado** — `text-xs text-muted-foreground`.

## 7. Formas, ícones e vetores

Escala de raio (`app/globals.css`, base `--radius: 0.5rem`):

| Token | Multiplicador |
|---|---|
| `radius-sm` | ×0.6 |
| `radius-md` | ×0.8 |
| `radius-lg` | ×1 (base) |
| `radius-xl` | ×1.4 |
| `radius-2xl` | ×1.8 |
| `radius-3xl` | ×2.2 |
| `radius-4xl` | ×2.6 |

- Cards e seções: `rounded-lg`/`rounded-xl`.
- Pílulas, avatares, indicadores, badges: `rounded-full` (ou `rounded-4xl`).
- **Ícones**: só `lucide-react`, `size-4` inline com texto (`size-3`/`3.5`
  em contextos compactos). Não introduzir outra biblioteca de ícones.
- **Vetores decorativos** (SVG solto, blobs, texturas): o código não usa
  forma decorativa inline hoje. Os SVGs de marca (logo, textura de folhas)
  ficam em `Hocus Pocus Arquivos/SVG/` e entram como asset/`<Image>`, nunca
  hardcoded dentro de um componente.
- **Parallax de capa de livro**: segue o fluxo da skill `atualizar-livro`,
  não este guia.
- **Vidro/blur**: reservado a elementos flutuantes sobre mídia (ex.:
  controles do Hero sobre vídeo — `backdrop-blur-[10px] bg-white/8
  border-white/24`), não para UI padrão do site.

## 8. Motion & acessibilidade

- `prefers-reduced-motion: reduce` já neutraliza toda animação/transição
  globalmente (`app/globals.css`) — não duplicar essa lógica em componentes.
- Transições padrão: `transition-all`/`transition-colors`, sem duração
  customizada (usa o default do Tailwind).
- Foco sempre visível via `focus-visible:ring-3 ring-ring/50` +
  `focus-visible:border-ring` — nunca remover outline sem substituto.

## 9. Regras de ouro

- Nunca hex direto num componente — sempre `var(--token)` ou classe
  semântica. Tom novo entra em `app/globals.css`, bloco `@theme inline`,
  antes de ser usado.
- Nunca montar classe Tailwind dinamicamente — mapear em objeto literal
  (padrão `lib/tone.ts`).
- Uma fonte para heading (`font-display`/`font-heading`), uma para o resto
  (`font-sans`/`font-serif`/`font-mono`, todas Nunito Sans).
- `lucide-react` é a única biblioteca de ícones do projeto.
- Todo container de seção do site público usa `max-w-6xl mx-auto px-4
  sm:px-6`, salvo exceção justificada (ex.: hero full-bleed).

## Vínculo com o brandbook editável (Word)

Existe uma cópia editável deste guia em Word, para o usuário anotar visão
de design fora do código:

`Hocus Pocus Arquivos/Textos/Brandbook - Guia de Design.DOCX`

Quando o usuário devolver esse arquivo com alterações:

1. Leia o `.DOCX` (descompactar + limpar XML, como na skill
   `atualizar-livro`, ou via `python-docx`).
2. Compare cada seção com o estado atual deste `SKILL.md` e com os tokens
   reais em `app/globals.css` / `components/ui/*`.
3. Onde a visão do designer divergir do código atual, pergunte ao usuário
   se é (a) só atualizar este guia, ou (b) também alterar os tokens/
   componentes no código — não sobrescreva código sem confirmação.
4. Atualize este arquivo refletindo a decisão.
