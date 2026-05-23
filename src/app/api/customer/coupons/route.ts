import { NextRequest, NextResponse } from "next/server";
import { getCustomerTokenFromRequest, validateCustomerSessionToken } from "@/lib/auth";
import { getData } from "@/lib/store";

export async function GET(req: NextRequest) {
  const token = getCustomerTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const customerId = validateCustomerSessionToken(token);
  if (!customerId) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  const data = await getData();
  const now = Date.now();
  const customerCoupons = (data.coupons || []).filter(
    (c: any) => c.active && c.assignedTo.includes(customerId) && c.expiresAt > now && c.usedCount < c.maxUses
  );

  return NextResponse.json({ coupons: customerCoupons });
}
