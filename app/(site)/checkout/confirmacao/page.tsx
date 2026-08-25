import type { Metadata } from "next";

import { ConfirmationContent } from "./_components/confirmation-content";

export const metadata: Metadata = {
  title: "Pedido confirmado",
  description: "Confirmação do seu pedido na Hocus Pocus.",
};

export default async function CheckoutConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;
  return <ConfirmationContent orderId={orderId} />;
}
