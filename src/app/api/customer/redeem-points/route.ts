import { NextRequest, NextResponse } from "next/server";
import { getCustomerTokenFromRequest, validateCustomerSessionToken } from "@/lib/auth";
import { getData, saveData } from "@/lib/store";
import { sendWhatsApp } from "@/lib/whatsapp";

export async function POST(req: NextRequest) {
  const token = getCustomerTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const customerId = validateCustomerSessionToken(token);
  if (!customerId) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  const { points } = await req.json();
  if (!points || points < 100 || points % 100 !== 0) {
    return NextResponse.json({ error: "Points must be in multiples of 100" }, { status: 400 });
  }

  const data = await getData();
  const customer = data.customers.find((c: any) => c.id === customerId);
  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  if ((customer.loyaltyPoints || 0) < points) {
    return NextResponse.json({ error: "Not enough points" }, { status: 400 });
  }

  const discountValue = (points / 100) * 10;
  customer.loyaltyPoints = (customer.loyaltyPoints || 0) - points;

  const code = `POINTS-${customerId.slice(0, 6).toUpperCase()}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
  data.coupons.push({
    id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    code,
    discount: discountValue,
    type: "fixed",
    minOrder: discountValue,
    maxUses: 1,
    usedCount: 0,
    expiresAt: Date.now() + 90 * 24 * 60 * 60 * 1000,
    assignedTo: [customerId],
    active: true,
  });

  await saveData(data);

  sendWhatsApp(
    customer.phone,
    `TRIO FASHION — You've redeemed ${points} loyalty points! 🎉\n\nYou received a coupon worth ${discountValue} L.E.\nCode: ${code}\nMin. order: ${discountValue} L.E.\nExpires: ${new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString("en-EG")}\n\nUse it at checkout to save on your next order!\n\nThank you for being a loyal TRIO customer.`,
  );

  return NextResponse.json({ success: true, code, discount: discountValue, remainingPoints: customer.loyaltyPoints });
}
