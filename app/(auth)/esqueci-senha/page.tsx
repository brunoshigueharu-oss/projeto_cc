import type { Metadata } from "next";

import { EsqueciSenhaForm } from "./_components/esqueci-senha-form";

export const metadata: Metadata = {
  title: "Esqueci minha senha",
  description: "Receba um link para redefinir sua senha na Hocus Pocus.",
};

export default function EsqueciSenhaPage() {
  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Esqueci minha senha</h1>
      <p className="mt-2 font-serif text-sm text-muted-foreground">
        Informe o e-mail da sua conta e enviaremos um link para redefinir a senha.
      </p>
      <div className="mt-8">
        <EsqueciSenhaForm />
      </div>
    </div>
  );
}
