import { createAgentWallet, SessionKeyManager } from "@veridex/agentic-payments";
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
const ERC20_BALANCE_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
] as const;
const MIN_NATIVE_BALANCE_FOR_WRITE = ethers.parseEther("0.0001");

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

  if (!masterCredential || !config.veridex.relayerUrl) {
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
      relayerApiKey: config.veridex.relayerApiKey || undefined,
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

export async function getEnterpriseAgentSigner(
  locator?: FrontierSessionLocator,
): Promise<ethers.Wallet | null> {
  const masterCredential = await resolveEnterpriseMasterCredential(locator);
  if (!masterCredential) {
    return null;
  }

  const wallet = await getEnterpriseAgentWallet(locator);
  if (!wallet) {
    return null;
  }

  const sessionStatus = wallet.getSessionStatus();
  const sessionManager = new SessionKeyManager();
  const storedSession = await sessionManager.loadSession(sessionStatus.keyHash);

  if (!storedSession) {
    return null;
  }

  return sessionManager.getSessionWallet(
    storedSession,
    masterCredential.credentialId,
  );
}

function paywallAssetForNetwork(network: string): string {
  switch (network.toLowerCase()) {
    case "base-sepolia":
      return "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
    case "base-mainnet":
    case "base":
      return "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
    case "ethereum-sepolia":
      return "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
    case "ethereum-mainnet":
    case "ethereum":
      return "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    default:
      return "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
  }
}

export interface EnterpriseRuntimeHealth {
  available: boolean;
  signerSource: "session_wallet" | "erc8004_private_key" | "unavailable";
  walletAddress?: string | null;
  paywallNetwork: string;
  paywallAsset: string;
  paywallAmountUsd: number;
  nativeBalanceWei?: string;
  nativeBalanceFormatted?: string;
  assetBalanceRaw?: string;
  assetBalanceFormatted?: string;
  assetSymbol?: string;
  x402Ready: boolean;
  erc8004Ready: boolean;
  livePaymentReady: boolean;
  liveWriteReady: boolean;
  warnings: string[];
}

export async function getEnterpriseRuntimeHealth(
  locator?: FrontierSessionLocator,
): Promise<EnterpriseRuntimeHealth> {
  const config = getFrontierConfig();
  const readiness = getSponsorPathReadiness(config);
  const warnings: string[] = [];
  const paywallAsset = paywallAssetForNetwork(config.paywall.network);

  let signerSource: EnterpriseRuntimeHealth["signerSource"] = "unavailable";
  let signer: ethers.Wallet | null = null;

  if (config.erc8004.privateKey) {
    signerSource = "erc8004_private_key";
    signer = new ethers.Wallet(config.erc8004.privateKey);
  } else {
    signer = await getEnterpriseAgentSigner(locator);
    if (signer) {
      signerSource = "session_wallet";
    }
  }

  if (!signer) {
    if (!readiness.enterpriseAgentWalletReady) {
      warnings.push("Enterprise runtime wallet is not configured.");
    }
    if (!config.erc8004.privateKey) {
      warnings.push("No dedicated ERC-8004 signer or authenticated enterprise session is available.");
    }

    return {
      available: false,
      signerSource,
      walletAddress: null,
      paywallNetwork: config.paywall.network,
      paywallAsset,
      paywallAmountUsd: config.paywall.amountUsd,
      x402Ready: readiness.x402Ready,
      erc8004Ready: readiness.erc8004Ready,
      livePaymentReady: false,
      liveWriteReady: false,
      warnings,
    };
  }

  const rpcUrl = config.paywall.rpcUrl ?? config.erc8004.rpcUrl;
  if (!rpcUrl) {
    warnings.push("No Base Sepolia RPC is configured for runtime health checks.");
    return {
      available: true,
      signerSource,
      walletAddress: signer.address,
      paywallNetwork: config.paywall.network,
      paywallAsset,
      paywallAmountUsd: config.paywall.amountUsd,
      x402Ready: readiness.x402Ready,
      erc8004Ready: readiness.erc8004Ready,
      livePaymentReady: false,
      liveWriteReady: false,
      warnings,
    };
  }

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const connectedSigner = signer.connect(provider);
    const [nativeBalance, assetDecimals, assetSymbol, assetBalance] = await Promise.all([
      provider.getBalance(connectedSigner.address),
      new ethers.Contract(paywallAsset, ERC20_BALANCE_ABI, provider).decimals(),
      new ethers.Contract(paywallAsset, ERC20_BALANCE_ABI, provider)
        .symbol()
        .catch(() => "USDC"),
      new ethers.Contract(paywallAsset, ERC20_BALANCE_ABI, provider).balanceOf(
        connectedSigner.address,
      ),
    ]);
    const paymentRequirement = BigInt(Math.round(config.paywall.amountUsd * 1_000_000));
    const liveWriteReady = nativeBalance >= MIN_NATIVE_BALANCE_FOR_WRITE;
    const livePaymentReady = assetBalance >= paymentRequirement;

    if (!liveWriteReady) {
      warnings.push("Wallet does not have enough native gas for an ERC-8004 write.");
    }

    if (!livePaymentReady) {
      warnings.push("Wallet does not have enough paywall asset balance for the live x402 payment.");
    }

    return {
      available: true,
      signerSource,
      walletAddress: connectedSigner.address,
      paywallNetwork: config.paywall.network,
      paywallAsset,
      paywallAmountUsd: config.paywall.amountUsd,
      nativeBalanceWei: nativeBalance.toString(),
      nativeBalanceFormatted: Number(ethers.formatEther(nativeBalance)).toFixed(6),
      assetBalanceRaw: assetBalance.toString(),
      assetBalanceFormatted: Number(
        ethers.formatUnits(assetBalance, Number(assetDecimals)),
      ).toFixed(6),
      assetSymbol,
      x402Ready: readiness.x402Ready,
      erc8004Ready: readiness.erc8004Ready,
      livePaymentReady,
      liveWriteReady,
      warnings,
    };
  } catch (error) {
    warnings.push(
      error instanceof Error
        ? error.message
        : "Unable to query runtime balances from the configured RPC.",
    );

    return {
      available: true,
      signerSource,
      walletAddress: signer.address,
      paywallNetwork: config.paywall.network,
      paywallAsset,
      paywallAmountUsd: config.paywall.amountUsd,
      x402Ready: readiness.x402Ready,
      erc8004Ready: readiness.erc8004Ready,
      livePaymentReady: false,
      liveWriteReady: false,
      warnings,
    };
  }
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

  if (config.mode === "live") {
    const health = await getEnterpriseRuntimeHealth(locator);
    if (!health.livePaymentReady) {
      throw new Error(
        health.warnings[0] ??
          "Live x402 payment path is not funded for the configured paywall asset.",
      );
    }
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
