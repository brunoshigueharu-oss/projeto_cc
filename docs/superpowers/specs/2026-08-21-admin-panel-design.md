# Painel admin (pedidos, clientes, métricas) — design

## Contexto

Pedido: uma área `/admin` dentro do próprio projeto Hocus Pocus (não um app
separado, não o CRM "Piloto" — schemas incompatíveis, ver decisão abaixo)
pra acompanhar pedidos e ter uma visão geral do que está vendendo. Hoje não
existe nenhuma interface visual pra isso — os dados só existem nas tabelas
Supabase (`profiles`, `addresses`, `orders`, `order_items`).

**Por que não o CRM Piloto:** é um projeto separado (`/Users/brunohigashi/
Documents/Claude Code/Piloto`), com um Supabase próprio (`nhqdphxvrdnrqkenenmi`,
plano de vendas B2B: `clientes` + `negocios` com estágios
novo/contato/proposta/negociação/ganho/perdido). Schema de pipeline de
vendas, não de pedidos de e-commerce — adaptar exigiria remodelar o CRM
inteiro, mais trabalho que construir do zero no domínio certo.

**Por que não só Supabase Studio:** resolveria "ver os dados" mas não dá uma
UX dedicada (filtros, métricas, navegação por pedido) — decisão do usuário
foi investir num admin próprio.

## Controle de acesso

Hoje **não existe** conceito de role — `profiles` só tem
`id, email, name, plan, created_at`, e a RLS de todas as tabelas é
estritamente `auth.uid() = profile_id` (dono só vê o próprio dado).

**Decisão (discutida e aprovada com o usuário):** coluna `role` em
`profiles` + policies de RLS pra admin, **sem service role key**. Alternativa
descartada foi allowlist de e-mail + service role key no servidor — rejeitada
porque a service role ignora RLS por completo: um data-access que esqueça de
checar o allowlist vazaria a tabela inteira, sem rede de segurança por baixo.
Com role + RLS, mesmo que o app-layer falhe (bug no proxy, layout sem check),
o Postgres ainda barra — a mesma garantia que já protege dado de cliente hoje.

**Padrão de RLS sem recursão** (confirmado na doc oficial do Supabase —
`supabase.com/docs/guides/database/postgres/row-level-security`): uma policy
de `profiles` não pode consultar `profiles` diretamente sem cair em
recursão. A solução documentada é uma função `security definer` num schema
`private` (não exposto pela API) — ela ignora RLS internamente e quebra o
ciclo.

### Migration

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

-- 4. Update de status (RLS pronta mesmo sem UI de update no MVP — custo zero)
create policy "admin_update_order_status" on public.orders
  for update to authenticated
  using ( (select private.is_admin()) )
  with check ( (select private.is_admin()) );

-- 5. Fechar o seam de status (candidato da revisão de arquitetura, dobrado aqui
--    por ser praticamente grátis nesta mesma migration)
alter table public.orders
  add constraint orders_status_check
    check (status in ('processando', 'em-transito', 'entregue', 'cancelado')),
  add constraint orders_payment_status_check
    check (payment_status in ('pendente', 'pago', 'cancelado', 'reembolsado'));
```

Os valores de `status` vêm do enum já usado em
`app/(site)/perfil/_data-access/get-profile.ts`. Os de `payment_status` são
uma proposta conservadora (só `'pendente'` é observado hoje, é o default da
coluna) — **revisar na leitura desta spec**, já que ainda não há gateway de
pagamento definindo o vocabulário real de transições.

### Bootstrap do primeiro admin

Sem tela/Server Action de "promover admin" no MVP (decisão do usuário — mais
superfície de ataque do que vale pra um admin só). Depois que o usuário
criar a própria conta por `/cadastro`, uma única query manual via MCP:

```sql
update public.profiles set role = 'admin' where email = 'brunoshigueharu@gmail.com';
```

### Camadas de defesa (nenhuma delas é a única linha)

1. `proxy.ts`: quando o pathname começa com `/admin`, consulta
   `profiles.role` e redireciona pra `/login` (sem sessão) ou `/` (sessão
   sem role admin) antes de a página renderizar. Só roda essa query extra
   pra rotas `/admin/*`.
2. `lib/supabase/session.ts` ganha `requireAdminSession()`: chama
   `requireSession()` e, se `role !== 'admin'`, `redirect("/")`.
3. RLS (migration acima) — última linha, independente do app-layer.

Nenhuma service role key é introduzida — o admin autentica com o Supabase
Auth normal (mesma sessão/cookies dos clientes), e o Postgres decide o que
ele pode ler.

## Rotas e telas (MVP)

Novo route group `app/(admin)/`, seguindo o padrão de `(auth)` e `(site)`:

```
app/(admin)/
  layout.tsx                                  # requireAdminSession() + nav do admin
  admin/
    page.tsx                                  # dashboard (métricas)
    _data-access/get-dashboard-metrics.ts
    pedidos/
      page.tsx                                # lista de pedidos
      _data-access/get-orders.ts
      [numero]/
        page.tsx                              # detalhe do pedido
        _data-access/get-order-detail.ts
```

`lib/supabase/queries/orders.ts` ganha `getAllOrders()` e
`getOrderByNumber(orderNumber)` — paralelas a `getOrdersForUser`, mas sem
filtro de `profile_id` (a RLS de admin libera o select).

**Dashboard:** 3 cards — total de pedidos, faturamento (soma de
`total_cents`), pedidos pendentes (`status = 'processando'`). Calculado em
JS a partir de `getAllOrders()` — volume baixo de uma loja nova não
justifica uma RPC de agregação agora (YAGNI); dá pra otimizar depois se
crescer.

**Lista de pedidos:** tabela com número, cliente (join com `profiles`),
status, total, data — cada linha linka pro detalhe.

**Detalhe do pedido:** itens (`order_items`), endereço de entrega, dados do
cliente, status/`payment_status`.

**Fora do MVP** (decisão explícita do usuário, revisitar depois): lista de
clientes (`profiles`) separada, e UI de atualizar status do pedido (a RLS já
está pronta pra isso, só falta a tela).

## Erros e casos de borda

- Não-admin em `/admin/*` → redirect, nas duas camadas de app-layer descritas
  acima.
- `[numero]` inválido/inexistente → `notFound()` (404 padrão do Next).
- Lista de pedidos vazia (loja nova) → estado vazio simples, sem
  skeleton/gráfico chamativo.
- Erro de query (banco fora, etc.) → propaga, igual o resto do projeto já
  faz hoje (sem try/catch novo em `_data-access`).

## Fora de escopo (registrado, não esquecido)

- **Candidato "Strong" da revisão de arquitetura** (colapsar a resolução
  duplicada de linha do carrinho entre `CartProvider` e
  `revalidateCartItems`): não faz parte deste admin, é uma limpeza
  independente no fluxo de checkout existente. Fica pra uma spec própria.
- Gateway de pagamento — o checkout hoje só registra o pedido, não processa
  cobrança. `payment_status` fica com o vocabulário conservador acima até
  isso existir.
- Promoção de admin pela aplicação (só SQL manual por enquanto).

## Verificação

`npm run type-check && npm run lint` depois de implementar. Teste manual no
browser: logar como cliente comum → confirmar redirect saindo de `/admin`;
promover o profile do usuário a admin via SQL; logar de novo → conferir
dashboard, lista e detalhe com dados reais; testar lista vazia e número de
pedido inválido.
