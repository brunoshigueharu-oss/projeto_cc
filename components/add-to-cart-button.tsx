"use client";

import { useState } from "react";
import { Check } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { useCart, type CartItemType } from "@/lib/cart/cart-context";
import { cn } from "@/lib/utils";

type AddToCartButtonProps = {
  type: CartItemType;
  slug: string;
  label: string;
  addedLabel: string;
  className?: string;
};

export function AddToCartButton({
  type,
  slug,
  label,
  addedLabel,
  className,
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  function handleClick() {
    addItem(type, slug, 1);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        buttonVariants({ variant: "accent", size: "lg" }),
        "h-11 gap-2 rounded-full px-7",
        className,
      )}
    >
      {justAdded ? <Check className="size-4" aria-hidden="true" /> : null}
      {justAdded ? addedLabel : label}
    </button>
  );
}
