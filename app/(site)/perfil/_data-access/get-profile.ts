import "server-only";

import { BOOKS_BY_SLUG } from "@/lib/data/books";
import type { Book } from "@/lib/data/schemas";
import { getOrdersForUser } from "@/lib/supabase/queries/orders";
import { requireSession } from "@/lib/supabase/session";

export type Profile = {
  name: string;
  email: string;
  memberSince: string;
  plan: string | null;
};

export type OrderItem = {
  slug: string;
  type: "book" | "combo";
  title: string;
  quantity: number;
};

export type Order = {
  id: string;
  placedAt: string;
  total: number;
  status: "processando" | "em-transito" | "entregue" | "cancelado";
  items: readonly OrderItem[];
};

export type PerfilData = {
  profile: Profile;
  orders: readonly Order[];
  shelf: readonly Book[];
};

/**
 * Uma sessão, uma query de pedidos — `orders`/`shelf` derivam do mesmo
 * resultado de `getOrdersForUser`, em vez de repetir a query (a estante é só
 * os livros de pedidos entregues).
 */
export async function getPerfilData(): Promise<PerfilData> {
  const { supabase, user } = await requireSession();

  const [profileRow, rawOrders] = await Promise.all([
    supabase.from("profiles").select("name, email, plan, created_at").eq("id", user.id).single(),
    getOrdersForUser(supabase),
  ]);

  if (profileRow.error) throw profileRow.error;

  const profile: Profile = {
    name: profileRow.data.name,
    email: profileRow.data.email,
    // `formatDate` espera "YYYY-MM-DD" — `created_at` é timestamptz completo.
    memberSince: profileRow.data.created_at.slice(0, 10),
    plan: profileRow.data.plan,
  };

  const orders: Order[] = rawOrders.map((order) => ({
    id: order.order_number,
    // `formatDate` espera "YYYY-MM-DD" — `placed_at` é timestamptz completo.
    placedAt: order.placed_at.slice(0, 10),
    total: order.total_cents,
    status: order.status as Order["status"],
    items: order.order_items.map((item) => ({
      slug: item.book_slug ?? item.combo_slug ?? "",
      type: item.item_type as OrderItem["type"],
      title: item.title_snapshot,
      quantity: item.quantity,
    })),
  }));

  const deliveredBookSlugs = new Set(
    rawOrders
      .filter((order) => order.status === "entregue")
      .flatMap((order) => order.order_items)
      .map((item) => item.book_slug)
      .filter((slug): slug is string => Boolean(slug)),
  );

  const shelf = Array.from(deliveredBookSlugs).flatMap((slug) => {
    const book = BOOKS_BY_SLUG.get(slug);
    // Livro despublicado não deve virar link morto na estante.
    return book?.published ? [book] : [];
  });

  return { profile, orders, shelf };
}
