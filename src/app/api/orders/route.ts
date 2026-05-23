import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, validateSessionToken } from "@/lib/auth";
import { getData, saveData } from "@/lib/store";
import { v4 as uuidv4 } from "uuid";
import { generateFawryReference, isCustomerBlacklisted, checkAndFlagUnconfirmedOrders, processFulfillmentStatusChange, autoDeliverIfEligible } from "@/lib/payment-verification";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Support both old format (single product) and new format (cart items)
    if (body.items?.[0]?.productId || body.items?.[0]?.name) {
      // New checkout format
      const { items, customerName, customerPhone, customerAddress, governorate, deliveryNote, paymentMethod, screenshot, customerId, transactionId } = body;
      if (!items?.length || !customerName || !customerPhone) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      const data = await getData();
      const subtotal = items.reduce((sum: number, item: any) => {
        const priceStr = item.discountPrice || item.price || "0";
        const num = parseFloat(priceStr.replace(/[^0-9.]/g, "") || "0");
        return sum + num * (item.quantity || 1);
      }, 0);
      const feeMin = data.contact?.freeDeliveryMinimum || 2000;
      const feeAmount = data.contact?.deliveryFee || 80;
      const deliveryFee = subtotal >= feeMin ? 0 : feeAmount;
      const total = subtotal + deliveryFee;

      // Blacklist check
      const blacklistCheck = await isCustomerBlacklisted(customerPhone);
      if (blacklistCheck.blocked) {
        return NextResponse.json({ error: blacklistCheck.reason || "Account blocked. Contact support." }, { status: 403 });
      }

      const statusMap: Record<string, string> = {
        instapay: "Pending Verification",
        telda: "Pending Verification",
        fawry: "Pending Fawry Payment",
        cod: "Cash on Delivery",
      };

      const orderId = uuidv4();
      const fawryRef = paymentMethod === "fawry" ? generateFawryReference(orderId) : undefined;

      data.orders.push({
        id: orderId,
        items,
        subtotal,
        deliveryFee,
        total,
        customerName,
        customerPhone,
        customerAddress,
        governorate,
        deliveryNote,
        paymentMethod,
        paymentStatus: paymentMethod === "cod" ? "verified" : "pending",
        screenshot,
        customerId,
        transactionId: transactionId || undefined,
        verificationStatus: transactionId ? "pending" : undefined,
        fawryReferenceCode: fawryRef,
        status: statusMap[paymentMethod as string] || "Pending",
        createdAt: Date.now(),
      });

      if (customerId) {
        const c = data.customers.find((cust: any) => cust.id === customerId);
        if (c) c.lastActiveAt = Date.now();
      }
      await checkAndFlagUnconfirmedOrders(customerPhone, customerId);
      await saveData(data);

      const response: any = { success: true, orderId };
      if (fawryRef) response.fawryReferenceCode = fawryRef;
      return NextResponse.json(response);
    }

    // Old format (single product from product page order modal)
    const { productName, productPrice, items: oldItems, customerName, customerPhone, customerAddress, deliveryNote } = body;
    if (!productName || !customerName || !customerPhone || !oldItems?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const priceNum = parseFloat((productPrice || "").replace(/[^0-9.]/g, "") || "0");
    const totalPrice = oldItems.reduce((sum: number, item: any) => sum + (item.quantity || 0) * priceNum, 0);
    const data = await getData();
    const blacklistCheck = await isCustomerBlacklisted(customerPhone);
    if (blacklistCheck.blocked) {
      return NextResponse.json({ error: blacklistCheck.reason || "Account blocked." }, { status: 403 });
    }
    data.orders.push({
      id: uuidv4(),
      productName,
      productPrice,
      items: oldItems,
      totalPrice,
      customerName,
      customerPhone,
      customerAddress,
      deliveryNote,
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
  let data = await getData();
  const deliveredCount = await autoDeliverIfEligible();
  if (deliveredCount > 0) data = await getData();
  const sorted = [...data.orders].sort((a, b) => b.createdAt - a.createdAt);
  return NextResponse.json({ orders: sorted });
}

export async function PATCH(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const valid = token ? await validateSessionToken(token) : false;
  if (!valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id, status, internalNotes, trackingNumber } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing order ID" }, { status: 400 });
    const data = await getData();
    const order = data.orders.find((o: any) => o.id === id);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (status) {
      order.status = status;
      await processFulfillmentStatusChange(data, order, status, trackingNumber);
    } else if (trackingNumber !== undefined) {
      order.trackingNumber = trackingNumber;
    }
    if (internalNotes !== undefined) order.internalNotes = internalNotes;
    await saveData(data);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const valid = token ? await validateSessionToken(token) : false;
  if (!valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing order ID" }, { status: 400 });
    const data = await getData();
    data.orders = data.orders.filter((o: any) => o.id !== id);
    await saveData(data);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
  }
}
