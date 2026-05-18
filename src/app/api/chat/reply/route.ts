import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, validateSessionToken } from "@/lib/auth";
import { getData, saveData } from "@/lib/store";
import { getOrCreateKey, encrypt } from "@/lib/crypto";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const valid = token ? await validateSessionToken(token) : false;
  if (!valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { chatId, text } = await req.json();
    if (!chatId || !text) {
      return NextResponse.json({ error: "chatId and text required" }, { status: 400 });
    }

    const data = await getData();
    const key = await getOrCreateKey();
    const { encrypted, iv } = encrypt(text, key);

    const chat = data.chats.find((c) => c.id === chatId);
    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    chat.messages.push({
      id: uuidv4(),
      text: encrypted,
      iv,
      sender: "admin",
      timestamp: Date.now(),
      read: true,
    });

    await saveData(data);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to reply" }, { status: 500 });
  }
}
