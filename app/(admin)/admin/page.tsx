import type { Metadata } from "next";

import { MaintenanceNotice } from "@/components/maintenance-notice";

export const metadata: Metadata = { title: "Dashboard" };

export default function AdminDashboardPage() {
  return (
    <MaintenanceNotice
      title="Dashboard em manutenção"
      description="As métricas de pedidos voltam aqui quando o painel for reconstruído sobre o Wix, na fase 3 da migração."
    />
  );
}
