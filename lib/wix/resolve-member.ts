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
