import { NextRequest, NextResponse } from "next/server";
import { getData, saveData } from "@/lib/store";
import {
  autoVerifyPayment,
  generateFawryReference,
  buildVerificationSuccessMessage,
  buildVerificationFailedMessage,
  buildFulfillmentStatusMessage,
  getWhatsAppNotificationLink,
  checkAndFlagUnconfirmedOrders,
} from "@/lib/payment-verification";

export async function POST(req: NextRequest) {
  try {
    const { orderId, method, transactionId, amount, screenshotUrl } = await req.json();

    if (!orderId || !method || !transactionId || amount == null) {
      return NextResponse.json({ error: "Missing required fields: orderId, method, transactionId, amount" }, { status: 400 });
    }

    if (!["instapay", "telda"].includes(method)) {
      return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
    }

    const data = await getData();
    const order = data.orders.find((o: any) => o.id === orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const expectedAmount = order.total ?? order.totalPrice ?? 0;
    const parsedAmount = typeof amount === "string" ? parseFloat(amount.replace(/[^0-9.]/g, "")) : parseFloat(amount);

    const result = await autoVerifyPayment({
      orderId,
      method,
      transactionId: transactionId.trim(),
      amount: parsedAmount,
      expectedAmount,
      customerPhone: order.customerPhone,
      customerId: order.customerId,
      screenshotUrl: screenshotUrl || "",
    });

    if (result.verified) {
      await checkAndFlagUnconfirmedOrders(order.customerPhone, order.customerId);

      const waMsg = buildFulfillmentStatusMessage(order, "Confirmed");
      const waLink = getWhatsAppNotificationLink(order.customerPhone, waMsg);

      return NextResponse.json({
        success: true,
        verified: true,
        status: "Confirmed",
        waLink,
        message: "Payment verified successfully! Order confirmed.",
      });
    } else {
      const waMsg = buildVerificationFailedMessage(orderId, result.reason || "Verification failed", method === "instapay" ? "InstaPay" : "Telda");
      const waLink = getWhatsAppNotificationLink(order.customerPhone, waMsg);

      return NextResponse.json({
        success: true,
        verified: false,
        status: "Rejected",
        waLink,
        reason: result.reason,
        message: result.reason,
      });
    }
  } catch (e) {
    console.error("Verify payment error:", e);
    return NextResponse.json({ error: "Server error during verification" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const data = await getData();
    const transactions = [...data.transactions].sort((a: any, b: any) => (b.checkedAt || 0) - (a.checkedAt || 0));
    return NextResponse.json({ transactions });
  } catch {
    return NextResponse.json({ error: "Failed to load transactions" }, { status: 500 });
  }
}
