"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { reconcilePendingCheckout } from "@/lib/cart/pending-checkout";
import { cn } from "@/lib/utils";
import { getPlacedOrder } from "@/lib/wix/ecom";

type ConfirmationContentProps = {
  orderId: string | undefined;
};

type Confirmation =
  | { status: "checking" }
  /** Pedido aprovado (pagamento recebido). */
  | { status: "confirmed"; orderNumber: string }
  /** Pedido feito, pagamento ainda não confirmado (ex.: Pix em processamento). */
  | { status: "awaiting-payment"; orderNumber: string }
  /** Pedido cancelado ou com pagamento recusado. */
  | { status: "not-completed" }
  /** A Wix não reconhece esse pedido como sendo de quem está na página. */
  | { status: "not-found" }
  /** Não deu para consultar (rede, instabilidade) — nada se sabe ainda. */
  | { status: "error" };

const LINK_CLASSNAME = cn(
  buttonVariants({ variant: "brand", size: "lg" }),
  "mt-8 h-11 rounded-full px-7",
);

/**
 * O `orderId` da URL não prova nada sozinho: ele fica no histórico do
 * navegador e pode ser reaberto, copiado ou digitado. Por isso a página
 * consulta o pedido na Wix — que só o devolve a quem o fez — e só então
 * concilia o carrinho, descontando apenas o que foi para aquele checkout (ver
 * `lib/cart/pending-checkout.ts`). Reabrir uma confirmação antiga mostra o
 * pedido de novo, mas não mexe no carrinho atual.
 */
export function ConfirmationContent({ orderId }: ConfirmationContentProps) {
  const [confirmation, setConfirmation] = useState<Confirmation>({ status: "checking" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!orderId) return;
    let isStale = false;

    getPlacedOrder(orderId)
      .then((order) => {
        if (isStale) return;
        if (!order) {
          setConfirmation({ status: "not-found" });
          return;
        }
        if (order.status === "CANCELED" || order.status === "REJECTED") {
          setConfirmation({ status: "not-completed" });
          return;
        }
        // O pedido existe e é desta pessoa: o que foi para esse checkout sai
        // do carrinho, mesmo com o pagamento ainda em processamento — senão
        // os mesmos itens ficariam ali convidando a uma compra em dobro.
        if (order.checkoutId) reconcilePendingCheckout(order.checkoutId);
        setConfirmation({
          status: order.status === "APPROVED" ? "confirmed" : "awaiting-payment",
          orderNumber: order.number ?? orderId,
        });
      })
      .catch((error: unknown) => {
        if (isStale) return;
        console.error(error);
        setConfirmation({ status: "error" });
      });

    return () => {
      isStale = true;
    };
  }, [orderId, attempt]);

  function handleRetry() {
    setConfirmation({ status: "checking" });
    setAttempt((previous) => previous + 1);
  }

  if (!orderId) {
    return (
      <Shell title="Nenhum pedido para confirmar">
        <p className="mt-3 font-serif text-muted-foreground">
          Se você acabou de finalizar uma compra, confira seu e-mail para a
          confirmação. Caso contrário, volte para o carrinho.
        </p>
        <Link href="/carrinho" className={LINK_CLASSNAME}>
          Ver carrinho
        </Link>
      </Shell>
    );
  }

  if (confirmation.status === "checking") {
    return (
      <Shell title="Conferindo seu pedido…">
        <p role="status" className="mt-3 font-serif text-muted-foreground">
          Só um instante.
        </p>
      </Shell>
    );
  }

  if (confirmation.status === "error") {
    return (
      <Shell title="Não conseguimos conferir seu pedido">
        <p role="status" className="mt-3 font-serif text-muted-foreground">
          A consulta falhou, então ainda não sabemos o resultado da compra.
          Seu carrinho não foi alterado. Se o pagamento foi concluído, a
          confirmação chega por e-mail.
        </p>
        <Button type="button" variant="brand" size="lg" onClick={handleRetry} className="mt-8 h-11 rounded-full px-7">
          Tentar novamente
        </Button>
      </Shell>
    );
  }

  if (confirmation.status === "not-found") {
    return (
      <Shell title="Não encontramos este pedido">
        <p role="status" className="mt-3 font-serif text-muted-foreground">
          Não há um pedido com esse número na sua conta. Se você concluiu um
          pagamento, a confirmação chega por e-mail. Seu carrinho não foi
          alterado.
        </p>
        <Link href="/carrinho" className={LINK_CLASSNAME}>
          Ver carrinho
        </Link>
      </Shell>
    );
  }

  if (confirmation.status === "not-completed") {
    return (
      <Shell title="Este pedido não foi concluído">
        <p role="status" className="mt-3 font-serif text-muted-foreground">
          O pagamento foi cancelado ou recusado. Seus itens continuam no
          carrinho para você tentar de novo.
        </p>
        <Link href="/carrinho" className={LINK_CLASSNAME}>
          Ver carrinho
        </Link>
      </Shell>
    );
  }

  const isConfirmed = confirmation.status === "confirmed";

  return (
    <Shell title={isConfirmed ? "Pedido confirmado!" : "Pedido recebido"}>
      <p className="mt-3 font-serif text-muted-foreground">
        Nº do pedido:{" "}
        <span className="font-mono text-foreground">{confirmation.orderNumber}</span>
      </p>
      <p role="status" className="mt-1 font-serif text-muted-foreground">
        {isConfirmed
          ? "Você vai receber a confirmação por e-mail em breve."
          : "Estamos aguardando a confirmação do pagamento. Avisamos por e-mail assim que ela chegar."}
      </p>
      <Link href="/catalogo" className={LINK_CLASSNAME}>
        Continuar navegando
      </Link>
    </Shell>
  );
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
      <h1 className="font-display text-2xl text-foreground sm:text-3xl">{title}</h1>
      {children}
    </div>
  );
}
