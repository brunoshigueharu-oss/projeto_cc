import type { Metadata } from "next";

import { MaintenanceNotice } from "@/components/maintenance-notice";

export const metadata: Metadata = { title: "Detalhe do pedido" };

export default function AdminOrderDetailPage() {
  return (
    <MaintenanceNotice
      title="Detalhe do pedido em manutenção"
      description="O detalhe de pedidos volta aqui quando o painel for reconstruído sobre o Wix, na fase 3 da migração."
    />
  );
}
