import type { Metadata } from "next";

import { OrderDetailContent } from "./_components/order-detail-content";

export const metadata: Metadata = { title: "Detalhe do pedido" };

export default async function AdminOrderDetailPage(props: PageProps<"/admin/pedidos/[id]">) {
  const { id } = await props.params;
  return <OrderDetailContent orderId={id} />;
}
