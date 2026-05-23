import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, validateSessionToken } from "@/lib/auth";
import { getData, saveData } from "@/lib/store";
import { logFraudEvent, flagAccount } from "@/lib/payment-verification";

export async function GET(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const valid = token ? await validateSessionToken(token) : false;
  if (!valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await getData();
  const flagged = [...data.flaggedAccounts].sort((a: any, b: any) => b.createdAt - a.createdAt);
  const events = [...data.fraudEvents].sort((a: any, b: any) => b.createdAt - a.createdAt);

  return NextResponse.json({ flaggedAccounts: flagged, fraudEvents: events });
}

export async function POST(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const valid = token ? await validateSessionToken(token) : false;
  if (!valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { action, accountId, reason } = await req.json();

    if (action === "unblock") {
      if (!accountId) return NextResponse.json({ error: "Missing accountId" }, { status: 400 });

      const data = await getData();
      const account = data.flaggedAccounts.find((f: any) => f.id === accountId);
      if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

      account.blocked = false;
      account.unblockedAt = Date.now();

      if (account.customerId) {
        const customer = data.customers.find((c: any) => c.id === account.customerId);
        if (customer) {
          customer.blacklisted = false;
          customer.lockedUntil = undefined;
          customer.failedPaymentAttempts = 0;
        }
      }

      await logFraudEvent({
        type: "account_unblocked",
        phone: account.phone,
        customerId: account.customerId,
        details: reason || "Account unblocked by admin",
      });

      await saveData(data);
      return NextResponse.json({ success: true, flaggedAccounts: data.flaggedAccounts, fraudEvents: data.fraudEvents });
    }

    if (action === "flag") {
      const { phone, customerId, reason: flagReason, severity, block } = await req.json();
      if (!phone || !flagReason) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

      await flagAccount({
        phone,
        customerId,
        reason: flagReason,
        severity: severity || "medium",
        block: block !== false,
      });

      const data = await getData();
      return NextResponse.json({ success: true, flaggedAccounts: data.flaggedAccounts, fraudEvents: data.fraudEvents });
    }

    if (action === "clear") {
      const data = await getData();
      data.fraudEvents = [];
      await saveData(data);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e) {
    console.error("Fraud API error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
