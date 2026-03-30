import { NextResponse } from "next/server";
import { fakeCid, fakeTxHash } from "@/lib/frontierguard/server";

export async function POST(request: Request) {
  const body = await request.json();
  const cid = fakeCid({ scope: "filecoin-pin", body });
  const txHash = fakeTxHash({ scope: "filecoin-calibration", body });

  return NextResponse.json({
    cid,
    txHash,
    network: "Filecoin Calibration Demo",
    status: "pinned",
  });
}
