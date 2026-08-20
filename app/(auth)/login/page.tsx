import type { Metadata } from "next";

import { LoginForm } from "./_components/login-form";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Acesse sua conta na Hocus Pocus.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const params = await searchParams;

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Entrar</h1>
      <p className="mt-2 font-serif text-sm text-muted-foreground">
        Acesse sua estante e seus pedidos.
      </p>
      <div className="mt-8">
        <LoginForm redirectTo={params.redirect} />
      </div>
    </div>
  );
}
