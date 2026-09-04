# Parallax do Yanayag como divisor no "Sobre o projeto" da campanha Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trazer a faixa de parallax do Yanayag (hoje só na página de catálogo) para dentro do bloco "Sobre o projeto" da página de campanha, como divisor full-width logo depois do primeiro parágrafo.

**Architecture:** `ParallaxSection` (Client Component existente) migra de `app/(site)/catalogo/[slug]/_components/` para o diretório global `components/`, sem mudanças internas. `CampaignAbout` (Server Component) passa a retornar um fragment com duas `<section>` (`max-w-6xl`) e a `ParallaxSection` encostada entre elas, sem container, para ficar full-width.

**Tech Stack:** Next.js 16 App Router, React 19 Server Components, TailwindCSS 4, TypeScript.

**Spec:** `docs/superpowers/specs/2026-09-01-campanha-about-parallax-design.md`

## Global Constraints

- Nenhum campo novo em `lib/data/schemas.ts` ou `lib/data/books.ts` — reaproveita `primaryBook.parallax`, já preenchido para o Yanayag.
- `ParallaxSection` não muda de comportamento nem de props (`layers: ParallaxLayer[]`).
- `npm run type-check && npm run lint` precisam passar sem erros novos após cada task (regra do projeto, `CLAUDE.md`).

---

### Task 1: Compartilhar `ParallaxSection` movendo para `components/`

**Files:**
- Move: `app/(site)/catalogo/[slug]/_components/parallax-section.tsx` → `components/parallax-section.tsx`
- Modify: `app/(site)/catalogo/[slug]/page.tsx:13` (import) e `:38` (comentário de estrutura)

**Interfaces:**
- Produces: `ParallaxSection` exportado de `@/components/parallax-section`, mesma assinatura atual — `ParallaxSection({ layers }: { layers: ParallaxLayer[] })`, `ParallaxLayer` também exportado do mesmo arquivo (usado por `lib/data/books.ts` via `book.parallax`, que já tipa como `ParallaxLayer[]` — confirmar que o tipo é importado de algum lugar em `schemas.ts`/`books.ts` e ajustar esse import também, se existir).

- [ ] **Step 1: Verificar se `ParallaxLayer` é importado em outro arquivo**

Rode: `grep -rn "ParallaxLayer" --include="*.ts" --include="*.tsx" .`

Se algum arquivo fora de `parallax-section.tsx` importar esse tipo (ex.: `lib/data/schemas.ts` para tipar `book.parallax`), anote o caminho — o import precisa apontar pro novo local no Step 3.

- [ ] **Step 2: Mover o arquivo preservando histórico**

```bash
git mv "app/(site)/catalogo/[slug]/_components/parallax-section.tsx" "components/parallax-section.tsx"
```

- [ ] **Step 3: Atualizar o import em `catalogo/[slug]/page.tsx`**

Em `app/(site)/catalogo/[slug]/page.tsx:13`, troque:

```ts
import { ParallaxSection } from "./_components/parallax-section";
```

por:

```ts
import { ParallaxSection } from "@/components/parallax-section";
```

Se o Step 1 encontrou outro arquivo importando `ParallaxLayer` do caminho antigo, atualize esse import da mesma forma (`@/components/parallax-section`).

- [ ] **Step 4: Atualizar o comentário de estrutura no mesmo arquivo**

Em `app/(site)/catalogo/[slug]/page.tsx:38`, troque a linha:

```
 *   _components/parallax-section   faixa decorativa opcional (book.parallax)
```

por:

```
 *   components/parallax-section    faixa decorativa opcional (book.parallax) —
 *                                  compartilhada com a página de campanha
```

- [ ] **Step 5: Rodar type-check e lint**

Rode: `npm run type-check && npm run lint`
Esperado: sem erros novos (o único import afetado foi corrigido no Step 3).

- [ ] **Step 6: Commit**

```bash
git add components/parallax-section.tsx "app/(site)/catalogo/[slug]/page.tsx"
git commit -m "refactor(catalogo): move ParallaxSection to shared components/"
```

---

### Task 2: Dividir `CampaignAbout` com o parallax como divisor full-width

**Files:**
- Modify: `app/(site)/campanhas/_components/campaign-about.tsx` (arquivo inteiro reescrito abaixo)

**Interfaces:**
- Consumes: `ParallaxSection` de `@/components/parallax-section` (Task 1); `Book`/`Campaign` de `@/lib/data/schemas` (sem mudança); `primaryBook.parallax` (`ParallaxLayer[] | undefined`, já existe em `lib/data/books.ts` para o Yanayag).
- Produces: `CampaignAbout` continua exportado com a mesma assinatura de props (`{ campaign: Campaign; primaryBook: Book | undefined }`) — nenhum consumidor (`app/(site)/campanhas/page.tsx`) precisa mudar.

- [ ] **Step 1: Reescrever `campaign-about.tsx`**

Conteúdo completo do arquivo:

```tsx
import Image from "next/image";
import Link from "next/link";

import { ParallaxSection } from "@/components/parallax-section";
import type { Book, Campaign } from "@/lib/data/schemas";

/**
 * "Sobre o projeto" (node 211:1425 do Figma): título, primeiro parágrafo
 * isolado, a faixa de parallax do livro (`book.parallax`) como divisor
 * full-width — mesma seção usada na página de catálogo — e o restante do
 * texto em duas colunas com a ficha técnica ao lado, seguido da tira de
 * páginas internas.
 *
 * A ficha é montada a partir do título principal da campanha, não de campos
 * próprios: `books.ts` já é a fonte de verdade de páginas, formato e ISBN, e
 * duplicar isso no registro da campanha só criaria divergência. Por isso o
 * rótulo do Figma — "Ficha Técnica Estimada" — vira "Ficha Técnica" quando o
 * livro já saiu, e continua "Estimada" enquanto a campanha está aberta.
 */
export function CampaignAbout({
  campaign,
  primaryBook,
}: {
  campaign: Campaign;
  primaryBook: Book | undefined;
}) {
  const paragraphs = campaign.about ?? [campaign.description];
  const [firstParagraph, ...restParagraphs] = paragraphs;
  const specs = buildSpecs(primaryBook);
  const gallery = campaign.gallery ?? primaryBook?.gallery ?? [];
  // "Estimada" só faz sentido enquanto o exemplar ainda não foi impresso —
  // numa campanha de evento ou assinatura o livro já existe, com ficha fechada.
  const isEstimated =
    campaign.status !== "encerrada" &&
    (campaign.kind === "pre-venda" || campaign.kind === "lancamento");

  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pt-16 sm:px-6 sm:pt-20">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-primary">
          Sobre o projeto
        </p>
        <h1 className="mt-3 max-w-3xl text-balance font-display text-3xl font-bold leading-[1.15] text-foreground sm:text-4xl">
          {campaign.title}
        </h1>
        <p className="mt-12 max-w-3xl text-lg leading-relaxed text-foreground">
          {firstParagraph}
        </p>
      </section>

      <ParallaxSection layers={primaryBook?.parallax ?? []} />

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="flex flex-col gap-12 pt-12 sm:pt-16 lg:flex-row lg:gap-16">
          <div className="flex flex-1 flex-col gap-6 text-lg leading-relaxed text-foreground">
            {restParagraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          {specs.length > 0 ? (
            <div className="w-full shrink-0 rounded-3xl border border-border bg-card p-7 lg:w-[420px]">
              <h2 className="font-display text-lg font-bold text-foreground">
                {isEstimated ? "Ficha Técnica Estimada" : "Ficha Técnica"}
              </h2>

              <dl className="mt-4">
                {specs.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-start justify-between gap-4 border-b border-border pb-2 pt-3 text-[13px] first:pt-0"
                  >
                    <dt className="text-muted-foreground">{row.label}</dt>
                    <dd className="text-right font-bold text-foreground tabular-nums">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>

              {primaryBook ? (
                <Link
                  href={`/catalogo/${primaryBook.slug}`}
                  className="mt-6 inline-flex text-xs font-medium uppercase tracking-[0.2em] text-primary underline-offset-4 hover:underline"
                >
                  Ver o livro no catálogo →
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>

        {gallery.length > 0 ? (
          <div className="mt-16">
            <h2 className="font-display text-xl font-bold text-foreground">
              Visualização das páginas internas
            </h2>
            <ul className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {gallery.map((image) => (
                <li
                  key={image.src}
                  className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-muted"
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </>
  );
}

/** Linhas da ficha, na ordem do Figma. Cada uma some quando o dado não veio. */
function buildSpecs(book: Book | undefined): Array<{ label: string; value: string }> {
  if (!book) {
    return [];
  }

  return [
    { label: "Autor", value: book.author.name },
    { label: "Editora", value: "Hocus Pocus" },
    ...(book.specs
      ? [
          { label: "Páginas", value: String(book.specs.pages) },
          { label: "Formato", value: `${book.specs.dimensions} (${book.specs.format})` },
          { label: "ISBN", value: book.specs.isbn },
        ]
      : []),
  ];
}
```

Mudanças em relação ao arquivo atual: import de `ParallaxSection`; `paragraphs` desestruturado em `firstParagraph`/`restParagraphs`; o `<section>` único virou fragment com duas `<section>` (padding `pt-*` na primeira, `pb-*` na segunda, sem gap entre elas e a faixa de parallax — mesmo padrão de `BookHero → ParallaxSection → AboutBookSection` no catálogo); primeiro parágrafo ganha `max-w-3xl` (mesma largura do `<h1>`); a `<div>` com `flex-col lg:flex-row` ganha `pt-12 sm:pt-16` (substitui o `mt-12` que existia entre o título e essa linha) e mapeia `restParagraphs` em vez de `paragraphs`. `buildSpecs` não muda.

- [ ] **Step 2: Rodar type-check e lint**

Rode: `npm run type-check && npm run lint`
Esperado: sem erros (nenhuma prop pública mudou, `app/(site)/campanhas/page.tsx` não precisa de alteração).

- [ ] **Step 3: Commit**

```bash
git add "app/(site)/campanhas/_components/campaign-about.tsx"
git commit -m "feat(campanhas): add Yanayag parallax as divider in about section"
```

---

### Task 3: Checagem visual manual

**Files:** nenhum (só verificação)

- [ ] **Step 1: Subir o dev server**

Rode: `npm run dev` (porta 3000)

- [ ] **Step 2: Conferir `/campanhas`**

Abrir `http://localhost:3000/campanhas` e checar:
- O primeiro parágrafo aparece sozinho, logo abaixo do título.
- A faixa de parallax do Yanayag aparece full-width (encostada nas bordas da viewport, sem o padding do container) logo depois do primeiro parágrafo, e anima ao rolar a página (camadas se deslocam em velocidades diferentes).
- Os parágrafos restantes + ficha técnica aparecem depois da faixa, no mesmo layout de duas colunas de antes.
- A galeria de páginas internas (se houver) continua no final, inalterada.

- [ ] **Step 3: Conferir `/catalogo/yanayag`**

Abrir `http://localhost:3000/catalogo/yanayag` e checar que a faixa de parallax entre o hero e "O Livro" continua funcionando normalmente após a mudança de local do arquivo (nenhuma regressão pela Task 1).

- [ ] **Step 4: Reportar resultado**

Nenhum commit nesta task — se algo estiver errado, voltar pra Task 1 ou 2 conforme o problema encontrado.
