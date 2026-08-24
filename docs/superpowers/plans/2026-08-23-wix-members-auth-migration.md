# Migração Supabase → Wix Members (Fase 1: Auth) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir a autenticação por Supabase Auth pela autenticação headless da Wix (Members), mantendo o front-end Next.js como está e sem hospedar nada no Wix.

**Architecture:** Cliente Wix client-only (token em `localStorage`, sem cookie de servidor) — `lib/wix/client.ts` + `lib/wix/members-auth.ts` (porta do `wix-vibe-headless`) expostos via `MemberProvider`/`useMember()`. Login/cadastro/logout viram chamadas client-side direto do formulário (desvio documentado do padrão de Server Actions, só para este fluxo). O gate de `/admin` usa uma coleção do Wix Data consultada num Route Handler server-side com a Admin API Key — nunca no client.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Zod, React Hook Form, Vitest (novo nesta fase — o projeto não tinha runner de teste configurado).

**Spec:** `docs/superpowers/specs/2026-08-23-wix-members-auth-migration-design.md`

## Global Constraints

- `WIX_CLIENT_ID`: `83747f22-4b42-446b-9597-2afb8249c84b` (público, seguro para hardcode).
- `WIX_METASITE_ID`: `14110309-77c6-4b74-b8af-893fe1f1e12c`.
- Origem de produção a allow-listar: `https://hocus-pocus-website.zg0o1b.easypanel.host`.
- Origem de desenvolvimento a allow-listar: `http://localhost:3000` (o default da Wix é `localhost:4321`, porta do Vite — não cobre o Next.js).
- Server Components por padrão, `'use client'` só onde precisa — **exceto** as ações de auth desta fase, que rodam client-side por decisão explícita da spec (não é precedente para outras mutações).
- Sem `any` explícito — `unknown` + type guard.
- kebab-case para arquivos, PascalCase para componentes.
- Reaproveitar os schemas Zod e mensagens pt-BR já existentes onde a forma ainda encaixa.

---

## ⚠️ Lacuna descoberta durante o planejamento — decisão registrada

A spec marcou "conteúdo do admin" e "loja/checkout" como fora de escopo desta
fase, e mandou remover `lib/supabase/` por completo. Ao abrir os arquivos
reais, dois problemas apareceram — ambos **decididos com o usuário**, não
escolhas unilaterais:

**1. `/perfil` e `/checkout` (endereços salvos).** `get-profile.ts` e
`get-addresses.ts` (fora do escopo de conteúdo, mas que **existem hoje e
funcionam**) chamam `requireSession()` de `lib/supabase/session.ts` não só
pra checar login, mas pra obter o cliente Supabase autenticado (via cookie)
que a RLS usa pra filtrar `profiles`/`orders`/`addresses` pelo dono. Sem
`lib/supabase/session.ts`, não tem como gerar esse client sem um service
role key — que bypassa RLS por completo (o mesmo padrão que a spec
`2026-08-21-admin-panel-design.md` já tinha rejeitado por segurança pro
admin).

**2. Todo o painel `/admin` (dashboard, lista de pedidos, detalhe).** Mesmo
padrão: `requireAdminSession()` é usado tanto pra checar o papel quanto pra
obter o client Supabase que as queries de pedidos precisam. A spec original
assumia que "conteúdo do admin continua no Supabase" seria possível nesta
fase — não é, pela mesma razão do item 1 (achado posterior, depois que o
usuário já tinha decidido o item 1).

**Decisão final do usuário: nenhum service role key em nenhuma parte do
projeto nesta fase.** `/perfil`, `/checkout` e as três telas do admin
(dashboard, pedidos, detalhe do pedido) entram em estado "em manutenção" até
a fase 3, quando o conteúdo real passa a vir do Wix (e da fase 2, no caso do
checkout). A Task 21 (ponte via service role, cogitada e rejeitada) fica
registrada abaixo só como histórico da decisão. A Task 22 reflete o escopo
final: remove `lib/supabase/` por completo e troca as 5 páginas afetadas por
um estado de manutenção compartilhado.

---

### Task 1: Configurar Vitest (o projeto não tem runner de teste hoje)

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

**Interfaces:**
- Produces: comando `npm run test -- <nome>` (já referenciado no `CLAUDE.md`, mas nunca implementado); `npm run test:watch`.

- [ ] **Step 1: Instalar o Vitest**

```bash
npm install -D vitest @vitejs/plugin-react jsdom
```

- [ ] **Step 2: Criar a config**

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["**/*.test.ts", "**/*.test.tsx"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

- [ ] **Step 3: Adicionar os scripts em `package.json`**

No bloco `"scripts"`, adicione:

```json
    "test": "vitest run",
    "test:watch": "vitest"
```

- [ ] **Step 4: Verificar que roda (sem teste ainda, só o runner)**

Run: `npm run test`
Expected: `No test files found` (ou saída equivalente do Vitest) — sem erro de config.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: add Vitest as the project's test runner"
```

---

### Task 2: Configuração manual no painel Wix (bloqueante — sem isso nada de auth funciona)

Sem código nesta task — é pré-requisito manual antes de qualquer teste no
browser das próximas tasks.

- [ ] **Step 1:** Acesse `https://manage.wix.com/dashboard/14110309-77c6-4b74-b8af-893fe1f1e12c/oauth-apps-settings`, abra o app **"Hocus Pocus Next.js Frontend"**.
- [ ] **Step 2:** Em **Allowed redirect domains** (ou campo equivalente de origem), adicione `http://localhost:3000` e `https://hocus-pocus-website.zg0o1b.easypanel.host`.
- [ ] **Step 3:** Confirme que existe (ou crie) um campo de **allowed authorization redirect URIs** cobrindo a URL que vamos usar como destino da recuperação de senha — será `http://localhost:3000/atualizar-senha` (dev) e `https://hocus-pocus-website.zg0o1b.easypanel.host/atualizar-senha` (prod). Adicione as duas.
- [ ] **Step 4:** Salve.

---

### Task 3: Transporte Wix — config

**Files:**
- Create: `lib/wix/config.ts`

**Interfaces:**
- Produces: `WIX_CLIENT_ID: string`, `WIX_METASITE_ID: string`.

- [ ] **Step 1: Criar o arquivo**

```ts
// lib/wix/config.ts
// IDs públicos do headless client do site "Hocus Pocus (cópia)" — não são
// segredo (o client id só autentica visitantes/membros via OAuth2, nunca dá
// acesso admin). Ver docs/superpowers/specs/2026-08-23-wix-members-auth-migration-design.md.
export const WIX_CLIENT_ID = "83747f22-4b42-446b-9597-2afb8249c84b";
export const WIX_METASITE_ID = "14110309-77c6-4b74-b8af-893fe1f1e12c";
```

- [ ] **Step 2: Commit**

```bash
git add lib/wix/config.ts
git commit -m "feat(wix): add headless client config"
```

---

### Task 4: Transporte Wix — cliente REST

Porta de `references/shared/app/rest/wix-client.js` da skill `wix-vibe-headless`
(base: `~/.claude/plugins/cache/wix/wix/1.16.3/skills/wix-vibe-headless/`).
Lógica idêntica ao original — só sintaxe TS/import adicionada, e **uma
exportação nova** (`getAccessToken`, antes privada) porque as Tasks 17/19
precisam do token bruto do membro pra mandar num header `Authorization` a um
Route Handler nosso.

**Files:**
- Create: `lib/wix/client.ts`

**Interfaces:**
- Consumes: `WIX_CLIENT_ID` de `lib/wix/config.ts`.
- Produces: `wixApiRequest(path, options?)`, `setSessionTokens(tokens)`,
  `clearSession()`, `isMember(): boolean`, `getAccessToken(): Promise<string>`.

- [ ] **Step 1: Criar o arquivo**

```ts
// lib/wix/client.ts
// Transporte REST client-only pro Wix headless — porta de
// wix-vibe-headless/references/shared/app/rest/wix-client.js. Plain fetch,
// sem SDK. Guarda `typeof window` pra nunca rodar em Server Component.
import { WIX_CLIENT_ID } from "./config";

export const WIX_API_BASE = "https://www.wixapis.com";
const OAUTH_TOKEN_URL = `${WIX_API_BASE}/oauth2/token`;

type TokenRole = "visitor" | "member";

type StoredToken = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  role: TokenRole;
};

const TOKEN_STORAGE_KEY = `wix-visitor-token-${WIX_CLIENT_ID}`;
let tokenCache: StoredToken | null = null;

function loadToken(): StoredToken | null {
  if (tokenCache) return tokenCache;
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (raw) tokenCache = JSON.parse(raw) as StoredToken;
  } catch {
    /* ignore disabled/full storage */
  }
  return tokenCache;
}

function saveToken(t: StoredToken) {
  tokenCache = t;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(t));
  } catch {
    /* ignore */
  }
}

type MintBody =
  | { clientId: string; grantType: "anonymous" }
  | { clientId: string; grantType: "refresh_token"; refreshToken: string };

async function mintToken(body: MintBody): Promise<Omit<StoredToken, "role">> {
  const res = await fetch(OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Wix OAuth failed: ${res.status}`);
  const data = await res.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}

/** Grava tokens de membro no cliente compartilhado após login/cadastro bem-sucedido. */
export function setSessionTokens({
  accessToken,
  refreshToken,
  expiresIn,
}: {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}) {
  saveToken({
    accessToken,
    refreshToken,
    expiresAt: Date.now() + expiresIn * 1000,
    role: "member",
  });
}

/** Limpa a sessão local — chamar no logout. */
export function clearSession() {
  tokenCache = null;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** true quando há um membro logado neste cliente (vs. visitante anônimo). */
export function isMember(): boolean {
  return loadToken()?.role === "member";
}

async function getAccessTokenInternal(): Promise<string> {
  const cached = loadToken();
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.accessToken;

  if (cached?.refreshToken) {
    try {
      const refreshed = await mintToken({
        clientId: WIX_CLIENT_ID,
        grantType: "refresh_token",
        refreshToken: cached.refreshToken,
      });
      const withRole: StoredToken = { ...refreshed, role: cached.role || "visitor" };
      saveToken(withRole);
      return withRole.accessToken;
    } catch {
      /* refresh falhou — cai pra visitante anônimo novo */
    }
  }
  const fresh = await mintToken({ clientId: WIX_CLIENT_ID, grantType: "anonymous" });
  const withRole: StoredToken = { ...fresh, role: "visitor" };
  saveToken(withRole);
  return withRole.accessToken;
}

/**
 * Token de acesso bruto do cliente atual (visitante ou membro). Exportado
 * (o original não expunha isso) porque `lib/wix/resolve-member.ts` precisa
 * mandar esse token pro servidor num header `Authorization` — o servidor não
 * tem acesso ao `localStorage`.
 */
export async function getAccessToken(): Promise<string> {
  return getAccessTokenInternal();
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, string | string[] | undefined>;
};

export async function wixApiRequest(path: string, options: RequestOptions = {}) {
  const { method = "POST", body, query } = options;
  const token = await getAccessTokenInternal();

  const url = new URL(path.startsWith("http") ? path : `${WIX_API_BASE}${path}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined) continue;
      if (Array.isArray(v)) {
        for (const item of v) url.searchParams.append(k, item);
      } else {
        url.searchParams.set(k, v);
      }
    }
  }

  const res = await fetch(url.toString(), {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: token, // Wix espera o token cru, sem prefixo "Bearer"
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 402) {
    console.warn("Wix: Payment required (402) — recurso exige plano ativo no site.");
    return undefined;
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
    const err = new Error(`Wix API error ${res.status}: ${text}`) as Error & {
      status?: number;
      body?: unknown;
    };
    err.status = res.status;
    err.body = parsed;
    throw err;
  }
  if (res.status === 204) return undefined;
  return await res.json();
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/wix/client.ts
git commit -m "feat(wix): add REST transport (visitor/member token, wixApiRequest)"
```

---

### Task 5: Helper de auth — `lib/wix/members-auth.ts`

Porta de `references/members/app/rest/wix-members-auth.js` — **verbatim na
lógica** (é a regra da própria skill: os shapes de OAuth/PKCE são exatos e
frágeis, "simplificar" quebra o login com 400). Só sintaxe de módulo/tipos
muda, e `mapAuthError` passa a ser exportado (era privada) pra dar pra testar
isoladamente na Task 6.

**Files:**
- Create: `lib/wix/members-auth.ts`

**Interfaces:**
- Consumes: `wixApiRequest`, `WIX_API_BASE`, `WIX_CLIENT_ID`,
  `setSessionTokens`, `clearSession`, `isMember` de `lib/wix/client.ts`.
- Produces: `register(email, password, profile?)`, `login(email, password)`,
  `verifyEmail(code, stateToken)`, `sendPasswordResetEmail(email, redirectUri)`,
  `isLoggedIn()`, `getCurrentMember()`, `logout(returnTo?)`,
  `startSocialLogin(idp, callbackUri, returnTo?)`, `completeSocialLogin()`,
  `IDP`, `MemberAuthError`, `mapAuthError` (exportado só pra teste).

- [ ] **Step 1: Criar o arquivo**

```ts
// lib/wix/members-auth.ts
// Porta verbatim (lógica) de wix-vibe-headless/references/members/app/rest/wix-members-auth.js.
// NÃO reescrever os internals — os shapes de OAuth/PKCE (createRedirectSession,
// exchangeCode) são exatos; "simplificar" retorna 400. Estender chamando os
// exports, nunca editando o corpo das funções internas.
import {
  wixApiRequest,
  WIX_API_BASE,
  setSessionTokens,
  clearSession,
  isMember,
} from "./client";
import { WIX_CLIENT_ID } from "./config";

const AUTH_BASE = "/_api/iam/authentication/v2";
const VERIFY_URL = "/_api/iam/verification/v1/auth/verify";
const RECOVERY_URL = "/_api/iam/recovery/v1/send-email";
const REDIRECT_SESSION_URL = "/_api/redirects-api/v1/redirect-session";
const CURRENT_MEMBER_URL = "/members/v1/members/my";
const OAUTH_STASH_KEY = `wix-oauth-data-${WIX_CLIENT_ID}`;

export const IDP = {
  GOOGLE: "0e6a50f5-b523-4e29-990d-f37fa2ffdd69",
  FACEBOOK: "3ecad13f-52c3-483d-911f-31dbcf2a6d23",
} as const;

/** Perfil parcial de um membro Wix — shape best-effort (não confirmado contra
 * a doc completa da Members API nesta sessão). Trate campos não listados como
 * `unknown` e valide antes de usar. */
export interface WixMember {
  id?: string;
  loginEmail?: string;
  profile?: { nickname?: string; firstName?: string; lastName?: string } | null;
  contact?: { firstName?: string; lastName?: string } | null;
  [key: string]: unknown;
}

type AuthState = "SUCCESS" | "REQUIRE_EMAIL_VERIFICATION" | "REQUIRE_OWNER_APPROVAL";

type AuthResult = { state: AuthState; member?: WixMember | null; stateToken?: string };

export class MemberAuthError extends Error {
  code: string;
  constructor(code: string, message?: string) {
    super(message || code);
    this.name = "MemberAuthError";
    this.code = code;
  }
}

// ─────────────────────────── (A) credencial direta ───────────────────────────

export async function register(
  email: string,
  password: string,
  profile?: Record<string, unknown>,
): Promise<AuthResult> {
  return runCredentialFlow(`${AUTH_BASE}/register`, {
    loginId: { email },
    password,
    ...(profile ? { profile } : {}),
  });
}

export async function login(email: string, password: string): Promise<AuthResult> {
  return runCredentialFlow(`${AUTH_BASE}/login`, { loginId: { email }, password });
}

export async function verifyEmail(code: string, stateToken: string): Promise<AuthResult> {
  let res;
  try {
    res = await wixApiRequest(VERIFY_URL, { body: { code, stateToken } });
  } catch (e) {
    throw mapAuthError(e);
  }
  return resolveState(res);
}

/** Wix hospeda a página de troca de senha e devolve o membro pra `redirectUri`
 * depois de trocar a senha. `redirectUri` PRECISA estar na allow-list (Task 2). */
export async function sendPasswordResetEmail(email: string, redirectUri: string): Promise<void> {
  await wixApiRequest(RECOVERY_URL, {
    body: { email, redirect: { url: redirectUri, clientId: WIX_CLIENT_ID } },
  });
}

async function runCredentialFlow(path: string, body: unknown): Promise<AuthResult> {
  let res;
  try {
    res = await wixApiRequest(path, { body });
  } catch (e) {
    throw mapAuthError(e);
  }
  return resolveState(res);
}

async function resolveState(res: { state: AuthState; sessionToken?: string; stateToken?: string }): Promise<AuthResult> {
  if (res.state === "SUCCESS") {
    const member = await completeDirectLogin(res.sessionToken!);
    return { state: res.state, member };
  }
  return { state: res.state, stateToken: res.stateToken };
}

async function completeDirectLogin(sessionToken: string): Promise<WixMember | null> {
  const pkce = await generatePkce();
  const { fullUrl } = await createRedirectSession({
    authRequest: { responseMode: "web_message", sessionToken, pkce },
  });
  const { code } = await authorizeViaHiddenIframe(fullUrl, pkce.state);
  const tokens = await exchangeCode(code, pkce.codeVerifier);
  setSessionTokens(tokens);
  return getCurrentMember();
}

// ─────────────────────────── (B) social / SSO ───────────────────────────
// Não usado nesta fase (spec: login social fora de escopo) — portado por
// completude/paridade com o helper original, sem quebrar o arquivo verbatim.

export async function startSocialLogin(idp: string, callbackUri: string, returnTo = "/"): Promise<void> {
  const pkce = await generatePkce();
  const { fullUrl } = await createRedirectSession({
    authRequest: { responseMode: "fragment", idp, redirectUri: callbackUri, pkce },
  });
  window.localStorage.setItem(
    OAUTH_STASH_KEY,
    JSON.stringify({ codeVerifier: pkce.codeVerifier, state: pkce.state, redirectUri: callbackUri, returnTo }),
  );
  window.location.href = fullUrl;
}

export async function completeSocialLogin(): Promise<{ member: WixMember | null; returnTo: string }> {
  const raw = window.localStorage.getItem(OAUTH_STASH_KEY);
  if (!raw) throw new MemberAuthError("missingOAuthData", "No pending login found — start the login again.");
  window.localStorage.removeItem(OAUTH_STASH_KEY);
  const stash = JSON.parse(raw);

  const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const error = params.get("error");
  if (error) throw new MemberAuthError(error, params.get("error_description") || error);
  const code = params.get("code");
  const state = params.get("state");
  if (!code || !state) throw new MemberAuthError("missingCode", "No authorization code returned.");
  if (state !== stash.state) throw new MemberAuthError("stateMismatch", "OAuth state mismatch — possible CSRF; login aborted.");

  const tokens = await exchangeCode(code, stash.codeVerifier, stash.redirectUri);
  setSessionTokens(tokens);
  return { member: await getCurrentMember(), returnTo: stash.returnTo || "/" };
}

// ─────────────────────────── sessão ───────────────────────────

export function isLoggedIn(): boolean {
  return isMember();
}

export async function getCurrentMember(): Promise<WixMember | null> {
  try {
    const res = await wixApiRequest(CURRENT_MEMBER_URL, { method: "GET", query: { fieldSet: "FULL" } });
    return res?.member || null;
  } catch (e) {
    const status = (e as { status?: number })?.status;
    if (status === 401 || status === 403 || status === 404) return null;
    throw e;
  }
}

export async function logout(returnTo?: string): Promise<void> {
  const postFlowUrl = returnTo || (typeof window !== "undefined" ? window.location.origin : "/");
  let logoutUrl: string | undefined;
  try {
    const { redirectSession } = await wixApiRequest(REDIRECT_SESSION_URL, {
      body: { logout: { clientId: WIX_CLIENT_ID }, callbacks: { postFlowUrl } },
    });
    logoutUrl = redirectSession?.fullUrl;
  } finally {
    clearSession();
  }
  if (logoutUrl && typeof window !== "undefined") window.location.href = logoutUrl;
}

// ─────────────────────────── internals ───────────────────────────

type Pkce = { codeVerifier: string; codeChallenge: string; state: string };

async function createRedirectSession({
  authRequest,
}: {
  authRequest: {
    responseMode: string;
    sessionToken?: string;
    idp?: string;
    redirectUri?: string;
    pkce: Pkce;
  };
}): Promise<{ fullUrl: string }> {
  const { responseMode, sessionToken, idp, redirectUri, pkce } = authRequest;
  // ⚠️ Shape exato da Wix — não simplificar. Precisa do wrapper auth.authRequest,
  // os campos PKCE FLAT (codeChallenge/codeChallengeMethod, sem objeto pkce
  // aninhado — codeVerifier NÃO vai aqui, só na troca de token), e
  // responseType/scope presentes. Espalhar o input direto no body vira 400.
  const { redirectSession } = await wixApiRequest(REDIRECT_SESSION_URL, {
    body: {
      auth: {
        authRequest: {
          clientId: WIX_CLIENT_ID,
          codeChallenge: pkce.codeChallenge,
          codeChallengeMethod: "S256",
          responseMode,
          responseType: "code",
          scope: "offline_access",
          state: pkce.state,
          ...(redirectUri ? { redirectUri } : {}),
          ...(sessionToken ? { sessionToken } : {}),
          ...(idp ? { idp } : {}),
        },
      },
    },
  });
  if (!redirectSession?.fullUrl) throw new MemberAuthError("noRedirectSession", "Wix did not return an authorization URL.");
  return { fullUrl: redirectSession.fullUrl };
}

function authorizeViaHiddenIframe(authUrl: string, expectedState: string): Promise<{ code: string; state: string }> {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    let settled = false;
    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      clearTimeout(timer);
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    };
    const onMessage = (e: MessageEvent) => {
      if (!e.data || e.data.state !== expectedState) return;
      settled = true;
      cleanup();
      if (e.data.error) reject(new MemberAuthError(e.data.error, e.data.error_description || e.data.error));
      else resolve({ code: e.data.code, state: e.data.state });
    };
    window.addEventListener("message", onMessage);
    const timer = setTimeout(() => {
      if (!settled) {
        cleanup();
        reject(
          new MemberAuthError(
            "timeout",
            `Login timed out. Most likely this app's origin (${typeof window !== "undefined" ? window.location.origin : "?"}) ` +
              `is not an allowed authorization redirect URI on the Wix OAuth app — register it in the site's Headless Settings.`,
          ),
        );
      }
    }, 120000);
    iframe.src = authUrl;
    document.body.appendChild(iframe);
  });
}

async function exchangeCode(
  code: string,
  codeVerifier: string,
  redirectUri?: string,
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  if (!code) throw new MemberAuthError("missingCode", "No authorization code to exchange.");
  const res = await fetch(`${WIX_API_BASE}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientId: WIX_CLIENT_ID,
      grantType: "authorization_code",
      code,
      codeVerifier,
      ...(redirectUri ? { redirectUri } : {}),
    }),
  });
  if (!res.ok) {
    let body: { error?: string } | undefined;
    try {
      body = await res.json();
    } catch {
      /* ignore */
    }
    throw new MemberAuthError(
      body?.error || "tokenExchangeFailed",
      `Token exchange failed: ${res.status}${body ? ` ${JSON.stringify(body)}` : ""}`,
    );
  }
  const data = await res.json();
  return { accessToken: data.access_token, refreshToken: data.refresh_token, expiresIn: data.expires_in };
}

/** Exportado (era privada no original) só pra dar pra testar isoladamente — a
 * lógica de mapeamento não mudou uma linha. */
export function mapAuthError(e: unknown): MemberAuthError | Error {
  const err = e as { body?: { details?: { applicationError?: { code?: string } } }; status?: number };
  const code = err?.body?.details?.applicationError?.code;
  if (code === "-19995" || err?.status === 409) {
    return new MemberAuthError("emailAlreadyExists", "An account with this email already exists — try logging in instead.");
  }
  if (code === "-19999" || code === "-19976" || err?.status === 404 || err?.status === 401) {
    return new MemberAuthError("invalidCredentials", "Incorrect email or password.");
  }
  if (e instanceof MemberAuthError) return e;
  return e as Error;
}

// ── PKCE (RFC 7636, S256) — Web Crypto do browser, sem dependência ──
async function generatePkce(): Promise<Pkce> {
  const codeVerifier = randomUnreserved(43);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(codeVerifier));
  return { codeVerifier, codeChallenge: base64Url(new Uint8Array(digest)), state: randomUnreserved(24) };
}

function randomUnreserved(length: number): string {
  const mask = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let out = "";
  for (let i = 0; i < length; i++) out += mask[bytes[i] % mask.length];
  return out;
}

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/wix/members-auth.ts
git commit -m "feat(wix): add members auth helper (register/login/verify/reset/logout)"
```

---

### Task 6: Testes unitários de `mapAuthError`

Única peça desta fase que é lógica pura o bastante pra teste unitário
tradicional — o resto (troca de token OAuth via iframe, PKCE, redirect
sessions) depende de rede/browser real e é coberto por verificação manual nas
tasks seguintes, não por unit test. Não finja o contrário.

**Files:**
- Test: `lib/wix/members-auth.test.ts`

**Interfaces:**
- Consumes: `mapAuthError`, `MemberAuthError` de `lib/wix/members-auth.ts`.

- [ ] **Step 1: Escrever os testes**

```ts
// lib/wix/members-auth.test.ts
import { describe, expect, it } from "vitest";
import { mapAuthError, MemberAuthError } from "./members-auth";

describe("mapAuthError", () => {
  it("maps a 409 conflict to emailAlreadyExists", () => {
    const err = mapAuthError({ status: 409 });
    expect(err).toBeInstanceOf(MemberAuthError);
    expect((err as MemberAuthError).code).toBe("emailAlreadyExists");
  });

  it("maps applicationError code -19995 to emailAlreadyExists", () => {
    const err = mapAuthError({ body: { details: { applicationError: { code: "-19995" } } } });
    expect((err as MemberAuthError).code).toBe("emailAlreadyExists");
  });

  it("maps a 401 to invalidCredentials", () => {
    const err = mapAuthError({ status: 401 });
    expect((err as MemberAuthError).code).toBe("invalidCredentials");
  });

  it("maps a 404 to invalidCredentials", () => {
    const err = mapAuthError({ status: 404 });
    expect((err as MemberAuthError).code).toBe("invalidCredentials");
  });

  it("maps applicationError code -19976 (wrong password) to invalidCredentials", () => {
    const err = mapAuthError({ body: { details: { applicationError: { code: "-19976" } } } });
    expect((err as MemberAuthError).code).toBe("invalidCredentials");
  });

  it("passes through an existing MemberAuthError unchanged", () => {
    const original = new MemberAuthError("timeout", "Login timed out.");
    expect(mapAuthError(original)).toBe(original);
  });

  it("bubbles an unmapped error as-is (fail loudly)", () => {
    const original = new Error("network down");
    expect(mapAuthError(original)).toBe(original);
  });
});
```

- [ ] **Step 2: Rodar e confirmar que passa**

Run: `npm run test -- members-auth`
Expected: 7 testes passando.

- [ ] **Step 3: Commit**

```bash
git add lib/wix/members-auth.test.ts
git commit -m "test(wix): cover mapAuthError branches"
```

---

### Task 7: `MemberProvider` / `useMember()`

Porta de `references/members/app/context/MemberContext.jsx`. Nome
`useMember` (não `useAuth`) é proposital — não colide com nada do projeto.

**Files:**
- Create: `lib/wix/member-context.tsx`

**Interfaces:**
- Consumes: `isLoggedIn`, `getCurrentMember`, `logout`, `WixMember` de `lib/wix/members-auth.ts`.
- Produces: `<MemberProvider>`, `useMember(): { member: WixMember | null; loggedIn: boolean; loading: boolean; refresh(): Promise<void>; logout(returnTo?: string): Promise<void> }`.

- [ ] **Step 1: Criar o arquivo**

```tsx
// lib/wix/member-context.tsx
"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { isLoggedIn, getCurrentMember, logout as apiLogout, type WixMember } from "./members-auth";

type MemberContextValue = {
  member: WixMember | null;
  loggedIn: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: (returnTo?: string) => Promise<void>;
};

const MemberContext = createContext<MemberContextValue | null>(null);

export function MemberProvider({ children }: { children: React.ReactNode }) {
  const [member, setMember] = useState<WixMember | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const active = isLoggedIn();
      setLoggedIn(active);
      setMember(active ? await getCurrentMember() : null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logout = useCallback(async (returnTo?: string) => {
    setMember(null);
    setLoggedIn(false);
    await apiLogout(returnTo);
  }, []);

  return (
    <MemberContext.Provider value={{ member, loggedIn, loading, refresh, logout }}>
      {children}
    </MemberContext.Provider>
  );
}

export function useMember(): MemberContextValue {
  const ctx = useContext(MemberContext);
  if (!ctx) throw new Error("useMember must be used within <MemberProvider>");
  return ctx;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/wix/member-context.tsx
git commit -m "feat(wix): add MemberProvider/useMember client context"
```

---

### Task 8: Wire `MemberProvider` no root layout

**Files:**
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: `MemberProvider` de `lib/wix/member-context.tsx`.

- [ ] **Step 1: Editar `app/layout.tsx`**

Adicionar o import e envolver `<CartProvider>` com `<MemberProvider>` (o
`CartProvider` continua igual — `MemberProvider` é Client Component, mas
`{children}` passado a partir do Server Component pai continua renderizando
como Server Component; esse é o padrão de composição normal do App Router).

```tsx
// app/layout.tsx
import type { Metadata } from "next";
import { Nunito_Sans, Poppins } from "next/font/google";

import { CartProvider } from "@/lib/cart/cart-context";
import { MemberProvider } from "@/lib/wix/member-context";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Hocus Pocus",
    template: "%s · Hocus Pocus",
  },
  description: "Editora de ficção sombria ilustrada.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${poppins.variable} ${nunitoSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-4 focus-visible:z-50 focus-visible:rounded-md focus-visible:bg-primary focus-visible:px-4 focus-visible:py-2 focus-visible:text-sm focus-visible:font-medium focus-visible:text-primary-foreground"
        >
          Pular para o conteúdo
        </a>
        <MemberProvider>
          <CartProvider>{children}</CartProvider>
        </MemberProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Verificar**

Run: `npm run dev`, abra `http://localhost:3000` no browser.
Expected: página carrega normalmente, sem erro no console sobre `useMember`/contexto.

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat(wix): wrap app in MemberProvider"
```

---

### Task 9: Componente `RequireAuth` (gate client-side)

Adaptação de `references/members/app/components/RequireAuth.jsx` — trocando
`react-router-dom` (`Navigate`/`useLocation`) por `next/navigation`, já que o
App Router não tem um componente `<Navigate>` síncrono: o redirect acontece
num `useEffect` depois que `loading` resolve.

**Files:**
- Create: `components/require-auth.tsx`

**Interfaces:**
- Consumes: `useMember` de `lib/wix/member-context.tsx`.
- Produces: `<RequireAuth fallback?: string>{children}</RequireAuth>`.

- [ ] **Step 1: Criar o arquivo**

```tsx
// components/require-auth.tsx
"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useMember } from "@/lib/wix/member-context";

/**
 * Gate client-side pra rotas de membro (`/perfil`, `/carrinho`, `/checkout`).
 * Sem cookie de sessão pro servidor ver, não dá pra bloquear antes de
 * renderizar (ver spec, decisão 2) — o redirect acontece assim que o check
 * client-side resolve, com uma tela de carregando no meio.
 */
export function RequireAuth({
  children,
  fallback = "/login",
}: {
  children: React.ReactNode;
  fallback?: string;
}) {
  const { loggedIn, loading } = useMember();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !loggedIn) {
      router.replace(`${fallback}?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [loading, loggedIn, router, fallback, pathname]);

  if (loading || !loggedIn) {
    return (
      <div className="p-12 text-center text-muted-foreground">Carregando…</div>
    );
  }

  return <>{children}</>;
}
```

- [ ] **Step 2: Commit**

```bash
git add components/require-auth.tsx
git commit -m "feat(wix): add client-side RequireAuth route gate"
```

---

### Task 10: Reescrever o login

Remove a Server Action; o formulário chama `login()` direto do client. Se
`login()` retornar `REQUIRE_EMAIL_VERIFICATION` (raro em login, mas o estado
existe no contrato — ver Task 11 pro fluxo normal de cadastro), mostra erro
genérico pedindo pra usar "esqueci senha" — não vamos construir uma segunda
tela de código só pro login.

**Files:**
- Modify: `app/(auth)/login/_components/login-form.tsx`
- Delete: `app/(auth)/login/_actions/login.ts`

**Interfaces:**
- Consumes: `login`, `MemberAuthError` de `lib/wix/members-auth.ts`; `useMember` de `lib/wix/member-context.tsx`; `loginSchema`, `LoginInput` de `../_lib/login-schema` (sem mudança, reaproveitado).
- Produces: nada consumido por outra task.

- [ ] **Step 1: Apagar a Server Action**

```bash
rm "app/(auth)/login/_actions/login.ts"
```

- [ ] **Step 2: Reescrever o formulário**

```tsx
// app/(auth)/login/_components/login-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { FormStatus, type FormResult } from "@/components/form-status";
import { useMember } from "@/lib/wix/member-context";
import { login, MemberAuthError } from "@/lib/wix/members-auth";
import { loginSchema, type LoginInput } from "../_lib/login-schema";

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [result, setResult] = useState<FormResult | null>(null);
  const router = useRouter();
  const { refresh } = useMember();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    setResult(null);
    try {
      const res = await login(values.email, values.password);
      if (res.state === "SUCCESS") {
        await refresh();
        router.push(redirectTo?.startsWith("/") ? redirectTo : "/perfil");
        return;
      }
      // REQUIRE_EMAIL_VERIFICATION / REQUIRE_OWNER_APPROVAL no login (raro):
      // não construímos uma segunda tela aqui, orienta pro fluxo de recuperação.
      setResult({ ok: false, message: "Confirme seu cadastro antes de entrar. Verifique seu e-mail." });
    } catch (e) {
      if (e instanceof MemberAuthError) {
        setResult({ ok: false, message: "E-mail ou senha incorretos." });
      } else {
        setResult({ ok: false, message: "Não foi possível entrar. Tente novamente." });
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="email">E-mail</FieldLabel>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            spellCheck={false}
            aria-invalid={errors.email ? true : undefined}
            {...register("email")}
          />
          <FieldError errors={[errors.email]} />
        </Field>

        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor="password">Senha</FieldLabel>
            <Link
              href="/esqueci-senha"
              className="text-sm font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Esqueci minha senha
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={errors.password ? true : undefined}
            {...register("password")}
          />
          <FieldError errors={[errors.password]} />
        </Field>

        <div className="flex flex-wrap items-center gap-4">
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="h-11 rounded-full px-7"
          >
            {isSubmitting ? "Entrando…" : "Entrar"}
          </Button>

          <FormStatus result={result} />
        </div>

        <p className="text-sm text-muted-foreground">
          Ainda não tem conta?{" "}
          <Link
            href="/cadastro"
            className="font-medium text-foreground underline underline-offset-4"
          >
            Cadastre-se
          </Link>
        </p>
      </FieldGroup>
    </form>
  );
}
```

- [ ] **Step 3: Verificar manualmente**

Pré-requisito: Task 2 concluída (origem `localhost:3000` allow-listada) e ao
menos um membro já cadastrado direto no painel Wix (Members Area → Adicionar
membro) pra testar login antes da Task 11 existir.

Run: `npm run dev`, abra `http://localhost:3000/login`.
Expected: login com credenciais válidas redireciona pra `/perfil` (vai dar 500
até a Task 22 rodar — nesta task, confirme só que `useMember().loggedIn` vira
`true` e a URL muda, via `console.log` temporário ou o React DevTools); senha
errada mostra "E-mail ou senha incorretos." sem estourar exceção não tratada
no console.

- [ ] **Step 4: Commit**

```bash
git add "app/(auth)/login/_components/login-form.tsx"
git rm "app/(auth)/login/_actions/login.ts"
git commit -m "feat(auth): switch login to client-side Wix Members auth"
```

---

### Task 11: Reescrever o cadastro (com etapa de código de 6 dígitos)

**Files:**
- Modify: `app/(auth)/cadastro/_components/cadastro-form.tsx`
- Delete: `app/(auth)/cadastro/_actions/cadastro.ts`

**Interfaces:**
- Consumes: `register`, `verifyEmail`, `MemberAuthError` de `lib/wix/members-auth.ts`; `useMember`; `cadastroSchema`, `CadastroInput` de `../_lib/cadastro-schema` (sem mudança).

- [ ] **Step 1: Apagar a Server Action**

```bash
rm "app/(auth)/cadastro/_actions/cadastro.ts"
```

- [ ] **Step 2: Reescrever o formulário com as duas fases**

```tsx
// app/(auth)/cadastro/_components/cadastro-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { FormStatus, type FormResult } from "@/components/form-status";
import { useMember } from "@/lib/wix/member-context";
import { register as wixRegister, verifyEmail, MemberAuthError } from "@/lib/wix/members-auth";
import { cadastroSchema, type CadastroInput } from "../_lib/cadastro-schema";

type Phase = "form" | "verify" | "pending";

export function CadastroForm() {
  const [result, setResult] = useState<FormResult | null>(null);
  const [phase, setPhase] = useState<Phase>("form");
  const [stateToken, setStateToken] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const router = useRouter();
  const { refresh } = useMember();

  const {
    register: registerField,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CadastroInput>({
    resolver: zodResolver(cadastroSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  async function onSubmit(values: CadastroInput) {
    setResult(null);
    try {
      const res = await wixRegister(values.email, values.password, { nickname: values.name });
      if (res.state === "SUCCESS") {
        await refresh();
        router.push("/perfil");
        return;
      }
      if (res.state === "REQUIRE_EMAIL_VERIFICATION") {
        setStateToken(res.stateToken ?? null);
        setPhase("verify");
        return;
      }
      if (res.state === "REQUIRE_OWNER_APPROVAL") {
        setPhase("pending");
        return;
      }
    } catch (e) {
      if (e instanceof MemberAuthError && e.code === "emailAlreadyExists") {
        setResult({ ok: false, message: "Este e-mail já tem cadastro. Tente entrar." });
      } else {
        setResult({ ok: false, message: "Não foi possível criar sua conta. Tente novamente." });
      }
    }
  }

  async function onSubmitCode(e: React.FormEvent) {
    e.preventDefault();
    if (!stateToken) return;
    setVerifying(true);
    setResult(null);
    try {
      const res = await verifyEmail(code, stateToken);
      if (res.state === "SUCCESS") {
        await refresh();
        router.push("/perfil");
        return;
      }
      setResult({ ok: false, message: "Código inválido. Confira e tente novamente." });
    } catch {
      setResult({ ok: false, message: "Código inválido. Confira e tente novamente." });
    } finally {
      setVerifying(false);
    }
  }

  if (phase === "pending") {
    return (
      <p className="text-sm text-muted-foreground">
        Seu cadastro está pendente de aprovação. Você poderá entrar assim que
        for aprovado.
      </p>
    );
  }

  if (phase === "verify") {
    return (
      <form onSubmit={onSubmitCode}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="code">Código de verificação</FieldLabel>
            <p className="text-sm text-muted-foreground">
              Enviamos um código de 6 dígitos para o seu e-mail.
            </p>
            <Input
              id="code"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="one-time-code"
            />
          </Field>
          <div className="flex flex-wrap items-center gap-4">
            <Button type="submit" size="lg" disabled={verifying} className="h-11 rounded-full px-7">
              {verifying ? "Confirmando…" : "Confirmar"}
            </Button>
            <FormStatus result={result} />
          </div>
        </FieldGroup>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="name">Nome</FieldLabel>
          <Input id="name" autoComplete="name" aria-invalid={errors.name ? true : undefined} {...registerField("name")} />
          <FieldError errors={[errors.name]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="email">E-mail</FieldLabel>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            spellCheck={false}
            aria-invalid={errors.email ? true : undefined}
            {...registerField("email")}
          />
          <FieldError errors={[errors.email]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="password">Senha</FieldLabel>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={errors.password ? true : undefined}
            {...registerField("password")}
          />
          <FieldError errors={[errors.password]} />
        </Field>

        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" size="lg" disabled={isSubmitting} className="h-11 rounded-full px-7">
            {isSubmitting ? "Criando conta…" : "Criar conta"}
          </Button>
          <FormStatus result={result} />
        </div>

        <p className="text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
            Entrar
          </Link>
        </p>
      </FieldGroup>
    </form>
  );
}
```

- [ ] **Step 3: Verificar manualmente**

Run: `npm run dev`, abra `http://localhost:3000/cadastro`, cadastre um e-mail
novo. Se a Wix pedir verificação, confira que chega e-mail com código de 6
dígitos e que digitar o código certo completa o cadastro; código errado
mostra "Código inválido."

- [ ] **Step 4: Commit**

```bash
git add "app/(auth)/cadastro/_components/cadastro-form.tsx"
git rm "app/(auth)/cadastro/_actions/cadastro.ts"
git commit -m "feat(auth): switch signup to client-side Wix Members auth with 6-digit verification"
```

---

### Task 12: Reescrever "esqueci senha"

**Files:**
- Modify: `app/(auth)/esqueci-senha/_components/esqueci-senha-form.tsx`
- Delete: `app/(auth)/esqueci-senha/_actions/esqueci-senha.ts`

**Interfaces:**
- Consumes: `sendPasswordResetEmail` de `lib/wix/members-auth.ts`; `esqueciSenhaSchema`, `EsqueciSenhaInput` de `../_lib/esqueci-senha-schema` (sem mudança).

- [ ] **Step 1: Apagar a Server Action**

```bash
rm "app/(auth)/esqueci-senha/_actions/esqueci-senha.ts"
```

- [ ] **Step 2: Reescrever o formulário**

```tsx
// app/(auth)/esqueci-senha/_components/esqueci-senha-form.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { FormStatus, type FormResult } from "@/components/form-status";
import { sendPasswordResetEmail } from "@/lib/wix/members-auth";
import { esqueciSenhaSchema, type EsqueciSenhaInput } from "../_lib/esqueci-senha-schema";

export function EsqueciSenhaForm() {
  const [result, setResult] = useState<FormResult | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EsqueciSenhaInput>({
    resolver: zodResolver(esqueciSenhaSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: EsqueciSenhaInput) {
    const redirectUri = `${window.location.origin}/atualizar-senha`;
    try {
      await sendPasswordResetEmail(values.email, redirectUri);
    } catch {
      // Mensagem sempre igual, mesmo em erro — não revela se o e-mail existe.
    }
    setResult({ ok: true, message: "Se esse e-mail tiver cadastro, enviamos um link para redefinir a senha." });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="email">E-mail</FieldLabel>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            spellCheck={false}
            aria-invalid={errors.email ? true : undefined}
            {...register("email")}
          />
          <FieldError errors={[errors.email]} />
        </Field>

        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" size="lg" disabled={isSubmitting} className="h-11 rounded-full px-7">
            {isSubmitting ? "Enviando…" : "Enviar link"}
          </Button>
          <FormStatus result={result} />
        </div>
      </FieldGroup>
    </form>
  );
}
```

- [ ] **Step 3: Verificar manualmente**

Pré-requisito: Task 2 (URI de redirect `/atualizar-senha` allow-listada).
Run: `npm run dev`, abra `http://localhost:3000/esqueci-senha`, envie pra um
e-mail de membro existente. Confirme que chega e-mail com link, e que clicar
no link volta pro site (a página em si é tratada na Task 13).

- [ ] **Step 4: Commit**

```bash
git add "app/(auth)/esqueci-senha/_components/esqueci-senha-form.tsx"
git rm "app/(auth)/esqueci-senha/_actions/esqueci-senha.ts"
git commit -m "feat(auth): switch password recovery email to Wix Members"
```

---

### Task 13: "Atualizar senha" vira tela de confirmação

Antes era um formulário de nova senha (Supabase trocava a sessão só depois do
link, então a troca acontecia aqui). Agora a Wix hospeda a etapa de trocar a
senha — nossa página só recebe o retorno depois que já trocou (ver spec,
decisão 4, e o JSDoc de `sendPasswordResetEmail` que confirma isso: "Wix hosts
the reset page and returns them to redirectUri"). Vira uma tela de
confirmação simples, sem formulário de senha.

**Files:**
- Modify: `app/(auth)/atualizar-senha/page.tsx`
- Delete: `app/(auth)/atualizar-senha/_actions/atualizar-senha.ts`
- Delete: `app/(auth)/atualizar-senha/_components/atualizar-senha-form.tsx`
- Delete: `app/(auth)/atualizar-senha/_lib/atualizar-senha-schema.ts`

**Interfaces:**
- Nenhuma — página estática, sem estado de outra task.

- [ ] **Step 1: Apagar os arquivos do formulário antigo**

```bash
rm "app/(auth)/atualizar-senha/_actions/atualizar-senha.ts"
rm "app/(auth)/atualizar-senha/_components/atualizar-senha-form.tsx"
rm "app/(auth)/atualizar-senha/_lib/atualizar-senha-schema.ts"
```

- [ ] **Step 2: Reescrever a página**

```tsx
// app/(auth)/atualizar-senha/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Senha atualizada",
  description: "Sua senha foi atualizada na Hocus Pocus.",
};

export default function AtualizarSenhaPage() {
  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Senha atualizada</h1>
      <p className="mt-2 font-serif text-sm text-muted-foreground">
        Se você acabou de trocar sua senha pelo link do e-mail, já pode entrar
        com a nova senha.
      </p>
      <Link
        href="/login"
        className="mt-8 inline-block font-medium text-foreground underline underline-offset-4"
      >
        Ir para o login
      </Link>
    </div>
  );
}
```

- [ ] **Step 3: Verificar manualmente**

Run: `npm run dev`, abra `http://localhost:3000/atualizar-senha` direto —
deve renderizar a tela de confirmação sem erro (não exige mais sessão prévia).

- [ ] **Step 4: Commit**

```bash
git add "app/(auth)/atualizar-senha/page.tsx"
git rm "app/(auth)/atualizar-senha/_actions/atualizar-senha.ts" \
       "app/(auth)/atualizar-senha/_components/atualizar-senha-form.tsx" \
       "app/(auth)/atualizar-senha/_lib/atualizar-senha-schema.ts"
git commit -m "feat(auth): turn atualizar-senha into a post-reset confirmation page"
```

---

### Task 14: Sign-out

Substitui `lib/supabase/actions/sign-out.ts` (Server Action, `<form action=…>`)
por um botão client-side chamando `logout()` direto.

**Files:**
- Create: `components/sign-out-button.tsx`
- Delete: `lib/supabase/actions/sign-out.ts`

**Interfaces:**
- Consumes: `logout` de `lib/wix/members-auth.ts`.
- Produces: `<SignOutButton className?: string children: React.ReactNode>`, consumido pela Task 15.

- [ ] **Step 1: Criar o botão**

```tsx
// components/sign-out-button.tsx
"use client";

import { logout } from "@/lib/wix/members-auth";

export function SignOutButton({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={() => logout()} className={className}>
      {children}
    </button>
  );
}
```

- [ ] **Step 2: Apagar a Server Action antiga**

```bash
rm lib/supabase/actions/sign-out.ts
```

- [ ] **Step 3: Commit**

```bash
git add components/sign-out-button.tsx
git rm lib/supabase/actions/sign-out.ts
git commit -m "feat(auth): add client-side sign-out button"
```

---

### Task 15: Atualizar `site-header.tsx` e `mobile-nav.tsx`

`SiteHeader` era `async` e lia a sessão no servidor (`getOptionalSession`) —
isso não existe mais (sessão é client-only). Vira Client Component lendo
`useMember()`. `MobileNav` já era Client Component; só troca a prop recebida
e o botão de sair.

**Files:**
- Modify: `components/site-header.tsx`
- Modify: `components/mobile-nav.tsx`

**Interfaces:**
- Consumes: `useMember` de `lib/wix/member-context.tsx`; `SignOutButton` de `components/sign-out-button.tsx` (Task 14).

- [ ] **Step 1: Reescrever `site-header.tsx`**

```tsx
// components/site-header.tsx
"use client";

import Link from "next/link";
import { CircleUserRound, LogOut } from "lucide-react";

import { NAV_LINKS } from "@/lib/nav-links";
import { useMember } from "@/lib/wix/member-context";
import { SignOutButton } from "./sign-out-button";
import { CartLink } from "./cart-link";
import { MobileNav } from "./mobile-nav";
import { NavLink } from "./nav-link";
import { Seal } from "./seal";
import { Wordmark } from "./wordmark";

const ICON_LINK_CLASS =
  "hidden size-9 items-center justify-center rounded-full bg-foreground/5 text-foreground/80 transition-colors hover:bg-muted hover:text-foreground md:inline-flex";

function getInitials(displayName: string) {
  return displayName
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function SiteHeader() {
  const { loggedIn, member, loading } = useMember();

  const displayName =
    member?.profile?.nickname || member?.loginEmail || "";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Seal className="size-8" />
          <Wordmark className="h-6 w-auto text-foreground" />
        </Link>

        {/* `md` e não `sm`: com cinco itens a navegação estoura entre 640px e 768px. */}
        <nav aria-label="Navegação principal" className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.href}
              href={link.href}
              className="text-xs font-medium uppercase tracking-[0.2em] text-foreground/70 transition-colors hover:text-primary"
              activeClassName="text-primary"
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <CartLink className={ICON_LINK_CLASS} />

          {!loading && loggedIn ? (
            <>
              <Link
                href="/perfil"
                aria-label="Minha conta"
                className={`${ICON_LINK_CLASS} text-xs font-medium`}
              >
                {getInitials(displayName || "Conta")}
              </Link>
              <SignOutButton className={ICON_LINK_CLASS}>
                <LogOut className="size-[18px]" aria-hidden="true" />
              </SignOutButton>
            </>
          ) : (
            <Link href="/login" aria-label="Entrar" className={ICON_LINK_CLASS}>
              <CircleUserRound className="size-[18px]" aria-hidden="true" />
            </Link>
          )}

          <MobileNav isAuthenticated={!loading && loggedIn} />
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Atualizar `mobile-nav.tsx`** (só troca a Server Action pelo novo botão — o resto do arquivo é idêntico)

```tsx
// components/mobile-nav.tsx
"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

import { NAV_LINKS } from "@/lib/nav-links";
import { SignOutButton } from "./sign-out-button";
import { NavLink } from "./nav-link";

const PANEL_LINK_CLASS =
  "rounded-md px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted hover:text-foreground";

/**
 * Menu de navegação para telas estreitas.
 *
 * É um Client Component de propósito: com `<details>` o painel continuava
 * aberto por cima da página nova depois de uma navegação client-side. Aqui o
 * estado é fechado no clique do link, então a navegação sempre limpa o menu.
 */
export function MobileNav({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [isOpen, setIsOpen] = useState(false);

  function handleClose() {
    setIsOpen(false);
  }

  return (
    <div className="relative md:hidden">
      <button
        type="button"
        aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
        aria-expanded={isOpen}
        aria-controls="mobile-nav-panel"
        onClick={() => setIsOpen((open) => !open)}
        className="inline-flex size-9 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
      >
        {isOpen ? (
          <X className="size-[18px]" aria-hidden="true" />
        ) : (
          <Menu className="size-[18px]" aria-hidden="true" />
        )}
      </button>

      {isOpen ? (
        <nav
          id="mobile-nav-panel"
          aria-label="Navegação (menu)"
          className="absolute right-0 top-12 flex w-48 flex-col gap-1 rounded-lg border border-border bg-card p-2 shadow-lg"
        >
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.href}
              href={link.href}
              onClick={handleClose}
              className={PANEL_LINK_CLASS}
              activeClassName="bg-muted text-primary"
            >
              {link.label}
            </NavLink>
          ))}
          <NavLink
            href="/carrinho"
            onClick={handleClose}
            className={PANEL_LINK_CLASS}
            activeClassName="bg-muted text-primary"
          >
            Carrinho
          </NavLink>
          <NavLink
            href={isAuthenticated ? "/perfil" : "/login"}
            onClick={handleClose}
            className={PANEL_LINK_CLASS}
            activeClassName="bg-muted text-primary"
          >
            Minha conta
          </NavLink>
          {isAuthenticated ? (
            <SignOutButton className={`w-full text-left ${PANEL_LINK_CLASS}`}>
              Sair
            </SignOutButton>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 3: Verificar manualmente**

Run: `npm run dev`. Deslogado: header mostra ícone de entrar. Logado (após
Task 10 funcionar): header mostra iniciais + botão de sair; clicar em sair
volta pro estado deslogado.

- [ ] **Step 4: Commit**

```bash
git add components/site-header.tsx components/mobile-nav.tsx
git commit -m "feat(auth): read member session from useMember in header/nav"
```

---

### Task 16: Proteger `/perfil`, `/carrinho`, `/checkout` com `RequireAuth`

Só o gate (redireciona quem não está logado) — não mexe na busca de dados
dessas páginas. Ver a seção "⚠️ Lacuna descoberta" no topo: `/perfil` e
`/checkout` vão continuar quebrando na busca de dados até a Task 22
substituí-las pela tela de manutenção. `/carrinho` não busca dado de usuário
(usa `useCart()`, local) — funciona de ponta a ponta só com esta task.

**Files:**
- Modify: `app/(site)/perfil/page.tsx`
- Modify: `app/(site)/carrinho/page.tsx`
- Modify: `app/(site)/checkout/page.tsx`

**Interfaces:**
- Consumes: `RequireAuth` de `components/require-auth.tsx` (Task 9).

- [ ] **Step 1: Envolver `perfil/page.tsx`**

`perfil/page.tsx` é hoje um Server Component `async` que já busca dado
(`getPerfilData()`) — `RequireAuth` é Client Component, então a chamada
`await getPerfilData()` não pode mais acontecer direto no topo de um
componente que vira filho de um gate client-side síncrono da forma antiga.
Pelo `children` do App Router, um Server Component AINDA pode ser passado
como `children` pra um Client Component wrapper — a única mudança aqui é
importar `RequireAuth` e envolver o retorno; a busca de dados em si só para
de dar erro quando a Task 22 substituir este arquivo pela tela de
manutenção.

```tsx
// app/(site)/perfil/page.tsx (só o topo e o wrap do return mudam — o miolo é o mesmo arquivo de hoje)
import type { Metadata } from "next";

import { BookCard } from "@/components/book-card";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { RequireAuth } from "@/components/require-auth";
import { formatDate, formatPrice } from "@/lib/format";
import { getPerfilData } from "./_data-access/get-profile";
import type { Order } from "./_data-access/get-profile";

export const metadata: Metadata = {
  title: "Minha conta",
  description: "Sua estante, seus pedidos e seus dados na Hocus Pocus.",
};

const ORDER_STATUS: Record<
  Order["status"],
  { label: string; variant: "secondary" | "default" | "outline" }
> = {
  entregue: { label: "Entregue", variant: "outline" },
  "em-transito": { label: "Em trânsito", variant: "default" },
  processando: { label: "Processando", variant: "secondary" },
  cancelado: { label: "Cancelado", variant: "secondary" },
};

export default async function PerfilPage() {
  const { profile, orders, shelf } = await getPerfilData();

  const initials = profile.name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

  return (
    <RequireAuth>
      <PageHeader eyebrow="Minha conta" title={profile.name}>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <span
            aria-hidden="true"
            className="flex size-14 items-center justify-center rounded-full bg-primary font-display text-xl text-primary-foreground"
          >
            {initials}
          </span>
          <div>
            <p className="font-mono text-sm text-foreground">{profile.email}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.15em] text-muted-foreground">
              Leitora desde {formatDate(profile.memberSince)}
            </p>
          </div>
          {profile.plan ? <Badge>{profile.plan}</Badge> : null}
        </div>
      </PageHeader>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="font-display text-2xl text-foreground sm:text-3xl">
          Minha estante
        </h2>
        <p className="mt-3 font-serif text-muted-foreground">
          {shelf.length} títulos adquiridos.
        </p>

        <ul className="mt-10 grid grid-cols-2 gap-x-8 gap-y-14 lg:grid-cols-4 lg:gap-x-10 lg:gap-y-16">
          {shelf.map((book) => (
            <li key={book.slug}>
              <BookCard book={book} />
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-border bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="font-display text-2xl text-foreground sm:text-3xl">
            Pedidos
          </h2>

          <ul className="mt-8 flex flex-col gap-4">
            {orders.map((order) => (
              <li
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card px-5 py-4"
              >
                <div>
                  <p className="font-mono text-sm text-foreground tabular-nums">
                    {order.id}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(order.placedAt)} ·{" "}
                    {order.items.length === 1
                      ? "1 item"
                      : `${order.items.length} itens`}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-mono text-sm text-foreground tabular-nums">
                    {formatPrice(order.total)}
                  </span>
                  <Badge variant={ORDER_STATUS[order.status].variant}>
                    {ORDER_STATUS[order.status].label}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </RequireAuth>
  );
}
```

**Nota:** enquanto a Task 22 não rodar, `getPerfilData()` continua chamando
`requireSession()` do Supabase normalmente (ainda funciona até lá). A Task 22
substitui este arquivo inteiro pela tela de manutenção — a decisão de não
usar service role (ver "Lacuna descoberta") já está tomada, não é mais uma
pendência.

- [ ] **Step 2: Envolver `carrinho/page.tsx`** (só o wrap — `useCart()` não muda)

Adicione `import { RequireAuth } from "@/components/require-auth";` no topo e
envolva os dois `return` do componente (o de carrinho vazio e o principal)
com `<RequireAuth>...</RequireAuth>`.

- [ ] **Step 3: Envolver `checkout/page.tsx`**

```tsx
// app/(site)/checkout/page.tsx
import type { Metadata } from "next";

import { RequireAuth } from "@/components/require-auth";
import { CheckoutForm } from "./_components/checkout-form";
import { getSavedAddresses } from "./_data-access/get-addresses";

export const metadata: Metadata = {
  title: "Finalizar pedido",
  description: "Confirme o endereço de entrega e finalize seu pedido.",
};

export default async function CheckoutPage() {
  const savedAddresses = await getSavedAddresses();

  return (
    <RequireAuth>
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-2xl text-foreground sm:text-3xl">
          Finalizar pedido
        </h1>
        <div className="mt-8">
          <CheckoutForm savedAddresses={savedAddresses} />
        </div>
      </div>
    </RequireAuth>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add "app/(site)/perfil/page.tsx" "app/(site)/carrinho/page.tsx" "app/(site)/checkout/page.tsx"
git commit -m "feat(auth): gate /perfil, /carrinho, /checkout with client-side RequireAuth"
```

---

### Task 17: Helper server-side pra resolver o membro a partir do token

Peça compartilhada pelas Tasks 19 (gate do admin) e 21 (ponte de dados do
perfil/checkout, se aprovada): dado um token de acesso do Wix (mandado pelo
client num header), resolve o e-mail do membro **no servidor**, chamando a
própria API da Wix com esse token — nunca confiando num e-mail que o client
diga que é o dele.

**Files:**
- Create: `lib/wix/resolve-member.ts`

**Interfaces:**
- Produces: `resolveMemberFromRequest(request: Request): Promise<{ email: string; id: string } | null>`.

- [ ] **Step 1: Criar o arquivo**

```ts
// lib/wix/resolve-member.ts
import "server-only";

import { WIX_API_BASE } from "./client";

/**
 * Lê o token do membro do header `Authorization` de uma Request server-side
 * (Route Handler) e resolve a identidade **chamando a própria API da Wix com
 * esse token** — nunca aceitar um e-mail que o client alegue ser o seu, já
 * que o Route Handler roda fora do alcance do `localStorage` e não tem outra
 * forma de saber quem está do outro lado.
 */
export async function resolveMemberFromRequest(
  request: Request,
): Promise<{ email: string; id: string } | null> {
  const auth = request.headers.get("authorization");
  if (!auth) return null;

  const res = await fetch(`${WIX_API_BASE}/members/v1/members/my`, {
    method: "GET",
    headers: { Authorization: auth },
  });
  if (!res.ok) return null;

  const data = await res.json();
  const email: string | undefined = data?.member?.loginEmail;
  const id: string | undefined = data?.member?.id;
  if (!email || !id) return null;
  return { email, id };
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/wix/resolve-member.ts
git commit -m "feat(wix): add server-side member resolution from access token"
```

---

### Task 18: Coleção de admins no Wix Data + Admin API Key (manual)

Sem código nesta task.

- [ ] **Step 1:** No painel do site, vá em **Conteúdo → Coleções do CMS** (Wix
  Data) e crie uma coleção chamada `Admins`, com um único campo de texto
  `email`.
- [ ] **Step 2:** Adicione seu próprio e-mail (o que você vai usar pra logar
  como admin) como o primeiro item da coleção.
- [ ] **Step 3:** Em `https://manage.wix.com/dashboard/14110309-77c6-4b74-b8af-893fe1f1e12c/oauth-apps-settings`,
  gere a **Chave de API de administrador** ("Chave de API de administrador" /
  Admin API Key).
- [ ] **Step 4:** Guarde essa chave como variável de ambiente de servidor —
  **nunca** com prefixo `NEXT_PUBLIC_` (ela precisa ficar de fora do bundle
  client). No `.env.local` (e no painel do EasyPanel, em produção):

```bash
WIX_ADMIN_API_KEY=<a chave gerada>
```

- [ ] **Step 5:** Confirme em `.env.example` (crie se não existir) que a
  chave `WIX_ADMIN_API_KEY=` está documentada, sem o valor real.

---

### Task 19: `lib/wix/admin.ts` + Route Handler `/api/admin/check`

**Antes de escrever este código, confirme o formato exato da consulta Wix
Data v2** com a doc oficial (`SearchWixRESTDocumentation`/`wix-docs` por
`items/query`, ou `dev.wix.com/docs/api-reference/wix-data/items/query`) —
o corpo abaixo é minha melhor estimativa com base no padrão de outras APIs
Wix (`Authorization` cru + header `wix-site-id`), mas não foi confirmado
contra a doc dessa API específica nesta sessão de planejamento. Ajuste se a
doc mostrar um shape diferente.

**Files:**
- Create: `lib/wix/admin.ts`
- Create: `app/api/admin/check/route.ts`

**Interfaces:**
- Consumes: `resolveMemberFromRequest` de `lib/wix/resolve-member.ts` (Task 17).
- Produces: `isAdminEmail(email: string): Promise<boolean>`; endpoint `POST /api/admin/check` → `{ isAdmin: boolean }`.

- [ ] **Step 1: Criar `lib/wix/admin.ts`**

```ts
// lib/wix/admin.ts
import "server-only";

import { WIX_API_BASE } from "./client";
import { WIX_METASITE_ID } from "./config";

const ADMIN_API_KEY = process.env.WIX_ADMIN_API_KEY;
const ADMINS_COLLECTION_ID = "Admins";

/** Consulta a coleção `Admins` do Wix Data com a Admin API Key — nunca chamado
 * a partir do client (a chave é secreta). */
export async function isAdminEmail(email: string): Promise<boolean> {
  if (!ADMIN_API_KEY) {
    throw new Error("WIX_ADMIN_API_KEY não configurada no servidor.");
  }

  const res = await fetch(`${WIX_API_BASE}/wix-data/v2/items/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: ADMIN_API_KEY,
      "wix-site-id": WIX_METASITE_ID,
    },
    body: JSON.stringify({
      dataCollectionId: ADMINS_COLLECTION_ID,
      query: {
        filter: { email: { $eq: email } },
        cursorPaging: { limit: 1 },
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Wix Data query falhou: ${res.status}`);
  }
  const data = await res.json();
  const items: unknown[] = data?.dataItems ?? [];
  return items.length > 0;
}
```

- [ ] **Step 2: Criar o Route Handler**

```ts
// app/api/admin/check/route.ts
import { NextResponse } from "next/server";

import { isAdminEmail } from "@/lib/wix/admin";
import { resolveMemberFromRequest } from "@/lib/wix/resolve-member";

export async function POST(request: Request) {
  const member = await resolveMemberFromRequest(request);
  if (!member) {
    return NextResponse.json({ isAdmin: false }, { status: 401 });
  }

  const isAdmin = await isAdminEmail(member.email);
  return NextResponse.json({ isAdmin });
}
```

- [ ] **Step 3: Verificar manualmente**

Pré-requisito: Task 18 concluída. Com o dev server rodando e logado como o
e-mail cadastrado na coleção `Admins`, abra o DevTools do browser e rode:

```js
const token = await (await import("/lib/wix/client")).getAccessToken?.() // ajuste o caminho de import conforme seu bundler resolver em dev
fetch("/api/admin/check", { headers: { Authorization: token } }).then(r => r.json()).then(console.log)
```

Expected: `{ isAdmin: true }` pro e-mail cadastrado, `{ isAdmin: false }` pra
qualquer outro membro logado.

- [ ] **Step 4: Commit**

```bash
git add lib/wix/admin.ts "app/api/admin/check/route.ts"
git commit -m "feat(admin): add Wix Data-backed admin check endpoint"
```

---

### Task 20: `AdminGate` + atualizar `app/(admin)/layout.tsx`

O layout do admin era `async` e chamava `requireAdminSession()` (Supabase,
server-side, antes de renderizar). Sem cookie de sessão, essa checagem não
pode mais acontecer antes da renderização — vira um gate client-side que, ao
montar, manda o token do membro pro `/api/admin/check` (Task 19) e só
renderiza o conteúdo se a resposta for `isAdmin: true`. Isso é uma correção
em relação ao que a spec (decisão 2) prometia ("proteção real de servidor
antes de renderizar") — tecnicamente não dá pra manter isso sem cookie; o que
sobrevive é a Admin API Key nunca sair do servidor, e a fonte da verdade
(coleção Wix Data) só ser consultada lá.

**Files:**
- Create: `components/admin-gate.tsx`
- Modify: `app/(admin)/layout.tsx`

**Interfaces:**
- Consumes: `useMember` de `lib/wix/member-context.tsx`; `getAccessToken` de `lib/wix/client.ts`.

- [ ] **Step 1: Criar `AdminGate`**

```tsx
// components/admin-gate.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useMember } from "@/lib/wix/member-context";
import { getAccessToken } from "@/lib/wix/client";

type CheckState = "checking" | "allowed" | "denied";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const { loggedIn, loading } = useMember();
  const [state, setState] = useState<CheckState>("checking");
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!loggedIn) {
      router.replace("/login");
      return;
    }
    let cancelled = false;
    (async () => {
      const token = await getAccessToken();
      const res = await fetch("/api/admin/check", {
        method: "POST",
        headers: { Authorization: token },
      });
      const data = await res.json().catch(() => ({ isAdmin: false }));
      if (cancelled) return;
      if (data.isAdmin) {
        setState("allowed");
      } else {
        setState("denied");
        router.replace("/");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, loggedIn, router]);

  if (state !== "allowed") {
    return <div className="p-12 text-center text-muted-foreground">Verificando acesso…</div>;
  }

  return <>{children}</>;
}
```

- [ ] **Step 2: Atualizar `app/(admin)/layout.tsx`**

```tsx
// app/(admin)/layout.tsx
import type { Metadata } from "next";
import Link from "next/link";

import { AdminGate } from "@/components/admin-gate";

export const metadata: Metadata = {
  title: { template: "%s | Admin", default: "Admin" },
  robots: { index: false, follow: false },
};

const ADMIN_NAV_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/pedidos", label: "Pedidos" },
] as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGate>
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

        <main id="main-content" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          {children}
        </main>
      </div>
    </AdminGate>
  );
}
```

- [ ] **Step 3: Verificar manualmente**

Logado como um membro comum (não admin): acessar `/admin` deve mostrar
"Verificando acesso…" e depois redirecionar pra `/`. Logado como o e-mail da
coleção `Admins`: deve renderizar o layout do admin (o conteúdo interno —
`/admin/pedidos` etc. — ainda busca dado do Supabase normalmente até a Task
22 rodar; depois dela, mostra a tela de manutenção em vez de dado real, sem
erro — isso é esperado, ver "Lacuna descoberta" no topo).

- [ ] **Step 4: Commit**

```bash
git add components/admin-gate.tsx "app/(admin)/layout.tsx"
git commit -m "feat(admin): gate /admin via client-side check against Wix Data"
```

---

### Task 21 [REJEITADA — mantida como registro da decisão]: ponte de dados via service role

**Não execute esta task.** Foi cogitada como forma barata de manter
`/perfil` e `/checkout` funcionando sem tocar no escopo de loja/checkout,
trocando `getPerfilData()`/`getSavedAddresses()` de "sessão Supabase" pra um
client com `SUPABASE_SERVICE_ROLE_KEY` (bypassa RLS, filtro só na
aplicação).

**Rejeitada pelo usuário** por reintroduzir exatamente o padrão que a spec
`2026-08-21-admin-panel-design.md` já tinha descartado por segurança: sem
RLS como rede de segurança, um data-access que esqueça o filtro de e-mail
vaza a tabela inteira. A decisão foi estendida ao painel admin também
(achado posterior, ver "Lacuna descoberta" no topo) — nenhuma parte do
projeto usa service role nesta fase. Ver Task 22 pelo caminho efetivamente
seguido.

---

### Task 22: Remover Supabase por completo + telas afetadas em manutenção

Decisão final registrada em "Lacuna descoberta" (topo do plano): sem service
role em nenhuma parte do projeto. `/perfil`, `/checkout` e as três telas do
admin (`dashboard`, `pedidos`, `pedidos/[numero]`) perdem sua fonte de dados
Supabase nesta task e passam a mostrar um estado de manutenção — a
reconstrução delas em cima do Wix é trabalho da fase 3 (e da fase 2, no caso
do checkout).

**Files:**
- Create: `components/maintenance-notice.tsx`
- Modify: `app/(site)/perfil/page.tsx`
- Modify: `app/(site)/checkout/page.tsx`
- Modify: `app/(admin)/admin/page.tsx`
- Modify: `app/(admin)/admin/pedidos/page.tsx`
- Modify: `app/(admin)/admin/pedidos/[numero]/page.tsx`
- Delete: `app/(site)/perfil/_data-access/get-profile.ts`
- Delete: `app/(site)/checkout/_data-access/get-addresses.ts`
- Delete: `app/(site)/checkout/_actions/create-order.ts`
- Delete: `app/(site)/checkout/_components/checkout-form.tsx`
- Delete: `app/(admin)/admin/_data-access/get-dashboard-metrics.ts`
- Delete: `app/(admin)/admin/pedidos/_data-access/get-orders.ts`
- Delete: `app/(admin)/admin/pedidos/[numero]/_data-access/get-order-detail.ts`
- Delete: `lib/supabase/` (diretório inteiro: `session.ts`, `middleware.ts`, `server.ts`, `database.types.ts`, `queries/orders.ts`, `queries/addresses.ts`, `actions/sign-out.ts`)
- Delete: `proxy.ts`
- Delete: `app/auth/confirm/route.ts`
- Modify: `package.json` (remover `@supabase/ssr` e `@supabase/supabase-js`)

**Interfaces:**
- Consumes: nada de tasks anteriores — esta task só remove e substitui conteúdo.
- Produces: `MaintenanceNotice` (`components/maintenance-notice.tsx`), reaproveitado pelas 5 páginas.

- [ ] **Step 1: Criar o componente compartilhado de manutenção**

```tsx
// components/maintenance-notice.tsx
type MaintenanceNoticeProps = {
  title: string;
  description: string;
};

export function MaintenanceNotice({ title, description }: MaintenanceNoticeProps) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
      <h1 className="font-display text-2xl text-foreground sm:text-3xl">{title}</h1>
      <p className="mt-4 font-serif text-muted-foreground">{description}</p>
    </div>
  );
}
```

- [ ] **Step 2: Trocar `/perfil` pela tela de manutenção**

**Mantém o `<RequireAuth>` que a Task 16 já colocou aqui** — esta página
continua exigindo login, só o conteúdo interno muda de dado real pra aviso
de manutenção. Substitua todo o conteúdo de `app/(site)/perfil/page.tsx`:

```tsx
import type { Metadata } from "next";

import { MaintenanceNotice } from "@/components/maintenance-notice";
import { RequireAuth } from "@/components/require-auth";

export const metadata: Metadata = {
  title: "Minha conta",
  description: "Sua estante, seus pedidos e seus dados na Hocus Pocus.",
};

export default function PerfilPage() {
  return (
    <RequireAuth>
      <MaintenanceNotice
        title="Em manutenção"
        description="Estamos migrando o backend da loja. Sua conta, pedidos e estante voltam a aparecer aqui em breve."
      />
    </RequireAuth>
  );
}
```

- [ ] **Step 3: Trocar `/checkout` pela tela de manutenção**

**Mantém o `<RequireAuth>` que a Task 16 já colocou aqui**, pelo mesmo
motivo do Step 2. Substitua todo o conteúdo de `app/(site)/checkout/page.tsx`:

```tsx
import type { Metadata } from "next";

import { MaintenanceNotice } from "@/components/maintenance-notice";
import { RequireAuth } from "@/components/require-auth";

export const metadata: Metadata = {
  title: "Finalizar pedido",
  description: "Confirme o endereço de entrega e finalize seu pedido.",
};

export default function CheckoutPage() {
  return (
    <RequireAuth>
      <MaintenanceNotice
        title="Checkout em manutenção"
        description="Estamos migrando o backend da loja. Volte em breve para finalizar sua compra."
      />
    </RequireAuth>
  );
}
```

- [ ] **Step 4: Trocar as três telas do admin pela tela de manutenção**

Substitua todo o conteúdo de `app/(admin)/admin/page.tsx`:

```tsx
import type { Metadata } from "next";

import { MaintenanceNotice } from "@/components/maintenance-notice";

export const metadata: Metadata = { title: "Dashboard" };

export default function AdminDashboardPage() {
  return (
    <MaintenanceNotice
      title="Dashboard em manutenção"
      description="As métricas de pedidos voltam aqui quando o painel for reconstruído sobre o Wix, na fase 3 da migração."
    />
  );
}
```

Substitua todo o conteúdo de `app/(admin)/admin/pedidos/page.tsx`:

```tsx
import type { Metadata } from "next";

import { MaintenanceNotice } from "@/components/maintenance-notice";

export const metadata: Metadata = { title: "Pedidos" };

export default function AdminOrdersPage() {
  return (
    <MaintenanceNotice
      title="Pedidos em manutenção"
      description="A lista de pedidos volta aqui quando o painel for reconstruído sobre o Wix, na fase 3 da migração."
    />
  );
}
```

Substitua todo o conteúdo de `app/(admin)/admin/pedidos/[numero]/page.tsx`:

```tsx
import type { Metadata } from "next";

import { MaintenanceNotice } from "@/components/maintenance-notice";

export const metadata: Metadata = { title: "Detalhe do pedido" };

export default function AdminOrderDetailPage() {
  return (
    <MaintenanceNotice
      title="Detalhe do pedido em manutenção"
      description="O detalhe de pedidos volta aqui quando o painel for reconstruído sobre o Wix, na fase 3 da migração."
    />
  );
}
```

- [ ] **Step 5: Remover os data-access e componentes órfãos**

```bash
rm "app/(site)/perfil/_data-access/get-profile.ts"
rm "app/(site)/checkout/_data-access/get-addresses.ts"
rm "app/(site)/checkout/_actions/create-order.ts"
rm "app/(site)/checkout/_components/checkout-form.tsx"
rm "app/(admin)/admin/_data-access/get-dashboard-metrics.ts"
rm "app/(admin)/admin/pedidos/_data-access/get-orders.ts"
rm "app/(admin)/admin/pedidos/[numero]/_data-access/get-order-detail.ts"
```

`app/(site)/checkout/_lib/checkout-schema.ts` não referencia Supabase — fica
como está, sem uso por enquanto, pra ser reaproveitado na reescrita do
checkout na fase 2.

- [ ] **Step 6: Remover `lib/supabase/`, `proxy.ts` e a rota de confirmação**

```bash
rm -rf lib/supabase
rm proxy.ts
rm "app/auth/confirm/route.ts"
```

- [ ] **Step 7: Remover as dependências do Supabase**

```bash
npm uninstall @supabase/ssr @supabase/supabase-js
```

- [ ] **Step 8: Atualizar variáveis de ambiente**

Remova de `.env.local`, `.env.example` e do painel do EasyPanel:
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, e
qualquer chave de service role que eventualmente exista (não deveria, já que
a Task 21 foi rejeitada — é só uma checagem de segurança).

- [ ] **Step 9: Rodar as verificações do projeto**

Run: `npm run type-check && npm run lint`
Expected: sem erros. Corrija qualquer import quebrado que apontava pros
arquivos removidos antes de prosseguir — em especial `components/site-header.tsx`
e `components/mobile-nav.tsx` (Task 15), e confirme que nada mais importa
tipos como `Order`/`Profile` que viviam em `get-profile.ts`.

- [ ] **Step 10: Checklist de verificação manual completo**

- [ ] Cadastro completo (com código de verificação) cria e loga o membro.
- [ ] Login funciona; senha errada mostra mensagem sem revelar detalhe.
- [ ] Logout limpa a sessão e volta pro estado deslogado.
- [ ] Sessão sobrevive a um `F5` (reload).
- [ ] "Esqueci senha" de ponta a ponta: e-mail chega, link funciona, `/atualizar-senha` mostra a confirmação.
- [ ] Acesso a `/perfil` sem sessão redireciona pra `/login`; logado, mostra a mensagem de manutenção (sem erro 500).
- [ ] Acesso a `/checkout` sem sessão redireciona pra `/login`; logado, mostra a mensagem de manutenção.
- [ ] Acesso a `/admin` sem ser admin redireciona pra `/`.
- [ ] Acesso a `/admin` como o e-mail da coleção `Admins` funciona e mostra as três telas em manutenção (dashboard, pedidos, detalhe), sem erro 500.
- [ ] `grep -r "supabase" app lib components proxy.ts 2>/dev/null` não retorna nada (fora deste plano/spec em `docs/`).

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "chore(auth): remove Supabase entirely, move dependent pages to maintenance"
```
