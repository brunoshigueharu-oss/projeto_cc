"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { getAccessToken } from "@/lib/wix/client";
import type { WixOrderDetail } from "@/lib/wix/orders";

import { formatOrderDate } from "../../_lib/format-order-date";

type FetchState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "not-found" }
  | { status: "loaded"; order: WixOrderDetail };

export function OrderDetailContent({ orderId }: { orderId: string }) {
  const [state, setState] = useState<FetchState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getAccessToken();
        const res = await fetch(`/api/admin/orders/${orderId}`, {
          method: "POST",
          headers: { Authorization: token },
        });
        if (res.status === 404) {
          if (!cancelled) setState({ status: "not-found" });
          return;
        }
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        setState({ status: "loaded", order: data.order });
      } catch {
        if (cancelled) return;
        setState({ status: "error" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (state.status === "loading") {
    return <p className="text-sm text-muted-foreground">Carregando pedido…</p>;
  }

  if (state.status === "not-found") {
    return <p className="text-sm text-muted-foreground">Pedido não encontrado.</p>;
  }

  if (state.status === "error") {
    return <p className="text-sm text-muted-foreground">Não foi possível carregar o pedido.</p>;
  }

  const { order } = state;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl text-foreground">#{order.number}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{formatOrderDate(order.createdDate)}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="outline">{order.paymentStatusLabel}</Badge>
          <Badge variant="secondary">{order.fulfillmentStatusLabel}</Badge>
          {order.orderStatusLabel ? (
            <Badge variant="destructive">{order.orderStatusLabel}</Badge>
          ) : null}
        </div>
      </div>

      <section>
        <h2 className="text-sm font-medium uppercase tracking-[0.1em] text-muted-foreground">
          Cliente
        </h2>
        <p className="mt-2 text-sm text-foreground">{order.buyerEmail}</p>
      </section>

      {order.shippingAddress ? (
        <section>
          <h2 className="text-sm font-medium uppercase tracking-[0.1em] text-muted-foreground">
            Endereço de entrega
          </h2>
          <p className="mt-2 text-sm text-foreground">
            {order.shippingAddress.recipientName} — {order.shippingAddress.street},{" "}
            {order.shippingAddress.number}
            {order.shippingAddress.addressLine2 ? ` (${order.shippingAddress.addressLine2})` : ""}
            <br />
            {order.shippingAddress.city} - {order.shippingAddress.subdivision}
            <br />
            CEP {order.shippingAddress.postalCode}
          </p>
        </section>
      ) : null}

      <section>
        <h2 className="text-sm font-medium uppercase tracking-[0.1em] text-muted-foreground">
          Itens
        </h2>
        <ul className="mt-3 flex flex-col gap-2">
          {order.lineItems.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
            >
              <div>
                <p className="text-sm text-foreground">{item.name}</p>
                <p className="text-xs text-muted-foreground">Quantidade: {item.quantity}</p>
              </div>
              <span className="font-mono text-sm text-foreground tabular-nums">
                {item.priceFormatted}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-1 border-t border-border pt-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Subtotal</span>
          <span className="font-mono tabular-nums">{order.priceSummary.subtotalFormatted}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Frete</span>
          <span className="font-mono tabular-nums">{order.priceSummary.shippingFormatted}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Impostos</span>
          <span className="font-mono tabular-nums">{order.priceSummary.taxFormatted}</span>
        </div>
        <div className="flex items-center justify-between text-base font-medium text-foreground">
          <span>Total</span>
          <span className="font-mono tabular-nums">{order.priceSummary.totalFormatted}</span>
        </div>
      </section>
    </div>
  );
}
