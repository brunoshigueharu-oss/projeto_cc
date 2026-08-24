import type { Metadata } from "next";

import { MaintenanceNotice } from "@/components/maintenance-notice";

export const metadata: Metadata = { title: "Pedidos" };

export default function AdminOrdersPage() {
  return (
    <MaintenanceNotice
      title="Pedidos em manutenção"
      description="A lista de pedidos volta aqui quando o painel for reconstruído sobre o Wix, na fase 3 da migração."
    />
  );
}
