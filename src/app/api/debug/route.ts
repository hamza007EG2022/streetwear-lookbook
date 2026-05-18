import { NextResponse } from "next/server";
import { getData } from "@/lib/store";

export async function GET() {
  const data = await getData();
  return NextResponse.json({
    hasPassword: !!data.adminPassword,
    hasToken: !!data.adminToken,
    tokenPrefix: data.adminToken ? data.adminToken.substring(0, 8) + "..." : null,
    chatCount: data.chats.length,
    hasEncryptionKey: !!data.encryptionKey,
  });
}
