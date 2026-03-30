import { NextResponse } from "next/server";
import { encryptConfidentialPolicy } from "@/lib/frontierguard/integrations/zama";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    missionId: string;
    operatorWallet: string;
    maxSpendUsd?: number;
    minTrustScore?: number;
    allowedCounterparties: string[];
    emergencyStop: boolean;
  };

  const result = await encryptConfidentialPolicy(body);
  return NextResponse.json(result);
}
