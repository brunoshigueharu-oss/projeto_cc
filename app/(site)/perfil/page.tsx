import type { Metadata } from "next";

import { MaintenanceNotice } from "@/components/maintenance-notice";
import { RequireAuth } from "@/components/require-auth";

export const metadata: Metadata = {
  title: "Minha conta",
  description: "Sua estante, seus pedidos e seus dados na Hocus Pocus.",
};

export default function PerfilPage() {
  return (
    <RequireAuth>
      <MaintenanceNotice
        title="Em manutenção"
        description="Estamos migrando o backend da loja. Sua conta, pedidos e estante voltam a aparecer aqui em breve."
      />
    </RequireAuth>
  );
}
