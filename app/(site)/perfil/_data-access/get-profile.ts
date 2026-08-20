import "server-only";

import { BOOKS_BY_SLUG } from "@/lib/data/books";
import type { Book } from "@/lib/data/schemas";
import { getOrdersForUser } from "@/lib/supabase/queries/orders";
import { requireSession } from "@/lib/supabase/require-session";

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

export async function getProfile(): Promise<Profile> {
  const { supabase, user } = await requireSession();

  const { data, error } = await supabase
    .from("profiles")
    .select("name, email, plan, created_at")
    .eq("id", user.id)
    .single();

  if (error) throw error;

  return {
    name: data.name,
    email: data.email,
    // `formatDate` espera "YYYY-MM-DD" — `created_at` é timestamptz completo.
    memberSince: data.created_at.slice(0, 10),
    plan: data.plan,
  };
}

export async function getOrders(): Promise<readonly Order[]> {
  const { supabase } = await requireSession();
  const orders = await getOrdersForUser(supabase);

  return orders.map((order) => ({
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
}

export async function getShelf(): Promise<readonly Book[]> {
  const { supabase } = await requireSession();
  const orders = await getOrdersForUser(supabase);

  const deliveredBookSlugs = new Set(
    orders
      .filter((order) => order.status === "entregue")
      .flatMap((order) => order.order_items)
      .map((item) => item.book_slug)
      .filter((slug): slug is string => Boolean(slug)),
  );

  return Array.from(deliveredBookSlugs).flatMap((slug) => {
    const book = BOOKS_BY_SLUG.get(slug);
    // Livro despublicado não deve virar link morto na estante.
    return book?.published ? [book] : [];
  });
}
