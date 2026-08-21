import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { formatDate, formatPrice } from "@/lib/format";
import { getOrderDetail } from "./_data-access/get-order-detail";

export const metadata: Metadata = { title: "Detalhe do pedido" };

export default async function AdminOrderDetailPage(
  props: PageProps<"/admin/pedidos/[numero]">,
) {
  const { numero } = await props.params;
  const order = await getOrderDetail(numero);

  if (!order) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl text-foreground">{order.order_number}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatDate(order.placed_at.slice(0, 10))}
        </p>
        <div className="mt-3 flex gap-2">
          <Badge>{order.status}</Badge>
          <Badge variant="outline">{order.payment_status}</Badge>
        </div>
      </div>

      <section>
        <h2 className="text-sm font-medium uppercase tracking-[0.1em] text-muted-foreground">
          Cliente
        </h2>
        <p className="mt-2 text-sm text-foreground">
          {order.profiles?.name ?? "—"} · {order.profiles?.email ?? "—"}
        </p>
      </section>

      {order.addresses ? (
        <section>
          <h2 className="text-sm font-medium uppercase tracking-[0.1em] text-muted-foreground">
            Endereço de entrega
          </h2>
          <p className="mt-2 text-sm text-foreground">
            {order.addresses.recipient_name} — {order.addresses.street}, {order.addresses.number}
            {order.addresses.complement ? ` (${order.addresses.complement})` : ""}
            <br />
            {order.addresses.neighborhood}, {order.addresses.city} - {order.addresses.state}
            <br />
            CEP {order.addresses.postal_code}
          </p>
        </section>
      ) : null}

      <section>
        <h2 className="text-sm font-medium uppercase tracking-[0.1em] text-muted-foreground">
          Itens
        </h2>
        <ul className="mt-3 flex flex-col gap-2">
          {order.order_items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
            >
              <div>
                <p className="text-sm text-foreground">{item.title_snapshot}</p>
                <p className="text-xs text-muted-foreground">Quantidade: {item.quantity}</p>
              </div>
              <span className="font-mono text-sm text-foreground tabular-nums">
                {formatPrice(item.total_price_cents)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex items-center justify-between border-t border-border pt-4">
        <span className="text-sm font-medium text-foreground">Total</span>
        <span className="font-mono text-base text-foreground tabular-nums">
          {formatPrice(order.total_cents)}
        </span>
      </section>
    </div>
  );
}
