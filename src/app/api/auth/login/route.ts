import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, hashPassword, createSessionToken } from "@/lib/auth";
import { getData, saveData, blobExists } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    if (!password) {
      return NextResponse.json({ error: "Password required" }, { status: 400 });
    }

    const data = await getData();

    if (!data.adminPassword) {
      const exists = await blobExists();
      if (exists) {
        // CDN may be stale — retry reading with delay
        for (let i = 0; i < 3; i++) {
          await new Promise(r => setTimeout(r, 1500));
          const retry = await getData();
          if (retry.adminPassword) {
            const valid = await verifyPassword(password, retry.adminPassword);
            if (!valid) {
              return NextResponse.json({ error: "Invalid password" }, { status: 401 });
            }
            const token = await createSessionToken();
            const res = NextResponse.json({ success: true, token });
            res.cookies.set("admin_token", token, {
              httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7,
            });
            return res;
          }
        }
        // blob exists but truly has no password — treat as first-time setup
        const hashed = await hashPassword(password);
        const fresh = await getData();
        fresh.adminPassword = hashed;
        await saveData(fresh);
        const token = await createSessionToken();
        const res = NextResponse.json({ success: true, token });
        res.cookies.set("admin_token", token, {
          httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7,
        });
        return res;
      }
      const hashed = await hashPassword(password);
      data.adminPassword = hashed;
      await saveData(data);
      const token = await createSessionToken();
      const res = NextResponse.json({ success: true, token });
      res.cookies.set("admin_token", token, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
      return res;
    }

    const valid = await verifyPassword(password, data.adminPassword);
    if (!valid) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const token = await createSessionToken();
    const res = NextResponse.json({ success: true, token });
    res.cookies.set("admin_token", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Login error:", msg, e instanceof Error ? e.stack : "");
    return NextResponse.json({ error: "Server error", detail: msg }, { status: 500 });
  }
}

