import type { Metadata } from "next";

import { MaintenanceNotice } from "@/components/maintenance-notice";
import { RequireAuth } from "@/components/require-auth";

export const metadata: Metadata = {
  title: "Finalizar pedido",
  description: "Confirme o endereço de entrega e finalize seu pedido.",
};

export default function CheckoutPage() {
  return (
    <RequireAuth>
      <MaintenanceNotice
        title="Checkout em manutenção"
        description="Estamos migrando o backend da loja. Volte em breve para finalizar sua compra."
      />
    </RequireAuth>
  );
}
