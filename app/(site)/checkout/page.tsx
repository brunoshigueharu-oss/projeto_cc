import type { Metadata } from "next";

import { RequireAuth } from "@/components/require-auth";
import { CheckoutForm } from "./_components/checkout-form";
import { getSavedAddresses } from "./_data-access/get-addresses";

export const metadata: Metadata = {
  title: "Finalizar pedido",
  description: "Confirme o endereço de entrega e finalize seu pedido.",
};

export default async function CheckoutPage() {
  const savedAddresses = await getSavedAddresses();

  return (
    <RequireAuth>
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-2xl text-foreground sm:text-3xl">
        Finalizar pedido
      </h1>
      <div className="mt-8">
        <CheckoutForm savedAddresses={savedAddresses} />
      </div>
      </div>
    </RequireAuth>
  );
}
