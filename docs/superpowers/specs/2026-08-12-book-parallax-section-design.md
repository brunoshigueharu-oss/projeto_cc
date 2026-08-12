# Seção de parallax na página de livro — design

## Contexto

O site atual (Wix) tem, na página de cada livro, uma faixa decorativa entre as
informações do produto e os textos "O Livro" / "Sobre o Autor": um arco de
folhagem que emoldura um fundo desfocado de mata. No site novo (Next.js) essa
seção ainda não existe.

O usuário forneceu 6 PNGs recortados para o livro **Um Bípede Entre Plantas**
(slug `um-bipede-entre-plantas`), em
`/Users/brunohigashi/Documents/Site Ravaglio/parallax/O planta/png/{1..6}.png`,
todos no mesmo canvas 1920×1080:

- `1.png` — fundo desfocado da mata, sem transparência (opaco, cobre o frame
  inteiro).
- `2.png` — moita de folhas ocupando a parte de baixo do frame; resto
  transparente.
- `3.png`, `4.png`, `5.png`, `6.png` — o mesmo arco de folhagem no topo do
  frame, cada um com um padrão diferente de "buracos" transparentes no meio
  do arco (retrabalho de recorte, não guias de profundidade diferentes).

Pedido: ao rolar a página, essa faixa deve parecer que "se move" — parallax.

## Decisões (confirmadas com o usuário)

1. **Reaproveitável, não hardcoded.** Vira um campo opcional no schema de
   livro, para qualquer título futuro poder ter sua própria sequência de
   imagens.
2. **Posição:** entre `<BookHero />` e `<AboutBookSection />`, igual ao site
   atual.
3. **As 4 variações do arco (3/4/5/6) viram camadas de profundidade**, mesmo
   sendo visualmente parecidas — a ideia é que, empilhadas com velocidades de
   parallax diferentes, os buracos transparentes de cada uma se desloquem uns
   em relação aos outros durante o scroll, e cada camada "tapa" parte da
   transparência da anterior, resultando numa folhagem cheia com uma
   sensação orgânica de profundidade.

## Modelo de dados

Em `lib/data/schemas.ts`, novo campo opcional em `bookSchema`, seguindo o
mesmo padrão de `gallery`:

```ts
/** Opcional: camadas de imagem para a seção de parallax entre o hero e "O
 *  Livro", ordenadas de trás pra frente (fundo → primeiro plano). */
parallax: z.array(z.string().min(1)).min(1).optional(),
```

Em `lib/data/books.ts`, preenchido só para `um-bipede-entre-plantas`:

```ts
parallax: [
  "/images/parallax/um-bipede-entre-plantas/1.png", // fundo
  "/images/parallax/um-bipede-entre-plantas/2.png", // moita de baixo
  "/images/parallax/um-bipede-entre-plantas/4.png", // arco, buracos grandes
  "/images/parallax/um-bipede-entre-plantas/5.png", // arco, buracos médios
  "/images/parallax/um-bipede-entre-plantas/3.png", // arco quase cheio
  "/images/parallax/um-bipede-entre-plantas/6.png", // arco mais limpo (frente)
],
```

## Assets

Copiar os 6 PNGs originais (sem reprocessar/comprimir — `next/image` otimiza
sob demanda) para `public/images/parallax/um-bipede-entre-plantas/{1..6}.png`.

## Componente

Novo `app/catalogo/[slug]/_components/parallax-section.tsx`, **Server
Component** (sem `"use client"`):

```tsx
type ParallaxSectionProps = {
  layers: string[]; // ordenado fundo → frente
};

export function ParallaxSection({ layers }: ParallaxSectionProps) {
  if (layers.length === 0) return null;

  return (
    <section aria-hidden="true" className="relative isolate aspect-video w-full overflow-hidden">
      {layers.map((src, index) => (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          sizes="100vw"
          className="parallax-layer object-cover"
          style={{ "--parallax-shift": `${8 + index * 14}px` } as React.CSSProperties}
        />
      ))}
    </section>
  );
}
```

Notas:

- `aspect-video` (16:9) casa exatamente com o canvas original das imagens
  (1920×1080) — sem isso, um `object-cover` cortaria ou o topo do arco ou a
  moita de baixo, dependendo do `object-position`.
- Deslocamento por camada cresce linearmente com o índice (`8 + i * 14`px):
  fórmula genérica, funciona para qualquer quantidade de camadas que um
  livro futuro venha a ter — não é hardcoded para 6.
- Seção inteira é `aria-hidden="true"`: é puramente decorativa, nenhuma
  informação nova pro usuário.
- Em `page.tsx`, chamada sempre como `<ParallaxSection layers={book.parallax ?? []} />`
  — o componente decide sozinho se renderiza algo, mesmo padrão que
  `AboutBookSection`/`UpsellCard` já usam pra dados opcionais.

## Efeito de parallax — CSS puro (scroll-driven animations)

Sem JavaScript, sem Client Component. Em `app/globals.css`:

```css
@keyframes parallax-drift {
  from {
    transform: translateY(calc(var(--parallax-shift, 0px) * -1));
  }
  to {
    transform: translateY(var(--parallax-shift, 0px));
  }
}

.parallax-layer {
  animation-name: parallax-drift;
  animation-duration: 1ms; /* arbitrário: o tempo real vem do animation-timeline abaixo */
  animation-timing-function: linear;
  animation-fill-mode: both;
}

@supports (animation-timeline: view()) {
  .parallax-layer {
    animation-timeline: view();
    animation-range: cover 0% cover 100%;
  }
}
```

E o bloco de `prefers-reduced-motion` já existente (linhas 149–157) ganha
`.parallax-layer { animation: none; }` junto da regra universal — garante que
o movimento *scroll-linked* realmente desliga (um `animation-duration`
quase-zero sozinho não é garantia suficiente quando o "tempo" da animação vem
do scroll, não do relógio).

**Degradação:** em navegador sem suporte a `animation-timeline: view()`
(cobertura ampla — Chrome/Edge 115+, Safari 26+, Firefox recente — mas não
100%), a regra dentro do `@supports` simplesmente não se aplica; a animação
roda como time-based com `1ms` de duração (imperceptível) e para no estado
final (`fill-mode: both`), ou seja, a imagem fica estática, empilhada, sem
quebrar nada.

## Fora de escopo

- Não vamos comprimir/reencodar os PNGs originais.
- Não vamos criar fallback em JavaScript (scroll listener) — se no futuro o
  suporte a `animation-timeline: view()` se mostrar insuficiente pro público
  do site, isso vira uma iteração separada.
- Não vamos aplicar esse campo a nenhum outro livro agora — só
  `um-bipede-entre-plantas` recebe dados em `books.ts`.
