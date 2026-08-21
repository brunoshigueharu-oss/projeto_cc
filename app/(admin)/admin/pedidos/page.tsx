import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { formatDate, formatPrice } from "@/lib/format";
import { getOrdersList } from "./_data-access/get-orders";

export const metadata: Metadata = { title: "Pedidos" };

const STATUS_VARIANT: Record<string, "secondary" | "default" | "outline"> = {
  entregue: "outline",
  "em-transito": "default",
  processando: "secondary",
  cancelado: "secondary",
};

export default async function AdminOrdersPage() {
  const orders = await getOrdersList();

  if (orders.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum pedido ainda.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {orders.map((order) => (
        <li key={order.id}>
          <Link
            href={`/admin/pedidos/${order.order_number}`}
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card px-5 py-4 transition-colors hover:bg-muted/50"
          >
            <div>
              <p className="font-mono text-sm text-foreground tabular-nums">
                {order.order_number}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {order.profiles?.name ?? "—"} · {formatDate(order.placed_at.slice(0, 10))}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-mono text-sm text-foreground tabular-nums">
                {formatPrice(order.total_cents)}
              </span>
              <Badge variant={STATUS_VARIANT[order.status] ?? "secondary"}>
                {order.status}
              </Badge>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
