# Migração de autenticação: Supabase → Wix Members (headless) — design

## Contexto

O projeto hoje usa Supabase inteiro (Auth + Postgres) como backend. Decisão
do usuário: manter o front-end Next.js exatamente como está (design, stack,
hospedagem no EasyPanel/Hostinger — já validado, roda em produção), e trocar
o backend por completo pelo Wix, aproveitando uma assinatura Wix Studio já
ativa. Motivo: o painel de gestão do Wix (produtos, pedidos, membros) é mais
simples de manter no dia a dia do que operar um backend próprio.

O site Wix já existe — **"Hocus Pocus (cópia)"**
(`metaSiteId: 14110309-77c6-4b74-b8af-893fe1f1e12c`), Wix Studio, com Wix
Stores (Catalog V3), Members Area e Invoices instalados. Um cliente OAuth
headless foi criado nas Configurações headless do site — **"Hocus Pocus
Next.js Frontend"** (`clientId: 83747f22-4b42-446b-9597-2afb8249c84b`, público,
seguro para hardcode no front).

**Migração em 3 fases** (combinadas com o usuário, cada uma com sua própria
spec):
1. **Auth** — este documento.
2. **Loja/Checkout** — catálogo e compra via Wix Stores.
3. **Admin (pedidos, dashboard)** — consumindo dados do Wix.

Esta spec cobre **só a fase 1**: login, cadastro, sessão, recuperação de
senha e o *gate* de acesso ao `/admin` (quem entra) — o **conteúdo** do
admin (lista de pedidos, métricas) continua no Supabase até a fase 3, ver
`2026-08-21-admin-panel-design.md`, que precisará de uma revisão pontual
quando essa fase chegar (a checagem de role que ela descreve muda de lugar).

## Por que não dá pra portar 1:1

O cliente Wix Members headless (`wix-vibe-headless`) é **client-side puro**:
token de sessão vive em `localStorage`, não em cookie de servidor. Isso
força duas mudanças estruturais em relação ao Supabase Auth atual:

1. **Sem conceito de "role"/admin na camada de auth headless.** A doc oficial
   do Wix é explícita: não há `elevate`/admin scope nem MFA — "essas camadas
   de segurança são governadas pelo dashboard". Não existe substituto nativo
   pro `profiles.role === 'admin'` de hoje.
2. **`proxy.ts` não enxerga `localStorage`.** A proteção de rota "redireciona
   antes de renderizar" que existe hoje (via cookie lido no middleware) não
   é replicável como está pro modelo de token client-side.

## Decisões

### 1. Admin: coleção no Wix Data + Admin API Key

Lista de e-mails/IDs de admin fica numa coleção do Wix Data (CMS),
consultada no servidor com a **Admin API Key** do Wix (gerenciada em
Configurações headless → "Chave de API de administrador", nunca exposta no
client). Alternativa descartada: allowlist fixa em variável de ambiente —
mais simples, mas exige redeploy pra adicionar um admin; a coleção no Wix
Data mantém a promessa de "gerenciável pelo painel" que motivou a migração
inteira.

### 2. Sessão: client-side em toda parte — inclusive `/admin`

**Correção pós-implementação (Task 20):** esta seção originalmente previa
manter `/admin` com "checagem no servidor, mesma garantia de hoje". Isso se
provou impossível sem cookie de sessão legível pelo servidor — o token do
Wix Member vive só em `localStorage`, então não há nada que um Server
Component possa ler antes de renderizar. O que foi de fato implementado:

- `/perfil`, `/carrinho`, `/checkout`, `/admin`: gate client-side — um
  componente lê `useMember()` (do provider do cliente Wix) e redireciona pra
  `/login` (ou pra `/`, no caso do admin não autorizado) se não houver
  sessão válida. Aceita-se o trade-off frente ao `proxy.ts` removido: sem
  bloqueio no servidor antes de renderizar, só depois de montar no client.
  É o padrão que o próprio cliente Wix já entrega pronto.
- `/admin` especificamente: a fonte da verdade da autorização (coleção
  `Admins` do Wix Data, decisão 1) só é consultada num Route Handler
  server-only (`/api/admin/check`), com a Admin API Key nunca saindo do
  servidor — mas a decisão de renderizar ou não o conteúdo do lado do
  client continua sendo client-side, com a mesma limitação estrutural das
  outras rotas. A garantia real contra vazamento de dado sensível nessa
  fase vem de as páginas do admin não fazerem nenhum data-fetching real (ver
  Task 22 do plano) — não de um gate server-side, que não existe.

### 3. Cadastro: verificação por código de 6 dígitos (não link)

`Register V2` → se `state === 'REQUIRE_EMAIL_VERIFICATION'`, a Wix manda um
código de 6 dígitos por e-mail; tela própria pra digitar o código, que
completa o cadastro via `Verify During Authentication`. Muda a UX do
cadastro atual (hoje é link clicável) — decisão aceita pelo usuário.

### 4. Recuperação de senha: `Send Recovery Email` (link, mantém o padrão atual)

Diferente do cadastro, a recuperação de senha **é** baseada em link: `Send
Recovery Email` manda um e-mail com link; `redirect.url` define pra onde o
membro volta **depois de trocar a senha** — o campo já indica que a troca em
si acontece antes do redirect, então a etapa de "digite a nova senha" é
hospedada pela própria Wix, não por uma tela nossa. Nossa página de destino
(`/atualizar-senha` ou equivalente) vira uma tela de confirmação/pós-login,
não um formulário de nova senha.

**Em aberto, a confirmar na implementação:** o payload exato que a Wix
inclui no redirect (se já vem com sessão pronta pra logar automaticamente,
ou só uma confirmação sem tokens) não está detalhado na doc consultada —
validar isso na prática (ou via `wix-docs`) antes de finalizar essa tela.

### 5. Login: fluxo iframe (sem sair da página)

`Login V2` → `Create Redirect Session` com `responseMode: "web_message"` →
troca de token via iframe oculto, sem navegação de página cheia. É o
comportamento padrão do cliente já pronto da Wix; não foi uma escolha
discutida separadamente, é a via recomendada por eles.

## Arquitetura

O cliente de referência da Wix (`wix-vibe-headless`) foi escrito para uma
SPA Vite + react-router — **não é um drop-in** em Next.js App Router.
Adaptação necessária, mantendo os princípios do projeto (`CLAUDE.md`:
Server Components por padrão, `'use client'` só onde precisa):

- `lib/wix/client.ts` (substitui `lib/supabase/server.ts`/`middleware.ts`):
  porta `wix-client.js` + `wix-config.js` do skill — transporte REST,
  `WIX_CLIENT_ID`/`WIX_METASITE_ID`, troca/refresh de token, guarda de
  `window`/`localStorage` pra SSR.
- `lib/wix/members-auth.ts`: porta `wix-members-auth.js` **verbatim** (regra
  da própria skill — os shapes de OAuth são exatos, reescrever quebra).
- `MemberProvider`/`useMember()` (Client Component, contexto React) substitui
  `getOptionalSession()`/`requireSession()` — some com o modelo "buscar
  sessão no servidor a cada request".
- Header/nav (`site-header.tsx`, `mobile-nav.tsx`) passam a ler `useMember()`
  em vez de props vindas de Server Component com sessão do Supabase.
- Rotas `/login`, `/cadastro`, `/esqueci-senha`, `/atualizar-senha` mantêm
  a estrutura de página existente (`page.tsx` Server Component fino +
  `_components/content.tsx` Client Component), mas o conteúdo interno troca
  as Server Actions com `createClient()` do Supabase por chamadas aos
  helpers de `lib/wix/members-auth.ts` — que rodam no client (o modelo Wix é
  client-only), então essas actions deixam de ser Server Actions e viram
  funções client-side chamadas direto do formulário.

  **Desvio explícito da convenção do projeto:** o `CLAUDE.md` pede mutações
  via Server Actions em `actions/`, nunca lógica direto em Client Components.
  A troca de auth por um modelo client-only da Wix força uma exceção
  pontual pra esse fluxo específico — não é um precedente pra mover outras
  mutações do projeto (loja, pedidos) pra fora de Server Actions sem motivo
  equivalente.
- `app/(admin)/layout.tsx`: troca a query em `profiles` por uma consulta à
  coleção de admins no Wix Data, autenticada com a Admin API Key (essa
  chamada sim continua no servidor — é a Admin API Key, não o token do
  membro).
- **Removido por completo:** `lib/supabase/` (todo o diretório), `proxy.ts`
  na forma atual (o novo `/admin` gate pode virar um Route Handler
  intermediário ou checagem no próprio `layout.tsx` — detalhar no plano de
  implementação).

## Configuração necessária no painel Wix (fora do código)

- **Allowed redirect domains/URIs** (Configurações headless → o app "Hocus
  Pocus Next.js Frontend"): adicionar a origem de produção
  (`https://hocus-pocus-website.zg0o1b.easypanel.host`) e a origem de
  desenvolvimento local. Importante: o default liberado pela Wix é
  `localhost:4321` (porta padrão do Vite) — **não** cobre o `localhost:3000`
  do Next.js, então login em dev vai falhar até adicionarmos essa origem
  manualmente.
- Confirmar a **URL de redirect** da recuperação de senha (decisão 4) como
  URI permitida.

## Erros e casos de borda

- Credenciais inválidas → mensagem genérica (como hoje: "E-mail ou senha
  incorretos"), sem revelar se o e-mail existe.
- `REQUIRE_EMAIL_VERIFICATION` no cadastro → tela de código, com opção de
  reenviar.
- `REQUIRE_OWNER_APPROVAL` (caso a Wix exija aprovação manual do dono do
  site) → estado "cadastro pendente", sem tratar como erro.
- Token expirado/refresh falhando → limpar sessão local, tratar como
  visitante (não travar a UI).
- Origem não allow-listada → sintoma documentado pela própria Wix:
  `MemberAuthError('timeout')` no login por credencial; página "Invalid
  redirect URI" no fluxo social — não vamos usar login social nesta fase,
  mas vale registrar o sintoma caso apareça por engano de configuração.

## Fora de escopo (fase 1)

- Catálogo, carrinho, checkout real (fase 2).
- Conteúdo do admin — pedidos, métricas (fase 3); só o *gate* de acesso ao
  `/admin` está nesta fase.
- Login social (Google/Facebook) — não solicitado; a estrutura do cliente
  Wix suporta, mas exige URIs de callback adicionais allow-listadas.
- Perfil estendido (foto, campos customizados) — depende do app Members Area
  instalado; usar só o necessário pro MVP (nome, e-mail).

## Verificação

`npm run type-check && npm run lint` após a implementação. Teste manual:
cadastro completo (com código de verificação), login, logout, sessão
sobrevive a reload, "esqueci senha" de ponta a ponta, acesso a `/perfil` sem
sessão redireciona pra `/login`, acesso a `/admin` sem ser admin redireciona
pra `/`, acesso a `/admin` como admin (via coleção Wix Data) funciona.
