import { NextResponse } from "next/server";
import { fetchPremiumYieldWithEnterpriseAgent } from "@/lib/frontierguard/integrations/runtime";
import { durationMsSince, getRequestContext } from "@/lib/frontierguard/observability";
import { persistAuditEvent, persistRuntimeError } from "@/lib/frontierguard/repository";

export async function POST(request: Request) {
  const startedAt = Date.now();
  const context = getRequestContext(request);
  let body: {
    missionId?: string;
    objective?: string;
    sessionId?: string;
    credentialId?: string;
    passkeyKeyHash?: string;
    operatorWallet?: string;
  } = {};

  try {
    body = (await request.json()) as typeof body;

    const result = await fetchPremiumYieldWithEnterpriseAgent(request, body);

    await persistAuditEvent({
      eventType: "enterprise_agent_service_request",
      action: "premium_yield_access",
      source: "api/frontier/agent/premium-yield",
      status: "success",
      requestId: context.requestId,
      correlationId: context.correlationId,
        missionId: body.missionId,
        sessionId: body.sessionId,
        credentialId: body.credentialId,
        operatorWallet: body.operatorWallet,
        actorType: "specialist",
        resource: "/api/frontier/services/premium-yield",
      durationMs: durationMsSince(startedAt),
      metadata: {
        paymentTxHash: result.paymentTxHash,
        paymentVerified: result.paymentVerified,
        live: result.live,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Enterprise premium yield execution failed.";

    await Promise.all([
      persistAuditEvent({
        eventType: "enterprise_agent_service_request",
        action: "premium_yield_access",
        source: "api/frontier/agent/premium-yield",
        status: "error",
        requestId: context.requestId,
        correlationId: context.correlationId,
        actorType: "specialist",
        resource: "/api/frontier/services/premium-yield",
        sessionId: body.sessionId,
        credentialId: body.credentialId,
        operatorWallet: body.operatorWallet,
        durationMs: durationMsSince(startedAt),
        errorMessage: message,
      }),
      persistRuntimeError({
        scope: "api/frontier/agent/premium-yield",
        errorName:
          error instanceof Error ? error.name : "EnterprisePremiumYieldRouteError",
        errorMessage: message,
        stackExcerpt:
          error instanceof Error
            ? error.stack?.split("\n").slice(0, 5).join("\n")
            : undefined,
        recoverable: true,
        detail: {
          requestId: context.requestId,
        },
      }),
    ]);

    return NextResponse.json({ error: message }, { status: 503 });
  }
}
