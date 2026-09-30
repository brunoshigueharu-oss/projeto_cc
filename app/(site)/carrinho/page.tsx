"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { formatPriceClient } from "@/lib/cart/format-price";
import { useCart, type ResolvedCartLine } from "@/lib/cart/cart-context";
import { cn } from "@/lib/utils";

export default function CarrinhoPage() {
  const { resolvedLines, subtotalCents, setQuantity, removeItem, addItem } = useCart();
  const [removed, setRemoved] = useState<(ResolvedCartLine & { removalId: number })[]>([]);
  const nextRemovalId = useRef(0);
  const pending = useRef(new Map<string, Animation | null>());
  const restored = useRef(new Set<number>());
  const undoRegion = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const animations = pending.current;
    return () => {
      // Complete an accepted removal even when navigating away mid-animation.
      animations.forEach((animation) => animation?.finish());
    };
  }, []);

  async function removeLine(line: ResolvedCartLine, button: HTMLButtonElement) {
    const key = `${line.type}-${line.slug}`;
    if (pending.current.has(key)) return;
    pending.current.set(key, null);
    const row = button.closest("li")!;
    const hadFocus = row.contains(document.activeElement);
    row.inert = true;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!motion.matches && typeof row.animate === "function") {
      const animation = row.animate(
        [
          { height: `${row.getBoundingClientRect().height}px`, opacity: 1, transform: "translateX(0)", marginBottom: "16px" },
          { height: `${row.getBoundingClientRect().height}px`, opacity: 0, transform: "translateX(12px)", marginBottom: "16px", offset: 0.4 },
          { height: "0px", opacity: 0, paddingTop: "0px", paddingBottom: "0px", borderWidth: "0px", marginBottom: "0px" },
        ],
        { duration: 240, easing: "ease-out", fill: "forwards" },
      );
      pending.current.set(key, animation);
      const stopMotion = () => { if (motion.matches) animation.finish(); };
      motion.addEventListener("change", stopMotion);
      try {
        await animation.finished;
      } catch {
        // Cancellation must not discard the user's removal.
      } finally {
        motion.removeEventListener("change", stopMotion);
      }
    }
    removeItem(line.type, line.slug);
    const removalId = nextRemovalId.current++;
    setRemoved((previous) => [...previous, { ...line, removalId }]);
    pending.current.delete(key);
    if (hadFocus) {
      requestAnimationFrame(() => {
        undoRegion.current?.querySelector<HTMLButtonElement>(`[data-removal-id="${removalId}"]`)?.focus({ preventScroll: true });
      });
    }
  }

  function undoRemoval(line: ResolvedCartLine & { removalId: number }) {
    if (restored.current.has(line.removalId)) return;
    restored.current.add(line.removalId);
    // addItem merges by type + slug, including items added in another tab.
    addItem(line.type, line.slug, line.quantity);
    setRemoved((previous) => previous.filter((item) => item.removalId !== line.removalId));
  }

  const undoNotice = (
    <div ref={undoRegion} className="mt-6 space-y-2 text-left" aria-label="Itens removidos">
      <div role="status" className="sr-only">
        {removed.length > 0 ? `${removed.length} remoção(ões). Você pode desfazer abaixo.` : ""}
      </div>
      {removed.map((line) => (
        <div key={line.removalId} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm">
          <span>{line.title} removido · {line.quantity} un.</span>
          <button
            type="button"
            data-removal-id={line.removalId}
            aria-label={`Desfazer remoção de ${line.title}`}
            onClick={() => undoRemoval(line)}
            className="min-h-9 rounded-md px-2 font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Desfazer
          </button>
        </div>
      ))}
    </div>
  );
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
        {undoNotice}
        <Link
          href="/catalogo"
          className={cn(
            buttonVariants({ variant: "brand", size: "lg" }),
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

      <ul className="mt-8 flex flex-col">
        {resolvedLines.map((line) => (
          <li
            key={`${line.type}-${line.slug}`}
            className="mb-4 flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-xl border border-border bg-card px-5 py-4"
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
                  onChange={(event) => {
                    const quantity = Number(event.target.value);
                    if (Number.isInteger(quantity) && quantity >= 1) {
                      setQuantity(line.type, line.slug, quantity);
                    }
                  }}
                  className="h-9 w-16 text-center"
                />
              </label>
              <button
                type="button"
                aria-label={`Remover ${line.title}`}
                onClick={(event) => void removeLine(line, event.currentTarget)}
                className="text-muted-foreground transition-colors hover:text-destructive"
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {undoNotice}

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
            buttonVariants({ variant: "brand", size: "lg" }),
            "mt-6 h-11 w-full cursor-not-allowed justify-center rounded-full px-7 opacity-50",
          )}
        >
          Finalizar pedido
        </span>
      ) : (
        <Link
          href="/checkout"
          className={cn(
            buttonVariants({ variant: "brand", size: "lg" }),
            "mt-6 h-11 w-full justify-center rounded-full px-7",
          )}
        >
          Finalizar pedido
        </Link>
      )}
    </div>
  );
}
