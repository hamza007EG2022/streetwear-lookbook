import { NextRequest, NextResponse } from "next/server";
import { getCustomerTokenFromRequest, validateCustomerSessionToken } from "@/lib/auth";
import { getData } from "@/lib/store";
import { autoDeliverIfEligible } from "@/lib/payment-verification";

export async function GET(req: NextRequest) {
  const token = getCustomerTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const customerId = validateCustomerSessionToken(token);
  if (!customerId) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  let data = await getData();
  const deliveredCount = await autoDeliverIfEligible();
  if (deliveredCount > 0) data = await getData();
  const customerOrders = data.orders
    .filter((o: any) => o.customerId === customerId)
    .sort((a: any, b: any) => b.createdAt - a.createdAt);

  return NextResponse.json({ orders: customerOrders });
}
