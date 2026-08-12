# Efeito de papel no card de upsell — design

## Contexto

O site antigo (Wix) tinha, em algum ponto, um efeito decorativo de papel que
inclinava conforme o mouse se movia. O usuário quer recriar uma versão desse
efeito no site novo: uma folha de papel que reage ao mouse e recebe um
rabisco por onde o cursor passa.

Referência de vídeo do efeito original:
`/Users/brunohigashi/Documents/Gravação de Tela 2026-08-12 às 14.18.20.mov`.

**Histórico:** a primeira versão implementada (duas folhas empilhadas +
lápis seguindo o cursor) foi revisada após teste em produção — ver
[Revisão 1](#revisão-1-depois-do-primeiro-teste) abaixo. Este documento
descreve o design **final**, já incorporando essa revisão.

## Onde entra

`app/catalogo/[slug]/_components/upsell-card.tsx` — o card "Exclusivo Hocus
Pocus" do exemplar autografado (hoje só populado para o livro `O Planta`,
via `book.upsell` em `lib/data/books.ts`). O card tinha uma coluna de texto
(`flex-1`) e, ao lado, um placeholder decorativo com o selo; esse placeholder
foi substituído pelo efeito, e a coluna de texto ganhou um teto de largura
(`lg:max-w-xs`) para abrir espaço.

## Decisões finais

1. **Uma folha só**, não duas — testar as duas empilhadas mostrou que a de
   trás quase não aparecia (a da frente cobria tudo) e deixava a caixa maior
   do que precisava.
2. **Sem lápis.** O elemento de lápis seguindo o cursor nunca ficava alinhado
   de forma confiável com o traço desenhado (a rotação do lápis pivotava no
   centro da imagem, não na ponta, então girar o lápis deslocava a ponta
   visualmente para longe do cursor real). Em vez de corrigir esse pivô, a
   decisão foi remover o lápis: o traço aparece exatamente onde o cursor
   passa sobre o papel, sem elemento extra pra manter alinhado.
3. **Caixa bem menor** (`max-w-[300px]`, antes 420px) — do tamanho de uma
   folha real ao lado do texto, não dominando o card.
4. **Área de interação:** o tilt do papel e o desenho do rastro só reagem ao
   mouse dentro da caixa do efeito, não na página inteira.
5. **Rastro do lápis:** desenhado direto num `<canvas>` na posição exata do
   cursor, some com o tempo (fade), mas **dura bem mais** que a primeira
   tentativa — ver nota técnica abaixo sobre o motivo de não ser só "baixar o
   número do fade".
6. **Mobile/touch:** sem mouse, mostra só a folha parada — sem canvas, sem
   listeners de mouse.

## Assets

Papel usado: `AdobeStock_1717481478.png` (novo PNG enviado pelo usuário na
revisão, substitui o primeiro). Fundo transparente confirmado (alpha 0 nas
bordas, ~255 no miolo), conteúdo real em `(464, 375)`–`(3517, 4608)` do
canvas 4000×5000 → ~3053×4233px, proporção ~0,72 (retrato).

Recortado (bounding box + margem de 50px pra sombra suave) e redimensionado
pro maior lado ~900px, salvo em `public/images/upsell/paper.png`. O PNG do
lápis (`public/images/upsell/pencil.png`) foi removido — não é mais usado.

## Componente: `paper-trail-effect.tsx`

`app/catalogo/[slug]/_components/paper-trail-effect.tsx`, `"use client"` —
isolado como folha do componente, o resto da página (`page.tsx`,
`upsell-card.tsx`) continua Server Component. (Nome original era
`paper-pencil-effect.tsx`/`PaperPencilEffect`, renomeado na revisão 1 depois
que o lápis saiu do escopo.)

```tsx
export function PaperTrailEffect() {
  // container com ref, uma <div>/<Image> de papel, <canvas> de rastro
}
```

Renderizado em `upsell-card.tsx` no lugar do placeholder antigo, sem props —
é puramente decorativo, não depende de dados do livro.

### Papel reagindo ao mouse

- `onMouseMove` no container calcula a posição do cursor normalizada
  (-1..1) em relação ao centro da caixa e aplica `rotateX`/`rotateY` (leve,
  via `perspective`) direto em `ref.style.transform` (não `useState`, pra
  não re-renderizar a cada pixel de movimento).
- Ao sair da caixa (`onMouseLeave`), a rotação volta a 0 (mesma transição
  CSS, ~120ms).

### Rastro que desaparece — e o porquê da técnica

- Um `<canvas>` posicionado sobre o papel, mesmo tamanho da caixa. A cada
  frame (`requestAnimationFrame`), desenha um segmento de linha (cor
  grafite) do ponto anterior ao atual quando o mouse se moveu.
- **O fade não é feito baixando `FADE_STRENGTH`.** `destination-out` com uma
  opacidade muito baixa esbarra em arredondamento de 8 bits por pixel: a
  remoção por frame vira `alpha * FADE_STRENGTH`, e quando esse valor cai
  abaixo de ~0,5 o canvas arredonda pra 0 — o traço **para de sumir e fica
  preso num resíduo visível pra sempre** (bug real encontrado ao testar: com
  `FADE_STRENGTH = 0.008`, o traço estabilizava em ~25% de opacidade e nunca
  ia embora). Confirmado via simulação isolada da curva de decaimento antes
  de fechar o valor.
- A correção: manter uma fração de remoção "segura" por passe
  (`FADE_STRENGTH = 0.05`, resíduo assintótico ~4%, imperceptível) e só
  aplicar esse passe a cada `FADE_EVERY_N_FRAMES = 6` frames — o desenho de
  novos segmentos continua todo frame (responsivo), só o desgaste roda mais
  devagar. Resultado simulado: traço bem visível em ~1s, perceptível ainda
  em ~3s, quase invisível por volta de 7s — bem mais longo que a primeira
  versão (que sumia quase por completo em ~1,5s) sem deixar mancha
  permanente.
- Loop cancelado (`cancelAnimationFrame`) e listeners removidos no unmount.

**Simplificação assumida:** o rastro é uma camada 2D plana por cima do
papel — não acompanha a perspectiva 3D dele quando está inclinado (exigiria
projeção em WebGL/CSS 3D real do canvas, fora de escopo). Com a inclinação
leve (±10°), o efeito lê bem mesmo assim.

### Fallbacks

- **Sem mouse fino** (`(hover: hover) and (pointer: fine)` falso, via
  `matchMedia` checado no mount): não registra nenhum listener de mouse, não
  renderiza o `<canvas>` — só o papel parado, sem rotação.
- **`prefers-reduced-motion: reduce`**: mesmo tratamento.

## Fora de escopo

- Rastro não acompanha perspectiva 3D do papel (ver simplificação acima).
- Sem suporte a touch/arrastar dedo para desenhar — mobile só vê o estado
  estático.
- Sem reaproveitamento do efeito em outro lugar do site por enquanto — fica
  específico do `UpsellCard`.
- Não alteramos `book.upsell` no schema nem em `books.ts` — o efeito é
  puramente visual, o dado do upsell já existe.

---

## Revisão 1 (depois do primeiro teste)

A primeira versão (duas folhas + lápis) foi implementada, testada
visualmente e apresentava 3 problemas relatados pelo usuário em produção:

1. Lápis visualmente desalinhado do traço sendo desenhado.
2. Caixa grande demais — a folha de trás praticamente não aparecia atrás da
   da frente.
3. Rastro sumindo rápido demais.

Decisão do usuário: remover o lápis inteiramente (o traço nasce direto onde
o cursor passa, sem precisar manter um elemento alinhado a ele), usar uma
folha só, reduzir a caixa, e fazer o rastro durar mais. Também trocou o PNG
do papel por um novo. As seções acima já refletem esse resultado final; esta
seção fica só como registro do porquê da mudança de rumo.

## Revisão 2 (lápis de volta, formato "canhoto de ingresso" rejeitado)

Duas rodadas depois da Revisão 1, o usuário pediu pra otimizar o design da
seção inteira do `UpsellCard` (não só o efeito de papel). Essa rodada
intermediária:

1. Trocou o botão de `bg-accent` (dourado, lido como fraco/deslocado) por
   `bg-primary` (vinho, mesmo tom do CTA da Hero) — **decisão mantida**.
2. Reformatou o card em "canhoto de ingresso": painel de texto em
   `bg-card` + painel do papel em `bg-secondary` (creme), separados por
   linha pontilhada com dois furos circulares — **rejeitada**: usuário não
   quis nenhuma cor nova atrás do papel, e achou a barra de furos "too
   much".
3. Nessa reformatação a folha única (da Revisão 1) ficou isolada dentro do
   painel creme.

Feedback do usuário, com referência visual (foto com anotação "APENAS
NESSA" apontando pra folha da frente): voltar a ter **folhas "jogadas"**
(mais de uma, espalhadas/sobrepostas como jogadas sobre a mesa, não
perfeitamente empilhadas) e **trazer o lápis de volta** — mas funcionando
só na folha da frente.

### Decisões finais (estado atual)

1. **Sem painel colorido atrás do papel.** Removido `bg-secondary`, a
   borda pontilhada e os furos. O efeito fica direto sobre o fundo da
   seção (branco, sem alteração) — só a folha em si tem sombra.
2. **Card de texto simples**, igual ao padrão do resto do site
   (`bg-card` + `border-border` + `rounded-[28px]`), sem painel irmão.
3. **Duas folhas "jogadas"**, não mais uma: uma atrás, parada e sem
   nenhum listener (puramente decorativa, `aria-hidden`), e uma na
   frente, que concentra toda a interatividade — tilt no mouse, rastro no
   canvas, e agora também o lápis. Cada uma com sua própria rotação fixa
   (`rotate(9deg)` a de trás, `rotate(-6deg)` a da frente) pra parecerem
   soltas, não alinhadas.
4. **Lápis de volta, mas resolvendo o bug da Revisão 1**: em vez de um PNG
   girado dinamicamente em torno do centro da imagem (causa do
   desalinhamento original), o lápis agora é um **SVG desenhado na
   vertical**, com a ponta posicionada exatamente no ponto de
   `transform-origin` (`50% 100%`, a base do viewBox). Rotação em torno da
   própria ponta nunca desloca esse ponto — a ponta é então colada no
   cursor com `translate3d` num wrapper externo. Verificado
   matematicamente (`SVGPoint.matrixTransform(getScreenCTM())`): erro
   sub-pixel entre a ponta renderizada e o ponto do cursor.
5. **Lápis só existe na folha da frente**: o wrapper interativo
   (`containerRef`, com todos os listeners de mouse) é o mesmo elemento
   que delimita a folha da frente — a folha de trás nunca recebe eventos,
   então o lápis nunca aparece nem reage nela. Ângulo de repouso do lápis
   fixo (`-35deg`), sem rotação dinâmica por direção de movimento (outra
   fonte comum de bug, evitada de propósito).
6. **Rastro no canvas**: técnica de fade inalterada da Revisão 1
   (`FADE_STRENGTH = 0.05` a cada 6 frames) — já validada, não mexida.
7. **Mobile/touch**: continua mostrando só as folhas paradas (sem canvas,
   sem lápis, sem listeners) — mesmo comportamento de sempre.

### Componente

Renomeado de `paper-trail-effect.tsx`/`PaperTrailEffect` para
`paper-sketch-effect.tsx`/`PaperSketchEffect` — o escopo voltou a incluir o
lápis, então o nome "trail" (só rastro) ficou incompleto. Mesmo padrão de
naming das revisões anteriores (nome reflete o escopo atual do
componente).

## Revisão 3 (lápis e rastro removidos de vez, folhas maiores)

Depois de testar a Revisão 2 em produção, o usuário não gostou do lápis
vetor aparecendo sobre a folha ao desenhar — mesmo com o bug de
alinhamento já corrigido. Decisão: remover a função de desenhar na folha
por completo (canvas de rastro) e remover o lápis junto, não só ajustar.
Pediu também para aumentar as duas folhas, que estavam pequenas demais
perto do resto do conteúdo da página.

### Decisões finais (estado atual)

1. **Canvas de rastro removido por completo** — sem `<canvas>`, sem loop
   de `requestAnimationFrame`, sem lógica de fade. O papel não recebe mais
   nenhum rabisco.
2. **Lápis removido por completo** — sem o SVG, sem `pencilRef`, sem
   `translate3d` seguindo o cursor.
3. **Tilt 3D mantido**: a folha da frente continua inclinando levemente
   (`rotateX`/`rotateY` via `perspective`) ao mover o mouse dentro da
   caixa, e volta a 0 ao sair — isso não foi pedido para remoção.
4. **Folhas ~1.5x maiores**, para ficarem alinhadas visualmente ao card de
   texto ao lado (`lg:max-w-md`, 448px): caixa de `max-w-[300px]` para
   `max-w-[460px]`, cada folha de `~160×208px` (`h-52 w-40`) para
   `~230×300px` (proporção do PNG preservada, `object-contain` absorve a
   diferença sub-pixel).
5. **Mobile/touch/reduced-motion**: sem mudança — continua mostrando só
   as folhas paradas, sem nenhum listener.

### Componente

Renomeado de `paper-sketch-effect.tsx`/`PaperSketchEffect` para
`paper-tilt-effect.tsx`/`PaperTiltEffect` — sem lápis nem rastro, só sobra
o tilt no mouse. Mesmo padrão de naming das revisões anteriores.

## Revisão 4 (tilt na folha de trás + rastreio global)

O usuário gostou do tilt da folha da frente e pediu duas mudanças: (1)
aplicar o mesmo efeito na folha de trás, que até então ficava
completamente estática; (2) fazer o rastreio funcionar "globalmente" — ou
seja, reagir ao mouse em qualquer lugar da página, não só quando o cursor
está bem em cima da caixa pequena das folhas (a área de hover era só
`h-[300px] w-[230px]`/`sm:h-[340px] sm:w-[260px]`, fácil de sair sem
perceber).

### Decisões

1. **Ambas as folhas inclinam** com o mesmo `MAX_TILT_DEG = 10`, cada uma
   mantendo sua rotação de repouso própria (`FRONT_SHEET_ROTATE_DEG = -6`,
   `BACK_SHEET_ROTATE_DEG = 9`) como base do `rotate()` antes do
   `rotateX`/`rotateY` dinâmico.
2. **Rastreio movido de `container.mousemove` (a caixa da folha) para
   `window.mousemove`.** A posição do cursor é normalizada (-1..1) contra
   `window.innerWidth`/`innerHeight` (antes era contra o
   `getBoundingClientRect()` da caixinha) — o tilt agora responde ao mouse
   em qualquer ponto da janela, com o efeito ficando mais suave por ser
   mapeado numa área bem maior.
3. **Reset ao sair:** trocado de `mouseleave` no container para
   `mouseleave` em `document` (dispara quando o cursor sai da viewport do
   navegador) — mesma lógica de zerar a rotação, só que no nível certo
   agora que o rastreio não é mais por elemento.
4. **`containerRef` da folha da frente removido** — não é mais necessário
   como alvo de listener nem para `getBoundingClientRect()`; cada folha
   agora só tem sua própria ref (`frontPaperRef`/`backPaperRef`) pra
   aplicar o transform.
5. **Gate de interatividade inalterado**: `matchMedia` hover/pointer fino
   + reduced-motion continua decidindo se os listeners são registrados —
   mobile/touch/reduced-motion seguem vendo só as folhas paradas.
