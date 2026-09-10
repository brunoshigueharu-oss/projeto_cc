# Redesenho da seção "itens da caixa" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesenhar a faixa de vídeos "itens da caixa" (`BoxContentsSection`) com cabeçalho de texto, botões de navegação estilo Hero, e um indicador de "clique para ampliar" mais sutil.

**Architecture:** Mudança contida a um único Client Component existente (`box-contents-section.tsx`). Nenhum novo arquivo, nenhuma nova dependência, nenhuma mudança de dados/schema — só reescreve o JSX/estado do componente.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, `lucide-react` (ícones), `clsx`/`tailwind-merge` via `cn()` (`lib/utils.ts`).

**Spec:** `docs/superpowers/specs/2026-09-10-box-contents-section-redesign-design.md`

## Global Constraints

- Nunca usar `any` explícito — usar `unknown` + type guard se necessário.
- Tailwind only — sem CSS inline, sem styled-components.
- Ícones só de `lucide-react`, `size-4` inline com texto (`size-3`/`3.5` em contextos compactos).
- Nunca hex direto num componente — usar classes semânticas do design system (`text-foreground`, `bg-background`, `text-muted-foreground`, `border-border` etc.); exceção documentada só para overlays sobre mídia (`bg-black/NN`, `text-white`), já usado hoje no modal deste mesmo componente.
- `ALWAYS run npm run type-check && npm run lint` após a mudança (regra do projeto).
- Título fixo da seção: **"confira o que vem dentro da caixa"** (minúsculas, conforme referência do usuário).
- Não existe framework de teste de componente React neste projeto (só `vitest` para lógica pura — sem `@testing-library/react`). Verificação é `type-check` + `lint` + teste manual no browser via `npm run dev`, conforme instruído no `CLAUDE.md` do projeto ("For UI or frontend changes, start the dev server and use the feature in a browser before reporting the task as complete").

---

### Task 1: Reescrever `BoxContentsSection` com cabeçalho, navegação e hover sutil

**Files:**
- Modify: `app/(site)/catalogo/[slug]/_components/box-contents-section.tsx` (arquivo inteiro, 178 linhas hoje)
- Verify only (não muda): `app/(site)/catalogo/[slug]/page.tsx:119` (já renderiza `<BoxContentsSection book={book} />`, continua igual)
- Verify only (não muda): `lib/data/books.ts:644-668` (dados de `os-contos-do-planta-caixa-de-reliquias.boxContents`, já tem os 4 itens incluindo o livro)

**Interfaces:**
- Consumes: `Book["boxContents"]` de `lib/data/schemas.ts:111-123` — `{ openingVideoSrc?: string; items: { videoSrc: string; label?: string }[] }`. `Locale` de `lib/data/schemas.ts` (usado em `DIALOG_LABELS`).
- Produces: `BoxContentsSection({ book: Book })` — mesma assinatura pública de hoje, nenhum outro arquivo precisa mudar.

- [ ] **Step 1: Substituir o conteúdo do arquivo**

Arquivo: `app/(site)/catalogo/[slug]/_components/box-contents-section.tsx`

```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Book, Locale } from "@/lib/data/schemas";

const DIALOG_LABELS: Record<Locale, string> = {
  pt: "Itens da caixa",
  en: "Box contents",
};

const NAV_BUTTON_CLASSNAME =
  "absolute top-1/2 z-10 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/80 text-foreground shadow-sm backdrop-blur-[10px] transition-opacity hover:bg-background disabled:pointer-events-none disabled:opacity-40 sm:flex";

/**
 * Faixa horizontal com os vídeos dos itens da caixa, com scroll manual
 * (arrasto/roda do mouse) e botões de navegação — só renderiza quando
 * `book.boxContents` existe. Primeiro e último item aparecem maiores para
 * dar ritmo à faixa. Clicar abre o vídeo em modo expandido, com navegação
 * entre eles.
 */
export function BoxContentsSection({ book }: { book: Book }) {
  const { boxContents } = book;

  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const items = boxContents?.items ?? [];
  const itemLabels = items
    .map((item) => item.label)
    .filter((label): label is string => Boolean(label));

  const close = useCallback(() => setOpenIndex(null), []);
  const showPrevious = useCallback(
    () => setOpenIndex((current) => (current === null ? current : (current - 1 + items.length) % items.length)),
    [items.length],
  );
  const showNext = useCallback(
    () => setOpenIndex((current) => (current === null ? current : (current + 1) % items.length)),
    [items.length],
  );

  useEffect(() => {
    if (openIndex === null) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") showPrevious();
      if (event.key === "ArrowRight") showNext();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openIndex, close, showPrevious, showNext]);

  const updateScrollState = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanScrollPrev(el.scrollLeft > 8);
    setCanScrollNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    updateScrollState();
    window.addEventListener("resize", updateScrollState);
    return () => window.removeEventListener("resize", updateScrollState);
  }, [updateScrollState, items.length]);

  const scrollByStep = useCallback((direction: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const firstItem = el.firstElementChild as HTMLElement | null;
    const step = firstItem ? firstItem.offsetWidth + 24 : el.clientWidth * 0.8;
    el.scrollBy({ left: direction * step, behavior: "smooth" });
  }, []);

  if (!boxContents) {
    return null;
  }

  return (
    <section className="border-t border-border py-20">
      {boxContents.openingVideoSrc ? (
        <div className="mx-auto mb-12 max-w-2xl overflow-hidden rounded-2xl px-4 sm:px-6">
          <video
            className="h-full w-full object-cover"
            src={boxContents.openingVideoSrc}
            autoPlay
            loop
            muted
            playsInline
          />
        </div>
      ) : null}

      <div className="mx-auto mb-8 max-w-6xl px-4 text-center sm:px-6">
        <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
          confira o que vem dentro da caixa
        </h2>
        {itemLabels.length > 0 ? (
          <p className="mt-2 font-sans text-base font-normal text-muted-foreground sm:text-lg">
            {itemLabels.join(", ")}
          </p>
        ) : null}
      </div>

      <div className="relative">
        {items.length > 1 ? (
          <button
            type="button"
            aria-label="Item anterior"
            onClick={() => scrollByStep(-1)}
            disabled={!canScrollPrev}
            className={cn(NAV_BUTTON_CLASSNAME, "left-2 sm:left-4")}
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
        ) : null}

        <div
          ref={scrollerRef}
          onScroll={updateScrollState}
          className="flex snap-x snap-mandatory items-center gap-4 overflow-x-auto px-4 pb-2 sm:gap-6 sm:px-6"
        >
          {items.map((item, index) => {
            const isEdge = index === 0 || index === items.length - 1;

            return (
              <button
                key={item.videoSrc}
                type="button"
                onClick={() => setOpenIndex(index)}
                aria-label={item.label ? `Ver em tela cheia: ${item.label}` : "Ver em tela cheia"}
                className={cn(
                  "group relative aspect-[1670/1970] shrink-0 snap-center overflow-hidden rounded-2xl transition-shadow duration-300 ease-out hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                  isEdge ? "h-72 sm:h-96" : "h-56 sm:h-72",
                )}
              >
                <video
                  className="h-full w-full object-cover"
                  src={item.videoSrc}
                  autoPlay
                  loop
                  muted
                  playsInline
                />
                <span className="absolute bottom-2 right-2 flex size-7 items-center justify-center rounded-full border border-white/30 bg-black/30 text-white opacity-70 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                  <Expand className="size-3.5" aria-hidden="true" />
                </span>
              </button>
            );
          })}
        </div>

        {items.length > 1 ? (
          <button
            type="button"
            aria-label="Próximo item"
            onClick={() => scrollByStep(1)}
            disabled={!canScrollNext}
            className={cn(NAV_BUTTON_CLASSNAME, "right-2 sm:right-4")}
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {openIndex !== null ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={items[openIndex].label ?? DIALOG_LABELS[book.locale]}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-6"
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            aria-label="Fechar"
            className="absolute right-6 top-6 text-white/80 transition hover:text-white"
          >
            <X className="size-8" aria-hidden="true" />
          </button>

          {items.length > 1 ? (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  showPrevious();
                }}
                aria-label="Item anterior"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 transition hover:text-white sm:left-6"
              >
                <ChevronLeft className="size-10" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  showNext();
                }}
                aria-label="Próximo item"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 transition hover:text-white sm:right-6"
              >
                <ChevronRight className="size-10" aria-hidden="true" />
              </button>
            </>
          ) : null}

          <div
            className="relative h-[85vh] w-auto max-w-[90vw]"
            onClick={(event) => event.stopPropagation()}
          >
            <video
              key={items[openIndex].videoSrc}
              className="h-full w-full object-contain"
              src={items[openIndex].videoSrc}
              autoPlay
              loop
              muted
              playsInline
              controls
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
```

Notas sobre o que mudou em relação ao arquivo atual:
- Removido o state `hoveredIndex` e toda a lógica de "spotlight" (`isDimmed`, `scale-105`, `shadow-2xl`, ícone `Expand` grande centralizado que só aparecia no hover).
- Adicionado: bloco de cabeçalho (título + subtítulo com nomes dos itens), `NAV_BUTTON_CLASSNAME` + dois botões (`ChevronLeft`/`ChevronRight`) com `scrollByStep`, estado `canScrollPrev`/`canScrollNext` atualizado em scroll/resize/mount, e o ícone `Expand` pequeno fixo no canto inferior direito de cada item.
- O modal (`openIndex !== null`) foi mantido **idêntico** ao arquivo original — só copiado como está.

- [ ] **Step 2: Rodar o type-check**

Run: `npm run type-check`
Expected: sem erros relacionados a `box-contents-section.tsx` (o comando roda `tsc --noEmit` no projeto inteiro — confirme que nenhum erro novo aparece nesse arquivo).

- [ ] **Step 3: Rodar o lint**

Run: `npm run lint`
Expected: sem warnings/erros novos em `box-contents-section.tsx` (ex.: hooks exhaustive-deps, unused vars).

- [ ] **Step 4: Testar manualmente no browser**

Run: `npm run dev`, depois abrir `/catalogo/os-contos-do-planta-caixa-de-reliquias` (slug real com `boxContents` cadastrado, ver `lib/data/books.ts:552`) e rolar até a seção "confira o que vem dentro da caixa".

Checklist visual:
- Título "confira o que vem dentro da caixa" aparece centralizado, seguido pelos 4 nomes dos itens ("Contos do Planta 2, Jornal, Tabuleiro, Cards e Postais") em fonte mais leve/clara.
- Os 4 itens aparecem na faixa (incluindo o vídeo do livro "Contos do Planta 2" como primeiro item).
- Setas de navegação (círculo translúcido com blur) aparecem nas laterais em telas `sm:` pra cima; clicar rola a faixa suavemente; a seta esquerda começa desabilitada/esmaecida (já está no início) e a direita fica desabilitada ao chegar no fim.
- Passar o mouse sobre um item **não** escurece os vizinhos nem cresce o item — só um leve `shadow-md`.
- O ícone pequeno de expandir aparece sempre visível (opacidade ~70%) no canto inferior direito de cada item, sem depender de hover.
- Clicar num item ainda abre o modal de tela cheia com navegação por setas grandes e `Esc`/`←`/`→` funcionando, igual a antes.
- Testar em viewport estreito (~390px) — a faixa rola por arrasto/toque mesmo sem os botões (que ficam ocultos abaixo de `sm:`).

Se algo do checklist falhar, corrigir o componente antes de prosseguir.

- [ ] **Step 5: Commit**

```bash
git add "app/(site)/catalogo/[slug]/_components/box-contents-section.tsx"
git commit -m "$(cat <<'EOF'
feat(catalogo): redesign box contents section with header and nav arrows

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```
