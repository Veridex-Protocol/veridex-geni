import { NextResponse } from "next/server";
import { durationMsSince, getRequestContext } from "@/lib/frontierguard/observability";
import {
  persistAuditEvent,
  persistMissionState,
  persistRuntimeError,
} from "@/lib/frontierguard/repository";
import type { FrontierState } from "@/lib/frontierguard/types";

export async function POST(request: Request) {
  const startedAt = Date.now();
  const context = getRequestContext(request);

  try {
    const body = (await request.json()) as { state?: FrontierState };

    if (!body.state?.mission?.id) {
      return NextResponse.json({ error: "Missing frontier state payload." }, { status: 400 });
    }

    const persisted = await persistMissionState(body.state);

    await persistAuditEvent({
      eventType: "state_request",
      action: "persist_frontier_state",
      source: "api/frontier/state",
      status: persisted ? "success" : "degraded",
      requestId: context.requestId,
      correlationId: context.correlationId,
      missionId: body.state.mission.id,
      sessionId: body.state.session.sessionId,
      credentialId: body.state.session.passkeyCredentialId || undefined,
      operatorWallet: body.state.session.vaultAddress ?? body.state.session.operatorWallet,
      actorType: "system",
      resource: "/api/frontier/state",
      durationMs: durationMsSince(startedAt),
      metadata: {
        persisted,
      },
    });

    return NextResponse.json({ ok: true, persisted });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to persist frontier state.";

    await Promise.all([
      persistAuditEvent({
        eventType: "state_request",
        action: "persist_frontier_state",
        source: "api/frontier/state",
        status: "error",
        requestId: context.requestId,
        correlationId: context.correlationId,
        actorType: "system",
        resource: "/api/frontier/state",
        durationMs: durationMsSince(startedAt),
        errorMessage: message,
      }),
      persistRuntimeError({
        scope: "api/frontier/state",
        errorName: error instanceof Error ? error.name : "StatePersistenceError",
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
