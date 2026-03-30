import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    status: "completed",
    provider: "veridex_session_key",
  });
}
