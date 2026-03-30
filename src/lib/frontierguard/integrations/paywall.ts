import {
  buildPaywallResponse,
  settleX402Payment,
  verifyX402Payment,
  type PaymentSettlementResponse,
} from "@veridex/agentic-payments";
import { ethers } from "ethers";
import { fakeTxHash } from "@/lib/frontierguard/server";
import {
  getFrontierConfig,
  getRequestOrigin,
  type IntegrationMode,
} from "@/lib/frontierguard/integrations/config";
import { durationMsSince, getRequestContext } from "@/lib/frontierguard/observability";
import {
  persistAuditEvent,
  persistPaymentRecord,
  persistPolicyEvaluation,
  persistRuntimeError,
  persistToolInvocation,
} from "@/lib/frontierguard/repository";

export interface FrontierPaywallVerification {
  paid: boolean;
  response: Response;
  payment?: {
    protocol: "x402" | "ucp" | "acp" | "ap2";
    txHash: string;
    live: boolean;
    mode: IntegrationMode;
    explorerUrl?: string;
    blockNumber?: number;
    settlementVerified?: boolean;
    settlementHeader?: string;
  };
}

type AppRouterPaywallConfig = Parameters<typeof buildPaywallResponse>[0];

function toCaip2(network: string): string {
  const normalized = network.toLowerCase();

  switch (normalized) {
    case "base-sepolia":
      return "eip155:84532";
    case "base-mainnet":
    case "base":
      return "eip155:8453";
    case "ethereum-sepolia":
      return "eip155:11155111";
    case "ethereum-mainnet":
    case "ethereum":
      return "eip155:1";
    default:
      return normalized.startsWith("eip155:") ? normalized : network;
  }
}

function isDemoPaymentSignature(signature: string): boolean {
  if (signature.startsWith("veridex-demo:")) {
    return true;
  }

  try {
    const decoded = JSON.parse(Buffer.from(signature, "base64").toString("utf-8")) as {
      payload?: {
        signature?: string;
        authorization?: {
          to?: string;
          value?: string;
          validBefore?: number;
        };
      };
    };

    return Boolean(
      decoded.payload?.signature &&
        decoded.payload.authorization?.to &&
        decoded.payload.authorization?.value &&
        decoded.payload.authorization.validBefore,
    );
  } catch {
    return false;
  }
}

function createPaywallConfig(request: Request): AppRouterPaywallConfig {
  const config = getFrontierConfig();
  const origin = getRequestOrigin(request);

  return {
    amount: config.paywall.amountUsd.toFixed(2),
    recipient: config.paywall.recipient,
    network: config.paywall.network,
    facilitatorUrl: config.paywall.facilitatorUrl,
    fallbackFacilitatorUrl: config.paywall.fallbackFacilitatorUrl,
    description: config.paywall.description,
    protocols: ["x402", "ucp", "acp", "ap2"],
    corsHeaders: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Headers":
        "Content-Type, payment-signature, PAYMENT-SIGNATURE, x-ucp-payment-credential, x-acp-payment-token, x-ap2-fulfillment",
    },
  };
}

function createPaymentResponseHeader(
  settlement: PaymentSettlementResponse,
): string {
  return Buffer.from(JSON.stringify(settlement)).toString("base64");
}

function paywallAssetForNetwork(network: string): string {
  switch (toCaip2(network)) {
    case "eip155:84532":
      return "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
    case "eip155:8453":
      return "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
    case "eip155:11155111":
      return "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
    case "eip155:1":
      return "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    default:
      return "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
  }
}

function paymentExplorerUrl(baseUrl: string | undefined, txHash: string): string | undefined {
  if (!baseUrl) {
    return undefined;
  }

  return `${baseUrl.replace(/\/$/, "")}/tx/${txHash}`;
}

function buildPaymentRequirements(config = getFrontierConfig()) {
  return {
    scheme: "exact" as const,
    network: toCaip2(config.paywall.network),
    maxAmountRequired: String(Math.round(config.paywall.amountUsd * 1_000_000)),
    asset: paywallAssetForNetwork(config.paywall.network),
    payTo: config.paywall.recipient,
  };
}

async function verifyEvmSettlement(txHash: string): Promise<{
  verified: boolean;
  blockNumber?: number;
  explorerUrl?: string;
}> {
  const config = getFrontierConfig();
  const explorerUrl = paymentExplorerUrl(config.paywall.explorerBaseUrl, txHash);

  if (!config.paywall.rpcUrl) {
    return {
      verified: false,
      explorerUrl,
    };
  }

  try {
    const provider = new ethers.JsonRpcProvider(config.paywall.rpcUrl);
    const receipt = await provider.getTransactionReceipt(txHash);

    if (!receipt || receipt.status !== 1) {
      return {
        verified: false,
        explorerUrl,
      };
    }

    return {
      verified: true,
      blockNumber: receipt.blockNumber,
      explorerUrl,
    };
  } catch {
    return {
      verified: false,
      explorerUrl,
    };
  }
}

function createChallengeResponse(request: Request, resource: string, reason?: string): Response {
  const config = getFrontierConfig();
  const paywallResponse = buildPaywallResponse(createPaywallConfig(request), reason);
  const headers = new Headers(paywallResponse.headers);
  const challengeId = fakeTxHash({
    scope: "premium-yield-challenge",
    resource,
    recipient: config.paywall.recipient,
  }).slice(2, 18);

  return new Response(
    JSON.stringify({
      protocol: "x402",
      paymentRequired: true,
      merchant: config.paywall.merchant,
      resource,
      challengeId,
      amountUsd: config.paywall.amountUsd,
      network: config.paywall.network,
      networkCaip2: toCaip2(config.paywall.network),
      counterpartyTrust: 96.4,
      description: config.paywall.description,
      recipient: config.paywall.recipient,
    }),
    {
      status: 402,
      headers,
    },
  );
}

export async function verifyFrontierPaywall(
  request: Request,
  resource: string,
  options: { missionId?: string } = {},
): Promise<FrontierPaywallVerification> {
  const config = getFrontierConfig();
  const context = getRequestContext(request);
  const startedAt = Date.now();
  const signature =
    request.headers.get("payment-signature") ??
    request.headers.get("PAYMENT-SIGNATURE");
  const missionId = options.missionId;
  const demoSignature = signature ? isDemoPaymentSignature(signature) : false;
  const hasFacilitator = Boolean(
    config.paywall.facilitatorUrl || config.paywall.fallbackFacilitatorUrl,
  );

  if (!signature) {
    await Promise.all([
      persistPaymentRecord({
        id: createChallengeResponse(request, resource).headers.get("x-veridex-payment-id") ?? undefined,
        missionId,
        merchant: config.paywall.merchant,
        resource,
        protocol: "x402",
        amountUsd: config.paywall.amountUsd,
        network: config.paywall.network,
        recipient: config.paywall.recipient,
        counterpartyTrust: 96.4,
        status: "challenged",
        live: config.mode === "live",
        detail: {
          requestId: context.requestId,
          reason: "missing-signature",
        },
      }),
      persistToolInvocation({
        missionId,
        toolName: "x402-paywall",
        operation: "verifyFrontierPaywall",
        endpoint: resource,
        provider: "veridex-agentic-payments",
        status: "challenged",
        requestPayload: { hasSignature: false },
        responsePayload: { resource, paymentRequired: true },
        live: config.mode === "live",
        durationMs: durationMsSince(startedAt),
      }),
      persistAuditEvent({
        eventType: "payment_challenge",
        action: "verify_paywall",
        source: "integration/paywall",
        status: "challenged",
        requestId: context.requestId,
        correlationId: context.correlationId,
        missionId,
        actorType: "payment",
        resource,
        durationMs: durationMsSince(startedAt),
        metadata: {
          protocol: "x402",
          amountUsd: config.paywall.amountUsd,
        },
      }),
    ]);

    return {
      paid: false,
      response: createChallengeResponse(request, resource),
    };
  }

  if (config.mode === "live" && demoSignature) {
    const message = "Live sponsor mode only accepts verifiable x402 settlements.";

    await Promise.all([
      persistPolicyEvaluation({
        missionId,
        action: "verify_paywall",
        decision: "blocked",
        ruleName: "live_mode_demo_signature_rejection",
        threshold: { mode: config.mode },
        observed: { resource },
        rationale: message,
        blocked: true,
      }),
      persistAuditEvent({
        eventType: "payment_rejected",
        action: "verify_paywall",
        source: "integration/paywall",
        status: "blocked",
        requestId: context.requestId,
        correlationId: context.correlationId,
        missionId,
        actorType: "policy",
        resource,
        durationMs: durationMsSince(startedAt),
        errorMessage: message,
      }),
    ]);

    return {
      paid: false,
      response: createChallengeResponse(request, resource, message),
    };
  }

  if (config.mode === "live" && !hasFacilitator) {
    const message =
      "Live x402 execution is blocked because no facilitator is configured for settlement verification.";

    await Promise.all([
      persistPolicyEvaluation({
        missionId,
        action: "verify_paywall",
        decision: "blocked",
        ruleName: "x402_facilitator_configuration",
        threshold: { mode: config.mode },
        observed: { resource },
        rationale: message,
        blocked: true,
      }),
      persistRuntimeError({
        missionId,
        scope: "integration/paywall:verifyFrontierPaywall",
        errorName: "MissingFacilitatorConfiguration",
        errorMessage: message,
        recoverable: true,
        detail: { resource },
      }),
    ]);

    return {
      paid: false,
      response: createChallengeResponse(request, resource, message),
    };
  }

  if (!demoSignature && config.mode !== "demo") {
    try {
      const requirements = buildPaymentRequirements(config);
      const verified = await verifyX402Payment(signature, requirements, {
        facilitatorUrl: config.paywall.facilitatorUrl,
        fallbackUrl: config.paywall.fallbackFacilitatorUrl,
        timeoutMs: 5000,
      });

      if (!verified.isValid) {
        throw new Error(verified.error ?? "Payment verification failed.");
      }

      const settled = await settleX402Payment(signature, requirements, {
        facilitatorUrl: config.paywall.facilitatorUrl,
        fallbackUrl: config.paywall.fallbackFacilitatorUrl,
        timeoutMs: 10_000,
      });

      if (!settled.success || !settled.txHash) {
        throw new Error(settled.error ?? "Payment settlement failed.");
      }

      const settlementProof = await verifyEvmSettlement(settled.txHash);
      if (config.mode === "live" && !settlementProof.verified) {
        throw new Error("Payment settled but could not be verified on-chain.");
      }
      const settlementHeader = createPaymentResponseHeader({
        success: true,
        transactionHash: settled.txHash,
        network: requirements.network,
        amount: requirements.maxAmountRequired,
        facilitator: config.paywall.facilitatorUrl ?? config.paywall.fallbackFacilitatorUrl,
      });

      {
        const payment = {
          protocol: "x402" as const,
          txHash: settled.txHash,
          live: true,
          mode: config.mode,
          explorerUrl: settlementProof.explorerUrl,
          blockNumber: settlementProof.blockNumber,
          settlementVerified: settlementProof.verified,
          settlementHeader,
        };

        await Promise.all([
          persistPaymentRecord({
            id: createStablePaymentId(resource, payment.txHash),
            missionId,
            merchant: config.paywall.merchant,
            resource,
            protocol: payment.protocol,
            amountUsd: config.paywall.amountUsd,
            network: config.paywall.network,
            recipient: config.paywall.recipient,
            txHash: payment.txHash,
            counterpartyTrust: 96.4,
            status: "settled",
            live: true,
            detail: {
              requestId: context.requestId,
              mode: config.mode,
              settlementVerified: payment.settlementVerified,
              blockNumber: payment.blockNumber,
              explorerUrl: payment.explorerUrl,
            },
          }),
          persistToolInvocation({
            missionId,
            toolName: "x402-paywall",
            operation: "verifyFrontierPaywall",
            endpoint: resource,
            provider: "veridex-agentic-payments",
            status: "success",
            requestPayload: { hasSignature: true },
            responsePayload: payment,
            live: true,
            durationMs: durationMsSince(startedAt),
          }),
          persistAuditEvent({
            eventType: "payment_verified",
            action: "verify_paywall",
            source: "integration/paywall",
            status: "success",
            requestId: context.requestId,
            correlationId: context.correlationId,
            missionId,
            actorType: "payment",
            resource,
            durationMs: durationMsSince(startedAt),
            metadata: payment,
          }),
        ]);

        return {
          paid: true,
          response: new Response(null, {
            status: 200,
            headers: {
              "PAYMENT-RESPONSE": settlementHeader,
            },
          }),
          payment,
        };
      }
    } catch (error) {
      if (config.mode === "live") {
        const message = error instanceof Error ? error.message : "Paywall verification failed.";
        await Promise.all([
          persistPolicyEvaluation({
            missionId,
            action: "verify_paywall",
            decision: "blocked",
            ruleName: "payment_signature_verification",
            threshold: { mode: config.mode },
            observed: { resource },
            rationale: message,
            blocked: true,
          }),
          persistRuntimeError({
            missionId,
            scope: "integration/paywall:verifyFrontierPaywall",
            errorName: error instanceof Error ? error.name : "PaywallVerificationError",
            errorMessage: message,
            stackExcerpt: error instanceof Error ? error.stack?.split("\n").slice(0, 5).join("\n") : undefined,
            recoverable: true,
            detail: { resource },
          }),
        ]);

        return {
          paid: false,
          response: createChallengeResponse(
            request,
            resource,
            message,
          ),
        };
      }
    }
  }

  if (!isDemoPaymentSignature(signature)) {
    await Promise.all([
      persistPolicyEvaluation({
        missionId,
        action: "verify_paywall",
        decision: "blocked",
        ruleName: "demo_signature_validation",
        threshold: { acceptedPrefix: "veridex-demo" },
        observed: { resource },
        rationale: "Payment verification failed.",
        blocked: true,
      }),
      persistAuditEvent({
        eventType: "payment_rejected",
        action: "verify_paywall",
        source: "integration/paywall",
        status: "blocked",
        requestId: context.requestId,
        correlationId: context.correlationId,
        missionId,
        actorType: "policy",
        resource,
        durationMs: durationMsSince(startedAt),
        errorMessage: "Payment verification failed.",
      }),
    ]);

    return {
      paid: false,
      response: createChallengeResponse(request, resource, "Payment verification failed."),
    };
  }

  const payment = {
    protocol: "x402" as const,
    txHash: fakeTxHash({ scope: "demo-paywall", signature, resource }),
    live: false,
    mode: config.mode,
    explorerUrl: paymentExplorerUrl(config.paywall.explorerBaseUrl, fakeTxHash({ scope: "demo-paywall", signature, resource })),
    settlementVerified: false,
  };

  await Promise.all([
    persistPaymentRecord({
      id: createStablePaymentId(resource, payment.txHash),
      missionId,
      merchant: config.paywall.merchant,
      resource,
      protocol: payment.protocol,
      amountUsd: config.paywall.amountUsd,
      network: config.paywall.network,
      recipient: config.paywall.recipient,
      txHash: payment.txHash,
      counterpartyTrust: 96.4,
      status: "settled",
      live: false,
      detail: {
        requestId: context.requestId,
        mode: config.mode,
      },
    }),
    persistToolInvocation({
      missionId,
      toolName: "x402-paywall",
      operation: "verifyFrontierPaywall",
      endpoint: resource,
      provider: "veridex-agentic-payments",
      status: "success",
      requestPayload: { hasSignature: true },
      responsePayload: payment,
      live: false,
      durationMs: durationMsSince(startedAt),
    }),
    persistAuditEvent({
      eventType: "payment_verified",
      action: "verify_paywall",
      source: "integration/paywall",
      status: "success",
      requestId: context.requestId,
      correlationId: context.correlationId,
      missionId,
      actorType: "payment",
      resource,
      durationMs: durationMsSince(startedAt),
      metadata: payment,
    }),
  ]);

  return {
    paid: true,
    response: new Response(null, { status: 200 }),
    payment,
  };
}

function createStablePaymentId(resource: string, txHash: string): string {
  return `payment:${resource.replace(/[^a-zA-Z0-9:_-]/g, "_")}:${txHash.slice(0, 18)}`;
}
