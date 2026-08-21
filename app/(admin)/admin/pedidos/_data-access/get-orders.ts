import "server-only";

import { getAllOrders, type OrderWithProfile } from "@/lib/supabase/queries/orders";
import { requireAdminSession } from "@/lib/supabase/session";

export type { OrderWithProfile };

export async function getOrdersList(): Promise<OrderWithProfile[]> {
  const { supabase } = await requireAdminSession();
  return getAllOrders(supabase);
}
