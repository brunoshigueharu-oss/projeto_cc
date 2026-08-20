import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "./server";

/** Server Components/data-access que exigem sessão — redireciona para
 * `/login` se não houver usuário autenticado (defesa em profundidade: o
 * `proxy.ts` já protege as rotas, mas a sessão pode expirar entre o check do
 * proxy e a query real). */
export async function requireSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { supabase, user };
}
