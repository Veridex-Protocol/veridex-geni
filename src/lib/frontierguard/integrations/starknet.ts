import { Account, CallData, RpcProvider, hash, num } from "starknet";
import { fakeTxHash, hashPayload } from "@/lib/frontierguard/server";
import { getFrontierConfig } from "@/lib/frontierguard/integrations/config";
import { durationMsSince } from "@/lib/frontierguard/observability";
import {
  persistAuditEvent,
  persistChainTransaction,
  persistExecutionRail,
  persistRuntimeError,
  persistStarknetPrivateIntent,
  persistToolInvocation,
} from "@/lib/frontierguard/repository";

export interface CreatePrivateIntentInput {
  missionId: string;
  label: string;
  objective: string;
  revealWindowHours: number;
  operatorWallet: string;
}

export interface PrivateIntentResult {
  commitmentHash: string;
  nullifier: string;
  txHash: string;
  explorerUrl?: string;
  network: string;
  status: "committed";
  live: boolean;
  blockNumber?: number;
  commitmentVerified?: boolean;
}

export interface PrivateIntentRevealResult {
  revealHash: string;
  revealTxHash: string;
  explorerUrl?: string;
  network: string;
  status: "revealed";
  live: boolean;
  blockNumber?: number;
}

function starknetExplorerUrl(baseUrl: string, txHash: string): string {
  return `${baseUrl.replace(/\/$/, "")}/tx/${txHash}`;
}

function missionIdToFelt(missionId: string): string {
  return num.toHex(hash.starknetKeccak(missionId));
}

function normalizeHex(value: string | bigint | number): string {
  if (typeof value === "bigint") {
    return num.toHex(value).toLowerCase();
  }

  if (typeof value === "number") {
    return `0x${value.toString(16)}`.toLowerCase();
  }

  if (value.startsWith("0x")) {
    return value.toLowerCase();
  }

  return `0x${value}`.toLowerCase();
}

function buildCommitmentHash(input: CreatePrivateIntentInput): string {
  return normalizeHex(
    hash.starknetKeccak(
      JSON.stringify({
        missionId: input.missionId,
        label: input.label,
        objective: input.objective,
        revealWindowHours: input.revealWindowHours,
        operatorWallet: input.operatorWallet.toLowerCase(),
      }),
    ),
  );
}

function buildNullifier(input: {
  missionId: string;
  commitmentHash: string;
}): string {
  return normalizeHex(
    hash.starknetKeccak(
      JSON.stringify({
        missionId: input.missionId,
        scope: "nullifier",
        commitmentHash: input.commitmentHash,
      }),
    ),
  );
}

function buildRevealHash(input: {
  missionId: string;
  commitmentHash: string;
  nullifier: string;
}): string {
  return normalizeHex(
    hash.starknetKeccak(
      JSON.stringify({
        missionId: input.missionId,
        scope: "reveal",
        commitmentHash: input.commitmentHash,
        nullifier: input.nullifier,
      }),
    ),
  );
}

function getLiveStarknetClient() {
  const config = getFrontierConfig();

  if (
    !config.starknet.enabled ||
    !config.starknet.rpcUrl ||
    !config.starknet.accountAddress ||
    !config.starknet.privateKey ||
    !config.starknet.privateIntentContract
  ) {
    throw new Error(
      "Starknet live execution is not configured. Set NEXT_PUBLIC_STARKNET_RPC_URL, FRONTIER_STARKNET_ACCOUNT_ADDRESS, FRONTIER_STARKNET_PRIVATE_KEY, and FRONTIER_STARKNET_PRIVATE_INTENT_CONTRACT.",
    );
  }

  const provider = new RpcProvider({
    nodeUrl: config.starknet.rpcUrl,
  });
  const account = new Account(
    provider,
    config.starknet.accountAddress,
    config.starknet.privateKey,
  );

  return {
    provider,
    account,
    contractAddress: config.starknet.privateIntentContract,
    config,
  };
}

function extractResultFelt(result: unknown): string | undefined {
  if (Array.isArray(result) && result.length > 0) {
    return normalizeHex(String(result[0]));
  }

  if (result && typeof result === "object") {
    const value = result as {
      result?: unknown[];
      [key: string]: unknown;
    };

    if (Array.isArray(value.result) && value.result.length > 0) {
      return normalizeHex(String(value.result[0]));
    }

    const first = Object.values(value).find(
      (entry) => typeof entry === "string" || typeof entry === "bigint",
    );
    if (typeof first === "string" || typeof first === "bigint") {
      return normalizeHex(first);
    }
  }

  return undefined;
}

async function getStoredCommitment(
  provider: RpcProvider,
  contractAddress: string,
  missionFelt: string,
): Promise<string | undefined> {
  const response = await provider.callContract({
    contractAddress,
    entrypoint: "get_commitment",
    calldata: CallData.compile({
      mission_id: missionFelt,
    }),
  });

  return extractResultFelt(response);
}

async function waitForConfirmedReceipt(provider: RpcProvider, txHash: string) {
  await provider.waitForTransaction(txHash);
  const receipt = await provider.getTransactionReceipt(txHash);
  const blockNumber =
    typeof (receipt as { block_number?: number }).block_number === "number"
      ? (receipt as { block_number?: number }).block_number
      : typeof (receipt as { blockNumber?: number }).blockNumber === "number"
        ? (receipt as { blockNumber?: number }).blockNumber
        : undefined;

  return {
    receipt,
    blockNumber,
  };
}

export async function createPrivateIntent(
  input: CreatePrivateIntentInput,
): Promise<PrivateIntentResult> {
  const config = getFrontierConfig();
  const startedAt = Date.now();
  const live =
    config.starknet.enabled &&
    Boolean(config.starknet.rpcUrl) &&
    Boolean(config.starknet.accountAddress) &&
    Boolean(config.starknet.privateIntentContract) &&
    config.mode !== "demo";

  try {
    const commitmentHash = buildCommitmentHash(input);
    const nullifier = buildNullifier({
      missionId: input.missionId,
      commitmentHash,
    });

    if (live) {
      const { provider, account, contractAddress, config: liveConfig } =
        getLiveStarknetClient();
      const missionFelt = missionIdToFelt(input.missionId);
      const invoke = await account.execute({
        contractAddress,
        entrypoint: "commit_intent",
        calldata: CallData.compile({
          mission_id: missionFelt,
          commitment: commitmentHash,
          reveal_window_hours: input.revealWindowHours,
        }),
      });
      const txHash = invoke.transaction_hash;
      const { blockNumber } = await waitForConfirmedReceipt(provider, txHash);
      const storedCommitment = await getStoredCommitment(
        provider,
        contractAddress,
        missionFelt,
      );
      const commitmentVerified =
        storedCommitment != null &&
        normalizeHex(storedCommitment) === normalizeHex(commitmentHash);

      if (!commitmentVerified && config.mode === "live") {
        throw new Error(
          "Starknet commitment transaction settled but the on-chain commitment did not match the expected value.",
        );
      }

      const result: PrivateIntentResult = {
        commitmentHash,
        nullifier,
        txHash,
        explorerUrl: starknetExplorerUrl(liveConfig.starknet.explorerBaseUrl, txHash),
        network: liveConfig.starknet.network,
        status: "committed",
        live: true,
        blockNumber,
        commitmentVerified,
      };

      await Promise.all([
        persistExecutionRail({
          missionId: input.missionId,
          rail: "private",
          status: "committed",
          selectorLabel: "Private",
          live: true,
          metadata: {
            commitmentHash: result.commitmentHash,
            commitmentVerified,
            network: result.network,
            blockNumber,
          },
        }),
        persistStarknetPrivateIntent({
          missionId: input.missionId,
          label: input.label,
          commitmentHash: result.commitmentHash,
          nullifier: result.nullifier,
          revealWindowHours: input.revealWindowHours,
          status: result.status,
          txHash: result.txHash,
          explorerUrl: result.explorerUrl,
          network: result.network,
          live: true,
          payload: {
            objective: input.objective,
            blockNumber,
            commitmentVerified,
          },
        }),
        persistChainTransaction({
          missionId: input.missionId,
          rail: "private",
          chain: "Starknet",
          network: result.network,
          action: "commit_private_intent",
          status: "confirmed",
          txHash: result.txHash,
          explorerUrl: result.explorerUrl,
          live: true,
          metadata: {
            commitmentHash: result.commitmentHash,
            nullifier: result.nullifier,
            blockNumber,
            commitmentVerified,
          },
        }),
        persistToolInvocation({
          missionId: input.missionId,
          operatorWallet: input.operatorWallet,
          toolName: "starknet-private-intent",
          operation: "createPrivateIntent",
          provider: "starknet",
          status: "success",
          requestPayload: input,
          responsePayload: result,
          live: true,
          durationMs: durationMsSince(startedAt),
        }),
        persistAuditEvent({
          eventType: "starknet_private_intent",
          action: "commit_private_intent",
          source: "integration/starknet",
          status: "success",
          missionId: input.missionId,
          operatorWallet: input.operatorWallet,
          actorType: "system",
          resource: input.label,
          durationMs: durationMsSince(startedAt),
          metadata: {
            commitmentHash: result.commitmentHash,
            live: true,
            blockNumber,
            commitmentVerified,
          },
        }),
      ]);

      return result;
    }

    throw new Error("Using deterministic Starknet intent path.");
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create Starknet private intent.";

    await Promise.all([
      persistToolInvocation({
        missionId: input.missionId,
        operatorWallet: input.operatorWallet,
        toolName: "starknet-private-intent",
        operation: "createPrivateIntent",
        provider: "starknet",
        status: config.mode === "live" ? "error" : "success",
        requestPayload: input,
        live,
        durationMs: durationMsSince(startedAt),
        errorMessage: config.mode === "live" ? message : undefined,
      }),
      persistRuntimeError({
        missionId: input.missionId,
        operatorWallet: input.operatorWallet,
        scope: "integration/starknet:createPrivateIntent",
        errorName:
          error instanceof Error ? error.name : "StarknetPrivateIntentError",
        errorMessage: message,
        stackExcerpt:
          error instanceof Error
            ? error.stack?.split("\n").slice(0, 5).join("\n")
            : undefined,
        recoverable: true,
        detail: { ...input },
      }),
    ]);

    if (config.mode === "live") {
      throw error;
    }

    const seed = hashPayload(input);
    const txHash = fakeTxHash({ scope: "starknet-intent", seed, live: false });
    const fallback: PrivateIntentResult = {
      commitmentHash: buildCommitmentHash(input),
      nullifier: buildNullifier({
        missionId: input.missionId,
        commitmentHash: buildCommitmentHash(input),
      }),
      txHash,
      explorerUrl: starknetExplorerUrl(config.starknet.explorerBaseUrl, txHash),
      network: config.starknet.network,
      status: "committed",
      live: false,
      commitmentVerified: false,
    };

    await Promise.all([
      persistExecutionRail({
        missionId: input.missionId,
        rail: "private",
        status: "committed",
        selectorLabel: "Private",
        live: false,
        metadata: {
          commitmentHash: fallback.commitmentHash,
          network: fallback.network,
        },
      }),
      persistStarknetPrivateIntent({
        missionId: input.missionId,
        label: input.label,
        commitmentHash: fallback.commitmentHash,
        nullifier: fallback.nullifier,
        revealWindowHours: input.revealWindowHours,
        status: fallback.status,
        txHash: fallback.txHash,
        explorerUrl: fallback.explorerUrl,
        network: fallback.network,
        live: false,
        payload: {
          objective: input.objective,
          fallbackReason: message,
        },
      }),
      persistChainTransaction({
        missionId: input.missionId,
        rail: "private",
        chain: "Starknet",
        network: fallback.network,
        action: "commit_private_intent",
        status: "confirmed",
        txHash: fallback.txHash,
        explorerUrl: fallback.explorerUrl,
        live: false,
        metadata: {
          commitmentHash: fallback.commitmentHash,
          fallback: true,
        },
      }),
      persistAuditEvent({
        eventType: "starknet_private_intent",
        action: "commit_private_intent",
        source: "integration/starknet",
        status: "success",
        missionId: input.missionId,
        operatorWallet: input.operatorWallet,
        actorType: "system",
        resource: input.label,
        durationMs: durationMsSince(startedAt),
        metadata: {
          commitmentHash: fallback.commitmentHash,
          live: false,
          fallback: true,
        },
      }),
    ]);

    return fallback;
  }
}

export async function revealPrivateIntent(input: {
  missionId: string;
  label: string;
  operatorWallet: string;
  commitmentHash: string;
  nullifier?: string;
}): Promise<PrivateIntentRevealResult> {
  const config = getFrontierConfig();
  const startedAt = Date.now();
  const live =
    config.starknet.enabled &&
    Boolean(config.starknet.rpcUrl) &&
    Boolean(config.starknet.accountAddress) &&
    Boolean(config.starknet.privateIntentContract) &&
    config.mode !== "demo";

  try {
    const nullifier =
      input.nullifier ??
      buildNullifier({
        missionId: input.missionId,
        commitmentHash: input.commitmentHash,
      });
    const revealHash = buildRevealHash({
      missionId: input.missionId,
      commitmentHash: input.commitmentHash,
      nullifier,
    });

    if (live) {
      const { provider, account, contractAddress, config: liveConfig } =
        getLiveStarknetClient();
      const missionFelt = missionIdToFelt(input.missionId);
      const invoke = await account.execute({
        contractAddress,
        entrypoint: "reveal_intent",
        calldata: CallData.compile({
          mission_id: missionFelt,
          reveal_hash: revealHash,
        }),
      });
      const txHash = invoke.transaction_hash;
      const { blockNumber } = await waitForConfirmedReceipt(provider, txHash);
      const result: PrivateIntentRevealResult = {
        revealHash,
        revealTxHash: txHash,
        explorerUrl: starknetExplorerUrl(liveConfig.starknet.explorerBaseUrl, txHash),
        network: liveConfig.starknet.network,
        status: "revealed",
        live: true,
        blockNumber,
      };

      await Promise.all([
        persistExecutionRail({
          missionId: input.missionId,
          rail: "private",
          status: "verified",
          selectorLabel: "Private",
          live: true,
          metadata: {
            revealHash,
            revealTxHash: txHash,
            blockNumber,
          },
        }),
        persistStarknetPrivateIntent({
          missionId: input.missionId,
          label: input.label,
          commitmentHash: input.commitmentHash,
          nullifier,
          revealWindowHours: 0,
          status: "revealed",
          revealTxHash: result.revealTxHash,
          explorerUrl: result.explorerUrl,
          network: result.network,
          live: true,
          payload: {
            revealHash,
            blockNumber,
          },
        }),
        persistChainTransaction({
          missionId: input.missionId,
          rail: "private",
          chain: "Starknet",
          network: result.network,
          action: "reveal_private_intent",
          status: "revealed",
          txHash: result.revealTxHash,
          explorerUrl: result.explorerUrl,
          live: true,
          metadata: {
            commitmentHash: input.commitmentHash,
            nullifier,
            revealHash,
            blockNumber,
          },
        }),
        persistToolInvocation({
          missionId: input.missionId,
          operatorWallet: input.operatorWallet,
          toolName: "starknet-private-intent",
          operation: "revealPrivateIntent",
          provider: "starknet",
          status: "success",
          requestPayload: input,
          responsePayload: result,
          live: true,
          durationMs: durationMsSince(startedAt),
        }),
        persistAuditEvent({
          eventType: "starknet_private_intent",
          action: "reveal_private_intent",
          source: "integration/starknet",
          status: "success",
          missionId: input.missionId,
          operatorWallet: input.operatorWallet,
          actorType: "system",
          resource: input.label,
          durationMs: durationMsSince(startedAt),
          metadata: {
            revealHash,
            live: true,
            blockNumber,
          },
        }),
      ]);

      return result;
    }

    throw new Error("Using deterministic Starknet reveal path.");
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to reveal Starknet private intent.";

    await Promise.all([
      persistToolInvocation({
        missionId: input.missionId,
        operatorWallet: input.operatorWallet,
        toolName: "starknet-private-intent",
        operation: "revealPrivateIntent",
        provider: "starknet",
        status: config.mode === "live" ? "error" : "success",
        requestPayload: input,
        live,
        durationMs: durationMsSince(startedAt),
        errorMessage: config.mode === "live" ? message : undefined,
      }),
      persistRuntimeError({
        missionId: input.missionId,
        operatorWallet: input.operatorWallet,
        scope: "integration/starknet:revealPrivateIntent",
        errorName:
          error instanceof Error
            ? error.name
            : "StarknetPrivateIntentRevealError",
        errorMessage: message,
        stackExcerpt:
          error instanceof Error
            ? error.stack?.split("\n").slice(0, 5).join("\n")
            : undefined,
        recoverable: true,
        detail: { ...input },
      }),
    ]);

    if (config.mode === "live") {
      throw error;
    }

    const revealHash = buildRevealHash({
      missionId: input.missionId,
      commitmentHash: input.commitmentHash,
      nullifier:
        input.nullifier ??
        buildNullifier({
          missionId: input.missionId,
          commitmentHash: input.commitmentHash,
        }),
    });
    const txHash = fakeTxHash({
      scope: "starknet-reveal",
      missionId: input.missionId,
      commitmentHash: input.commitmentHash,
    });
    const fallback: PrivateIntentRevealResult = {
      revealHash,
      revealTxHash: txHash,
      explorerUrl: starknetExplorerUrl(config.starknet.explorerBaseUrl, txHash),
      network: config.starknet.network,
      status: "revealed",
      live: false,
    };

    await Promise.all([
      persistExecutionRail({
        missionId: input.missionId,
        rail: "private",
        status: "verified",
        selectorLabel: "Private",
        live: false,
        metadata: {
          revealHash,
          revealTxHash: txHash,
          fallback: true,
        },
      }),
      persistStarknetPrivateIntent({
        missionId: input.missionId,
        label: input.label,
        commitmentHash: input.commitmentHash,
        nullifier:
          input.nullifier ??
          buildNullifier({
            missionId: input.missionId,
            commitmentHash: input.commitmentHash,
          }),
        revealWindowHours: 0,
        status: "revealed",
        revealTxHash: fallback.revealTxHash,
        explorerUrl: fallback.explorerUrl,
        network: fallback.network,
        live: false,
        payload: {
          revealHash,
          fallbackReason: message,
        },
      }),
      persistChainTransaction({
        missionId: input.missionId,
        rail: "private",
        chain: "Starknet",
        network: fallback.network,
        action: "reveal_private_intent",
        status: "revealed",
        txHash: fallback.revealTxHash,
        explorerUrl: fallback.explorerUrl,
        live: false,
        metadata: {
          commitmentHash: input.commitmentHash,
          revealHash,
          fallback: true,
        },
      }),
      persistAuditEvent({
        eventType: "starknet_private_intent",
        action: "reveal_private_intent",
        source: "integration/starknet",
        status: "success",
        missionId: input.missionId,
        operatorWallet: input.operatorWallet,
        actorType: "system",
        resource: input.label,
        durationMs: durationMsSince(startedAt),
        metadata: {
          revealHash,
          live: false,
          fallback: true,
        },
      }),
    ]);

    return fallback;
  }
}
