"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { useCart } from "@/lib/cart/cart-context";

export function CartLink({ className }: { className?: string }) {
  const { itemCount } = useCart();

  const badgeRef = useRef<HTMLSpanElement>(null);
  const previousCount = useRef(itemCount);

  useEffect(() => {
    const increased = itemCount > previousCount.current;
    previousCount.current = itemCount;
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!increased || motionPreference.matches || !badgeRef.current?.animate) return;

    const animation = badgeRef.current.animate(
      [{ transform: "scale(1)" }, { transform: "scale(1.2)" }, { transform: "scale(1)" }],
      { duration: 360, easing: "ease-out" },
    );
    const stopMotion = () => { if (motionPreference.matches) animation.cancel(); };
    motionPreference.addEventListener("change", stopMotion);
    return () => {
      animation.cancel();
      motionPreference.removeEventListener("change", stopMotion);
    };
  }, [itemCount]);

  return (
    <Link href="/carrinho" aria-label={`Carrinho, ${itemCount} ${itemCount === 1 ? "item" : "itens"}`} className={`relative ${className ?? ""}`}>
      <ShoppingBag className="size-[18px]" aria-hidden="true" />
      {itemCount > 0 ? (
        <span
          ref={badgeRef}
          aria-hidden="true"
          className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground"
        >
          {itemCount > 9 ? "9+" : itemCount}
        </span>
      ) : null}
    </Link>
  );
}
