import { NextRequest, NextResponse } from "next/server";
import { getData } from "@/lib/store";
import { getOrCreateKey, decrypt } from "@/lib/crypto";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");
  const since = parseInt(searchParams.get("since") || "0");

  if (!name) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }

  try {
    const data = await getData();
    const key = await getOrCreateKey();
    const chat = data.chats.find((c) => c.customerName === name);

    if (!chat) {
      return NextResponse.json({ messages: [] });
    }

    const newMessages = chat.messages
      .filter((m) => m.timestamp > since)
      .map((m) => {
        try {
          return { id: m.id, text: decrypt(m.text, m.iv, key), sender: m.sender, timestamp: m.timestamp };
        } catch {
          return { id: m.id, text: "[encrypted message]", sender: m.sender, timestamp: m.timestamp };
        }
      });

    return NextResponse.json({ messages: newMessages });
  } catch {
    return NextResponse.json({ error: "Poll failed" }, { status: 500 });
  }
}
