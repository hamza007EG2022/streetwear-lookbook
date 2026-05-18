import { NextRequest, NextResponse } from "next/server";
import { getData, saveData } from "@/lib/store";
import { getOrCreateKey, encrypt } from "@/lib/crypto";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const { name, text } = await req.json();
    if (!name || !text) {
      return NextResponse.json({ error: "Name and text required" }, { status: 400 });
    }

    const data = await getData();
    const key = await getOrCreateKey();
    const { encrypted, iv } = encrypt(text, key);

    let chat = data.chats.find((c) => c.customerName === name);
    if (!chat) {
      chat = { id: uuidv4(), customerName: name, messages: [], createdAt: Date.now() };
      data.chats.push(chat);
    }

    chat.messages.push({
      id: uuidv4(),
      text: encrypted,
      iv,
      sender: "customer",
      timestamp: Date.now(),
      read: false,
    });

    await saveData(data);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
