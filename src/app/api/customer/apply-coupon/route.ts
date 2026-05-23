import { NextRequest, NextResponse } from "next/server";
import { getCustomerTokenFromRequest, validateCustomerSessionToken } from "@/lib/auth";
import { getData, saveData } from "@/lib/store";

export async function POST(req: NextRequest) {
  const token = getCustomerTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const customerId = validateCustomerSessionToken(token);
  if (!customerId) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  const { code, subtotal } = await req.json();
  if (!code) return NextResponse.json({ error: "Missing coupon code" }, { status: 400 });

  const data = await getData();
  const coupon = data.coupons.find((c: any) => c.code.toUpperCase() === code.toUpperCase() && c.active);
  if (!coupon) return NextResponse.json({ error: "Invalid coupon code" }, { status: 404 });

  if (!coupon.assignedTo.includes(customerId) && !coupon.assignedTo.includes("*")) {
    return NextResponse.json({ error: "This coupon is not assigned to you" }, { status: 403 });
  }

  if (coupon.expiresAt < Date.now()) {
    return NextResponse.json({ error: "This coupon has expired" }, { status: 410 });
  }

  if (coupon.usedCount >= coupon.maxUses) {
    return NextResponse.json({ error: "This coupon has reached its usage limit" }, { status: 410 });
  }

  if (coupon.type === "free_delivery") {
    return NextResponse.json({
      valid: true,
      type: "free_delivery",
      discount: 0,
      label: "Free Delivery",
      couponId: coupon.id,
    });
  }

  if (subtotal != null && coupon.minOrder > 0 && subtotal < coupon.minOrder) {
    return NextResponse.json({ error: `Minimum order amount is ${coupon.minOrder} L.E.` }, { status: 400 });
  }

  return NextResponse.json({
    valid: true,
    type: coupon.type,
    discount: coupon.discount,
    label: coupon.type === "percentage" ? `${coupon.discount}% OFF` : `${coupon.discount} L.E. OFF`,
    couponId: coupon.id,
  });
}

export async function PATCH(req: NextRequest) {
  const token = getCustomerTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const customerId = validateCustomerSessionToken(token);
  if (!customerId) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  const { couponId } = await req.json();
  if (!couponId) return NextResponse.json({ error: "Missing couponId" }, { status: 400 });

  const data = await getData();
  const coupon = data.coupons.find((c: any) => c.id === couponId);
  if (!coupon) return NextResponse.json({ error: "Coupon not found" }, { status: 404 });

  coupon.usedCount = (coupon.usedCount || 0) + 1;
  if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
    coupon.active = false;
  }

  await saveData(data);
  return NextResponse.json({ success: true });
}
