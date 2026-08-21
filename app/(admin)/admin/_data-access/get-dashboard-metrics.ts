import "server-only";

import { getAllOrders } from "@/lib/supabase/queries/orders";
import { requireAdminSession } from "@/lib/supabase/session";

export type DashboardMetrics = {
  totalOrders: number;
  totalRevenueCents: number;
  pendingOrders: number;
};

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const { supabase } = await requireAdminSession();
  const orders = await getAllOrders(supabase);

  return {
    totalOrders: orders.length,
    totalRevenueCents: orders.reduce((sum, order) => sum + order.total_cents, 0),
    pendingOrders: orders.filter((order) => order.status === "processando").length,
  };
}
