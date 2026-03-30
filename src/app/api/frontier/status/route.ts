import { NextResponse } from "next/server";
import {
  getFrontierConfig,
  getSponsorPathReadiness,
} from "@/lib/frontierguard/integrations/config";
import { getEnterpriseAgentSnapshot } from "@/lib/frontierguard/integrations/runtime";
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

  return NextResponse.json({
    mode: config.mode,
    integrations: {
      veridexSdk: true,
      agentSdk: true,
      passkeyCredentialLoaded: snapshot.available,
      erc8004WriteEnabled: config.erc8004.enabled && !!config.erc8004.privateKey,
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
  });
}
