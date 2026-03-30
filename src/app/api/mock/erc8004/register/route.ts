import { NextResponse } from "next/server";
import { fakeExplorerUrl, fakeTxHash, hashPayload } from "@/lib/frontierguard/server";

export async function POST(request: Request) {
  const body = await request.json();
  const seed = hashPayload(body);
  const txHash = fakeTxHash({ scope: "erc8004-register", body });
  const identity = `ERC-8004-${seed.slice(0, 10).toUpperCase()}`;

  return NextResponse.json({
    agentId: `AGENT-${seed.slice(0, 8).toUpperCase()}`,
    erc8004Identity: identity,
    network: "Base Sepolia Demo",
    registry: "Veridex ERC-8004 Identity Registry",
    registrationTxHash: txHash,
    explorerUrl: fakeExplorerUrl("tx", txHash),
    trustScore: 96.2,
  });
}
