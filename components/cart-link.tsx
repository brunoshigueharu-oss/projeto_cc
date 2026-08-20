"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { useCart } from "@/lib/cart/cart-context";

export function CartLink({ className }: { className?: string }) {
  const { itemCount } = useCart();

  return (
    <Link href="/carrinho" aria-label="Carrinho" className={`relative ${className ?? ""}`}>
      <ShoppingBag className="size-[18px]" aria-hidden="true" />
      {itemCount > 0 ? (
        <span
          aria-hidden="true"
          className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground"
        >
          {itemCount > 9 ? "9+" : itemCount}
        </span>
      ) : null}
    </Link>
  );
}
