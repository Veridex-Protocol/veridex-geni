import { NextResponse } from "next/server";
import { submitFrontierFeedback } from "@/lib/frontierguard/integrations/identity";
import { durationMsSince, getRequestContext } from "@/lib/frontierguard/observability";
import { persistAuditEvent, persistRuntimeError } from "@/lib/frontierguard/repository";

export async function POST(request: Request) {
  const startedAt = Date.now();
  const context = getRequestContext(request);

  try {
    const body = (await request.json()) as {
      missionId: string;
      agentId?: string;
      rating: number;
      notes: string;
    };

    const result = await submitFrontierFeedback({
      missionId: body.missionId,
      agentId: body.agentId,
      rating: body.rating,
      notes: body.notes,
    });

    await persistAuditEvent({
      eventType: "erc8004_feedback_request",
      action: "erc8004_feedback",
      source: "api/frontier/erc8004/feedback",
      status: "success",
      requestId: context.requestId,
      correlationId: context.correlationId,
      missionId: body.missionId,
      actorType: "trust",
      actorId: body.agentId,
      resource: "/api/frontier/erc8004/feedback",
      durationMs: durationMsSince(startedAt),
      metadata: {
        txHash: result.txHash,
        updatedScore: result.updatedScore,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit feedback.";

    await Promise.all([
      persistAuditEvent({
        eventType: "erc8004_feedback_request",
        action: "erc8004_feedback",
        source: "api/frontier/erc8004/feedback",
        status: "error",
        requestId: context.requestId,
        correlationId: context.correlationId,
        actorType: "trust",
        resource: "/api/frontier/erc8004/feedback",
        durationMs: durationMsSince(startedAt),
        errorMessage: message,
      }),
      persistRuntimeError({
        scope: "api/frontier/erc8004/feedback",
        errorName: error instanceof Error ? error.name : "ERC8004FeedbackRouteError",
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
