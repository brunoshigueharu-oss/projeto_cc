# Efeito papel + lápis no card de upsell — design

## Contexto

O site antigo (Wix) tinha, em algum ponto, um efeito decorativo de duas
folhas de papel empilhadas que inclinavam conforme o mouse se movia (a de
cima numa velocidade, a de trás numa velocidade um pouco menor), com um
lápis que seguia o cursor e "escrevia" um rabisco no papel por onde passava.
O usuário quer recriar esse efeito no site novo, usando dois PNGs fornecidos
(uma folha de papel e um lápis, ambos fotografados em estúdio sobre fundo
transparente).

Referência de vídeo do efeito original:
`/Users/brunohigashi/Documents/Gravação de Tela 2026-08-12 às 14.18.20.mov`.

## Onde entra

`app/catalogo/[slug]/_components/upsell-card.tsx` — o card "Exclusivo Hocus
Pocus" do exemplar autografado (hoje só populado para o livro `O Planta`,
via `book.upsell` em `lib/data/books.ts`). O card tem hoje uma coluna de
texto (`flex-1`) e, ao lado, um placeholder decorativo com o selo:

```tsx
<div className="relative flex h-64 w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted lg:h-full lg:w-64">
  <Seal className="size-24 opacity-[0.08]" />
</div>
```

Esse placeholder é substituído pelo novo efeito.

## Decisões (confirmadas com o usuário)

1. **Layout:** a coluna de texto ganha um teto de largura (`lg:max-w-xs`) em
   vez de `flex-1` puro, abrindo espaço pra coluna visual crescer de 256px
   para algo em torno de 420×540px — proporção próxima do papel (retrato,
   ~0,74).
2. **Área de interação:** o tilt do papel e o lápis só reagem ao mouse
   dentro da caixa do efeito, não na página inteira.
3. **Rastro do lápis:** um rabisco cinza/grafite aparece por onde o lápis
   passa sobre o papel e **desaparece com o tempo** (fade), em vez de
   persistir ou resetar só ao sair da área.
4. **Mobile/touch:** sem mouse, mostra só as duas folhas paradas — sem
   lápis, sem canvas, sem listeners de puntear/touch.

## Assets

As duas imagens originais (fundo transparente confirmado — alpha 0 nas
bordas, ~255 no miolo) têm bounding box útil bem menor que o canvas:

- Papel (`AdobeStock_2068535405.png`, 4096×4096): conteúdo real em
  `(1012, 684)`–`(3042, 3416)` → ~2030×2732px, proporção ~0,74 (retrato).
- Lápis (`AdobeStock_1904617990.png`, 5632×3072): conteúdo real em
  `(263, 1426)`–`(5366, 1739)` → ~5103×313px, bem fino e alongado, ponta
  para a esquerda do frame.

Ambas recortadas (bounding box + pequena margem de segurança para a sombra
suave) e redimensionadas para um tamanho razoável de exibição (maior lado
~1400px), salvas em:

- `public/images/upsell/paper.png`
- `public/images/upsell/pencil.png`

Os arquivos originais em `Downloads/` não são alterados.

## Componente: `paper-pencil-effect.tsx`

Novo arquivo `app/catalogo/[slug]/_components/paper-pencil-effect.tsx`,
`"use client"` — isolado como folha do componente, o resto da página
(`page.tsx`, `upsell-card.tsx`) continua Server Component.

```tsx
export function PaperPencilEffect() {
  // container com ref, duas <img> de papel, <img> de lápis, <canvas> de rastro
}
```

Renderizado em `upsell-card.tsx` no lugar do placeholder atual, sem props —
é puramente decorativo, não depende de dados do livro.

### Duas folhas com "velocidades" diferentes

- `onMouseMove` no container calcula a posição do cursor normalizada
  (-1..1) em relação ao centro da caixa.
- Em vez de um loop de animação por camada, as duas folhas recebem a
  **mesma** rotação-alvo (`rotateX`/`rotateY`, leve, via `perspective`),
  aplicada diretamente via `ref.style.transform` (não `useState`, pra não
  re-renderizar a cada pixel de movimento do mouse).
- A diferença de "velocidade" vem do `transition-duration` de cada camada:
  folha da frente ~90ms (mais responsiva), folha de trás ~180ms (mais lenta,
  com leve atraso perceptível) — e a folha de trás com amplitude de rotação
  um pouco menor (ex.: ±10° frente, ±6° trás).
- Ao sair da caixa (`onMouseLeave`), a rotação volta a 0 nas duas camadas
  (mesma transição).

### Lápis seguindo o mouse

- `<img>` do lápis, posição absoluta, `pointer-events-none`, transladado
  para a posição do cursor (`translate(x, y)`) menos um offset pra ponta
  ficar no cursor, com rotação fixa (~-40°, ponta apontando pro canto onde o
  cursor está).
- Fade-in ao entrar na área (`onMouseEnter`), fade-out ao sair
  (`onMouseLeave`), via opacidade com transição CSS.

### Rastro que desaparece

- Um `<canvas>` posicionado sobre a folha da frente, mesmo tamanho da caixa.
- A cada frame (`requestAnimationFrame`):
  1. Erode o desenho existente (ex.: `globalCompositeOperation =
     "destination-out"` com um preenchimento de baixa opacidade sobre todo o
     canvas) — cria o efeito de fade sem guardar histórico de pontos.
  2. Se o mouse se moveu desde o último frame, desenha um segmento de linha
     (cor grafite, `lineCap`/`lineJoin` arredondados) do ponto anterior até o
     atual.
- Loop cancelado (`cancelAnimationFrame`) e listeners removidos no unmount.

**Simplificação assumida:** o rastro é uma camada 2D plana por cima da
folha — não acompanha a perspectiva 3D da folha quando ela está inclinada
(exigiria projeção em WebGL/CSS 3D real do canvas, fora de escopo). Com a
inclinação leve prevista (±10-14°), o efeito deve ler bem mesmo assim.

### Fallbacks

- **Sem mouse fino** (`(hover: hover) and (pointer: fine)` falso, via
  `matchMedia` checado no mount): não registra nenhum listener de mouse, não
  renderiza `<canvas>` nem o lápis — só as duas folhas paradas, sem
  rotação.
- **`prefers-reduced-motion: reduce`**: mesmo tratamento — folhas estáticas,
  sem tilt, sem lápis, sem canvas.

## Fora de escopo

- Rastro não acompanha perspectiva 3D da folha (ver simplificação acima).
- Sem suporte a touch/arrastar dedo para desenhar — mobile só vê o estado
  estático.
- Sem reaproveitamento do efeito em outro lugar do site por enquanto — fica
  específico do `UpsellCard`. Se quiserem usar em outra página depois, isso
  vira uma iteração separada de extrair o componente pra
  `components/`.
- Não vamos alterar `book.upsell` no schema nem em `books.ts` — o efeito é
  puramente visual, o dado do upsell já existe.
