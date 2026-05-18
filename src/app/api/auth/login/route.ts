import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, hashPassword, createSessionToken } from "@/lib/auth";
import { getData, saveData } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    if (!password) {
      return NextResponse.json({ error: "Password required" }, { status: 400 });
    }

    const data = await getData();

    if (!data.adminPassword) {
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
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
