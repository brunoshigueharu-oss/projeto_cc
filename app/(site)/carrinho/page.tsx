"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { formatPriceClient } from "@/lib/cart/format-price";
import { useCart } from "@/lib/cart/cart-context";
import { cn } from "@/lib/utils";

export default function CarrinhoPage() {
  const { resolvedLines, subtotalCents, setQuantity, removeItem } = useCart();
  const hasUnavailableItem = resolvedLines.some((line) => !line.available);

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

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-2xl text-foreground sm:text-3xl">
        Carrinho
      </h1>

      <ul className="mt-8 flex flex-col gap-4">
        {resolvedLines.map((line) => (
          <li
            key={`${line.type}-${line.slug}`}
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card px-5 py-4"
          >
            <div>
              <p className="font-medium text-foreground">{line.title}</p>
              {!line.available ? (
                <p className="mt-1 text-xs text-destructive">
                  {line.unavailableReason === "esgotado"
                    ? "Esgotado — remova para continuar."
                    : "Ainda não disponível para compra online — remova para continuar."}
                </p>
              ) : null}
              <p className="mt-1 font-mono text-sm text-muted-foreground tabular-nums">
                {formatPriceClient(line.unitPriceCents)}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                Qtd.
                <Input
                  type="number"
                  min={1}
                  value={line.quantity}
                  onChange={(event) =>
                    setQuantity(line.type, line.slug, Number(event.target.value))
                  }
                  className="h-9 w-16 text-center"
                />
              </label>
              <button
                type="button"
                aria-label={`Remover ${line.title}`}
                onClick={() => removeItem(line.type, line.slug)}
                className="text-muted-foreground transition-colors hover:text-destructive"
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-10 flex items-center justify-between border-t border-border pt-6">
        <span className="font-medium text-foreground">Subtotal</span>
        <span className="font-mono text-xl font-bold text-foreground tabular-nums">
          {formatPriceClient(subtotalCents)}
        </span>
      </div>

      {hasUnavailableItem ? (
        <p className="mt-4 text-sm text-destructive">
          Remova os itens indisponíveis do carrinho para continuar.
        </p>
      ) : null}

      {hasUnavailableItem ? (
        <span
          aria-disabled="true"
          className={cn(
            buttonVariants({ variant: "accent", size: "lg" }),
            "mt-6 h-11 w-full cursor-not-allowed justify-center rounded-full px-7 opacity-50",
          )}
        >
          Finalizar pedido
        </span>
      ) : (
        <Link
          href="/checkout"
          className={cn(
            buttonVariants({ variant: "accent", size: "lg" }),
            "mt-6 h-11 w-full justify-center rounded-full px-7",
          )}
        >
          Finalizar pedido
        </Link>
      )}
    </div>
  );
}
