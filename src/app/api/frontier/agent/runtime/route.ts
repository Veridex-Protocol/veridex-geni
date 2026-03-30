import { NextResponse } from "next/server";
import { getEnterpriseAgentSnapshot } from "@/lib/frontierguard/integrations/runtime";
import { resolveFrontierSessionLocator } from "@/lib/frontierguard/session";

export async function GET(request: Request) {
  const snapshot = await getEnterpriseAgentSnapshot(resolveFrontierSessionLocator(request));
  return NextResponse.json(snapshot);
}
