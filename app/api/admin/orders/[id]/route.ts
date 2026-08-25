import { NextResponse } from "next/server";

import { isAdminEmail } from "@/lib/wix/admin";
import { getOrder } from "@/lib/wix/orders";
import { resolveMemberFromRequest } from "@/lib/wix/resolve-member";

export async function POST(request: Request, { params }: RouteContext<"/api/admin/orders/[id]">) {
  const member = await resolveMemberFromRequest(request);
  if (!member) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const isAdmin = await isAdminEmail(member.email);
  if (!isAdmin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;
  try {
    const order = await getOrder(id);
    if (!order) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error(`[POST /api/admin/orders/${id}] getOrder falhou:`, error);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
