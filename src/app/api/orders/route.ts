import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, validateSessionToken } from "@/lib/auth";
import { getData, saveData } from "@/lib/store";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, productName, productPrice, productPhoto, items, customerName, customerPhone, deliveryAddress, note } = body;

    if (!productId || !customerName || !customerPhone || !deliveryAddress || !items?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const totalPrice = items.reduce((sum: number, item: any) => sum + (item.quantity || 0) * parseFloat(productPrice?.replace(/[^0-9.]/g, "") || "0"), 0);

    const data = await getData();
    data.orders.push({
      id: uuidv4(),
      productId,
      productName,
      productPrice,
      productPhoto: productPhoto || "",
      items,
      totalPrice,
      customerName,
      customerPhone,
      deliveryAddress,
      note: note || "",
      status: "new",
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
  if (!valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await getData();
  const sorted = [...data.orders].sort((a, b) => b.createdAt - a.createdAt);
  return NextResponse.json({ orders: sorted });
}

export async function PATCH(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const valid = token ? await validateSessionToken(token) : false;
  if (!valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, status } = await req.json();
    const data = await getData();
    const order = data.orders.find((o) => o.id === id);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    order.status = status;
    await saveData(data);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
