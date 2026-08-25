"use client";

import { useEffect } from "react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { useCart } from "@/lib/cart/cart-context";
import { cn } from "@/lib/utils";

type ConfirmationContentProps = {
  orderId: string | undefined;
};

/**
 * `orderId` só vem preenchido quando a Wix confirma que o pagamento foi
 * concluído (ver `thankYouPageUrl` em `lib/wix/ecom.ts`). É o único momento
 * seguro pra limpar o carrinho local — sem ele, um acesso direto à URL não
 * mexe no carrinho.
 */
export function ConfirmationContent({ orderId }: ConfirmationContentProps) {
  const { clear } = useCart();

  useEffect(() => {
    if (orderId) clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  if (!orderId) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
        <h1 className="font-display text-2xl text-foreground">
          Nenhum pedido para confirmar
        </h1>
        <p className="mt-3 font-serif text-muted-foreground">
          Se você acabou de finalizar uma compra, confira seu e-mail para a
          confirmação. Caso contrário, volte para o carrinho.
        </p>
        <Link
          href="/carrinho"
          className={cn(
            buttonVariants({ variant: "accent", size: "lg" }),
            "mt-8 h-11 rounded-full px-7",
          )}
        >
          Ver carrinho
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
      <h1 className="font-display text-2xl text-foreground sm:text-3xl">
        Pedido confirmado!
      </h1>
      <p className="mt-3 font-serif text-muted-foreground">
        Nº do pedido:{" "}
        <span className="font-mono text-foreground">{orderId}</span>
      </p>
      <p className="mt-1 font-serif text-muted-foreground">
        Você vai receber a confirmação por e-mail em breve.
      </p>
      <Link
        href="/catalogo"
        className={cn(
          buttonVariants({ variant: "accent", size: "lg" }),
          "mt-8 h-11 rounded-full px-7",
        )}
      >
        Continuar navegando
      </Link>
    </div>
  );
}
