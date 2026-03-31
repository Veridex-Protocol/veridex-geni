import { NextResponse } from "next/server";
import {
  getFrontierConfig,
  getSponsorPathReadiness,
} from "@/lib/frontierguard/integrations/config";
import {
  getEnterpriseAgentSnapshot,
  getEnterpriseRuntimeHealth,
} from "@/lib/frontierguard/integrations/runtime";
import { resolveFrontierSessionLocator } from "@/lib/frontierguard/session";
import { isDatabaseConfigured } from "@/lib/db";

export async function GET(request: Request) {
  const config = getFrontierConfig();
  const sponsorPath = getSponsorPathReadiness(config);
  const locator = resolveFrontierSessionLocator(request);
  const snapshot = await getEnterpriseAgentSnapshot(locator).catch(() => ({
    available: false,
    session: null,
    identity: null,
  }));
  const runtimeHealth = await getEnterpriseRuntimeHealth(locator).catch(() => ({
    available: false,
    signerSource: "unavailable" as const,
    walletAddress: null,
    paywallNetwork: config.paywall.network,
    paywallAsset: "",
    paywallAmountUsd: config.paywall.amountUsd,
    x402Ready: sponsorPath.x402Ready,
    erc8004Ready: sponsorPath.erc8004Ready,
    livePaymentReady: false,
    liveWriteReady: false,
    warnings: ["Unable to load runtime health."],
  }));

  return NextResponse.json({
    mode: config.mode,
    integrations: {
      veridexSdk: true,
      agentSdk: true,
      passkeyCredentialLoaded: snapshot.available,
      erc8004WriteEnabled: config.erc8004.enabled && sponsorPath.erc8004Ready,
      x402Ready: sponsorPath.x402Ready,
      starknetReady: sponsorPath.starknetReady,
      storachaWriteEnabled: config.storacha.enabled,
      filecoinProvider: config.filecoin.provider,
      relayerConfigured: Boolean(config.veridex.relayerUrl),
      databaseConfigured: isDatabaseConfigured(),
    },
    sponsorPath,
    proofs: {
      runtimeWalletBound: snapshot.available,
      corePathReady: snapshot.available && sponsorPath.coreProofReady,
      livePathReady: snapshot.available && sponsorPath.liveProofReady,
      x402SettlementReady: sponsorPath.x402Ready,
      erc8004ReceiptsReady: sponsorPath.erc8004Ready,
      starknetSecondaryReady: sponsorPath.starknetReady,
    },
    runtime: snapshot,
    runtimeHealth,
  });
}
