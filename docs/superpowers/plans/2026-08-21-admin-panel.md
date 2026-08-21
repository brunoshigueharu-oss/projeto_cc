# Painel Admin (pedidos, dashboard) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dar ao dono da loja uma área `/admin` dentro do próprio Hocus Pocus pra ver métricas gerais, listar todos os pedidos e abrir o detalhe de cada um.

**Architecture:** Route group `app/(admin)/` protegido em três camadas — `proxy.ts`/`updateSession` (redireciona antes de renderizar), `requireAdminSession()` no Server Component (defesa em profundidade), e RLS no Postgres via uma função `security definer` não-recursiva (última linha, independente do app). Sem service role key: o admin lê com a própria sessão Supabase, e o banco decide o que ele pode ver.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase (Postgres + Auth + `@supabase/ssr`), Tailwind 4, shadcn `base-nova`.

**Spec:** `docs/superpowers/specs/2026-08-21-admin-panel-design.md`

## Global Constraints

- Sem service role key em lugar nenhum — todo acesso admin passa pela sessão Supabase normal + RLS.
- Sem testes automatizados — este projeto não tem Jest/Vitest configurado (confirmado com o usuário). Verificação de cada task é `npm run type-check && npm run lint` +, na task final, teste manual no browser.
- Sem tela/Server Action de "promover admin" — bootstrap é uma query SQL manual (Task 9).
- Sem lista de clientes (`profiles`) separada e sem UI de atualizar status do pedido neste MVP — a policy de RLS pra update já fica pronta (Task 1), só a tela fica pra depois.
- Depois de criar qualquer rota nova em `app/(admin)/`, rodar `npm run dev` (Ctrl+C após o servidor subir) ou `npm run build` **uma vez** antes de `npm run type-check` — `PageProps<"/rota">` é gerado em `.next/dev/types/routes.d.ts` a partir das rotas existentes (regra do `CLAUDE.md` deste projeto).
- Nomes de arquivo kebab-case, componentes PascalCase, Tailwind only, sem `any` explícito.
- Projeto Supabase: `dxhdbrdsovviusycueht` (nome "Hocus Pocus").

---

### Task 1: Migration — role, RLS anti-recursão, CHECK de status

**Files:**
- Nenhum arquivo `.sql` local (este repo não versiona migrations — aplicadas direto via MCP, confirmado no código existente).
- Modify: `lib/supabase/database.types.ts` (regenerado por inteiro, não editar manualmente).

**Interfaces:**
- Produces: coluna `profiles.role: string` (valores possíveis em runtime: `'customer' | 'admin'`, mas o tipo TS gerado é `string`, sem union — Postgres CHECK não vira union type no gerador); `orders.status`/`orders.payment_status` continuam `string` no TS mas agora com CHECK no banco.

- [ ] **Step 1: Aplicar a migration via `mcp__plugin_supabase_supabase__apply_migration`**

Projeto: `dxhdbrdsovviusycueht`. Nome da migration: `admin_role_and_rls`. SQL exato:

```sql
-- 1. Role
alter table public.profiles
  add column role text not null default 'customer' check (role in ('customer', 'admin'));

-- 2. Função de checagem sem recursão (schema `private`, não exposto pela API)
create schema if not exists private;

create function private.is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- 3. Policies de leitura ampliada pra admin
create policy "admin_select_all_orders" on public.orders
  for select to authenticated using ( (select private.is_admin()) );

create policy "admin_select_all_order_items" on public.order_items
  for select to authenticated using ( (select private.is_admin()) );

create policy "admin_select_all_addresses" on public.addresses
  for select to authenticated using ( (select private.is_admin()) );

create policy "admin_select_all_profiles" on public.profiles
  for select to authenticated using ( (select private.is_admin()) );

-- 4. Update de status (RLS pronta mesmo sem UI de update no MVP)
create policy "admin_update_order_status" on public.orders
  for update to authenticated
  using ( (select private.is_admin()) )
  with check ( (select private.is_admin()) );

-- 5. Fechar o seam de status
alter table public.orders
  add constraint orders_status_check
    check (status in ('processando', 'em-transito', 'entregue', 'cancelado')),
  add constraint orders_payment_status_check
    check (payment_status in ('pendente', 'pago', 'cancelado', 'reembolsado'));
```

- [ ] **Step 2: Verificar que a migration aplicou corretamente**

Rodar via `mcp__plugin_supabase_supabase__execute_sql` (projeto `dxhdbrdsovviusycueht`):

```sql
select column_name, column_default from information_schema.columns
where table_schema = 'public' and table_name = 'profiles' and column_name = 'role';

select policyname from pg_policies
where schemaname = 'public' and policyname like 'admin_%'
order by policyname;

select conname from pg_constraint
where conname in ('orders_status_check', 'orders_payment_status_check');
```

Esperado: 1 linha pra `role` (default `'customer'::text`), 5 policies `admin_*`, 2 constraints.

- [ ] **Step 3: Regenerar `lib/supabase/database.types.ts`**

Rodar `mcp__plugin_supabase_supabase__generate_typescript_types` (projeto `dxhdbrdsovviusycueht`) e sobrescrever o arquivo com a saída completa via Write.

- [ ] **Step 4: Rodar type-check**

Run: `npm run type-check`
Expected: sem erros (só adiciona um campo opcional-por-default, nada consumia `profiles` com tipagem exaustiva).

- [ ] **Step 5: Commit**

```bash
git add lib/supabase/database.types.ts
git commit -m "feat(admin): add profiles.role, admin RLS policies and order status CHECK constraints"
```

---

### Task 2: `requireAdminSession()` em `lib/supabase/session.ts`

**Files:**
- Modify: `lib/supabase/session.ts`

**Interfaces:**
- Consumes: `requireSession()` (já existe no arquivo, retorna `{ supabase: SupabaseClient<Database>, user: User }` — `user` non-null porque `redirect()` tem tipo `never` e a checagem já estreita o tipo antes do `return`).
- Produces: `requireAdminSession(): Promise<{ supabase: SupabaseClient<Database>, user: User }>` — usado por toda `_data-access` do admin (Tasks 6-8) e pelo layout (Task 5).

- [ ] **Step 1: Adicionar a função**

Adicionar ao final de `lib/supabase/session.ts` (mantendo o `import "server-only"`, `redirect`, `createClient` já existentes no topo do arquivo):

```ts
/** Para Server Components/data-access do admin — exige sessão E role
 * 'admin'. Segunda camada de defesa: o `proxy.ts` já bloqueia `/admin/*`
 * antes de renderizar, e a RLS barra mesmo que as duas primeiras falhem. */
export async function requireAdminSession() {
  const { supabase, user } = await requireSession();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error) throw error;

  if (profile.role !== "admin") {
    redirect("/");
  }

  return { supabase, user };
}
```

- [ ] **Step 2: Rodar type-check**

Run: `npm run type-check`
Expected: sem erros (a coluna `role` já existe no `Database` type desde a Task 1).

- [ ] **Step 3: Rodar lint**

Run: `npm run lint`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add lib/supabase/session.ts
git commit -m "feat(admin): add requireAdminSession helper"
```

---

### Task 3: Gating de `/admin` no proxy

**Files:**
- Modify: `lib/supabase/middleware.ts`

**Interfaces:**
- Consumes: nenhuma nova (usa o mesmo `supabase` client já criado dentro de `updateSession`).
- Produces: nenhuma exportação nova — só muda o comportamento de `updateSession` pra rotas `/admin/*`.

O arquivo hoje (pra referência exata do que muda):

```ts
const PROTECTED_PATHS = ["/perfil", "/carrinho", "/checkout"];

export async function updateSession(request: NextRequest) {
  // ... cria `supabase` e `response` ...

  const { data } = await supabase.auth.getClaims();

  const isProtected = PROTECTED_PATHS.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );

  if (!data?.claims && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return response;
}
```

- [ ] **Step 1: Incluir `/admin` nas rotas protegidas e checar role**

```ts
const PROTECTED_PATHS = ["/perfil", "/carrinho", "/checkout", "/admin"];

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return parseCookieHeader(request.headers.get("Cookie") ?? "");
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
          Object.entries(headers).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();

  const isProtected = PROTECTED_PATHS.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );

  if (!data?.claims && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Checagem extra só pra `/admin/*` — role não está no JWT, então isso
  // exige uma query; as demais rotas protegidas não pagam esse custo.
  const isAdminPath = request.nextUrl.pathname.startsWith("/admin");

  if (data?.claims && isAdminPath) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.claims.sub)
      .single();

    if (profile?.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return response;
}
```

`proxy.ts` na raiz não muda — já delega tudo pra `updateSession` e o `matcher` já cobre `/admin/*`.

- [ ] **Step 2: Rodar type-check**

Run: `npm run type-check`
Expected: sem erros.

- [ ] **Step 3: Rodar lint**

Run: `npm run lint`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add lib/supabase/middleware.ts
git commit -m "feat(admin): gate /admin routes by role in proxy"
```

---

### Task 4: `getAllOrders()` e `getOrderByNumber()` em `lib/supabase/queries/orders.ts`

**Files:**
- Modify: `lib/supabase/queries/orders.ts`

**Interfaces:**
- Consumes: `Tables<"orders">`, `Tables<"addresses">`, `Tables<"profiles">`, `Tables<"order_items">` (de `../database.types`); `OrderWithItems` (já existe no arquivo).
- Produces: `getAllOrders(supabase): Promise<OrderWithProfile[]>` e `getOrderByNumber(supabase, orderNumber): Promise<OrderWithItemsAndAddress | null>` — consumidos pelas Tasks 6, 7 e 8.

- [ ] **Step 1: Adicionar os tipos e funções**

Adicionar ao final de `lib/supabase/queries/orders.ts` (o arquivo já importa `SupabaseClient`, `Database`, `Json`, `Tables` no topo — adicionar `Tables<"profiles">` e `Tables<"addresses">` ao import existente de tipos, que hoje é só `Tables`):

```ts
export type OrderWithProfile = Tables<"orders"> & {
  profiles: Pick<Tables<"profiles">, "name" | "email"> | null;
};

export async function getAllOrders(
  supabase: SupabaseClient<Database>,
): Promise<OrderWithProfile[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*, profiles(name, email)")
    .order("placed_at", { ascending: false });

  if (error) throw error;
  return data;
}

export type OrderWithItemsAndAddress = OrderWithItems & {
  profiles: Pick<Tables<"profiles">, "name" | "email"> | null;
  addresses: Tables<"addresses"> | null;
};

export async function getOrderByNumber(
  supabase: SupabaseClient<Database>,
  orderNumber: string,
): Promise<OrderWithItemsAndAddress | null> {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*), profiles(name, email), addresses(*)")
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (error) throw error;
  return data;
}
```

- [ ] **Step 2: Rodar type-check**

Run: `npm run type-check`
Expected: sem erros. Se o embed `profiles(name, email)`/`addresses(*)` não inferir o tipo automaticamente (supabase-js às vezes precisa do FK explícito quando há ambiguidade), o erro vai apontar exatamente isso — não há ambiguidade aqui (`orders` só tem uma FK pra `addresses` e uma pra `profiles`), então não é esperado.

- [ ] **Step 3: Rodar lint**

Run: `npm run lint`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add lib/supabase/queries/orders.ts
git commit -m "feat(admin): add getAllOrders and getOrderByNumber queries"
```

---

### Task 5: `app/(admin)/layout.tsx`

**Files:**
- Create: `app/(admin)/layout.tsx`

**Interfaces:**
- Consumes: `requireAdminSession()` (Task 2).
- Produces: layout que envolve todas as páginas de `app/(admin)/admin/**` (Tasks 6-8).

- [ ] **Step 1: Criar o layout**

```tsx
import type { Metadata } from "next";
import Link from "next/link";

import { requireAdminSession } from "@/lib/supabase/session";

export const metadata: Metadata = {
  title: { template: "%s | Admin", default: "Admin" },
  robots: { index: false, follow: false },
};

const ADMIN_NAV_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/pedidos", label: "Pedidos" },
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminSession();

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <span className="font-display text-lg text-foreground">Admin</span>
          <nav className="flex gap-6">
            {ADMIN_NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Rodar type-check e lint**

Run: `npm run type-check && npm run lint`
Expected: sem erros. (Ainda não há `page.tsx` em `app/(admin)/admin/`, então o layout sozinho não renderiza nada — isso é esperado, a página vem na Task 6.)

- [ ] **Step 3: Commit**

```bash
git add "app/(admin)/layout.tsx"
git commit -m "feat(admin): add admin layout with nav and access gate"
```

---

### Task 6: Dashboard (`/admin`)

**Files:**
- Create: `app/(admin)/admin/_data-access/get-dashboard-metrics.ts`
- Create: `app/(admin)/admin/page.tsx`

**Interfaces:**
- Consumes: `requireAdminSession()` (Task 2), `getAllOrders()` (Task 4), `formatPrice` (`@/lib/format`).
- Produces: nenhuma exportação consumida por outras tasks (página folha).

- [ ] **Step 1: Criar o data-access**

```ts
import "server-only";

import { getAllOrders } from "@/lib/supabase/queries/orders";
import { requireAdminSession } from "@/lib/supabase/session";

export type DashboardMetrics = {
  totalOrders: number;
  totalRevenueCents: number;
  pendingOrders: number;
};

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const { supabase } = await requireAdminSession();
  const orders = await getAllOrders(supabase);

  return {
    totalOrders: orders.length,
    totalRevenueCents: orders.reduce((sum, order) => sum + order.total_cents, 0),
    pendingOrders: orders.filter((order) => order.status === "processando").length,
  };
}
```

- [ ] **Step 2: Criar a página**

```tsx
import type { Metadata } from "next";

import { formatPrice } from "@/lib/format";
import { getDashboardMetrics } from "./_data-access/get-dashboard-metrics";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const metrics = await getDashboardMetrics();

  const cards = [
    { label: "Total de pedidos", value: metrics.totalOrders.toString() },
    { label: "Faturamento", value: formatPrice(metrics.totalRevenueCents) },
    { label: "Pedidos pendentes", value: metrics.pendingOrders.toString() },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border border-border bg-card px-5 py-4">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
            {card.label}
          </p>
          <p className="mt-2 font-display text-2xl text-foreground">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Rodar type-check e lint**

Run: `npm run type-check && npm run lint`
Expected: sem erros. Se `PageProps`/tipos de rota reclamarem, rodar `npm run dev` de novo (a rota `/admin` é nova desde a Task 5, mas como esta página não usa params dinâmicos, não deveria precisar — só as com `[numero]` na Task 8 precisam).

- [ ] **Step 4: Commit**

```bash
git add "app/(admin)/admin/_data-access/get-dashboard-metrics.ts" "app/(admin)/admin/page.tsx"
git commit -m "feat(admin): add dashboard with order metrics"
```

---

### Task 7: Lista de pedidos (`/admin/pedidos`)

**Files:**
- Create: `app/(admin)/admin/pedidos/_data-access/get-orders.ts`
- Create: `app/(admin)/admin/pedidos/page.tsx`

**Interfaces:**
- Consumes: `requireAdminSession()` (Task 2), `getAllOrders()` + `OrderWithProfile` (Task 4), `Badge` (`@/components/ui/badge`), `formatDate`/`formatPrice` (`@/lib/format`).
- Produces: nenhuma exportação consumida por outras tasks.

- [ ] **Step 1: Criar o data-access**

```ts
import "server-only";

import { getAllOrders, type OrderWithProfile } from "@/lib/supabase/queries/orders";
import { requireAdminSession } from "@/lib/supabase/session";

export type { OrderWithProfile };

export async function getOrdersList(): Promise<OrderWithProfile[]> {
  const { supabase } = await requireAdminSession();
  return getAllOrders(supabase);
}
```

- [ ] **Step 2: Criar a página**

```tsx
import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { formatDate, formatPrice } from "@/lib/format";
import { getOrdersList } from "./_data-access/get-orders";

export const metadata: Metadata = { title: "Pedidos" };

const STATUS_VARIANT: Record<string, "secondary" | "default" | "outline"> = {
  entregue: "outline",
  "em-transito": "default",
  processando: "secondary",
  cancelado: "secondary",
};

export default async function AdminOrdersPage() {
  const orders = await getOrdersList();

  if (orders.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum pedido ainda.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {orders.map((order) => (
        <li key={order.id}>
          <Link
            href={`/admin/pedidos/${order.order_number}`}
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card px-5 py-4 transition-colors hover:bg-muted/50"
          >
            <div>
              <p className="font-mono text-sm text-foreground tabular-nums">
                {order.order_number}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {order.profiles?.name ?? "—"} · {formatDate(order.placed_at.slice(0, 10))}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-mono text-sm text-foreground tabular-nums">
                {formatPrice(order.total_cents)}
              </span>
              <Badge variant={STATUS_VARIANT[order.status] ?? "secondary"}>
                {order.status}
              </Badge>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 3: Rodar type-check e lint**

Run: `npm run type-check && npm run lint`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add "app/(admin)/admin/pedidos/_data-access/get-orders.ts" "app/(admin)/admin/pedidos/page.tsx"
git commit -m "feat(admin): add orders list page"
```

---

### Task 8: Detalhe do pedido (`/admin/pedidos/[numero]`)

**Files:**
- Create: `app/(admin)/admin/pedidos/[numero]/_data-access/get-order-detail.ts`
- Create: `app/(admin)/admin/pedidos/[numero]/page.tsx`

**Interfaces:**
- Consumes: `requireAdminSession()` (Task 2), `getOrderByNumber()` + `OrderWithItemsAndAddress` (Task 4), `Badge`, `formatDate`/`formatPrice`, `notFound` (`next/navigation`).
- Produces: nenhuma exportação consumida por outras tasks.

- [ ] **Step 1: Criar o data-access**

```ts
import "server-only";

import {
  getOrderByNumber,
  type OrderWithItemsAndAddress,
} from "@/lib/supabase/queries/orders";
import { requireAdminSession } from "@/lib/supabase/session";

export type { OrderWithItemsAndAddress };

export async function getOrderDetail(
  orderNumber: string,
): Promise<OrderWithItemsAndAddress | null> {
  const { supabase } = await requireAdminSession();
  return getOrderByNumber(supabase, orderNumber);
}
```

- [ ] **Step 2: Criar a página**

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { formatDate, formatPrice } from "@/lib/format";
import { getOrderDetail } from "./_data-access/get-order-detail";

export const metadata: Metadata = { title: "Detalhe do pedido" };

export default async function AdminOrderDetailPage(
  props: PageProps<"/admin/pedidos/[numero]">,
) {
  const { numero } = await props.params;
  const order = await getOrderDetail(numero);

  if (!order) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl text-foreground">{order.order_number}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatDate(order.placed_at.slice(0, 10))}
        </p>
        <div className="mt-3 flex gap-2">
          <Badge>{order.status}</Badge>
          <Badge variant="outline">{order.payment_status}</Badge>
        </div>
      </div>

      <section>
        <h2 className="text-sm font-medium uppercase tracking-[0.1em] text-muted-foreground">
          Cliente
        </h2>
        <p className="mt-2 text-sm text-foreground">
          {order.profiles?.name ?? "—"} · {order.profiles?.email ?? "—"}
        </p>
      </section>

      {order.addresses ? (
        <section>
          <h2 className="text-sm font-medium uppercase tracking-[0.1em] text-muted-foreground">
            Endereço de entrega
          </h2>
          <p className="mt-2 text-sm text-foreground">
            {order.addresses.recipient_name} — {order.addresses.street}, {order.addresses.number}
            {order.addresses.complement ? ` (${order.addresses.complement})` : ""}
            <br />
            {order.addresses.neighborhood}, {order.addresses.city} - {order.addresses.state}
            <br />
            CEP {order.addresses.postal_code}
          </p>
        </section>
      ) : null}

      <section>
        <h2 className="text-sm font-medium uppercase tracking-[0.1em] text-muted-foreground">
          Itens
        </h2>
        <ul className="mt-3 flex flex-col gap-2">
          {order.order_items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
            >
              <div>
                <p className="text-sm text-foreground">{item.title_snapshot}</p>
                <p className="text-xs text-muted-foreground">Quantidade: {item.quantity}</p>
              </div>
              <span className="font-mono text-sm text-foreground tabular-nums">
                {formatPrice(item.total_price_cents)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex items-center justify-between border-t border-border pt-4">
        <span className="text-sm font-medium text-foreground">Total</span>
        <span className="font-mono text-base text-foreground tabular-nums">
          {formatPrice(order.total_cents)}
        </span>
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Rodar `npm run build` uma vez**

Run: `npm run build`
Expected: build completa. Necessário porque esta é a primeira rota com segmento dinâmico (`[numero]`) do grupo `(admin)` — `PageProps<"/admin/pedidos/[numero]">` só existe depois de o Next enxergar a rota num build/dev.

- [ ] **Step 4: Rodar type-check e lint**

Run: `npm run type-check && npm run lint`
Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add "app/(admin)/admin/pedidos/[numero]/_data-access/get-order-detail.ts" "app/(admin)/admin/pedidos/[numero]/page.tsx"
git commit -m "feat(admin): add order detail page"
```

---

### Task 9: Bootstrap do admin e verificação manual end-to-end

**Files:** nenhum (SQL manual + teste no browser).

**Interfaces:** nenhuma nova — task de verificação, fecha o plano.

- [ ] **Step 1: Criar a própria conta de teste (se ainda não tiver uma) por `/cadastro`**

Com o `npm run dev` rodando, acessar `http://localhost:3000/cadastro` e criar uma conta com o e-mail `brunoshigueharu@gmail.com` (se ainda não existir).

- [ ] **Step 2: Promover essa conta a admin via SQL**

Rodar via `mcp__plugin_supabase_supabase__execute_sql` (projeto `dxhdbrdsovviusycueht`):

```sql
update public.profiles set role = 'admin' where email = 'brunoshigueharu@gmail.com';
```

- [ ] **Step 3: Testar o bloqueio pra não-admin**

Logar com uma conta **sem** role admin (ou deslogado) e acessar `http://localhost:3000/admin`. Esperado: redirect pra `/login` (deslogado) ou `/` (logado sem role admin).

- [ ] **Step 4: Testar o dashboard**

Logar com a conta promovida a admin, acessar `/admin`. Esperado: 3 cards (total de pedidos, faturamento, pendentes) com números reais — se ainda não houver pedidos no banco, todos os cards mostram 0.

- [ ] **Step 5: Testar a lista de pedidos**

Acessar `/admin/pedidos`. Se não houver pedidos: mensagem de estado vazio. Se houver (crie um pedido de teste pelo fluxo de checkout normal do site, `/checkout`, com outra conta): a linha aparece com número, cliente, status, total e data corretos, e o link leva pro detalhe.

- [ ] **Step 6: Testar o detalhe do pedido**

Clicar num pedido da lista. Esperado: itens, endereço de entrega e dados do cliente batendo com o que foi comprado.

- [ ] **Step 7: Testar número de pedido inválido**

Acessar `/admin/pedidos/numero-que-nao-existe`. Esperado: página 404 padrão do Next.

- [ ] **Step 8: Rodar a verificação completa do projeto**

Run: `npm run type-check && npm run lint`
Expected: sem erros em nenhuma das duas.

Nenhum commit nesta task — é só verificação sobre o que já foi commitado nas Tasks 1-8.
