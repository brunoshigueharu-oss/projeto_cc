# Redesenho da seção "itens da caixa" — design

## Contexto

Pedido: redesenhar a faixa de itens da caixa (hoje em
`app/(site)/catalogo/[slug]/_components/box-contents-section.tsx`, usada na
página de detalhe do livro para livros com `book.boxContents`, ex.:
`os-contos-do-planta-caixa-de-reliquias`). O usuário trouxe uma referência
visual (mockup próprio, não fiel) mostrando: um texto de cabeçalho acima da
faixa, uma lista leve com os nomes dos itens, e botões de navegação
circulares nas laterais da faixa scrollável.

Ajustes pedidos sobre o comportamento atual:

- O scroll da faixa já é manual (arrasto/roda do mouse) — **continua assim**,
  sem autoplay. Isso já é como o componente funciona hoje.
- Adicionar botõezinhos de navegação, no estilo já usado no carrossel da Home
  (`app/(site)/_components/hero.tsx`: círculo translúcido com blur).
- O vídeo do livro ("Contos do Planta 2") precisa continuar aparecendo entre
  os itens — já está em `boxContents.items[0]` nos dados, não é um item novo.
- O efeito de "clique para ampliar" está forte demais hoje (escurece os
  itens vizinhos, cresce o item no hover, ícone grande central) e precisa
  ficar mais sutil.

## Estado atual (o que muda)

Hoje `BoxContentsSection`:
1. Não tem nenhum texto de cabeçalho — vai direto para a faixa de vídeos.
2. A faixa não tem botões de navegação, só scroll nativo com `snap`.
3. Hover: `scale-105` + `shadow-2xl` no item, `opacity-50` nos vizinhos
   (efeito "spotlight"), ícone `Expand` grande (`size-8`) que só aparece no
   hover, centralizado sobre o item.

## Mudanças

### 1. Cabeçalho (novo)

Acima da faixa, dentro do container padrão (`mx-auto max-w-6xl px-4
sm:px-6`), centralizado:

- Título: `font-display text-2xl font-bold text-foreground sm:text-3xl` —
  texto fixo "confira o que vem dentro da caixa" (sem variar por livro; a
  seção já só aparece quando `boxContents` existe).
- Subtítulo, logo abaixo: nomes dos itens separados por vírgula, gerados
  dinamicamente a partir de `items.map((item) => item.label)` (filtrando
  itens sem `label`). Estilo mais leve e mais claro que o título:
  `font-sans text-base font-normal text-muted-foreground sm:text-lg`.
- Se nenhum item tiver `label`, o subtítulo não é renderizado (mas o título
  continua aparecendo).

### 2. Botões de navegação

Reaproveita o espírito visual do `CAROUSEL_ARROW_CLASSNAME` de `hero.tsx`
(círculo, blur, ícone chevron), adaptado à paleta clara/neutra da seção —
o token do Hero (`bg-white/8 border-white/24`) foi pensado para ficar sobre
vídeo escuro full-bleed; aqui uso:

```
"absolute top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center
 rounded-full border border-border bg-background/80 text-foreground
 backdrop-blur-[10px] shadow-sm transition-opacity hover:bg-background
 disabled:pointer-events-none disabled:opacity-40"
```

Comportamento:

- Um container `ref` (`scrollerRef`) na `div` que já tem `overflow-x-auto`.
- Cada clique chama `scrollBy({ left: ±STEP, behavior: "smooth" })`, onde
  `STEP` é a largura aproximada de um item + gap (calculada a partir do
  primeiro item ou usando um valor fixo consistente com a altura dos cards,
  ex. largura ≈ altura do card × aspect ratio).
- Estado `canScrollPrev`/`canScrollNext`, atualizado num handler de
  `onScroll` do container (+ cálculo inicial num `useEffect`), desabilita
  (`disabled`) e esmaece o botão correspondente quando não há mais o que
  rolar naquela direção.
- Botões ficam ocultos (`hidden sm:flex`, como no Hero) em telas muito
  pequenas, onde o scroll por arrasto/toque já é o principal meio de
  navegação; ficam visíveis a partir de `sm`.
- Não renderiza os botões se houver só 1 item (nada para rolar).

### 3. Hover / "clique para ampliar" mais sutil

Remove:
- O escurecimento dos itens vizinhos (`opacity-50` condicionado a
  `hoveredIndex`) — todo o estado `hoveredIndex` sai do componente.
- O `scale-105` / `shadow-2xl` no hover.
- O ícone `Expand` grande centralizado que só aparecia no hover.

Adiciona: um ícone pequeno de expandir, sempre visível (baixa opacidade),
fixo num canto do item (inferior direito), dentro de um círculo translúcido
pequeno — mesma linguagem visual dos botões de navegação, em miniatura:

```
"absolute bottom-2 right-2 flex size-7 items-center justify-center rounded-full
 border border-white/30 bg-black/30 text-white opacity-70 backdrop-blur-sm
 transition-opacity group-hover:opacity-100"
```

com `<Expand className="size-3.5" />` dentro. Funciona em touch/mobile por
não depender de hover para ser visível.

O `button` de cada item mantém apenas uma transição sutil de sombra no
hover/focus (ex. `hover:shadow-md`), sem alterar escala nem afetar os
vizinhos.

### 4. O que não muda

- O modal de tela cheia ao clicar num item (vídeo grande, `X` para fechar,
  setas `ChevronLeft`/`ChevronRight` para navegar entre itens, teclado
  Esc/←/→) — mantém exatamente como está.
- `boxContents.openingVideoSrc` (vídeo opcional da caixa abrindo) — segue
  sem valor para este livro, sem mudança de lógica.
- Os 4 itens de `os-contos-do-planta-caixa-de-reliquias` (incluindo o vídeo
  do livro) já estão corretos em `lib/data/books.ts` — não há mudança de
  dados aqui.
- Tamanho maior do primeiro/último item (`isEdge`) — mantém, dá ritmo à
  faixa e não foi um ponto de reclamação.

## Componente afetado

Só `app/(site)/catalogo/[slug]/_components/box-contents-section.tsx` muda.
Nenhum outro arquivo usa esse componente (`page.tsx` só passa `book`).

## Fora de escopo

- Não mexe em `CampaignAbout` nem em qualquer seção da página de campanhas
  — `boxContents` não é usado lá (a campanha usa `gallery`, que é outra
  seção, já implementada).
- Não adiciona `boxContents` a nenhum outro livro além do que já tem.
- Não introduz nova biblioteca de carousel (`embla`, etc.) — o scroll
  continua sendo `overflow-x-auto` nativo com `scrollBy` imperativo, já que
  o comportamento pedido (arrasto livre + snap + botões) não precisa de uma
  lib extra.
