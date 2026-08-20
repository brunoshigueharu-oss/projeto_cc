import type { Metadata } from "next";

import { CadastroForm } from "./_components/cadastro-form";

export const metadata: Metadata = {
  title: "Criar conta",
  description: "Crie sua conta na Hocus Pocus.",
};

export default function CadastroPage() {
  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Criar conta</h1>
      <p className="mt-2 font-serif text-sm text-muted-foreground">
        Acompanhe seus pedidos e monte sua estante.
      </p>
      <div className="mt-8">
        <CadastroForm />
      </div>
    </div>
  );
}
