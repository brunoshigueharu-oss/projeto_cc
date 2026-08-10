# Project: [Nome do Projeto]

## Tech Stack
- Next.js 16 (App Router), React 19, TypeScript 7
- TailwindCSS 4, shadcn 4.16
- React Hook Form 7.85 + Zod 4.4 (validação)
- Server Component First

## Commands
- `npm run dev` — servidor local (porta 3000)
- `npm run build` — build de produção
- `npm run type-check` — `tsc --noEmit`
- `npm run lint` — eslint

> Ao criar rotas novas, rode `npm run dev` (ou `build`) UMA vez antes do
> `type-check`: `PageProps`/`LayoutProps` são tipos gerados em
> `.next/dev/types/routes.d.ts` a partir das rotas existentes.

## Architecture
- App Router: rotas em `app/`, agrupadas por `(grupo)/`
- Server Components por padrão — só adicionar `'use client'` quando usar hooks/eventos/browser APIs
- Mutações via Server Actions em `actions/` — NUNCA chamar DB direto em Client Components
- `components/ui/` — primitivos reutilizáveis (shadcn)
- `components/` — componentes de feature
- `lib/` — helpers, clients (supabase, stripe), configurações
- `lib/data/` — dados estáticos do site + schemas Zod, validados no topo do módulo
- `types/` — tipos globais e schemas Zod compartilhados

> shadcn neste projeto usa o estilo `base-nova` sobre `@base-ui/react` (não
> Radix). O wrapper `form` clássico não existe nesse estilo — o equivalente é
> `field` (`Field`/`FieldLabel`/`FieldError`), cujo `FieldError` já aceita o
> formato de `fieldState.error` do React Hook Form. Ver
> `app/contato/_components/contact-form.tsx`.

## Code Style
- NEVER use `any` explícito — usar `unknown` + type guard
- Imports: ES modules (import/export), sem require()
- Tailwind only — sem CSS inline, sem styled-components
- Novos design tokens vão em `app/globals.css`, no bloco `@theme inline`, antes de usar
  (Tailwind 4 é CSS-first — este projeto não tem `tailwind.config.ts`)
- Classe Tailwind dinâmica não funciona (`bg-universe-${tone}`): o scanner só
  enxerga nomes completos. Mapear para classe literal, como em `lib/tone.ts`
- Nomes de arquivo: kebab-case. Componentes: PascalCase

## Environment Variables
- `NEXT_PUBLIC_*` apenas para valores seguros no client
- Segredos (DB, API keys) apenas em Server Actions ou Route Handlers
- Copiar `.env.example` para `.env.local` ao clonar

## Workflow
- ALWAYS run `npm run type-check && npm run lint` após uma série de mudanças
- Rodar um teste por vez, não o suite completo: `npm run test -- NomeDoArquivo`
- Branch naming: `feat/`, `fix/`, `chore/` + descrição em kebab-case
- Commits em inglês, imperativo: "add OAuth callback handler"

## Common Gotchas
- `revalidatePath()` e `revalidateTag()` só funcionam em Server Actions/Route Handlers
- Middleware em `middleware.ts` na raiz — não dentro de `app/`
- Supabase client no server: usar `createServerClient` (cookies). No client: `createBrowserClient`
- Imagens externas precisam de domínio autorizado em `next.config.ts` (remotePatterns)
