import { NextResponse } from "next/server";
import { fakeTxHash, hashPayload } from "@/lib/frontierguard/server";

export async function POST(request: Request) {
  const body = await request.json();
  const paymentSignature = request.headers.get("payment-signature");
  const challengeId = `challenge_${hashPayload({ scope: "premium-yield", body }).slice(0, 10)}`;

  if (!paymentSignature) {
    return NextResponse.json(
      {
        protocol: "x402",
        paymentRequired: true,
        merchant: "Veridex Risk Oracle",
        resource: "/api/mock/services/premium-yield",
        challengeId,
        amountUsd: 4.2,
        network: "base-sepolia",
        counterpartyTrust: 96.4,
      },
      { status: 402 },
    );
  }

  return NextResponse.json({
    protocol: "x402",
    settled: true,
    merchant: "Veridex Risk Oracle",
    paymentTxHash: fakeTxHash({ scope: "premium-yield-payment", paymentSignature, body }),
    data: [
      {
        asset: "USDC",
        protocol: "Aave V3",
        apy: "8.42%",
        riskScore: 0.72,
        liquidity: "$4.2B",
        trustScore: 96.4,
      },
      {
        asset: "USDC",
        protocol: "Compound V3",
        apy: "8.91%",
        riskScore: 0.84,
        liquidity: "$2.8B",
        trustScore: 91.8,
      },
      {
        asset: "DAI",
        protocol: "Morpho Blue",
        apy: "11.14%",
        riskScore: 1.1,
        liquidity: "$611M",
        trustScore: 83.2,
      },
    ],
  });
}
