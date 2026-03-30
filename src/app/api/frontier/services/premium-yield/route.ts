import { NextResponse } from "next/server";
import { verifyFrontierPaywall } from "@/lib/frontierguard/integrations/paywall";
import { getFrontierConfig } from "@/lib/frontierguard/integrations/config";
import { getEnterpriseAgentSnapshot } from "@/lib/frontierguard/integrations/runtime";
import { runPremiumYieldResearch } from "@/lib/frontierguard/ai/research";
import { durationMsSince, getRequestContext } from "@/lib/frontierguard/observability";
import { resolveFrontierSessionLocator } from "@/lib/frontierguard/session";
import {
  persistAuditEvent,
  persistJobRun,
  persistRuntimeError,
} from "@/lib/frontierguard/repository";

const RESOURCE = "/api/frontier/services/premium-yield";

export async function POST(request: Request) {
  const startedAt = Date.now();
  const context = getRequestContext(request);

  try {
    const body = (await request.json()) as {
      missionId?: string;
      objective?: string;
      challengeId?: string;
    };
    const verification = await verifyFrontierPaywall(request, RESOURCE, {
      missionId: body.missionId,
    });

    if (!verification.paid) {
      await persistAuditEvent({
        eventType: "service_request",
        action: "premium_yield_access",
        source: "api/frontier/services/premium-yield",
        status: "challenged",
        requestId: context.requestId,
        correlationId: context.correlationId,
        missionId: body.missionId,
        actorType: "payment",
        resource: RESOURCE,
        durationMs: durationMsSince(startedAt),
        metadata: {
          objective: body.objective,
        },
      });

      return verification.response;
    }

    const config = getFrontierConfig();
    const runtime = await getEnterpriseAgentSnapshot(resolveFrontierSessionLocator(request)).catch(() => ({
      available: false,
      session: null,
      identity: null,
    }));
    const research = await runPremiumYieldResearch({
      objective: body.objective,
      query:
        body.objective ||
        "Current stablecoin yield opportunities suitable for treasury deployment with risk-aware normalization.",
    });

    if (
      config.mode === "live" &&
      (!verification.payment?.live || verification.payment.settlementVerified !== true)
    ) {
      throw new Error(
        "Live premium yield execution did not produce a verifiable on-chain settlement receipt.",
      );
    }

    const proofLevel =
      verification.payment?.settlementVerified
        ? "verified_onchain"
        : verification.payment?.live
          ? "live_unverified"
          : "demo";

    await Promise.all([
      persistJobRun({
        missionId: body.missionId,
        jobName: "premium-yield-service",
        status: "completed",
        startedAt: new Date(startedAt).toISOString(),
        finishedAt: new Date().toISOString(),
        durationMs: durationMsSince(startedAt),
        detail: {
          challengeId: body.challengeId,
          settled: true,
        },
      }),
      persistAuditEvent({
        eventType: "service_request",
        action: "premium_yield_access",
        source: "api/frontier/services/premium-yield",
        status: "success",
        requestId: context.requestId,
        correlationId: context.correlationId,
        missionId: body.missionId,
        actorType: "specialist",
        resource: RESOURCE,
        durationMs: durationMsSince(startedAt),
        metadata: {
          paymentTxHash: verification.payment?.txHash,
          live: verification.payment?.live ?? false,
          grounded: research.grounded,
          sourceCount: research.sources.length,
          model: research.modelVersion ?? research.model,
        },
      }),
    ]);

    return NextResponse.json({
      protocol: verification.payment?.protocol ?? "x402",
      settled: true,
      merchant: config.paywall.merchant,
      paymentTxHash: verification.payment?.txHash,
      paymentExplorerUrl: verification.payment?.explorerUrl,
      paymentBlockNumber: verification.payment?.blockNumber,
      paymentVerified: verification.payment?.settlementVerified ?? false,
      live: verification.payment?.live ?? false,
      proofLevel,
      proofSummary:
        proofLevel === "verified_onchain"
          ? "x402 settlement verified on-chain and bound to this mission."
          : proofLevel === "live_unverified"
            ? "Payment path executed live but settlement verification is incomplete."
            : "Payment path executed in demo or hybrid mode without a live settlement proof.",
      model: research.model,
      modelVersion: research.modelVersion,
      grounded: research.grounded,
      generatedAt: research.generatedAt,
      researchQuery: research.query,
      researchSummary: research.summary,
      searchQueries: research.searchQueries,
      sources: research.sources,
      runtime,
      data: research.data,
    }, {
      headers: verification.payment?.settlementHeader
        ? {
            "PAYMENT-RESPONSE": verification.payment.settlementHeader,
          }
        : undefined,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to serve premium yield data.";

    await Promise.all([
      persistJobRun({
        jobName: "premium-yield-service",
        status: "failed",
        startedAt: new Date(startedAt).toISOString(),
        finishedAt: new Date().toISOString(),
        durationMs: durationMsSince(startedAt),
        detail: {
          requestId: context.requestId,
        },
      }),
      persistAuditEvent({
        eventType: "service_request",
        action: "premium_yield_access",
        source: "api/frontier/services/premium-yield",
        status: "error",
        requestId: context.requestId,
        correlationId: context.correlationId,
        actorType: "specialist",
        resource: RESOURCE,
        durationMs: durationMsSince(startedAt),
        errorMessage: message,
      }),
      persistRuntimeError({
        scope: "api/frontier/services/premium-yield",
        errorName: error instanceof Error ? error.name : "PremiumYieldRouteError",
        errorMessage: message,
        stackExcerpt: error instanceof Error ? error.stack?.split("\n").slice(0, 5).join("\n") : undefined,
        recoverable: true,
        detail: {
          requestId: context.requestId,
        },
      }),
    ]);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
