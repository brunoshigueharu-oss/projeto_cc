import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json, Tables } from "../database.types";

export type OrderWithItems = Tables<"orders"> & {
  order_items: Tables<"order_items">[];
};

export async function getOrdersForUser(
  supabase: SupabaseClient<Database>,
): Promise<OrderWithItems[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .order("placed_at", { ascending: false });

  if (error) throw error;
  return data;
}

export type CreateOrderItemInput = {
  item_type: "book" | "combo";
  book_slug: string | null;
  combo_slug: string | null;
  title_snapshot: string;
  quantity: number;
  unit_price_cents: number;
  total_price_cents: number;
};

export type CreateOrderInput = {
  addressId: string;
  items: CreateOrderItemInput[];
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
};

export async function createOrder(
  supabase: SupabaseClient<Database>,
  input: CreateOrderInput,
): Promise<Tables<"orders">> {
  const { data, error } = await supabase.rpc("create_order", {
    p_address_id: input.addressId,
    p_items: input.items as unknown as Json,
    p_subtotal_cents: input.subtotalCents,
    p_shipping_cents: input.shippingCents,
    p_total_cents: input.totalCents,
  });

  if (error) throw error;
  return data;
}
