import type { PasskeyCredential } from "@veridex/sdk";

export type IntegrationMode = "demo" | "hybrid" | "live";

export interface FrontierIntegrationConfig {
  mode: IntegrationMode;
  app: {
    agentName: string;
    operatorWallet: string;
    publicBaseUrl?: string;
  };
  paywall: {
    amountUsd: number;
    recipient: string;
    network: string;
    merchant: string;
    description: string;
    rpcUrl?: string;
    explorerBaseUrl?: string;
    facilitatorUrl?: string;
    fallbackFacilitatorUrl?: string;
  };
  veridex: {
    chain: "base";
    network: "testnet" | "mainnet";
    relayerUrl?: string;
    relayerApiKey?: string;
    masterCredential?: PasskeyCredential;
    allowedChains: number[];
    dailyLimitUsd: number;
    perTransactionLimitUsd: number;
    expiryHours: number;
  };
  erc8004: {
    enabled: boolean;
    testnet: boolean;
    rpcUrl: string;
    privateKey?: string;
    minReputationScore: number;
    explorerBaseUrl: string;
    relayerUrl?: string;
  };
  filecoin: {
    provider: "demo" | "pinata" | "storacha";
    gateway?: string;
    apiKey?: string;
    apiSecret?: string;
    jwt?: string;
    networkLabel: string;
  };
  storacha: {
    enabled: boolean;
    agentKey?: string;
    proof?: string;
    spaceDid?: string;
    networkLabel: string;
  };
  flow: {
    enabled: boolean;
    network: string;
    accessNode?: string;
    walletDiscovery?: string;
    evmRpcUrl?: string;
    evmChainId?: string;
    serviceAccountAddress?: string;
    serviceAccountPrivateKey?: string;
    serviceAccountKeyIndex?: number;
    schedulerContractAddress?: string;
    handlerContractAddress?: string;
  };
  starknet: {
    enabled: boolean;
    network: string;
    rpcUrl?: string;
    chainId?: string;
    accountAddress?: string;
    privateKey?: string;
    privateIntentContract?: string;
    explorerBaseUrl: string;
  };
  zama: {
    enabled: boolean;
    network: string;
    hostChainRpcUrl?: string;
    relayerUrl?: string;
    gatewayUrl?: string;
    aclContractAddress?: string;
    policyVaultContract?: string;
    executorContract?: string;
    signerPrivateKey?: string;
  };
}

function parseBoolean(value: string | undefined, fallback = false): boolean {
  if (value == null) {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

function parseNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseAllowedChains(value: string | undefined, fallback: number[]): number[] {
  if (!value) {
    return fallback;
  }

  const parsed = value
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item));

  return parsed.length > 0 ? parsed : fallback;
}

function normalizeMode(value: string | undefined): IntegrationMode {
  if (value === "live" || value === "hybrid" || value === "demo") {
    return value;
  }

  return "hybrid";
}

export function getFrontierConfig(): FrontierIntegrationConfig {
  const mode = normalizeMode(process.env.FRONTIER_MODE);
  const storachaEnabled =
    !!process.env.STORACHA_AGENT_KEY &&
    !!process.env.STORACHA_PROOF &&
    mode !== "demo";
  const pinataEnabled =
    !!process.env.FRONTIER_PINATA_GATEWAY &&
    !!process.env.FRONTIER_PINATA_API_KEY &&
    mode !== "demo";

  return {
    mode,
    app: {
      agentName: process.env.FRONTIER_AGENT_NAME ?? "Frontier Research Specialist",
      operatorWallet:
        process.env.FRONTIER_OPERATOR_WALLET ??
        process.env.FRONTIER_PAYWALL_RECIPIENT ??
        "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      publicBaseUrl: process.env.NEXT_PUBLIC_APP_URL,
    },
    paywall: {
      amountUsd: parseNumber(process.env.FRONTIER_PAYWALL_AMOUNT_USD, 4.2),
      recipient:
        process.env.FRONTIER_PAYWALL_RECIPIENT ??
        "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      network: process.env.FRONTIER_PAYWALL_NETWORK ?? "base-sepolia",
      merchant: process.env.FRONTIER_PAYWALL_MERCHANT ?? "Veridex Risk Oracle",
      description:
        process.env.FRONTIER_PAYWALL_DESCRIPTION ??
        "Premium yield and counterparty risk intelligence for bounded autonomous missions.",
      rpcUrl:
        process.env.FRONTIER_PAYWALL_RPC_URL ??
        process.env.FRONTIER_ERC8004_RPC_URL ??
        "https://sepolia.base.org",
      explorerBaseUrl:
        process.env.FRONTIER_PAYWALL_EXPLORER_BASE_URL ??
        process.env.FRONTIER_ERC8004_EXPLORER_BASE_URL ??
        "https://sepolia.basescan.org",
      facilitatorUrl: process.env.FRONTIER_FACILITATOR_URL,
      fallbackFacilitatorUrl: process.env.FRONTIER_FACILITATOR_FALLBACK_URL,
    },
    veridex: {
      chain: "base",
      network:
        process.env.FRONTIER_VERIDEX_NETWORK === "mainnet" ? "mainnet" : "testnet",
      relayerUrl: process.env.FRONTIER_RELAYER_URL,
      relayerApiKey: process.env.FRONTIER_RELAYER_API_KEY || undefined,
      masterCredential: undefined,
      allowedChains: parseAllowedChains(process.env.FRONTIER_ALLOWED_CHAINS, [10004]),
      dailyLimitUsd: parseNumber(process.env.FRONTIER_DAILY_LIMIT_USD, 50),
      perTransactionLimitUsd: parseNumber(process.env.FRONTIER_PER_TX_LIMIT_USD, 10),
      expiryHours: parseNumber(process.env.FRONTIER_EXPIRY_HOURS, 24),
    },
    erc8004: {
      enabled:
        parseBoolean(process.env.FRONTIER_ERC8004_ENABLED, false) ||
        (!!process.env.FRONTIER_ERC8004_PRIVATE_KEY && mode !== "demo"),
      testnet: parseBoolean(process.env.FRONTIER_ERC8004_TESTNET, true),
      rpcUrl:
        process.env.FRONTIER_ERC8004_RPC_URL ??
        "https://sepolia.base.org",
      privateKey: process.env.FRONTIER_ERC8004_PRIVATE_KEY || undefined,
      minReputationScore: parseNumber(process.env.FRONTIER_MIN_REPUTATION_SCORE, 85),
      explorerBaseUrl:
        process.env.FRONTIER_ERC8004_EXPLORER_BASE_URL ??
        "https://sepolia.basescan.org",
      relayerUrl: process.env.FRONTIER_ERC8004_RELAYER_URL,
    },
    filecoin: {
      provider: pinataEnabled ? "pinata" : storachaEnabled ? "storacha" : "demo",
      gateway: process.env.FRONTIER_PINATA_GATEWAY,
      apiKey: process.env.FRONTIER_PINATA_API_KEY,
      apiSecret: process.env.FRONTIER_PINATA_API_SECRET,
      jwt: process.env.FRONTIER_PINATA_JWT,
      networkLabel: pinataEnabled
        ? "Pinata IPFS Pinning"
        : storachaEnabled
          ? "Storacha Filecoin Pipeline"
          : "Filecoin Calibration Demo",
    },
    storacha: {
      enabled: storachaEnabled,
      agentKey: process.env.STORACHA_AGENT_KEY,
      proof: process.env.STORACHA_PROOF,
      spaceDid: process.env.STORACHA_SPACE_DID,
      networkLabel: storachaEnabled ? "Storacha UCAN Space" : "Storacha Demo",
    },
    flow: {
      enabled: parseBoolean(process.env.FRONTIER_FLOW_ENABLED, false),
      network: process.env.NEXT_PUBLIC_FLOW_NETWORK ?? "testnet",
      accessNode: process.env.NEXT_PUBLIC_FLOW_FCL_ACCESS_NODE,
      walletDiscovery: process.env.NEXT_PUBLIC_FLOW_WALLET_DISCOVERY,
      evmRpcUrl: process.env.NEXT_PUBLIC_FLOW_EVM_RPC_URL,
      evmChainId: process.env.NEXT_PUBLIC_FLOW_EVM_CHAIN_ID,
      serviceAccountAddress: process.env.FRONTIER_FLOW_SERVICE_ACCOUNT_ADDRESS,
      serviceAccountPrivateKey: process.env.FRONTIER_FLOW_SERVICE_ACCOUNT_PRIVATE_KEY,
      serviceAccountKeyIndex: process.env.FRONTIER_FLOW_SERVICE_ACCOUNT_KEY_INDEX
        ? Number(process.env.FRONTIER_FLOW_SERVICE_ACCOUNT_KEY_INDEX)
        : undefined,
      schedulerContractAddress: process.env.FRONTIER_FLOW_SCHEDULER_CONTRACT_ADDRESS,
      handlerContractAddress: process.env.FRONTIER_FLOW_TRANSACTION_HANDLER_ADDRESS,
    },
    starknet: {
      enabled: parseBoolean(process.env.FRONTIER_STARKNET_ENABLED, false),
      network: process.env.NEXT_PUBLIC_STARKNET_NETWORK ?? "sepolia",
      rpcUrl: process.env.NEXT_PUBLIC_STARKNET_RPC_URL,
      chainId: process.env.NEXT_PUBLIC_STARKNET_CHAIN_ID,
      accountAddress: process.env.FRONTIER_STARKNET_ACCOUNT_ADDRESS,
      privateKey: process.env.FRONTIER_STARKNET_PRIVATE_KEY,
      privateIntentContract: process.env.FRONTIER_STARKNET_PRIVATE_INTENT_CONTRACT,
      explorerBaseUrl:
        process.env.FRONTIER_STARKNET_EXPLORER_BASE_URL ?? "https://sepolia.starkscan.co",
    },
    zama: {
      enabled: parseBoolean(process.env.FRONTIER_ZAMA_ENABLED, false),
      network: process.env.NEXT_PUBLIC_ZAMA_NETWORK ?? "sepolia",
      hostChainRpcUrl: process.env.NEXT_PUBLIC_ZAMA_HOST_CHAIN_RPC_URL,
      relayerUrl: process.env.FRONTIER_ZAMA_RELAYER_URL,
      gatewayUrl: process.env.FRONTIER_ZAMA_GATEWAY_URL,
      aclContractAddress: process.env.FRONTIER_ZAMA_ACL_CONTRACT_ADDRESS,
      policyVaultContract: process.env.FRONTIER_ZAMA_POLICY_VAULT_CONTRACT,
      executorContract: process.env.FRONTIER_ZAMA_EXECUTOR_CONTRACT,
      signerPrivateKey: process.env.FRONTIER_ZAMA_SIGNER_PRIVATE_KEY,
    },
  };
}

export function getRequestOrigin(request: Request): string {
  const url = new URL(request.url);
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");

  if (forwardedHost) {
    return `${forwardedProto ?? url.protocol.replace(":", "")}://${forwardedHost}`;
  }

  return url.origin;
}

export function hasEnterpriseAgentCredential(config = getFrontierConfig()): boolean {
  return config.veridex.masterCredential != null;
}

export interface SponsorPathReadiness {
  liveMode: boolean;
  enterpriseAgentWalletReady: boolean;
  x402Ready: boolean;
  erc8004Ready: boolean;
  starknetReady: boolean;
  coreProofReady: boolean;
  liveProofReady: boolean;
  fullyReady: boolean;
  missing: string[];
}

export function getSponsorPathReadiness(
  config = getFrontierConfig(),
): SponsorPathReadiness {
  const missing: string[] = [];
  const hasRelayer = Boolean(config.veridex.relayerUrl);
  const hasDedicatedErc8004Signer = Boolean(config.erc8004.privateKey);
  const enterpriseAgentWalletReady = hasRelayer;
  const hasFacilitator = Boolean(
    config.paywall.facilitatorUrl || config.paywall.fallbackFacilitatorUrl,
  );

  if (!hasRelayer) {
    missing.push("FRONTIER_RELAYER_URL");
  }

  const x402Ready =
    enterpriseAgentWalletReady &&
    hasFacilitator &&
    Boolean(config.paywall.recipient) &&
    Boolean(config.paywall.rpcUrl) &&
    Boolean(config.paywall.explorerBaseUrl);

  if (!hasFacilitator) {
    missing.push("FRONTIER_FACILITATOR_URL");
  }

  if (!config.paywall.rpcUrl) {
    missing.push("FRONTIER_PAYWALL_RPC_URL");
  }

  const erc8004Ready =
    config.erc8004.enabled &&
    (hasDedicatedErc8004Signer || enterpriseAgentWalletReady) &&
    Boolean(config.erc8004.rpcUrl);

  if (config.mode === "live" && !erc8004Ready) {
    if (!config.erc8004.enabled) {
      missing.push("FRONTIER_ERC8004_ENABLED");
    }
    if (!hasDedicatedErc8004Signer && !enterpriseAgentWalletReady) {
      missing.push("FRONTIER_ERC8004_PRIVATE_KEY or authenticated enterprise session");
    }
  }

  const coreProofReady =
    enterpriseAgentWalletReady &&
    x402Ready &&
    erc8004Ready;
  const liveProofReady = config.mode === "live" ? coreProofReady : true;

  const starknetReady =
    config.starknet.enabled &&
    Boolean(config.starknet.rpcUrl) &&
    Boolean(config.starknet.accountAddress) &&
    Boolean(config.starknet.privateKey) &&
    Boolean(config.starknet.privateIntentContract);

  if (config.mode === "live" && !starknetReady) {
    if (!config.starknet.rpcUrl) {
      missing.push("NEXT_PUBLIC_STARKNET_RPC_URL");
    }
    if (!config.starknet.accountAddress) {
      missing.push("FRONTIER_STARKNET_ACCOUNT_ADDRESS");
    }
    if (!config.starknet.privateKey) {
      missing.push("FRONTIER_STARKNET_PRIVATE_KEY");
    }
    if (!config.starknet.privateIntentContract) {
      missing.push("FRONTIER_STARKNET_PRIVATE_INTENT_CONTRACT");
    }
  }

  return {
    liveMode: config.mode === "live",
    enterpriseAgentWalletReady,
    x402Ready,
    erc8004Ready,
    starknetReady,
    coreProofReady,
    liveProofReady,
    fullyReady: coreProofReady && starknetReady,
    missing,
  };
}
