import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import bcrypt from "bcryptjs";

export async function GET() {
  const hash = await bcrypt.hash("admin", 10);
  const res = await fetch("https://th8mtgd77eyf2y5r.public.blob.vercel-storage.com/store.json?t=" + Date.now());
  const data = await res.json();
  data.adminPassword = hash;
  data._updatedAt = Date.now();
  await put("store.json", JSON.stringify(data, null, 2), { contentType: "application/json", access: "public", allowOverwrite: true });
  return NextResponse.json({ success: true, password: "admin" });
}
