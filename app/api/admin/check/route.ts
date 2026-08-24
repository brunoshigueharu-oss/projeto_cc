import { NextResponse } from "next/server";

import { isAdminEmail } from "@/lib/wix/admin";
import { resolveMemberFromRequest } from "@/lib/wix/resolve-member";

export async function POST(request: Request) {
  const member = await resolveMemberFromRequest(request);
  if (!member) {
    return NextResponse.json({ isAdmin: false }, { status: 401 });
  }

  const isAdmin = await isAdminEmail(member.email);
  return NextResponse.json({ isAdmin });
}
