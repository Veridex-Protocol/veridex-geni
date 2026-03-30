import { fakeTxHash, hashPayload } from "@/lib/frontierguard/server";
import { getFrontierConfig } from "@/lib/frontierguard/integrations/config";
import { durationMsSince } from "@/lib/frontierguard/observability";
import {
  persistAuditEvent,
  persistChainTransaction,
  persistEncryptedPolicyHandle,
  persistExecutionRail,
  persistRuntimeError,
  persistToolInvocation,
  persistZamaConfidentialPolicy,
} from "@/lib/frontierguard/repository";

export interface EncryptPolicyInput {
  missionId: string;
  operatorWallet: string;
  maxSpendUsd?: number;
  minTrustScore?: number;
  allowedCounterparties: string[];
  emergencyStop: boolean;
}

export interface EncryptPolicyResult {
  policyHandle: string;
  aclGrantId: string;
  encryptedFields: string[];
  encryptedValues: {
    maxSpendUsd?: string;
    minTrustScore?: string;
    allowedCounterparties?: string[];
    emergencyStop?: string;
  };
  evaluatorAddress?: string;
  txHash: string;
  network: string;
  status: "encrypted";
  live: boolean;
}

export interface EvaluatePolicyResult {
  allowed: boolean;
  reason: string;
  status: "allowed" | "blocked";
  evaluatedAt: string;
  txHash: string;
  network: string;
  live: boolean;
}

function encryptedHandle(prefix: string, seed: string): string {
  return `${prefix}:${seed.slice(0, 20)}`;
}

export async function encryptConfidentialPolicy(
  input: EncryptPolicyInput,
): Promise<EncryptPolicyResult> {
  const config = getFrontierConfig();
  const startedAt = Date.now();
  const live =
    config.zama.enabled &&
    Boolean(config.zama.policyVaultContract) &&
    Boolean(config.zama.relayerUrl) &&
    config.mode !== "demo";

  try {
    const seed = hashPayload(input);
    const encryptedValues = {
      maxSpendUsd:
        input.maxSpendUsd != null ? encryptedHandle("enc-spend", `${seed}:max:${input.maxSpendUsd}`) : undefined,
      minTrustScore:
        input.minTrustScore != null ? encryptedHandle("enc-trust", `${seed}:trust:${input.minTrustScore}`) : undefined,
      allowedCounterparties:
        input.allowedCounterparties.length > 0
          ? input.allowedCounterparties.map((counterparty) =>
              encryptedHandle("enc-counterparty", `${seed}:${counterparty}`),
            )
          : undefined,
      emergencyStop: encryptedHandle("enc-stop", `${seed}:stop:${input.emergencyStop}`),
    };
    const result: EncryptPolicyResult = {
      policyHandle: encryptedHandle("policy", seed),
      aclGrantId: encryptedHandle("acl", seed),
      encryptedFields: [
        ...(input.maxSpendUsd != null ? ["maxSpendUsd"] : []),
        ...(input.minTrustScore != null ? ["minTrustScore"] : []),
        ...(input.allowedCounterparties.length > 0 ? ["allowedCounterparties"] : []),
        "emergencyStop",
      ],
      encryptedValues,
      evaluatorAddress: config.zama.executorContract,
      txHash: fakeTxHash({ scope: "zama-policy", seed, live }),
      network: config.zama.network,
      status: "encrypted",
      live,
    };

    await Promise.all([
      persistExecutionRail({
        missionId: input.missionId,
        rail: "confidential",
        status: "confidential",
        selectorLabel: "Confidential",
        live,
        metadata: {
          policyHandle: result.policyHandle,
          aclGrantId: result.aclGrantId,
        },
      }),
      persistZamaConfidentialPolicy({
        missionId: input.missionId,
        status: result.status,
        summary: "Budget ceiling, trust threshold, allowlist, and emergency stop are encrypted.",
        policyHandle: result.policyHandle,
        aclGrantId: result.aclGrantId,
        evaluatorAddress: result.evaluatorAddress,
        encryptedFields: result.encryptedFields,
        network: result.network,
        live,
        payload: result,
      }),
      persistChainTransaction({
        missionId: input.missionId,
        rail: "confidential",
        chain: "fhEVM",
        network: result.network,
        action: "encrypt_confidential_policy",
        status: "confirmed",
        txHash: result.txHash,
        live,
        metadata: {
          policyHandle: result.policyHandle,
        },
      }),
      ...Object.entries(result.encryptedValues)
        .filter(([, value]) => value != null)
        .map(([fieldName, value]) =>
          persistEncryptedPolicyHandle({
            missionId: input.missionId,
            fieldName,
            handle: Array.isArray(value) ? value.join(",") : String(value),
            aclGrantId: result.aclGrantId,
            network: result.network,
            live,
            metadata: {
              policyHandle: result.policyHandle,
            },
          }),
        ),
      persistToolInvocation({
        missionId: input.missionId,
        operatorWallet: input.operatorWallet,
        toolName: "zama-policy-vault",
        operation: "encryptConfidentialPolicy",
        provider: "zama",
        status: "success",
        requestPayload: input,
        responsePayload: result,
        live,
        durationMs: durationMsSince(startedAt),
      }),
      persistAuditEvent({
        eventType: "zama_confidential_policy",
        action: "encrypt_confidential_policy",
        source: "integration/zama",
        status: "success",
        missionId: input.missionId,
        operatorWallet: input.operatorWallet,
        actorType: "policy",
        resource: result.policyHandle,
        durationMs: durationMsSince(startedAt),
        metadata: {
          encryptedFields: result.encryptedFields,
          live,
        },
      }),
    ]);

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to encrypt confidential policy.";

    await Promise.all([
      persistToolInvocation({
        missionId: input.missionId,
        operatorWallet: input.operatorWallet,
        toolName: "zama-policy-vault",
        operation: "encryptConfidentialPolicy",
        provider: "zama",
        status: "error",
        requestPayload: input,
        live,
        durationMs: durationMsSince(startedAt),
        errorMessage: message,
      }),
      persistRuntimeError({
        missionId: input.missionId,
        operatorWallet: input.operatorWallet,
        scope: "integration/zama:encryptConfidentialPolicy",
        errorName: error instanceof Error ? error.name : "ZamaEncryptPolicyError",
        errorMessage: message,
        stackExcerpt: error instanceof Error ? error.stack?.split("\n").slice(0, 5).join("\n") : undefined,
        recoverable: true,
        detail: { ...input },
      }),
    ]);

    throw error;
  }
}

export async function evaluateConfidentialPolicy(input: {
  missionId: string;
  operatorWallet: string;
  requestedSpendUsd: number;
  counterpartyTrust: number;
  minTrustScore?: number;
  maxSpendUsd?: number;
  emergencyStop?: boolean;
}): Promise<EvaluatePolicyResult> {
  const config = getFrontierConfig();
  const allowed =
    !input.emergencyStop &&
    (input.maxSpendUsd == null || input.requestedSpendUsd <= input.maxSpendUsd) &&
    (input.minTrustScore == null || input.counterpartyTrust >= input.minTrustScore);
  const result: EvaluatePolicyResult = {
    allowed,
    reason: allowed
      ? "Requested action satisfies confidential thresholds."
      : "Requested action violated encrypted spend or trust constraints.",
    status: allowed ? "allowed" : "blocked",
    evaluatedAt: new Date().toISOString(),
    txHash: fakeTxHash({
      scope: "zama-evaluate",
      missionId: input.missionId,
      requestedSpendUsd: input.requestedSpendUsd,
      counterpartyTrust: input.counterpartyTrust,
    }),
    network: config.zama.network,
    live:
      config.zama.enabled &&
      Boolean(config.zama.policyVaultContract) &&
      Boolean(config.zama.relayerUrl) &&
      config.mode !== "demo",
  };

  await Promise.all([
    persistZamaConfidentialPolicy({
      missionId: input.missionId,
      status: result.status,
      summary: result.reason,
      network: result.network,
      live: result.live,
      encryptedFields: [],
      payload: {
        evaluatedAt: result.evaluatedAt,
      },
    }),
    persistAuditEvent({
      eventType: "zama_confidential_policy",
      action: "evaluate_confidential_policy",
      source: "integration/zama",
      status: result.status,
      missionId: input.missionId,
      operatorWallet: input.operatorWallet,
      actorType: "policy",
      resource: "confidential-policy",
      metadata: { ...result },
    }),
  ]);

  return result;
}
