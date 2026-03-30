import { NextResponse } from "next/server";
import { buildWellKnownRegistration } from "@/lib/frontierguard/integrations/identity";

export async function GET(request: Request) {
  const payload = await buildWellKnownRegistration(request);
  return NextResponse.json(payload);
}
