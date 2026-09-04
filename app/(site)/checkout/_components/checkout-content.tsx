"use client";

import { useState } from "react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { FormStatus, type FormResult } from "@/components/form-status";
import { useCart, type ResolvedCartLine } from "@/lib/cart/cart-context";
import { formatPriceClient } from "@/lib/cart/format-price";
import { cn } from "@/lib/utils";
import { startWixCheckout } from "@/lib/wix/ecom";
import { AddressForm } from "./address-form";
import type { NewAddressInput } from "../_lib/checkout-schema";
import { toWixAddress } from "../_lib/to-wix-address";

export function CheckoutContent() {
  const { resolvedLines, subtotalCents } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<FormResult | null>(null);

  if (resolvedLines.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
        <h1 className="font-display text-2xl text-foreground">
          Seu carrinho está vazio
        </h1>
        <p className="mt-3 font-serif text-muted-foreground">
          Ainda não há nada por aqui. Que tal dar uma volta pelo catálogo?
        </p>
        <Link
          href="/catalogo"
          className={cn(
            buttonVariants({ variant: "accent", size: "lg" }),
            "mt-8 h-11 rounded-full px-7",
          )}
        >
          Ver catálogo
        </Link>
      </div>
    );
  }

  const purchasableLines = resolvedLines.filter(
    (line): line is Extract<ResolvedCartLine, { available: true }> => line.available,
  );
  const hasBlockedItem = resolvedLines.some((line) => !line.available);

  async function handleSubmit(address: NewAddressInput) {
    setResult(null);
    setSubmitting(true);
    try {
      const origin = window.location.origin;
      await startWixCheckout(
        purchasableLines.map((line) => ({ catalogItemId: line.wixProductId, quantity: line.quantity })),
        toWixAddress(address),
        { thankYouPageUrl: `${origin}/checkout/confirmacao`, postFlowUrl: `${origin}/checkout` },
      );
      // Caminho feliz não retorna — window.location.href já navegou o browser.
    } catch (e) {
      console.error(e);
      setResult({ ok: false, message: "Não foi possível iniciar o pagamento. Tente novamente." });
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-2xl text-foreground sm:text-3xl">
        Finalizar pedido
      </h1>

      <ul className="mt-8 flex flex-col gap-3">
        {resolvedLines.map((line) => (
          <li
            key={`${line.type}-${line.slug}`}
            className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-5 py-4"
          >
            <div>
              <p className="font-medium text-foreground">{line.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">Qtd. {line.quantity}</p>
            </div>
            <span className="font-mono text-sm text-muted-foreground tabular-nums">
              {formatPriceClient(line.unitPriceCents * line.quantity)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-center justify-between border-t border-border pt-6">
        <span className="font-medium text-foreground">Subtotal</span>
        <span className="font-mono text-xl font-bold text-foreground tabular-nums">
          {formatPriceClient(subtotalCents)}
        </span>
      </div>

      {hasBlockedItem ? (
        <div className="mt-8 rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">
          <p>Remova os itens indisponíveis no carrinho antes de continuar.</p>
          <Link href="/carrinho" className="mt-2 inline-block underline underline-offset-4">
            Voltar para o carrinho
          </Link>
        </div>
      ) : (
        <div className="mt-8">
          <AddressForm onSubmit={handleSubmit} submitting={submitting} />
          <div className="mt-4">
            <FormStatus result={result} />
          </div>
        </div>
      )}
    </div>
  );
}
