import type { Metadata } from "next";

import { formatPrice } from "@/lib/format";
import { getDashboardMetrics } from "./_data-access/get-dashboard-metrics";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const metrics = await getDashboardMetrics();

  const cards = [
    { label: "Total de pedidos", value: metrics.totalOrders.toString() },
    { label: "Faturamento", value: formatPrice(metrics.totalRevenueCents) },
    { label: "Pedidos pendentes", value: metrics.pendingOrders.toString() },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border border-border bg-card px-5 py-4">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
            {card.label}
          </p>
          <p className="mt-2 font-display text-2xl text-foreground">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
