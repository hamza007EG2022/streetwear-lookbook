import { NextResponse } from "next/server";
import { put, head } from "@vercel/blob";

export async function GET() {
  const results: any = {};
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  results.hasToken = !!token;
  results.tokenPrefix = token ? token.substring(0, 10) + "..." : null;

  // Test head
  try {
    const info = await head("store.json");
    results.headOk = true;
    results.headUrl = info.url.substring(0, 60);
    results.headSize = info.size;
    results.headUploaded = info.uploadedAt;
  } catch (e: any) {
    results.headOk = false;
    results.headError = e.message?.substring(0, 100);
  }

  // Test read via CDN URL (if head succeeded)
  if (results.headUrl) {
    try {
      const res = await fetch(`${results.headUrl}?t=${Date.now()}`);
      results.fetchStatus = res.status;
      if (res.ok) {
        const text = await res.text();
        const d = JSON.parse(text);
        results.brandName = d.brand?.name;
        results.hasPassword = !!d.adminPassword;
      }
    } catch (e: any) {
      results.fetchError = e.message;
    }
  }

  // Test write and immediate read
  try {
    const writeResult = await put("debug-write-test.json", JSON.stringify({ ts: Date.now(), msg: "hello" }), {
      contentType: "application/json",
      access: "public",
      allowOverwrite: true,
    });
    results.writeOk = true;
    results.writeUrl = writeResult.url.substring(0, 60);

    // Immediate read
    const readRes = await fetch(`${writeResult.url}?t=${Date.now()}`);
    if (readRes.ok) {
      const readText = await readRes.text();
      const readData = JSON.parse(readText);
      results.writeReadBack = readData.msg;
    } else {
      results.writeReadStatus = readRes.status;
    }
  } catch (e: any) {
    results.writeOk = false;
    results.writeError = e.message?.substring(0, 100);
  }

  return NextResponse.json(results);
}
