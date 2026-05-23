import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, createCustomerSessionToken, getCustomerTokenFromRequest, clearCustomerSessionToken } from "@/lib/auth";
import { getData } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const { identifier, password, remember } = await req.json();
    if (!identifier || !password) {
      return NextResponse.json({ error: "Email/phone and password required" }, { status: 400 });
    }

    const data = await getData();
    const customer = data.customers.find(
      (c: any) => c.email === identifier.trim().toLowerCase() || c.phone === identifier.trim()
    );
    if (!customer) {
      return NextResponse.json({ error: "Account not found" }, { status: 401 });
    }

    const valid = await verifyPassword(password, customer.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const token = createCustomerSessionToken(customer.id);
    const res = NextResponse.json({
      success: true,
      customer: { id: customer.id, name: customer.name, phone: customer.phone, email: customer.email, addresses: customer.addresses, wishlist: customer.wishlist, loyaltyPoints: customer.loyaltyPoints, createdAt: customer.createdAt },
    });
    res.cookies.set("customer_token", token, {
      httpOnly: true, sameSite: "lax", path: "/",
      maxAge: remember ? 60 * 60 * 24 * 30 : undefined,
    });

    return res;
  } catch (e) {
    console.error("Login error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const token = getCustomerTokenFromRequest(req);
  if (token) clearCustomerSessionToken(token);
  const res = NextResponse.json({ success: true });
  res.cookies.set("customer_token", "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  return res;
}
