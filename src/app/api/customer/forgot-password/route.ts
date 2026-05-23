import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { getData, saveData } from "@/lib/store";

function generateResetCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const { identifier } = await req.json();
    if (!identifier) return NextResponse.json({ error: "Phone or email required" }, { status: 400 });

    const data = await getData();
    const customer = data.customers.find(
      (c: any) => c.email === identifier.trim().toLowerCase() || c.phone === identifier.trim()
    );
    if (!customer) return NextResponse.json({ error: "Account not found" }, { status: 404 });

    const code = generateResetCode();
    customer.resetCode = code;
    customer.resetCodeExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes
    await saveData(data);

    const numOnly = data.contact?.whatsapp?.replace(/[^0-9]/g, "") || "";
    const message = `TRIO FASHION 🔐\nYour password reset code is: ${code}\nThis code expires in 15 minutes.\nIf you didn't request this, please ignore.`;
    const waLink = `https://wa.me/${customer.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(message)}`;

    return NextResponse.json({ success: true, waLink, maskedPhone: customer.phone.slice(0, 4) + "****" });
  } catch (e) {
    console.error("Forgot password error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { identifier, code, newPassword } = await req.json();
    if (!identifier || !code || !newPassword) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }

    if (newPassword.length < 8 || !/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return NextResponse.json({ error: "Password must be at least 8 characters with letters and numbers" }, { status: 400 });
    }

    const data = await getData();
    const customer = data.customers.find(
      (c: any) => c.email === identifier.trim().toLowerCase() || c.phone === identifier.trim()
    );
    if (!customer) return NextResponse.json({ error: "Account not found" }, { status: 404 });

    if (customer.resetCode !== code) {
      return NextResponse.json({ error: "Invalid reset code" }, { status: 400 });
    }
    if (!customer.resetCodeExpiry || Date.now() > customer.resetCodeExpiry) {
      return NextResponse.json({ error: "Reset code expired" }, { status: 400 });
    }

    customer.passwordHash = await hashPassword(newPassword);
    customer.resetCode = undefined;
    customer.resetCodeExpiry = undefined;
    await saveData(data);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Reset password error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
