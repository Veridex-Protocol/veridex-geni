import { NextResponse } from "next/server";
import { getFrontierConfig, getRequestOrigin } from "@/lib/frontierguard/integrations/config";

export async function HEAD() {
  return new Response(null, { status: 200 });
}

export async function GET(request: Request) {
  const config = getFrontierConfig();
  const origin = getRequestOrigin(request);

  return NextResponse.json({
    id: "veridex-frontierguard-ucp",
    name: "Veridex FrontierGuard Commerce",
    capabilities: ["premium-yield", "risk-intelligence", "bounded-checkout"],
    paymentHandlers: [
      {
        id: "handler-veridex-x402",
        name: "dev.veridex.passkey_payment",
        version: "2026-01",
        config: {
          recipient_address: config.paywall.recipient,
          chain_id: 84532,
          token_address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
          amount: String(Math.round(config.paywall.amountUsd * 1_000_000)),
          resource: `${origin}/api/frontier/services/premium-yield`,
        },
      },
    ],
  });
}

export async function POST() {
  const config = getFrontierConfig();

  return NextResponse.json({
    checkout_id: `ucp-${Date.now()}`,
    handlers: [
      {
        id: "handler-veridex-x402",
        name: "dev.veridex.passkey_payment",
        version: "2026-01",
        config: {
          recipient_address: config.paywall.recipient,
          chain_id: 84532,
          token_address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
          amount: String(Math.round(config.paywall.amountUsd * 1_000_000)),
        },
      },
    ],
    total: {
      amount: config.paywall.amountUsd.toFixed(2),
      currency: "USD",
    },
    status: "created",
  });
}
