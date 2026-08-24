import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearSession, getAccessToken, isMember, setSessionTokens, WIX_API_BASE } from "./client";

const OAUTH_TOKEN_URL = `${WIX_API_BASE}/oauth2/token`;

describe("lib/wix/client", () => {
  beforeEach(() => {
    clearSession();
  });

  afterEach(() => {
    clearSession();
    vi.unstubAllGlobals();
  });

  it("isMember() retorna false depois de clearSession()", () => {
    setSessionTokens({ accessToken: "a", refreshToken: "r", expiresIn: 3600 });
    expect(isMember()).toBe(true);

    clearSession();

    expect(isMember()).toBe(false);
  });

  it("getAccessToken() cai pra token de visitante (sem lançar) quando o refresh falha", async () => {
    // Sessão de membro já expirada — expiresIn negativo força expiresAt no passado.
    setSessionTokens({ accessToken: "expired-access", refreshToken: "expired-refresh", expiresIn: -1000 });
    expect(isMember()).toBe(true);

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      expect(url).toBe(OAUTH_TOKEN_URL);

      const body = init?.body ? JSON.parse(init.body as string) : {};

      if (body.grantType === "refresh_token") {
        // Simula o refresh de token falhando (token de membro expirado/revogado).
        return new Response(JSON.stringify({ error: "invalid_grant" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // grantType "anonymous" — fallback silencioso pra visitante.
      return new Response(
        JSON.stringify({
          access_token: "visitor-access-token",
          refresh_token: "visitor-refresh-token",
          expires_in: 3600,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const token = await getAccessToken();

    expect(token).toBe("visitor-access-token");
    expect(isMember()).toBe(false);
  });
});
