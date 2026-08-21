import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "./server";

async function getSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

/** Server Components/data-access que exigem sessão — redireciona para
 * `/login` se não houver usuário autenticado (defesa em profundidade: o
 * `proxy.ts` já protege as rotas, mas a sessão pode expirar entre o check do
 * proxy e a query real). */
export async function requireSession() {
  const { supabase, user } = await getSession();

  if (!user) {
    redirect("/login");
  }

  return { supabase, user };
}

/** Para Server Actions e Server Components que precisam saber se há sessão
 * sem redirecionar — `redirect()` cortaria a resposta de uma Server Action
 * antes de o formulário receber o erro, e a `SiteHeader` renderiza em rotas
 * públicas onde não haver usuário é um estado válido, não um erro. */
export async function getOptionalSession() {
  return getSession();
}
