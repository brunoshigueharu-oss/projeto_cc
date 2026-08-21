"use server";

import { isSoldOut } from "@/lib/data/book-availability";
import { BOOKS_BY_SLUG } from "@/lib/data/books";
import { COMBOS } from "@/lib/data/combos";
import { createAddress } from "@/lib/supabase/queries/addresses";
import {
  createOrder as createOrderMutation,
  type CreateOrderItemInput,
} from "@/lib/supabase/queries/orders";
import { getOptionalSession } from "@/lib/supabase/session";
import {
  createOrderSchema,
  type CreateOrderInput,
  type CreateOrderResult,
} from "../_lib/checkout-schema";

type RevalidationResult =
  | { ok: true; items: CreateOrderItemInput[] }
  | { ok: false; message: string };

/**
 * Nunca confia em preço/título vindos do client — cada item é resolvido de
 * novo contra o catálogo estático (`lib/data`) no momento da compra, e o
 * snapshot gravado em `order_items` usa esses valores revalidados.
 */
function revalidateCartItems(items: CreateOrderInput["items"]): RevalidationResult {
  const revalidatedItems: CreateOrderItemInput[] = [];

  for (const item of items) {
    if (item.item_type === "book") {
      const book = item.book_slug ? BOOKS_BY_SLUG.get(item.book_slug) : undefined;
      if (!book || isSoldOut(book.status)) {
        return {
          ok: false,
          message: `"${item.title_snapshot}" não está mais disponível.`,
        };
      }
      revalidatedItems.push({
        item_type: "book",
        book_slug: book.slug,
        combo_slug: null,
        title_snapshot: book.title,
        quantity: item.quantity,
        unit_price_cents: book.price.amount,
        total_price_cents: book.price.amount * item.quantity,
      });
      continue;
    }

    const combo = item.combo_slug
      ? COMBOS.find((candidate) => candidate.slug === item.combo_slug)
      : undefined;
    if (!combo) {
      return {
        ok: false,
        message: `"${item.title_snapshot}" não está mais disponível.`,
      };
    }
    revalidatedItems.push({
      item_type: "combo",
      book_slug: null,
      combo_slug: combo.slug,
      title_snapshot: combo.title,
      quantity: item.quantity,
      unit_price_cents: combo.price.amount,
      total_price_cents: combo.price.amount * item.quantity,
    });
  }

  return { ok: true, items: revalidatedItems };
}

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const validation = createOrderSchema.safeParse(input);

  if (!validation.success) {
    return { success: false, message: "Confira os dados do pedido." };
  }

  const { supabase, user } = await getOptionalSession();

  if (!user) {
    return { success: false, message: "Sua sessão expirou. Entre novamente." };
  }

  const revalidated = revalidateCartItems(validation.data.items);
  if (!revalidated.ok) {
    return { success: false, message: revalidated.message };
  }

  const subtotalCents = revalidated.items.reduce(
    (sum, item) => sum + item.total_price_cents,
    0,
  );

  let addressId = validation.data.addressId;

  if (!addressId && validation.data.newAddress) {
    const { saveAsDefault, ...address } = validation.data.newAddress;
    const created = await createAddress(supabase, user.id, {
      recipient_name: address.recipientName,
      street: address.street,
      number: address.number,
      complement: address.complement || null,
      neighborhood: address.neighborhood,
      city: address.city,
      state: address.state,
      postal_code: address.postalCode,
      is_default: saveAsDefault,
    });
    addressId = created.id;
  }

  if (!addressId) {
    return { success: false, message: "Selecione um endereço de entrega." };
  }

  const order = await createOrderMutation(supabase, {
    addressId,
    items: revalidated.items,
    subtotalCents,
    shippingCents: 0,
    totalCents: subtotalCents,
  });

  return { success: true, orderNumber: order.order_number };
}
