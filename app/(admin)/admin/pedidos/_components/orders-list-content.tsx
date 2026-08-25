"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { getAccessToken } from "@/lib/wix/client";
import type { WixOrderListItem } from "@/lib/wix/orders";

import { formatOrderDate } from "../_lib/format-order-date";

type FetchState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "loaded"; orders: WixOrderListItem[] };

export function OrdersListContent() {
  const [state, setState] = useState<FetchState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getAccessToken();
        const res = await fetch("/api/admin/orders", {
          method: "POST",
          headers: { Authorization: token },
        });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        setState({ status: "loaded", orders: data.orders });
      } catch {
        if (cancelled) return;
        setState({ status: "error" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading") {
    return <p className="text-sm text-muted-foreground">Carregando pedidos…</p>;
  }

  if (state.status === "error") {
    return (
      <p className="text-sm text-muted-foreground">Não foi possível carregar os pedidos.</p>
    );
  }

  if (state.orders.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum pedido ainda.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {state.orders.map((order) => (
        <li key={order.id}>
          <Link
            href={`/admin/pedidos/${order.id}`}
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card px-5 py-4 transition-colors hover:bg-muted/50"
          >
            <div>
              <p className="font-mono text-sm text-foreground tabular-nums">#{order.number}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {order.buyerEmail} · {formatOrderDate(order.createdDate)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm text-foreground tabular-nums">
                {order.totalFormatted}
              </span>
              <Badge variant="outline">{order.paymentStatusLabel}</Badge>
              <Badge variant="secondary">{order.fulfillmentStatusLabel}</Badge>
              {order.orderStatusLabel ? (
                <Badge variant="destructive">{order.orderStatusLabel}</Badge>
              ) : null}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
