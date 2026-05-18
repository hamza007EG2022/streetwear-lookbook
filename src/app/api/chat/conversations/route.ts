import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, validateSessionToken } from "@/lib/auth";
import { getData } from "@/lib/store";
import { getOrCreateKey, decrypt } from "@/lib/crypto";

export async function GET(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const valid = token ? await validateSessionToken(token) : false;
  if (!valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await getData();
    const key = await getOrCreateKey();

    const chats = data.chats.map((chat) => ({
      id: chat.id,
      customerName: chat.customerName,
      createdAt: chat.createdAt,
      messages: chat.messages.map((m) => {
        try {
          return { id: m.id, text: decrypt(m.text, m.iv, key), sender: m.sender, timestamp: m.timestamp, read: m.read };
        } catch {
          return { id: m.id, text: "[encrypted message]", sender: m.sender, timestamp: m.timestamp, read: m.read };
        }
      }),
    }));

    return NextResponse.json({ chats });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
