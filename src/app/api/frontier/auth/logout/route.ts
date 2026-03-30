import { NextResponse } from "next/server";
import { clearFrontierSessionCookie } from "@/lib/frontierguard/session";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearFrontierSessionCookie(response);
  return response;
}
