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

/** Extrai o `status` HTTP de um erro lançado por `wixApiRequest` — mesmo shape
 * (`err.status`) reconstruído independentemente em vários call-sites antes
 * desta função existir. `unknown` porque o erro chega de um `catch`; aceita
 * qualquer objeto com `status` numérico (não só `instanceof Error`) pra
 * casar com os testes existentes, que simulam o erro como objeto plano. */
export function wixErrorStatus(e: unknown): number | undefined {
  if (typeof e !== "object" || e === null) return undefined;
  const status = (e as { status?: unknown }).status;
  return typeof status === "number" ? status : undefined;
}
