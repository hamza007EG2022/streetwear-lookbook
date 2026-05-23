import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, validateSessionToken } from "@/lib/auth";
import { confirmFawryPayment } from "@/lib/payment-verification";

export async function POST(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const valid = token ? await validateSessionToken(token) : false;
  if (!valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { orderId } = await req.json();
    if (!orderId) return NextResponse.json({ error: "Missing orderId" }, { status: 400 });

    const result = await confirmFawryPayment(orderId);
    if (!result.success) return NextResponse.json({ error: result.message }, { status: 400 });

    return NextResponse.json({ success: true, message: result.message });
  } catch (e) {
    console.error("Fawry confirm error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
