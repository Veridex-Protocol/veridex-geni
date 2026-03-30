import { NextResponse } from "next/server";
import { getFrontierConfig, getRequestOrigin } from "@/lib/frontierguard/integrations/config";

export async function GET(request: Request) {
  const config = getFrontierConfig();
  const origin = getRequestOrigin(request);

  return NextResponse.json({
    id: "frontierguard-cart",
    items: [
      {
        id: "premium-yield-data",
        name: "Premium Yield Intelligence",
        quantity: 1,
        unit_price: config.paywall.amountUsd,
        currency: "USD",
      },
    ],
    total: config.paywall.amountUsd,
    currency: "USD",
    merchant: {
      id: "veridex-frontierguard",
      name: config.paywall.merchant,
    },
    checkout_url: `${origin}/.well-known/acp-checkout`,
  });
}
