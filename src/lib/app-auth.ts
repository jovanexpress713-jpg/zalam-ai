import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export function requireAppAccess(req: NextRequest): NextResponse | null {
  const expected = process.env.ZALAM_ACCESS_TOKEN;
  if (!expected || expected.length < 24) {
    return NextResponse.json({ error: "Workspace access token is not configured on the server." }, { status: 503 });
  }
  const supplied = req.headers.get("x-zalam-access-token") ?? "";
  const a = Buffer.from(expected);
  const b = Buffer.from(supplied);
  const valid = a.length === b.length && timingSafeEqual(a, b);
  if (!valid) return NextResponse.json({ error: "Access denied." }, { status: 401 });
  return null;
}
