import type { Metadata } from "next";

import { requireSession } from "@/lib/supabase/session";
import { AtualizarSenhaForm } from "./_components/atualizar-senha-form";

export const metadata: Metadata = {
  title: "Definir nova senha",
  description: "Defina uma nova senha para sua conta na Hocus Pocus.",
};

export default async function AtualizarSenhaPage() {
  // Exige uma sessão válida — só existe depois que o link do e-mail de
  // recuperação passou por `app/auth/confirm`, que troca o token por uma
  // sessão real via `verifyOtp`.
  await requireSession();

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Definir nova senha</h1>
      <p className="mt-2 font-serif text-sm text-muted-foreground">
        Escolha uma nova senha para acessar sua conta.
      </p>
      <div className="mt-8">
        <AtualizarSenhaForm />
      </div>
    </div>
  );
}
