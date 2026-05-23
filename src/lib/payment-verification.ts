import { v4 as uuidv4 } from "uuid";
import { getData, saveData } from "@/lib/store";
import { sendWhatsApp } from "@/lib/whatsapp";

export function generateFawryReference(orderId: string): string {
  const shortId = orderId.replace(/-/g, "").slice(0, 8).toUpperCase();
  const seq = Date.now().toString(36).slice(-4).toUpperCase();
  return `FAWRY-${shortId}-${seq}`;
}

export async function isTransactionIdUsed(transactionId: string): Promise<boolean> {
  if (!transactionId || transactionId.trim().length < 3) return false;
  const data = await getData();
  return data.transactions.some(
    (t: any) => t.transactionId === transactionId.trim() && t.status === "verified"
  );
}

export async function isCustomerBlacklisted(phone: string): Promise<{ blocked: boolean; reason?: string }> {
  const data = await getData();
  const account = data.flaggedAccounts.find(
    (f: any) => f.phone === phone && f.blocked
  );
  if (account) return { blocked: true, reason: account.reason };

  const customer = data.customers.find((c: any) => c.phone === phone);
  if (customer?.blacklisted) return { blocked: true, reason: "Account blacklisted" };

  if (customer?.lockedUntil && customer.lockedUntil > Date.now()) {
    const hoursLeft = Math.ceil((customer.lockedUntil - Date.now()) / (1000 * 60 * 60));
    return { blocked: true, reason: `Account temporarily locked — try again in ${hoursLeft} hour(s)` };
  }

  return { blocked: false };
}

export async function getUnconfirmedOrderCount(phone: string): Promise<number> {
  const data = await getData();
  return data.orders.filter(
    (o: any) =>
      o.customerPhone === phone &&
      (o.status === "Pending Verification" || o.status === "Pending Fawry Payment")
  ).length;
}

export async function countFailedVerifications(phone: string): Promise<number> {
  const data = await getData();
  return data.transactions.filter(
    (t: any) => t.customerPhone === phone && t.status === "rejected"
  ).length;
}

export async function logFraudEvent(params: {
  type: FraudEventType;
  phone: string;
  customerId?: string;
  orderId?: string;
  details: string;
}): Promise<void> {
  const data = await getData();
  data.fraudEvents.push({
    id: uuidv4(),
    type: params.type,
    phone: params.phone,
    customerId: params.customerId,
    orderId: params.orderId,
    details: params.details,
    createdAt: Date.now(),
  });
  await saveData(data);
}

type FraudEventType = "duplicate_transaction" | "failed_verification" | "too_many_unconfirmed" | "tampered_screenshot" | "account_blocked" | "account_unblocked";

export async function flagAccount(params: {
  phone: string;
  customerId?: string;
  reason: string;
  severity: "low" | "medium" | "high" | "critical";
  block: boolean;
}): Promise<void> {
  const data = await getData();

  const existing = data.flaggedAccounts.find((f: any) => f.phone === params.phone && f.blocked === params.block);
  if (existing) return;

  data.flaggedAccounts.push({
    id: uuidv4(),
    phone: params.phone,
    customerId: params.customerId,
    reason: params.reason,
    severity: params.severity,
    createdAt: Date.now(),
    blocked: params.block,
  });

  if (params.customerId) {
    const customer = data.customers.find((c: any) => c.id === params.customerId);
    if (customer) {
      customer.blacklisted = params.block;
    }
  }

  await logFraudEvent({
    type: params.block ? "account_blocked" : "account_unblocked",
    phone: params.phone,
    customerId: params.customerId,
    details: params.reason,
  });

  const adminPhone = data.contact?.whatsapp || "";
  if (adminPhone) {
    const severity = params.severity.toUpperCase();
    const blockedStr = params.block ? "BLOCKED" : "Flagged (not blocked)";
    sendWhatsApp(
      adminPhone,
      `⚠️ FRAUD ALERT — TRIO FASHION\n\nAccount ${blockedStr}\nPhone: ${params.phone}\nReason: ${params.reason}\nSeverity: ${severity}\n\nAction required in admin dashboard.`,
    );
  }

  await saveData(data);
}

export async function autoVerifyPayment(params: {
  orderId: string;
  method: "instapay" | "telda";
  transactionId: string;
  amount: number;
  expectedAmount: number;
  customerPhone: string;
  customerId?: string;
  screenshotUrl: string;
}): Promise<{
  verified: boolean;
  reason?: string;
}> {
  const data = await getData();

  const order = data.orders.find((o: any) => o.id === params.orderId);
  if (!order) return { verified: false, reason: "Order not found" };

  const blacklistCheck = await isCustomerBlacklisted(params.customerPhone);
  if (blacklistCheck.blocked) {
    await logFraudEvent({
      type: "account_blocked",
      phone: params.customerPhone,
      customerId: params.customerId,
      orderId: params.orderId,
      details: "Blocked customer attempted to place order: " + (blacklistCheck.reason || ""),
    });
    return { verified: false, reason: blacklistCheck.reason || "Account is blocked. Contact support." };
  }

  const screenshotReused = await isScreenshotReused(params.screenshotUrl, params.orderId);
  if (screenshotReused) {
    order.verificationStatus = "rejected";
    order.verificationNote = "Screenshot reused from another order";
    order.status = "Rejected";

    await logFraudEvent({
      type: "tampered_screenshot",
      phone: params.customerPhone,
      customerId: params.customerId,
      orderId: params.orderId,
      details: "Same screenshot uploaded for multiple orders",
    });

    await flagAccount({
      phone: params.customerPhone,
      customerId: params.customerId,
      reason: "Screenshot reuse detected",
      severity: "high",
      block: true,
    });

    await saveData(data);
    return { verified: false, reason: "This screenshot has been used for another order. Please upload a new screenshot." };
  }

  const isDuplicate = await isTransactionIdUsed(params.transactionId);
  if (isDuplicate) {
    order.verificationStatus = "rejected";
    order.verificationNote = "Duplicate transaction ID detected";
    order.status = "Rejected";

    await logFraudEvent({
      type: "duplicate_transaction",
      phone: params.customerPhone,
      customerId: params.customerId,
      orderId: params.orderId,
      details: `Transaction ID ${params.transactionId} was used before`,
    });

    await flagAccount({
      phone: params.customerPhone,
      customerId: params.customerId,
      reason: `Duplicate transaction ID: ${params.transactionId}`,
      severity: "high",
      block: true,
    });

    data.transactions.push({
      id: uuidv4(),
      transactionId: params.transactionId,
      orderId: params.orderId,
      amount: params.amount,
      method: params.method,
      status: "rejected",
      checkedAt: Date.now(),
      customerPhone: params.customerPhone,
      customerId: params.customerId,
    });

    await saveData(data);
    return { verified: false, reason: "This transaction ID has already been used. Fraud detected — account has been blocked." };
  }

  const amountDiff = Math.abs(params.amount - params.expectedAmount);
  if (amountDiff > 1) {
    order.verificationStatus = "rejected";
    order.verificationNote = `Amount mismatch: expected ${params.expectedAmount} L.E., got ${params.amount} L.E.`;
    order.status = "Rejected";
    order.verificationAttempts = (order.verificationAttempts || 0) + 1;

    await logFraudEvent({
      type: "failed_verification",
      phone: params.customerPhone,
      customerId: params.customerId,
      orderId: params.orderId,
      details: `Amount mismatch: expected ${params.expectedAmount}, got ${params.amount}`,
    });

    data.transactions.push({
      id: uuidv4(),
      transactionId: params.transactionId,
      orderId: params.orderId,
      amount: params.amount,
      method: params.method,
      status: "rejected",
      checkedAt: Date.now(),
      customerPhone: params.customerPhone,
      customerId: params.customerId,
    });

    const failedCount = await countFailedVerifications(params.customerPhone);
    const unconfirmedCount = await getUnconfirmedOrderCount(params.customerPhone);

    if (failedCount >= 3 || unconfirmedCount >= 5) {
      await flagAccount({
        phone: params.customerPhone,
        customerId: params.customerId,
        reason: `${failedCount >= 3 ? "Multiple failed payment attempts (" + failedCount + ")" : ""}${failedCount >= 3 && unconfirmedCount >= 5 ? "; " : ""}${unconfirmedCount >= 5 ? "Too many unconfirmed orders (" + unconfirmedCount + ")" : ""}`,
        severity: "high",
        block: true,
      });

      if (failedCount >= 3) {
        const customer = data.customers.find((c: any) => c.id === params.customerId);
        if (customer) {
          customer.lockedUntil = Date.now() + 24 * 60 * 60 * 1000;
        }
      }
    }

    await saveData(data);
    return { verified: false, reason: `Payment amount mismatch — expected ${params.expectedAmount} L.E. but the transaction shows ${params.amount} L.E. Please resubmit with the correct amount.` };
  }

  const unconfirmedCount = await getUnconfirmedOrderCount(params.customerPhone);
  if (unconfirmedCount >= 5) {
    await logFraudEvent({
      type: "too_many_unconfirmed",
      phone: params.customerPhone,
      customerId: params.customerId,
      orderId: params.orderId,
      details: `Phone ${params.customerPhone} has ${unconfirmedCount} unconfirmed orders`,
    });
    await flagAccount({
      phone: params.customerPhone,
      customerId: params.customerId,
      reason: `More than 5 unconfirmed orders (${unconfirmedCount})`,
      severity: "medium",
      block: false,
    });
  }

  order.verificationStatus = "auto_verified";
  order.paymentStatus = "verified";
  order.status = "Confirmed";
  order.transactionId = params.transactionId;
  order.verificationNote = `Auto-verified via ${params.method === "instapay" ? "InstaPay" : "Telda"} — amount matched (${params.amount} L.E.), transaction ID unique`;

  if (order.items && Array.isArray(order.items)) {
    for (const item of order.items) {
      if (!item.productId) continue;
      const product = data.products.find((p: any) => p.id === item.productId);
      if (!product) continue;
      const size = item.size;
      const qty = item.quantity || 1;
      if (product.stockPerSize && size && product.stockPerSize[size] !== undefined) {
        product.stockPerSize[size] = Math.max(0, product.stockPerSize[size] - qty);
      }
      const totalStock = product.stockPerSize
        ? Object.values(product.stockPerSize).reduce((sum: number, v: any) => sum + (v as number), 0)
        : 0;
      if (totalStock === 0) {
        product.stock = "out_of_stock";
      } else if (totalStock <= 5) {
        product.stock = "low_stock";
      } else {
        product.stock = "in_stock";
      }
    }
  }

  data.transactions.push({
    id: uuidv4(),
    transactionId: params.transactionId,
    orderId: params.orderId,
    amount: params.amount,
    method: params.method,
    status: "verified",
    checkedAt: Date.now(),
    customerPhone: params.customerPhone,
    customerId: params.customerId,
  });

  const customer = data.customers.find((c: any) => c.id === params.customerId);
  if (customer && customer.failedPaymentAttempts) {
    customer.failedPaymentAttempts = 0;
  }

  await saveData(data);

  sendWhatsApp(
    order.customerPhone,
    buildFulfillmentStatusMessage(order, "Confirmed"),
  );

  return { verified: true };
}

export function getWhatsAppNotificationLink(phone: string, message: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  const waPhone = cleanPhone.startsWith("20") ? cleanPhone : "2" + cleanPhone.replace(/^0\+?/, "");
  return `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`;
}

export function buildVerificationSuccessMessage(orderId: string, orderTotal: number, method: string): string {
  const shortId = orderId.slice(0, 8).toUpperCase();
  return `✓ TRIO FASHION — Payment Verified

Order #${shortId} has been automatically confirmed ✓

Amount: ${orderTotal} L.E.
Payment: ${method}
Status: ✅ Confirmed

We'll start preparing your order right away. You'll receive updates when it ships.

Thank you for shopping with TRIO FASHION!`;
}

export function buildVerificationFailedMessage(orderId: string, reason: string, method: string): string {
  const shortId = orderId.slice(0, 8).toUpperCase();
  return `✗ TRIO FASHION — Payment Verification Failed

Order #${shortId} could not be verified.

Reason: ${reason}
Method: ${method}

Please resubmit your payment with the correct information. If you believe this is an error, contact our support team.

Thank you,
TRIO FASHION`;
}

export async function isScreenshotReused(screenshotUrl: string, excludeOrderId?: string): Promise<boolean> {
  if (!screenshotUrl) return false;
  const data = await getData();
  return data.orders.some(
    (o: any) =>
      o.screenshot === screenshotUrl &&
      o.id !== excludeOrderId &&
      (o.verificationStatus === "auto_verified" || o.verificationStatus === "verified")
  );
}

export async function confirmFawryPayment(orderId: string): Promise<{ success: boolean; message: string }> {
  const data = await getData();
  const order = data.orders.find((o: any) => o.id === orderId);
  if (!order) return { success: false, message: "Order not found" };
  if (order.paymentMethod !== "fawry") return { success: false, message: "Not a Fawry payment" };

  order.paymentStatus = "verified";
  order.status = "Confirmed";
  order.verificationStatus = "verified";
  order.paymentStatus = "verified";

  if (order.items && Array.isArray(order.items)) {
    for (const item of order.items) {
      if (!item.productId) continue;
      const product = data.products.find((p: any) => p.id === item.productId);
      if (!product) continue;
      const size = item.size;
      const qty = item.quantity || 1;
      if (product.stockPerSize && size && product.stockPerSize[size] !== undefined) {
        product.stockPerSize[size] = Math.max(0, product.stockPerSize[size] - qty);
      }
      const totalStock = product.stockPerSize
        ? Object.values(product.stockPerSize).reduce((sum: number, v: any) => sum + (v as number), 0)
        : 0;
      if (totalStock === 0) {
        product.stock = "out_of_stock";
      } else if (totalStock <= 5) {
        product.stock = "low_stock";
      } else {
        product.stock = "in_stock";
      }
    }
  }

  data.transactions.push({
    id: uuidv4(),
    transactionId: order.fawryReferenceCode || "",
    orderId,
    amount: order.total ?? order.totalPrice ?? 0,
    method: "fawry",
    status: "verified",
    checkedAt: Date.now(),
    customerPhone: order.customerPhone,
    customerId: order.customerId,
  });

  await saveData(data);

  sendWhatsApp(
    order.customerPhone,
    buildFulfillmentStatusMessage(order, "Confirmed"),
  );

  return { success: true, message: "Fawry payment confirmed. Order status updated to Confirmed." };
}

export async function checkAndFlagUnconfirmedOrders(phone: string, customerId?: string): Promise<void> {
  const count = await getUnconfirmedOrderCount(phone);
  if (count >= 5) {
    await logFraudEvent({
      type: "too_many_unconfirmed",
      phone,
      customerId,
      details: `Phone ${phone} has ${count} unconfirmed orders`,
    });
    await flagAccount({
      phone,
      customerId,
      reason: `More than 5 unconfirmed orders (${count})`,
      severity: "medium",
      block: false,
    });
  }
}

export async function deductStock(order: any): Promise<void> {
  const data = await getData();
  if (!order.items || !Array.isArray(order.items)) return;

  for (const item of order.items) {
    if (!item.productId) continue;
    const product = data.products.find((p: any) => p.id === item.productId);
    if (!product) continue;

    const size = item.size;
    const qty = item.quantity || 1;

    if (product.stockPerSize && size && product.stockPerSize[size] !== undefined) {
      product.stockPerSize[size] = Math.max(0, product.stockPerSize[size] - qty);
    }

    const totalStock = product.stockPerSize
      ? Object.values(product.stockPerSize).reduce((sum: number, v: any) => sum + (v as number), 0)
      : 0;

    if (totalStock === 0) {
      product.stock = "out_of_stock";
    } else if (totalStock <= 5) {
      product.stock = "low_stock";
    } else {
      product.stock = "in_stock";
    }
  }

  await saveData(data);
}

export function calculateLoyaltyPoints(orderTotal: number, isBirthdayMonth?: boolean, isFirstOrder?: boolean): number {
  let points = Math.floor(orderTotal / 100) * 10;
  if (isBirthdayMonth) points *= 2;
  if (isFirstOrder) points += 50;
  return points;
}

export async function awardLoyaltyPoints(customerId: string, orderTotal: number, isBirthdayMonth?: boolean, isFirstOrder?: boolean): Promise<void> {
  if (!customerId) return;
  const data = await getData();
  const customer = data.customers.find((c: any) => c.id === customerId);
  if (!customer) return;

  const points = calculateLoyaltyPoints(orderTotal, isBirthdayMonth, isFirstOrder);
  if (points > 0) {
    customer.loyaltyPoints = (customer.loyaltyPoints || 0) + points;
    await saveData(data);
  }
}

export async function generateCouponForCustomer(customerId: string): Promise<void> {
  if (!customerId) return;
  const data = await getData();
  const customer = data.customers.find((c: any) => c.id === customerId);
  if (!customer) return;

  const currentPoints = customer.loyaltyPoints || 0;
  if (currentPoints < 100) return;

  const couponsToGenerate = Math.floor(currentPoints / 100);
  const pointsToDeduct = couponsToGenerate * 100;

  for (let i = 0; i < couponsToGenerate; i++) {
    const code = `LOYALTY-${customerId.slice(0, 6).toUpperCase()}-${Date.now().toString(36).slice(-4).toUpperCase()}-${i}`;
    data.coupons.push({
      id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      code,
      discount: 50,
      type: "fixed",
      minOrder: 500,
      maxUses: 1,
      usedCount: 0,
      expiresAt: Date.now() + 90 * 24 * 60 * 60 * 1000,
      assignedTo: [customerId],
      active: true,
    });
  }

  customer.loyaltyPoints = currentPoints - pointsToDeduct;
  await saveData(data);
}

export function buildFulfillmentStatusMessage(order: any, newStatus: string): string {
  const shortId = order.id.slice(0, 8).toUpperCase();
  const trackingText = order.trackingNumber ? `\nTracking: ${order.trackingNumber}` : "";

  const messages: Record<string, string> = {
    "Confirmed": `Your payment has been confirmed! ✅ Your order #${shortId} is now being prepared. We will notify you when it ships.`,

    "Preparing": `Your order #${shortId} is being prepared 📦 We'll notify you when it's on its way!`,

    "Shipped": `Your order is on its way! 🚚 Order #${shortId} has been shipped. Expected delivery: 2-5 business days.${trackingText}`,

    "Delivered": `Your order #${shortId} has been delivered! 🎉 Thank you for shopping with TRIO FASHION. We hope you love your pieces!`,
  };

  return messages[newStatus] || `TRIO FASHION — Order #${shortId} status: ${newStatus}`;
}

export function getFulfillmentWhatsAppLink(order: any, newStatus: string): string {
  if (!order.customerPhone) return "";
  const message = buildFulfillmentStatusMessage(order, newStatus);
  return getWhatsAppNotificationLink(order.customerPhone, message);
}

export async function processFulfillmentStatusChange(data: any, order: any, newStatus: string, trackingNumber?: string): Promise<void> {
  const previousStatus = order.status;

  if (newStatus !== previousStatus) {
    sendWhatsApp(
      order.customerPhone,
      buildFulfillmentStatusMessage(order, newStatus),
    );
  }

  if (newStatus === "Confirmed" && previousStatus !== "Confirmed") {
    if (order.items && Array.isArray(order.items)) {
      for (const item of order.items) {
        if (!item.productId) continue;
        const product = data.products.find((p: any) => p.id === item.productId);
        if (!product) continue;
        const size = item.size;
        const qty = item.quantity || 1;
        if (product.stockPerSize && size && product.stockPerSize[size] !== undefined) {
          product.stockPerSize[size] = Math.max(0, product.stockPerSize[size] - qty);
        }
        const totalStock = product.stockPerSize
          ? Object.values(product.stockPerSize).reduce((sum: number, v: any) => sum + (v as number), 0)
          : 0;
        if (totalStock === 0) {
          product.stock = "out_of_stock";
        } else if (totalStock <= 5) {
          product.stock = "low_stock";
        } else {
          product.stock = "in_stock";
        }
      }
    }
  }

  if (newStatus === "Shipped" && previousStatus !== "Shipped") {
    order.shippedAt = Date.now();
  }

  if (newStatus === "Delivered" && previousStatus !== "Delivered") {
    order.deliveredAt = Date.now();
    if (order.customerId) {
      const customer = data.customers.find((c: any) => c.id === order.customerId);
      if (customer) {
        const total = order.total ?? order.totalPrice ?? 0;
        const isFirstOrder = !customer.firstOrderDone;
        const isBirthday = customer.birthdayMonth ? new Date().getMonth() + 1 === customer.birthdayMonth : false;
        const points = calculateLoyaltyPoints(total, isBirthday, isFirstOrder);
        if (points > 0) {
          customer.loyaltyPoints = (customer.loyaltyPoints || 0) + points;
        }
        if (isFirstOrder) customer.firstOrderDone = true;
        customer.orderCount = (customer.orderCount || 0) + 1;
        customer.lifetimeSpend = (customer.lifetimeSpend || 0) + total;
        customer.lastActiveAt = Date.now();
        const currentPoints = customer.loyaltyPoints || 0;
        if (currentPoints >= 100) {
          const couponsToGenerate = Math.floor(currentPoints / 100);
          const pointsToDeduct = couponsToGenerate * 100;
          for (let i = 0; i < couponsToGenerate; i++) {
            data.coupons.push({
              id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
              code: `LOYALTY-${order.customerId.slice(0, 6).toUpperCase()}-${Date.now().toString(36).slice(-4).toUpperCase()}-${i}`,
              discount: 10,
              type: "fixed",
              minOrder: 100,
              maxUses: 1,
              usedCount: 0,
              expiresAt: Date.now() + 90 * 24 * 60 * 60 * 1000,
              assignedTo: [order.customerId],
              active: true,
            });
          }
          customer.loyaltyPoints = currentPoints - pointsToDeduct;
        }
      }
    }
  }

  if (trackingNumber) {
    order.trackingNumber = trackingNumber;
  }
}

export async function autoDeliverIfEligible(): Promise<number> {
  const data = await getData();
  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  let count = 0;

  for (const order of data.orders) {
    if (order.status === "Shipped") {
      const shippedAt = order.shippedAt || order.createdAt;
      if (now - shippedAt >= sevenDays) {
        order.status = "Delivered";
        order.deliveredAt = now;
        if (order.customerId) {
          const customer = data.customers.find((c: any) => c.id === order.customerId);
          if (customer) {
            const total = order.total ?? order.totalPrice ?? 0;
            const isFirstOrder = !customer.firstOrderDone;
            const isBirthday = customer.birthdayMonth ? new Date().getMonth() + 1 === customer.birthdayMonth : false;
            const points = calculateLoyaltyPoints(total, isBirthday, isFirstOrder);
            if (points > 0) {
              customer.loyaltyPoints = (customer.loyaltyPoints || 0) + points;
            }
            if (isFirstOrder) customer.firstOrderDone = true;
            customer.orderCount = (customer.orderCount || 0) + 1;
            customer.lifetimeSpend = (customer.lifetimeSpend || 0) + total;
            customer.lastActiveAt = Date.now();
            const currentPoints = customer.loyaltyPoints || 0;
            if (currentPoints >= 100) {
              const couponsToGenerate = Math.floor(currentPoints / 100);
              const pointsToDeduct = couponsToGenerate * 100;
              for (let i = 0; i < couponsToGenerate; i++) {
                data.coupons.push({
                  id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
                  code: `LOYALTY-${order.customerId.slice(0, 6).toUpperCase()}-${Date.now().toString(36).slice(-4).toUpperCase()}-${i}`,
                  discount: 10,
                  type: "fixed",
                  minOrder: 100,
                  maxUses: 1,
                  usedCount: 0,
                  expiresAt: Date.now() + 90 * 24 * 60 * 60 * 1000,
                  assignedTo: [order.customerId],
                  active: true,
                });
              }
              customer.loyaltyPoints = currentPoints - pointsToDeduct;
            }
          }
        }
        sendWhatsApp(
          order.customerPhone,
          buildFulfillmentStatusMessage(order, "Delivered"),
        );
        count++;
      }
    }
  }

  if (count > 0) await saveData(data);
  return count;
}
