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
