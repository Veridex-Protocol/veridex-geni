import { NextResponse } from "next/server";
import { fakeExplorerUrl, fakeTxHash } from "@/lib/frontierguard/server";

export async function POST(request: Request) {
  const body = await request.json();
  const txHash = fakeTxHash({ scope: "erc8004-feedback", body });
  const rating = typeof body.rating === "number" ? body.rating : 4.5;
  const updatedScore = Number((92 + rating * 1.5).toFixed(2));
  const delta = Number((rating - 4).toFixed(2));

  return NextResponse.json({
    txHash,
    explorerUrl: fakeExplorerUrl("tx", txHash),
    updatedScore,
    delta,
  });
}
