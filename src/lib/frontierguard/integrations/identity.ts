import {
  getERC8004Addresses,
  RegistrationFileManager,
  ReputationClient,
} from "@veridex/agentic-payments";
import { ethers } from "ethers";
import { fakeExplorerUrl, fakeTxHash, hashPayload } from "@/lib/frontierguard/server";
import {
  getFrontierConfig,
  getRequestOrigin,
} from "@/lib/frontierguard/integrations/config";
import { durationMsSince, getRequestContext } from "@/lib/frontierguard/observability";
import { pinArtifact } from "@/lib/frontierguard/integrations/storage";
import {
  persistAgentRegistration,
  persistAuditEvent,
  persistExternalOperation,
  persistFeedbackEvent,
  persistRuntimeError,
  persistToolInvocation,
} from "@/lib/frontierguard/repository";

const IDENTITY_REGISTRY_ABI = [
  "function register(string agentURI) returns (uint256)",
  "function register(string agentURI, tuple(string key, string value)[] metadata) returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
] as const;

const REPUTATION_REGISTRY_ABI = [
  "function giveFeedback(uint256 agentId, int128 value, uint8 valueDecimals, string tag1, string tag2)",
  "function giveFeedback(uint256 agentId, int128 value, uint8 valueDecimals, string tag1, string tag2, string endpointURI, string feedbackURI, bytes32 feedbackHash)",
] as const;

interface ServiceEndpoint {
  name: string;
  endpoint: string;
  version?: string;
  skills?: string[];
  domains?: string[];
}

interface AgentRegistrationFile {
  type: string;
  name: string;
  description: string;
  image?: string;
  services: ServiceEndpoint[];
  x402Support: boolean;
  active: boolean;
  registrations: Array<{
    agentId: number;
    agentRegistry: string;
  }>;
  supportedTrust?: string[];
}

interface FeedbackOptions {
  value: number;
  valueDecimals: number;
  tag1: string;
  tag2: string;
  endpointURI: string;
  feedbackURI: string;
  feedbackHash: string;
}

export interface RegisterFrontierAgentInput {
  missionId: string;
  agentName: string;
  operatorWallet: string;
  supportedTools: string[];
  origin?: string;
}

export interface RegisterFrontierAgentResult {
  agentId: string;
  onchainAgentId?: string;
  erc8004Identity: string;
  network: string;
  registry: string;
  registrationTxHash: string;
  explorerUrl: string;
  trustScore: number;
  registrationFile: AgentRegistrationFile;
  registrationFileUri: string;
  canonicalUAI: string;
  live: boolean;
}

function createServiceEndpoints(origin: string, supportedTools: string[]): ServiceEndpoint[] {
  return [
    {
      name: "web",
      endpoint: `${origin}/flows`,
      version: "1.0.0",
      skills: ["mission-control", "operator-console"],
      domains: ["frontend", "operations"],
    },
    {
      name: "x402",
      endpoint: `${origin}/api/frontier/services/premium-yield`,
      version: "2026-01",
      skills: supportedTools,
      domains: ["yield", "treasury", "risk"],
    },
    {
      name: "ucp",
      endpoint: `${origin}/.well-known/ucp`,
      version: "2026-01",
      skills: ["commerce", "checkout"],
    },
    {
      name: "acp",
      endpoint: `${origin}/.well-known/acp-checkout`,
      version: "2026-01",
      skills: ["cart", "checkout"],
    },
    {
      name: "ap2",
      endpoint: `${origin}/.well-known/ap2-mandate`,
      version: "2026-01",
      skills: ["mandate", "delegation"],
    },
  ];
}

function parseTransferTokenId(
  receipt: ethers.TransactionReceipt,
  contract: ethers.Contract,
): bigint | null {
  for (const log of receipt.logs) {
    try {
      const parsed = contract.interface.parseLog(log);
      if (parsed?.name === "Transfer") {
        return parsed.args.tokenId as bigint;
      }
    } catch {
      continue;
    }
  }

  return null;
}

async function registerOnChain(
  registrationFileUri: string,
  operatorWallet: string,
): Promise<{
  agentId: bigint;
  txHash: string;
  explorerUrl: string;
}> {
  const config = getFrontierConfig();

  if (!config.erc8004.enabled || !config.erc8004.privateKey) {
    throw new Error("ERC-8004 live registration is not configured.");
  }

  const provider = new ethers.JsonRpcProvider(config.erc8004.rpcUrl);
  const signer = new ethers.Wallet(config.erc8004.privateKey, provider);
  const addresses = getERC8004Addresses(config.erc8004.testnet);
  const contract = new ethers.Contract(addresses.identityRegistry, IDENTITY_REGISTRY_ABI, signer);
  const tx = await contract["register(string,tuple(string,string)[])"](
    registrationFileUri,
    [
      { key: "operator_wallet", value: operatorWallet },
      { key: "integration_mode", value: config.mode },
    ],
  );
  const receipt = await tx.wait();
  const agentId = receipt ? parseTransferTokenId(receipt, contract) : null;

  if (agentId == null) {
    throw new Error("ERC-8004 registration succeeded but the Transfer event was not found.");
  }

  return {
    agentId,
    txHash: tx.hash,
    explorerUrl: `${config.erc8004.explorerBaseUrl}/tx/${tx.hash}`,
  };
}

function createFallbackIdentity(seed: string, testnet: boolean): {
  agentId: string;
  onchainAgentId?: string;
  registrationTxHash: string;
  trustScore: number;
  explorerUrl: string;
  canonicalUAI: string;
} {
  const addresses = getERC8004Addresses(testnet);
  const agentId = `AGENT-${seed.slice(0, 8).toUpperCase()}`;
  const txHash = fakeTxHash({ scope: "erc8004-register", seed });

  return {
    agentId,
    registrationTxHash: txHash,
    trustScore: 96.2,
    explorerUrl: fakeExplorerUrl("tx", txHash),
    canonicalUAI: `eip155:${testnet ? "84532" : "8453"}:${addresses.identityRegistry}:${seed.slice(0, 8)}`,
  };
}

export async function registerFrontierAgent(
  request: Request,
  input: RegisterFrontierAgentInput,
): Promise<RegisterFrontierAgentResult> {
  const config = getFrontierConfig();
  const context = getRequestContext(request);
  const startedAt = Date.now();
  const origin = input.origin ?? getRequestOrigin(request);
  const addresses = getERC8004Addresses(config.erc8004.testnet);
  const services = createServiceEndpoints(origin, input.supportedTools);
  const registrationFile = RegistrationFileManager.buildRegistrationFile({
    name: input.agentName,
    description:
      "Portable trust, bounded autonomy, and verifiable execution for frontier-grade agent operations.",
    services,
    x402Support: true,
    supportedTrust: ["reputation", "crypto-economic"],
    metadata: [
      { key: "mission_id", value: input.missionId },
      { key: "operator_wallet", value: input.operatorWallet },
    ],
  });
  const pinnedRegistration = await pinArtifact(registrationFile, "agent-registration.json", {
    missionId: input.missionId,
    artifactType: "agent-registration",
    metadata: {
      operatorWallet: input.operatorWallet,
    },
  });
  const registrationFileUri = pinnedRegistration.uri;
  const seed = hashPayload({
    missionId: input.missionId,
    operatorWallet: input.operatorWallet,
    registrationFileUri,
  });

  try {
    if (config.mode === "demo") {
      throw new Error("Demo mode uses deterministic registration artifacts.");
    }

    const onchain = await registerOnChain(registrationFileUri, input.operatorWallet);
    const canonicalUAI = `eip155:${config.erc8004.testnet ? "84532" : "8453"}:${addresses.identityRegistry}:${onchain.agentId.toString()}`;

    const result = {
      agentId: onchain.agentId.toString(),
      onchainAgentId: onchain.agentId.toString(),
      erc8004Identity: canonicalUAI,
      network: config.erc8004.testnet ? "Base Sepolia" : "Base",
      registry: "ERC-8004 Identity Registry",
      registrationTxHash: onchain.txHash,
      explorerUrl: onchain.explorerUrl,
      trustScore: 96.2,
      registrationFile,
      registrationFileUri,
      canonicalUAI,
      live: true,
    };

    await persistAgentRegistration({
      missionId: input.missionId,
      agentId: result.agentId,
      onchainAgentId: result.onchainAgentId,
      erc8004Identity: result.erc8004Identity,
      registry: result.registry,
      network: result.network,
      registrationTxHash: result.registrationTxHash,
      explorerUrl: result.explorerUrl,
      registrationFileUri: result.registrationFileUri,
      canonicalUAI: result.canonicalUAI,
      live: result.live,
      payload: result.registrationFile,
    });

    await Promise.all([
      persistToolInvocation({
        missionId: input.missionId,
        operatorWallet: input.operatorWallet,
        toolName: "erc8004-identity",
        operation: "registerFrontierAgent",
        endpoint: result.explorerUrl,
        provider: "erc-8004",
        status: "success",
        requestPayload: {
          agentName: input.agentName,
          supportedTools: input.supportedTools,
        },
        responsePayload: {
          agentId: result.agentId,
          erc8004Identity: result.erc8004Identity,
        },
        live: result.live,
        durationMs: durationMsSince(startedAt),
      }),
      persistExternalOperation({
        missionId: input.missionId,
        operationType: "erc8004_registration",
        provider: "erc-8004",
        resource: input.agentName,
        network: result.network,
        uri: result.registrationFileUri,
        txHash: result.registrationTxHash,
        explorerUrl: result.explorerUrl,
        live: result.live,
        status: "success",
        requestPayload: registrationFile,
        responsePayload: result,
      }),
      persistAuditEvent({
        eventType: "identity_registered",
        action: "register_frontier_agent",
        source: "integration/identity",
        status: "success",
        requestId: context.requestId,
        correlationId: context.correlationId,
        missionId: input.missionId,
        operatorWallet: input.operatorWallet,
        actorType: "trust",
        resource: input.agentName,
        durationMs: durationMsSince(startedAt),
        metadata: {
          identity: result.erc8004Identity,
          live: result.live,
        },
      }),
    ]);

    return result;
  } catch (error) {
    if (config.mode === "live") {
      const message = error instanceof Error ? error.message : "ERC-8004 registration failed.";
      await Promise.all([
        persistToolInvocation({
          missionId: input.missionId,
          operatorWallet: input.operatorWallet,
          toolName: "erc8004-identity",
          operation: "registerFrontierAgent",
          provider: "erc-8004",
          status: "error",
          requestPayload: {
            agentName: input.agentName,
            supportedTools: input.supportedTools,
          },
          live: true,
          durationMs: durationMsSince(startedAt),
          errorMessage: message,
        }),
        persistRuntimeError({
          missionId: input.missionId,
          operatorWallet: input.operatorWallet,
          scope: "integration/identity:registerFrontierAgent",
          errorName: error instanceof Error ? error.name : "ERC8004RegistrationError",
          errorMessage: message,
          stackExcerpt: error instanceof Error ? error.stack?.split("\n").slice(0, 5).join("\n") : undefined,
          recoverable: true,
          detail: { agentName: input.agentName },
        }),
      ]);
      throw error;
    }

    const fallback = createFallbackIdentity(seed, config.erc8004.testnet);

    const result = {
      agentId: fallback.agentId,
      erc8004Identity: fallback.canonicalUAI,
      network: config.erc8004.testnet ? "Base Sepolia Demo" : "Base Demo",
      registry: "ERC-8004 Identity Registry",
      registrationTxHash: fallback.registrationTxHash,
      explorerUrl: fallback.explorerUrl,
      trustScore: fallback.trustScore,
      registrationFile,
      registrationFileUri,
      canonicalUAI: fallback.canonicalUAI,
      live: false,
    };

    await persistAgentRegistration({
      missionId: input.missionId,
      agentId: result.agentId,
      erc8004Identity: result.erc8004Identity,
      registry: result.registry,
      network: result.network,
      registrationTxHash: result.registrationTxHash,
      explorerUrl: result.explorerUrl,
      registrationFileUri: result.registrationFileUri,
      canonicalUAI: result.canonicalUAI,
      live: result.live,
      payload: result.registrationFile,
    });

    await Promise.all([
      persistToolInvocation({
        missionId: input.missionId,
        operatorWallet: input.operatorWallet,
        toolName: "erc8004-identity",
        operation: "registerFrontierAgent",
        endpoint: result.explorerUrl,
        provider: "erc-8004",
        status: "success",
        requestPayload: {
          agentName: input.agentName,
          supportedTools: input.supportedTools,
        },
        responsePayload: {
          agentId: result.agentId,
          erc8004Identity: result.erc8004Identity,
        },
        live: false,
        durationMs: durationMsSince(startedAt),
      }),
      persistExternalOperation({
        missionId: input.missionId,
        operationType: "erc8004_registration",
        provider: "erc-8004",
        resource: input.agentName,
        network: result.network,
        uri: result.registrationFileUri,
        txHash: result.registrationTxHash,
        explorerUrl: result.explorerUrl,
        live: false,
        status: "success",
        requestPayload: registrationFile,
        responsePayload: result,
      }),
      persistAuditEvent({
        eventType: "identity_registered",
        action: "register_frontier_agent",
        source: "integration/identity",
        status: "success",
        requestId: context.requestId,
        correlationId: context.correlationId,
        missionId: input.missionId,
        operatorWallet: input.operatorWallet,
        actorType: "trust",
        resource: input.agentName,
        durationMs: durationMsSince(startedAt),
        metadata: {
          identity: result.erc8004Identity,
          live: false,
          mode: "demo",
        },
      }),
    ]);

    return result;
  }
}

export async function buildWellKnownRegistration(request: Request) {
  const config = getFrontierConfig();
  const origin = getRequestOrigin(request);
  const addresses = getERC8004Addresses(config.erc8004.testnet);
  const registrationFile = RegistrationFileManager.buildRegistrationFile({
    name: config.app.agentName,
    description:
      "Veridex FrontierGuard agent registration with bounded mission execution and sponsor-aligned protocol support.",
    services: createServiceEndpoints(origin, ["Premium Yield API", "Receipt Compiler", "Risk Oracle"]),
    x402Support: true,
    supportedTrust: ["reputation", "crypto-economic"],
  });
  const registrationFileUri = RegistrationFileManager.buildDataURI(registrationFile);
  const canonicalUAI = `eip155:${config.erc8004.testnet ? "84532" : "8453"}:${addresses.identityRegistry}:1`;

  return RegistrationFileManager.buildWellKnownFile(
    1,
    canonicalUAI,
    registrationFileUri,
    config.erc8004.relayerUrl,
  );
}

export async function submitFrontierFeedback(input: {
  agentId?: string;
  rating: number;
  notes: string;
  missionId: string;
}): Promise<{
  txHash: string;
  explorerUrl: string;
  updatedScore: number;
  delta: number;
  live: boolean;
}> {
  const config = getFrontierConfig();
  const startedAt = Date.now();
  const numericAgentId =
    input.agentId && /^\d+$/.test(input.agentId) ? BigInt(input.agentId) : null;
  const feedbackDocument = {
    mission_id: input.missionId,
    rating: input.rating,
    notes: input.notes,
    submitted_at: new Date().toISOString(),
  };
  const pinnedFeedback = await pinArtifact(feedbackDocument, "reputation-feedback.json", {
    missionId: input.missionId,
    artifactType: "reputation-feedback",
    metadata: {
      agentId: input.agentId,
    },
  });

  try {
    if (config.mode === "demo" || !config.erc8004.enabled || !config.erc8004.privateKey || numericAgentId == null) {
      throw new Error("Using deterministic reputation feedback path.");
    }

    const provider = new ethers.JsonRpcProvider(config.erc8004.rpcUrl);
    const signer = new ethers.Wallet(config.erc8004.privateKey, provider);
    const addresses = getERC8004Addresses(config.erc8004.testnet);
    const contract = new ethers.Contract(addresses.reputationRegistry, REPUTATION_REGISTRY_ABI, signer);
    const normalizedScore = Math.round((input.rating / 5) * 10000);
    const options: FeedbackOptions = {
      value: normalizedScore,
      valueDecimals: 2,
      tag1: "frontierguard",
      tag2: "mission",
      endpointURI: "/api/frontier/services/premium-yield",
      feedbackURI: pinnedFeedback.uri,
      feedbackHash: `0x${hashPayload(feedbackDocument)}`,
    };

    const tx = await contract[
      "giveFeedback(uint256,int128,uint8,string,string,string,string,bytes32)"
    ](
      numericAgentId,
      BigInt(options.value),
      options.valueDecimals,
      options.tag1,
      options.tag2,
      options.endpointURI,
      options.feedbackURI,
      options.feedbackHash,
    );
    await tx.wait();

    const reputationClient = new ReputationClient(provider, signer, {
      testnet: config.erc8004.testnet,
    });
    const summary = await reputationClient.getSummary(numericAgentId, []);
    const updatedScore =
      summary.summaryValueDecimals > 0
        ? Number(summary.summaryValue) / 10 ** summary.summaryValueDecimals
        : Number(summary.summaryValue);

    const result = {
      txHash: tx.hash,
      explorerUrl: `${config.erc8004.explorerBaseUrl}/tx/${tx.hash}`,
      updatedScore: Number(updatedScore.toFixed(2)),
      delta: Number((input.rating - 4).toFixed(2)),
      live: true,
    };

    await persistFeedbackEvent({
      missionId: input.missionId,
      agentId: input.agentId,
      rating: input.rating,
      notes: input.notes,
      txHash: result.txHash,
      explorerUrl: result.explorerUrl,
      updatedScore: result.updatedScore,
      delta: result.delta,
      live: result.live,
      payload: feedbackDocument,
    });

    await Promise.all([
      persistToolInvocation({
        missionId: input.missionId,
        toolName: "erc8004-reputation",
        operation: "submitFrontierFeedback",
        endpoint: result.explorerUrl,
        provider: "erc-8004",
        status: "success",
        requestPayload: input,
        responsePayload: result,
        live: true,
        durationMs: durationMsSince(startedAt),
      }),
      persistExternalOperation({
        missionId: input.missionId,
        operationType: "erc8004_feedback",
        provider: "erc-8004",
        resource: input.agentId ?? "unknown-agent",
        network: config.erc8004.testnet ? "Base Sepolia" : "Base",
        uri: pinnedFeedback.uri,
        txHash: result.txHash,
        explorerUrl: result.explorerUrl,
        live: true,
        status: "success",
        requestPayload: feedbackDocument,
        responsePayload: result,
      }),
      persistAuditEvent({
        eventType: "feedback_submitted",
        action: "submit_frontier_feedback",
        source: "integration/identity",
        status: "success",
        missionId: input.missionId,
        actorType: "trust",
        actorId: input.agentId,
        resource: pinnedFeedback.uri,
        durationMs: durationMsSince(startedAt),
        metadata: {
          txHash: result.txHash,
          updatedScore: result.updatedScore,
          live: true,
        },
      }),
    ]);

    return result;
  } catch (error) {
    if (config.mode === "live") {
      const message = error instanceof Error ? error.message : "ERC-8004 feedback failed.";
      await Promise.all([
        persistToolInvocation({
          missionId: input.missionId,
          toolName: "erc8004-reputation",
          operation: "submitFrontierFeedback",
          provider: "erc-8004",
          status: "error",
          requestPayload: input,
          live: true,
          durationMs: durationMsSince(startedAt),
          errorMessage: message,
        }),
        persistRuntimeError({
          missionId: input.missionId,
          scope: "integration/identity:submitFrontierFeedback",
          errorName: error instanceof Error ? error.name : "ERC8004FeedbackError",
          errorMessage: message,
          stackExcerpt: error instanceof Error ? error.stack?.split("\n").slice(0, 5).join("\n") : undefined,
          recoverable: true,
          detail: { agentId: input.agentId },
        }),
      ]);
      throw error;
    }

    const txHash = fakeTxHash({ scope: "erc8004-feedback", input, feedback: pinnedFeedback.cid });
    const updatedScore = Number((92 + input.rating * 1.5).toFixed(2));

    const result = {
      txHash,
      explorerUrl: fakeExplorerUrl("tx", txHash),
      updatedScore,
      delta: Number((input.rating - 4).toFixed(2)),
      live: false,
    };

    await persistFeedbackEvent({
      missionId: input.missionId,
      agentId: input.agentId,
      rating: input.rating,
      notes: input.notes,
      txHash: result.txHash,
      explorerUrl: result.explorerUrl,
      updatedScore: result.updatedScore,
      delta: result.delta,
      live: result.live,
      payload: feedbackDocument,
    });

    await Promise.all([
      persistToolInvocation({
        missionId: input.missionId,
        toolName: "erc8004-reputation",
        operation: "submitFrontierFeedback",
        endpoint: result.explorerUrl,
        provider: "erc-8004",
        status: "success",
        requestPayload: input,
        responsePayload: result,
        live: false,
        durationMs: durationMsSince(startedAt),
      }),
      persistExternalOperation({
        missionId: input.missionId,
        operationType: "erc8004_feedback",
        provider: "erc-8004",
        resource: input.agentId ?? "unknown-agent",
        network: config.erc8004.testnet ? "Base Sepolia Demo" : "Base Demo",
        uri: pinnedFeedback.uri,
        txHash: result.txHash,
        explorerUrl: result.explorerUrl,
        live: false,
        status: "success",
        requestPayload: feedbackDocument,
        responsePayload: result,
      }),
      persistAuditEvent({
        eventType: "feedback_submitted",
        action: "submit_frontier_feedback",
        source: "integration/identity",
        status: "success",
        missionId: input.missionId,
        actorType: "trust",
        actorId: input.agentId,
        resource: pinnedFeedback.uri,
        durationMs: durationMsSince(startedAt),
        metadata: {
          txHash: result.txHash,
          updatedScore: result.updatedScore,
          live: false,
        },
      }),
    ]);

    return result;
  }
}
