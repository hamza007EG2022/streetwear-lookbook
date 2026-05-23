import { NextRequest, NextResponse } from "next/server";
import { hashPassword, createCustomerSessionToken } from "@/lib/auth";
import { getData, saveData } from "@/lib/store";
import { sendWhatsApp } from "@/lib/whatsapp";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const { name, phone, email, password } = await req.json();
    if (!name || !phone || !email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const trimmed = name.trim();
    if (trimmed.split(/\s+/).length < 3) {
      return NextResponse.json({ error: "Full name must include first, middle, and last name" }, { status: 400 });
    }

    if (!/^(010|011|012|015)\d{8}$/.test(phone.trim())) {
      return NextResponse.json({ error: "Invalid Egyptian phone number" }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json({ error: "Password must be at least 8 characters with letters and numbers" }, { status: 400 });
    }

    const data = await getData();
    const existingPhone = data.customers.find((c: any) => c.phone === phone.trim());
    if (existingPhone) {
      return NextResponse.json({ error: "Phone number already registered" }, { status: 409 });
    }
    const existingEmail = data.customers.find((c: any) => c.email === email.trim().toLowerCase());
    if (existingEmail) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const customer = {
      id: uuidv4(),
      name: trimmed,
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      addresses: [],
      wishlist: [],
      loyaltyPoints: 0,
      createdAt: Date.now(),
    };

    data.customers.push(customer);
    await saveData(data);

    sendWhatsApp(
      customer.phone,
      `Welcome to TRIO FASHION! 🎉\n\nHi ${customer.name.split(" ")[0]},\n\nThank you for creating an account with us. You're now part of the TRIO family.\n\nBrowse our latest collection and enjoy a premium streetwear experience.\n\nStay bold,\nTRIO FASHION`,
      true
    );

    const token = createCustomerSessionToken(customer.id);
    const res = NextResponse.json({
      success: true,
      customer: { id: customer.id, name: customer.name, phone: customer.phone, email: customer.email, addresses: customer.addresses, wishlist: customer.wishlist, loyaltyPoints: customer.loyaltyPoints, createdAt: customer.createdAt },
    });
    res.cookies.set("customer_token", token, {
      httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30,
    });

    return res;
  } catch (e) {
    console.error("Register error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
