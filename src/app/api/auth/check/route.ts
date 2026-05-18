import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, validateSessionToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const valid = token ? await validateSessionToken(token) : false;

  if (valid) {
    return NextResponse.json({ authenticated: true });
  }
  return NextResponse.json({ authenticated: false }, { status: 401 });
}
