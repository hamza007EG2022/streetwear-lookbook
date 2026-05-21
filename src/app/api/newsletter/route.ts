import { NextRequest, NextResponse } from "next/server";
import { getData, saveData } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const data = await getData();
    const exists = (data.newsletter || []).some((e: any) => e.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      return NextResponse.json({ message: "Already subscribed" });
    }

    data.newsletter = data.newsletter || [];
    data.newsletter.push({ email: email.toLowerCase(), subscribedAt: Date.now() });
    await saveData(data);

    return NextResponse.json({ message: "Subscribed successfully" });
  } catch {
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}
