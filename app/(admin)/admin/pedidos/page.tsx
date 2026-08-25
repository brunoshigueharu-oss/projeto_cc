import type { Metadata } from "next";

import { OrdersListContent } from "./_components/orders-list-content";

export const metadata: Metadata = { title: "Pedidos" };

export default function AdminOrdersPage() {
  return <OrdersListContent />;
}
