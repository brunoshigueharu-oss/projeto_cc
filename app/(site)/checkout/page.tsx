import type { Metadata } from "next";

import { CheckoutContent } from "./_components/checkout-content";

export const metadata: Metadata = {
  title: "Finalizar pedido",
  description: "Confirme o endereço de entrega e finalize seu pedido.",
};

export default function CheckoutPage() {
  return <CheckoutContent />;
}
