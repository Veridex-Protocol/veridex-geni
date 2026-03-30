import { createAgentWallet } from "@veridex/agentic-payments";
import type { PasskeyCredential } from "@veridex/sdk";
import { ethers } from "ethers";
import {
  getFrontierConfig,
  getRequestOrigin,
  getSponsorPathReadiness,
} from "@/lib/frontierguard/integrations/config";
import {
  getStoredCredential,
  getStoredCredentialByKeyHash,
  getStoredCredentialForSession,
} from "@/lib/frontierguard/repository";
import {
  resolveFrontierSessionLocator,
  type FrontierSessionLocator,
} from "@/lib/frontierguard/session";

type FrontierAgentWallet = Awaited<ReturnType<typeof createAgentWallet>>;

const walletPromises = new Map<string, Promise<FrontierAgentWallet | null>>();

function parseStoredCredentialValue(
  credential: {
    credential_id: string;
    key_hash: string;
    public_key_x: string;
    public_key_y: string;
    operator_wallet: string;
  },
  operatorWallet?: string,
): PasskeyCredential | null {
  if (
    operatorWallet &&
    credential.operator_wallet.toLowerCase() !== operatorWallet.toLowerCase()
  ) {
    return null;
  }

  try {
    return {
      credentialId: credential.credential_id,
      keyHash: credential.key_hash,
      publicKeyX: BigInt(credential.public_key_x),
      publicKeyY: BigInt(credential.public_key_y),
    };
  } catch {
    return null;
  }
}

async function resolveEnterpriseMasterCredential(
  locator?: FrontierSessionLocator,
): Promise<PasskeyCredential | null> {
  if (locator?.sessionId) {
    const credential = await getStoredCredentialForSession(locator.sessionId);
    const resolved = credential
      ? parseStoredCredentialValue(credential, locator.operatorWallet)
      : null;

    if (resolved) {
      return resolved;
    }
  }

  if (locator?.credentialId) {
    const credential = await getStoredCredential(locator.credentialId);
    const resolved = credential
      ? parseStoredCredentialValue(credential, locator.operatorWallet)
      : null;

    if (resolved) {
      return resolved;
    }
  }

  if (locator?.passkeyKeyHash) {
    const credential = await getStoredCredentialByKeyHash(locator.passkeyKeyHash);
    const resolved = credential
      ? parseStoredCredentialValue(credential, locator.operatorWallet)
      : null;

    if (resolved) {
      return resolved;
    }
  }

  return getFrontierConfig().veridex.masterCredential ?? null;
}

export async function getEnterpriseAgentWallet(
  locator?: FrontierSessionLocator,
): Promise<FrontierAgentWallet | null> {
  const config = getFrontierConfig();
  const masterCredential = await resolveEnterpriseMasterCredential(locator);

  if (
    !masterCredential ||
    !config.veridex.relayerUrl ||
    !config.veridex.relayerApiKey
  ) {
    return null;
  }

  const cacheKey = `${config.veridex.network}:${masterCredential.keyHash}`;
  let walletPromise = walletPromises.get(cacheKey) ?? null;

  if (!walletPromise) {
    walletPromise = createAgentWallet({
      masterCredential,
      session: {
        dailyLimitUSD: config.veridex.dailyLimitUsd,
        perTransactionLimitUSD: config.veridex.perTransactionLimitUsd,
        expiryHours: config.veridex.expiryHours,
        allowedChains: config.veridex.allowedChains,
      },
      relayerUrl: config.veridex.relayerUrl,
      relayerApiKey: config.veridex.relayerApiKey,
      x402: {
        verifyBeforePay: config.mode === "live",
      },
      erc8004: {
        enabled: config.erc8004.enabled,
        testnet: config.erc8004.testnet,
        registryProvider: new ethers.JsonRpcProvider(config.erc8004.rpcUrl),
        minReputationScore: config.erc8004.minReputationScore,
      },
    } as Parameters<typeof createAgentWallet>[0]).catch((error) => {
      walletPromises.delete(cacheKey);
      throw error;
    });

    walletPromises.set(cacheKey, walletPromise);
  }

  return walletPromise;
}

export async function getEnterpriseAgentSnapshot(locator?: FrontierSessionLocator) {
  const wallet = await getEnterpriseAgentWallet(locator);

  if (!wallet) {
    return {
      available: false,
      session: null,
      identity: null,
    };
  }

  let identity: Awaited<ReturnType<typeof wallet.getIdentity>> | null = null;

  try {
    identity = await wallet.getIdentity();
  } catch {
    identity = null;
  }

  return {
    available: true,
    session: wallet.getSessionStatus(),
    identity,
  };
}

export interface EnterprisePremiumYieldResult {
  protocol: "x402";
  settled: true;
  merchant: string;
  paymentTxHash?: string;
  paymentExplorerUrl?: string;
  paymentBlockNumber?: number;
  paymentVerified?: boolean;
  live: boolean;
  proofLevel?: "verified_onchain" | "live_unverified" | "demo";
  proofSummary?: string;
  runtime?: unknown;
  data: Array<{
    asset: string;
    protocol: string;
    apy: string;
    riskScore: number;
    liquidity: string;
    trustScore: number;
  }>;
}

export async function fetchPremiumYieldWithEnterpriseAgent(
  request: Request,
  payload: {
    missionId?: string;
    objective?: string;
    sessionId?: string;
    credentialId?: string;
    passkeyKeyHash?: string;
    operatorWallet?: string;
  },
): Promise<EnterprisePremiumYieldResult> {
  const locator = resolveFrontierSessionLocator(request, payload);
  const config = getFrontierConfig();
  const readiness = getSponsorPathReadiness(config);

  if (!readiness.enterpriseAgentWalletReady) {
    throw new Error(
      `Enterprise agent wallet is not configured. Missing: ${readiness.missing.join(", ")}`,
    );
  }

  if (!readiness.x402Ready) {
    throw new Error(
      `Paid execution is not provable yet. Missing x402 prerequisites: ${readiness.missing.join(", ")}`,
    );
  }

  if (config.mode === "live" && !readiness.erc8004Ready) {
    throw new Error(
      `Live sponsor path requires ERC-8004 trust receipts before execution. Missing: ${readiness.missing.join(", ")}`,
    );
  }

  const wallet = await getEnterpriseAgentWallet(locator);
  if (!wallet) {
    throw new Error(
      "No authenticated passkey session could be resolved for enterprise agent wallet.",
    );
  }

  const origin = config.app.publicBaseUrl ?? getRequestOrigin(request);
  const target = new URL("/api/frontier/services/premium-yield", origin);
  const response = await wallet.fetch(target.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  const body = text ? (JSON.parse(text) as EnterprisePremiumYieldResult) : null;

  if (!response.ok || !body) {
    throw new Error(
      body && typeof body === "object" && "error" in body
        ? String((body as { error?: unknown }).error ?? "Enterprise paid fetch failed.")
        : `Enterprise paid fetch failed with status ${response.status}.`,
    );
  }

  return body;
}
