import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, validateSessionToken } from "@/lib/auth";
import { getData, saveData } from "@/lib/store";
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
    let unread = 0;

    for (const chat of data.chats) {
      for (const msg of chat.messages) {
        if (msg.sender === "customer" && !msg.read) {
          unread++;
        }
      }
    }

    return NextResponse.json({ unread });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const valid = token ? await validateSessionToken(token) : false;
  if (!valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { chatId } = await req.json();
    const data = await getData();
    const chat = data.chats.find((c) => c.id === chatId);
    if (chat) {
      for (const msg of chat.messages) {
        if (msg.sender === "customer") msg.read = true;
      }
      await saveData(data);
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
