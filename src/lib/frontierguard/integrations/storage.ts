import { fakeCid, fakeTxHash } from "@/lib/frontierguard/server";
import { getFrontierConfig } from "@/lib/frontierguard/integrations/config";
import { durationMsSince } from "@/lib/frontierguard/observability";
import {
  persistArtifact,
  persistAuditEvent,
  persistExternalOperation,
  persistMemoryRecord,
  persistRuntimeError,
  persistToolInvocation,
} from "@/lib/frontierguard/repository";
import { uploadJsonToStoracha } from "@/lib/frontierguard/integrations/storacha";

export interface PinArtifactResult {
  cid: string;
  txHash: string;
  network: string;
  provider: "demo" | "pinata" | "storacha";
  uri: string;
  live: boolean;
}

export interface MemorySyncResult {
  cid: string;
  ucanDelegation: string;
  network: string;
  provider: "demo" | "storacha";
  live: boolean;
}

interface PinArtifactOptions {
  missionId?: string;
  artifactType?: string;
  metadata?: Record<string, unknown>;
}

interface StoreMemoryOptions {
  missionId?: string;
  metadata?: Record<string, unknown>;
}

async function pinViaPinata(payload: unknown, artifact: string): Promise<PinArtifactResult> {
  const config = getFrontierConfig();

  if (!config.filecoin.gateway || !config.filecoin.apiKey) {
    throw new Error("Pinata is not configured. Set FRONTIER_PINATA_GATEWAY and FRONTIER_PINATA_API_KEY.");
  }

  const response = await fetch(`${config.filecoin.gateway}/pinning/pinJSONToIPFS`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.filecoin.apiKey}`,
    },
    body: JSON.stringify({
      pinataContent: payload,
      pinataMetadata: { name: artifact },
    }),
  });

  if (!response.ok) {
    throw new Error(`Pinata pinning failed: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as { IpfsHash: string };
  const txHash = fakeTxHash({ scope: "pinata-proof", cid: data.IpfsHash, artifact });

  return {
    cid: data.IpfsHash,
    txHash,
    network: config.filecoin.networkLabel,
    provider: "pinata",
    uri: `ipfs://${data.IpfsHash}`,
    live: true,
  };
}

export async function pinArtifact(
  payload: unknown,
  artifact: string,
  options: PinArtifactOptions = {},
): Promise<PinArtifactResult> {
  const config = getFrontierConfig();
  const startedAt = Date.now();

  try {
    let result: PinArtifactResult;

    if (config.filecoin.provider === "pinata") {
      result = await pinViaPinata(payload, artifact);
    } else if (config.filecoin.provider === "storacha") {
      const uploaded = await uploadJsonToStoracha(artifact, payload);
      result = {
        cid: uploaded.cid,
        txHash: fakeTxHash({ scope: "storacha-filecoin-offer", cid: uploaded.cid, artifact }),
        network: config.filecoin.networkLabel,
        provider: "storacha",
        uri: uploaded.uri,
        live: true,
      };
    } else {
      const cid = fakeCid({ scope: "filecoin-pin", artifact, payload });
      const txHash = fakeTxHash({ scope: "filecoin-calibration", artifact, payload });

      result = {
        cid,
        txHash,
        network: config.filecoin.networkLabel,
        provider: "demo",
        uri: `ipfs://${cid}`,
        live: false,
      };
    }

    await persistArtifact({
      missionId: options.missionId,
      artifactName: artifact,
      artifactType: options.artifactType ?? artifact,
      provider: result.provider,
      network: result.network,
      status: "pinned",
      cid: result.cid,
      uri: result.uri,
      txHash: result.txHash,
      payload,
      metadata: {
        live: result.live,
        ...(options.metadata ?? {}),
      },
    });

    await Promise.all([
      persistToolInvocation({
        missionId: options.missionId,
        toolName: "filecoin-pin",
        operation: "pinArtifact",
        endpoint: result.uri,
        provider: result.provider,
        status: "success",
        requestPayload: { artifact, artifactType: options.artifactType ?? artifact },
        responsePayload: result,
        live: result.live,
        durationMs: durationMsSince(startedAt),
      }),
      persistExternalOperation({
        missionId: options.missionId,
        operationType: "filecoin_pin",
        provider: result.provider,
        resource: artifact,
        network: result.network,
        cid: result.cid,
        uri: result.uri,
        txHash: result.txHash,
        live: result.live,
        status: "success",
        requestPayload: payload,
        responsePayload: result,
      }),
      persistAuditEvent({
        eventType: "artifact_pinned",
        action: "pin_artifact",
        source: "integration/storage",
        status: "success",
        missionId: options.missionId,
        resource: artifact,
        durationMs: durationMsSince(startedAt),
        metadata: {
          provider: result.provider,
          cid: result.cid,
          live: result.live,
        },
      }),
    ]);

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to pin artifact.";

    await Promise.all([
      persistToolInvocation({
        missionId: options.missionId,
        toolName: "filecoin-pin",
        operation: "pinArtifact",
        provider: config.filecoin.provider,
        status: "error",
        requestPayload: { artifact, artifactType: options.artifactType ?? artifact },
        live: config.mode === "live",
        durationMs: durationMsSince(startedAt),
        errorMessage: message,
      }),
      persistExternalOperation({
        missionId: options.missionId,
        operationType: "filecoin_pin",
        provider: config.filecoin.provider,
        resource: artifact,
        network: config.filecoin.networkLabel,
        live: config.mode === "live",
        status: "error",
        requestPayload: payload,
        errorMessage: message,
      }),
      persistRuntimeError({
        missionId: options.missionId,
        scope: "integration/storage:pinArtifact",
        errorName: error instanceof Error ? error.name : "PinArtifactError",
        errorMessage: message,
        stackExcerpt: error instanceof Error ? error.stack?.split("\n").slice(0, 5).join("\n") : undefined,
        recoverable: true,
        detail: {
          artifact,
          artifactType: options.artifactType ?? artifact,
        },
      }),
    ]);

    throw error;
  }
}

export async function storeSharedMemory(
  payload: unknown,
  label: string,
  options: StoreMemoryOptions = {},
): Promise<MemorySyncResult> {
  const config = getFrontierConfig();
  const startedAt = Date.now();

  try {
    let result: MemorySyncResult;

    if (config.storacha.enabled) {
      const uploaded = await uploadJsonToStoracha(`${label}.json`, payload);
      result = {
        cid: uploaded.cid,
        ucanDelegation: uploaded.proofCid ?? uploaded.spaceDid,
        network: config.storacha.networkLabel,
        provider: "storacha",
        live: true,
      };
    } else {
      const cid = fakeCid({ scope: "storacha-memory", label, payload });

      result = {
        cid,
        ucanDelegation: `ucan:${fakeTxHash({ scope: "ucan-delegation", label, payload }).slice(2, 26)}`,
        network: config.storacha.networkLabel,
        provider: "demo",
        live: false,
      };
    }

    if (options.missionId) {
      await persistMemoryRecord({
        missionId: options.missionId,
        recordType: label,
        cid: result.cid,
        provider: result.provider,
        network: result.network,
        ucanDelegation: result.ucanDelegation,
        payload,
      });
    }

    await Promise.all([
      persistToolInvocation({
        missionId: options.missionId,
        toolName: "storacha-memory",
        operation: "storeSharedMemory",
        endpoint: result.cid,
        provider: result.provider,
        status: "success",
        requestPayload: { label },
        responsePayload: result,
        live: result.live,
        durationMs: durationMsSince(startedAt),
      }),
      persistExternalOperation({
        missionId: options.missionId,
        operationType: "storacha_memory_sync",
        provider: result.provider,
        resource: label,
        network: result.network,
        cid: result.cid,
        uri: result.cid ? `ipfs://${result.cid}` : undefined,
        live: result.live,
        status: "success",
        requestPayload: payload,
        responsePayload: result,
      }),
      persistAuditEvent({
        eventType: "memory_synced",
        action: "store_shared_memory",
        source: "integration/storage",
        status: "success",
        missionId: options.missionId,
        resource: label,
        durationMs: durationMsSince(startedAt),
        metadata: {
          provider: result.provider,
          cid: result.cid,
          live: result.live,
        },
      }),
    ]);

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to store shared memory.";

    await Promise.all([
      persistToolInvocation({
        missionId: options.missionId,
        toolName: "storacha-memory",
        operation: "storeSharedMemory",
        provider: config.storacha.enabled ? "storacha" : "demo",
        status: "error",
        requestPayload: { label },
        live: config.storacha.enabled,
        durationMs: durationMsSince(startedAt),
        errorMessage: message,
      }),
      persistExternalOperation({
        missionId: options.missionId,
        operationType: "storacha_memory_sync",
        provider: config.storacha.enabled ? "storacha" : "demo",
        resource: label,
        network: config.storacha.networkLabel,
        live: config.storacha.enabled,
        status: "error",
        requestPayload: payload,
        errorMessage: message,
      }),
      persistRuntimeError({
        missionId: options.missionId,
        scope: "integration/storage:storeSharedMemory",
        errorName: error instanceof Error ? error.name : "StoreSharedMemoryError",
        errorMessage: message,
        stackExcerpt: error instanceof Error ? error.stack?.split("\n").slice(0, 5).join("\n") : undefined,
        recoverable: true,
        detail: { label },
      }),
    ]);

    throw error;
  }
}
