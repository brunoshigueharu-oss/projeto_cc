import type { Metadata } from "next";

import { BookCard } from "@/components/book-card";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatPrice } from "@/lib/format";
import { getPerfilData } from "./_data-access/get-profile";
import type { Order } from "./_data-access/get-profile";

export const metadata: Metadata = {
  title: "Minha conta",
  description: "Sua estante, seus pedidos e seus dados na Hocus Pocus.",
};

const ORDER_STATUS: Record<
  Order["status"],
  { label: string; variant: "secondary" | "default" | "outline" }
> = {
  entregue: { label: "Entregue", variant: "outline" },
  "em-transito": { label: "Em trânsito", variant: "default" },
  processando: { label: "Processando", variant: "secondary" },
  cancelado: { label: "Cancelado", variant: "secondary" },
};

export default async function PerfilPage() {
  const { profile, orders, shelf } = await getPerfilData();

  const initials = profile.name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

  return (
    <>
      <PageHeader eyebrow="Minha conta" title={profile.name}>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <span
            aria-hidden="true"
            className="flex size-14 items-center justify-center rounded-full bg-primary font-display text-xl text-primary-foreground"
          >
            {initials}
          </span>
          <div>
            <p className="font-mono text-sm text-foreground">{profile.email}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.15em] text-muted-foreground">
              Leitora desde {formatDate(profile.memberSince)}
            </p>
          </div>
          {profile.plan ? <Badge>{profile.plan}</Badge> : null}
        </div>
      </PageHeader>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="font-display text-2xl text-foreground sm:text-3xl">
          Minha estante
        </h2>
        <p className="mt-3 font-serif text-muted-foreground">
          {shelf.length} títulos adquiridos.
        </p>

        <ul className="mt-10 grid grid-cols-2 gap-x-8 gap-y-14 lg:grid-cols-4 lg:gap-x-10 lg:gap-y-16">
          {shelf.map((book) => (
            <li key={book.slug}>
              <BookCard book={book} />
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-border bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="font-display text-2xl text-foreground sm:text-3xl">
            Pedidos
          </h2>

          <ul className="mt-8 flex flex-col gap-4">
            {orders.map((order) => (
              <li
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card px-5 py-4"
              >
                <div>
                  <p className="font-mono text-sm text-foreground tabular-nums">
                    {order.id}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(order.placedAt)} ·{" "}
                    {order.items.length === 1
                      ? "1 item"
                      : `${order.items.length} itens`}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-mono text-sm text-foreground tabular-nums">
                    {formatPrice(order.total)}
                  </span>
                  <Badge variant={ORDER_STATUS[order.status].variant}>
                    {ORDER_STATUS[order.status].label}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
