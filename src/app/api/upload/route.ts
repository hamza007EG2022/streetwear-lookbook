import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, validateSessionToken } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { put } from '@vercel/blob';
import path from "path";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const valid = token ? await validateSessionToken(token) : false;
  if (!valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const ext = path.extname(file.name) || ".jpg";
    const filename = `${uuidv4()}${ext}`;
    const bytes = await file.arrayBuffer();

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const buffer = Buffer.from(bytes);
      const blob = await put(`uploads/${filename}`, buffer, {
        contentType: file.type || 'image/jpeg',
        access: 'public',
        allowOverwrite: true,
      });
      return NextResponse.json({ url: blob.url });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), Buffer.from(bytes));
    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Upload error:", msg);
    return NextResponse.json({ error: "Upload failed", detail: msg }, { status: 500 });
  }
}
