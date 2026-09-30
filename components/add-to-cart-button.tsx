"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { Check } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { useCart, type CartItemType } from "@/lib/cart/cart-context";
import { cn } from "@/lib/utils";

type AddToCartButtonProps = {
  type: CartItemType;
  slug: string;
  label: string;
  addedLabel: string;
  /** `brand` (amarelo da marca, texto preto) é o padrão de todo CTA de
   *  compra do site; `default` (marrom) serve para fundos em que o amarelo
   *  some. */
  variant?: "default" | "brand";
  className?: string;
  secondaryAction?: ReactNode;
};

export function AddToCartButton({
  type,
  slug,
  label,
  addedLabel,
  variant = "brand",
  className,
  secondaryAction,
}: AddToCartButtonProps) {
  const { addItem, resolvedLines } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const [hasAdded, setHasAdded] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const line = resolvedLines.find((item) => item.type === type && item.slug === slug);

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  function handleClick() {
    addItem(type, slug, 1);
    setJustAdded(true);
    setHasAdded(true);
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setJustAdded(false), 2000);
  }

  return (
    <div className="inline-flex min-w-0 max-w-full flex-col items-start">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <button
          type="button"
          onClick={handleClick}
          className={cn(
            buttonVariants({ variant, size: "lg" }),
            "h-11 gap-2 rounded-full px-7",
            className,
          )}
        >
          <span className="grid">
            <span className={cn("col-start-1 row-start-1", justAdded && "invisible")} aria-hidden={justAdded}>
              {label}
            </span>
            <span className={cn("col-start-1 row-start-1 inline-flex items-center justify-center gap-2", !justAdded && "invisible")} aria-hidden={!justAdded}>
              <Check className="size-4" aria-hidden="true" />
              {addedLabel}
            </span>
          </span>
        </button>
        {secondaryAction}
      </div>
      <p role="status" aria-atomic="true" className="text-sm leading-relaxed text-foreground/80">
        {hasAdded && line ? (
          <span className="mt-2 block">
            <span className="font-medium">{line.title}</span> adicionado ao carrinho.
            <span className="sr-only"> Quantidade no carrinho: {line.quantity}.</span>
          </span>
        ) : null}
      </p>
      {hasAdded && line ? (
        <Link href="/carrinho" className="inline-flex min-h-11 items-center rounded-sm text-sm font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
          Ver carrinho
        </Link>
      ) : null}
    </div>
  );
}
