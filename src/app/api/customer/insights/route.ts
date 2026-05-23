import { NextRequest, NextResponse } from "next/server";
import { getCustomerTokenFromRequest, validateCustomerSessionToken } from "@/lib/auth";
import { getData } from "@/lib/store";

export async function GET(req: NextRequest) {
  const token = getCustomerTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const customerId = validateCustomerSessionToken(token);
  if (!customerId) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  const data = await getData();
  const customer = data.customers.find((c: any) => c.id === customerId);
  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  return NextResponse.json({
    viewedProducts: customer.viewedProducts || [],
    browsedCategories: customer.browsedCategories || [],
    lifetimeSpend: customer.lifetimeSpend || 0,
    orderCount: customer.orderCount || 0,
    averageOrderValue: customer.orderCount ? Math.round(((customer.lifetimeSpend || 0) / customer.orderCount) * 100) / 100 : 0,
    lastActiveAt: customer.lastActiveAt || customer.createdAt,
    loyaltyPoints: customer.loyaltyPoints || 0,
  });
}
