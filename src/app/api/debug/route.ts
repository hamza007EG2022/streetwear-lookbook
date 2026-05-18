import { NextResponse } from "next/server";
import { put, head } from "@vercel/blob";

export async function GET() {
  const results: any = {};
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  results.hasToken = !!token;
  results.tokenPrefix = token ? token.substring(0, 10) + "..." : null;

  // head() URL vs put() URL comparison
  try {
    const info = await head("store.json");
    results.headUrl = info.url;
    results.headSize = info.size;
    results.headUploaded = info.uploadedAt;
  } catch (e: any) {
    results.headError = e.message?.substring(0, 150);
  }

  // Read store.json using head() URL
  if (results.headUrl) {
    try {
      const res = await fetch(`${results.headUrl}?t=${Date.now()}`);
      results.headFetchStatus = res.status;
      if (res.ok) {
        const text = await res.text();
        const d = JSON.parse(text);
        results.headBrandName = d.brand?.name;
      }
    } catch (e: any) {
      results.headFetchError = e.message;
    }
  }

  // Write new content and capture put() URL
  try {
    const newData = { brand: { name: "TEST-" + Date.now() } };
    const putResult = await put("store.json", JSON.stringify(newData), {
      contentType: "application/json",
      access: "public",
      allowOverwrite: true,
    });
    results.putUrl = putResult.url;
    results.putPathname = putResult.pathname;

    // Read using put() URL immediately
    const putReadRes = await fetch(`${putResult.url}?t=${Date.now()}`);
    results.putReadStatus = putReadRes.status;
    if (putReadRes.ok) {
      const putReadText = await putReadRes.text();
      const putReadData = JSON.parse(putReadText);
      results.putReadBrand = putReadData.brand?.name;
    }

    // Now head() again to see if URL changed
    const info2 = await head("store.json");
    results.head2Url = info2.url;
    results.head2Uploaded = info2.uploadedAt;
    results.urlsMatch = info2.url === putResult.url;
  } catch (e: any) {
    results.putError = e.message?.substring(0, 150);
  }

  return NextResponse.json(results);
}
