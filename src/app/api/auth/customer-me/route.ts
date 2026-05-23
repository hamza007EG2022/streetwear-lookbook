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
    customer: { id: customer.id, name: customer.name, phone: customer.phone, email: customer.email, addresses: customer.addresses, wishlist: customer.wishlist, loyaltyPoints: customer.loyaltyPoints, createdAt: customer.createdAt },
  });
}
