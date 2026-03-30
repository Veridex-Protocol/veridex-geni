import { NextResponse } from "next/server";
import { getFrontierConfig, getRequestOrigin } from "@/lib/frontierguard/integrations/config";

export async function GET(request: Request) {
  const config = getFrontierConfig();
  const origin = getRequestOrigin(request);

  return NextResponse.json({
    version: "2026-01",
    mandate_id: "frontierguard-mandate",
    cart_mandate: {
      max_value: {
        amount: config.paywall.amountUsd,
        currency: "USD",
      },
      allowed_categories: ["risk-intelligence", "market-data"],
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    },
    payment_mandate: {
      provider: "veridex",
      credential_type: "session_key",
    },
    intent_mandate: {
      source: "frontierguard",
      verified_at: new Date().toISOString(),
      description: config.paywall.description,
    },
    fulfillment_url: `${origin}/.well-known/ap2-mandate`,
  });
}

export async function POST() {
  return NextResponse.json({
    status: "fulfilled",
    provider: "veridex",
  });
}
