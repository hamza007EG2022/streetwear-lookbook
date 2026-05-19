import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, validateSessionToken } from "@/lib/auth";
import { getData, saveData } from "@/lib/store";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const { productName, productPrice, items, customerName, customerPhone } = await req.json();
    if (!productName || !customerName || !customerPhone || !items?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const priceNum = parseFloat((productPrice || "").replace(/[^0-9.]/g, "") || "0");
    const totalPrice = items.reduce((sum: number, item: any) => sum + (item.quantity || 0) * priceNum, 0);
    const data = await getData();
    data.orders.push({
      id: uuidv4(),
      productName,
      productPrice,
      items,
      totalPrice,
      customerName,
      customerPhone,
      createdAt: Date.now(),
    });
    await saveData(data);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to submit order" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const valid = token ? await validateSessionToken(token) : false;
  if (!valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await getData();
  const sorted = [...data.orders].sort((a, b) => b.createdAt - a.createdAt);
  return NextResponse.json({ orders: sorted });
}
