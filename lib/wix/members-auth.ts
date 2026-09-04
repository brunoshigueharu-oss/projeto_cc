// lib/wix/members-auth.ts
// Porta verbatim (lógica) de wix-vibe-headless/references/members/app/rest/wix-members-auth.js.
// NÃO reescrever os internals — os shapes de OAuth/PKCE (createRedirectSession,
// exchangeCode) são exatos; "simplificar" retorna 400. Estender chamando os
// exports, nunca editando o corpo das funções internas.
import {
  wixApiRequest,
  wixErrorStatus,
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
    const status = wixErrorStatus(e);
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

/** Exportado (era privada no original) só pra dar pra testar isoladamente — as
 * condições de mapeamento são as mesmas do original; só a extração do status
 * do erro passou a usar `wixErrorStatus` (lib/wix/client.ts), compartilhada
 * com outros call-sites que faziam esse cast de forma independente. */
export function mapAuthError(e: unknown): MemberAuthError | Error {
  const status = wixErrorStatus(e);
  const body = (e as { body?: { message?: string; details?: { applicationError?: { code?: string } } } })?.body;
  const code = body?.details?.applicationError?.code;
  if (code === "-19995" || status === 409) {
    return new MemberAuthError("emailAlreadyExists", "An account with this email already exists — try logging in instead.");
  }
  if (code === "-19999" || code === "-19976" || status === 404 || status === 401) {
    return new MemberAuthError("invalidCredentials", "Incorrect email or password.");
  }
  if (e instanceof MemberAuthError) return e;
  // Erro do Wix não coberto pelos mapeamentos acima (ex.: SITE_NOT_PUBLISHED_EXCEPTION
  // quando o site está em rascunho) — sem isso, o único rastro fica escondido dentro
  // da string de `Error.message` montada em wixApiRequest. Loga o código/mensagem
  // reais separadamente, sem alterar o valor retornado (o caller ainda recebe `e`
  // intacto — ver teste "bubbles an unmapped error as-is").
  if (code || body?.message) {
    console.error(`[wix-auth] erro não mapeado do Wix (status ${status ?? "?"}):`, code ?? body?.message);
  }
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
