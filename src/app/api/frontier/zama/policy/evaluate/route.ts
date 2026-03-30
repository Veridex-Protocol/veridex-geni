import { NextResponse } from "next/server";
import { evaluateConfidentialPolicy } from "@/lib/frontierguard/integrations/zama";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    missionId: string;
    operatorWallet: string;
    requestedSpendUsd: number;
    counterpartyTrust: number;
    minTrustScore?: number;
    maxSpendUsd?: number;
    emergencyStop?: boolean;
  };

  const result = await evaluateConfidentialPolicy(body);
  return NextResponse.json(result);
}
