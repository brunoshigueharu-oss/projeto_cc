import "server-only";

import {
  getOrderByNumber,
  type OrderWithItemsAndAddress,
} from "@/lib/supabase/queries/orders";
import { requireAdminSession } from "@/lib/supabase/session";

export type { OrderWithItemsAndAddress };

export async function getOrderDetail(
  orderNumber: string,
): Promise<OrderWithItemsAndAddress | null> {
  const { supabase } = await requireAdminSession();
  return getOrderByNumber(supabase, orderNumber);
}
