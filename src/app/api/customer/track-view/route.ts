import { NextRequest, NextResponse } from "next/server";
import { getCustomerTokenFromRequest, validateCustomerSessionToken } from "@/lib/auth";
import { getData, saveData } from "@/lib/store";

export async function POST(req: NextRequest) {
  const token = getCustomerTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const customerId = validateCustomerSessionToken(token);
  if (!customerId) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  const { productId, category } = await req.json();
  if (!productId) return NextResponse.json({ error: "Missing productId" }, { status: 400 });

  const data = await getData();
  const customer = data.customers.find((c: any) => c.id === customerId);
  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  customer.lastActiveAt = Date.now();

  if (!customer.viewedProducts) customer.viewedProducts = [];
  const existing = customer.viewedProducts.find((v: any) => v.productId === productId);
  if (existing) {
    existing.count = (existing.count || 0) + 1;
  } else {
    customer.viewedProducts.push({ productId, count: 1 });
  }

  if (category) {
    if (!customer.browsedCategories) customer.browsedCategories = [];
    const catExisting = customer.browsedCategories.find((c: any) => c.category === category);
    if (catExisting) {
      catExisting.count = (catExisting.count || 0) + 1;
    } else {
      customer.browsedCategories.push({ category, count: 1 });
    }
  }

  await saveData(data);
  return NextResponse.json({ success: true });
}
