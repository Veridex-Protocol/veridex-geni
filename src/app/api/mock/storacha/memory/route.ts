import { NextResponse } from "next/server";
import { fakeCid, hashPayload } from "@/lib/frontierguard/server";

export async function POST(request: Request) {
  const body = await request.json();
  const cid = fakeCid({ scope: "storacha-memory", body });
  const ucanDelegation = `ucan:${hashPayload({ scope: "ucan", body }).slice(0, 24)}`;

  return NextResponse.json({
    cid,
    ucanDelegation,
    network: "Storacha Demo",
  });
}
