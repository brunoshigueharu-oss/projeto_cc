import { NextResponse } from "next/server";

import { isAdminEmail } from "@/lib/wix/admin";
import { searchOrders } from "@/lib/wix/orders";
import { resolveMemberFromRequest } from "@/lib/wix/resolve-member";

export async function POST(request: Request) {
  const member = await resolveMemberFromRequest(request);
  if (!member) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const isAdmin = await isAdminEmail(member.email);
  if (!isAdmin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const orders = await searchOrders();
  return NextResponse.json({ orders });
}
