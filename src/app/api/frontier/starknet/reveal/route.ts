import { NextResponse } from "next/server";
import { revealPrivateIntent } from "@/lib/frontierguard/integrations/starknet";
import { durationMsSince, getRequestContext } from "@/lib/frontierguard/observability";
import { persistAuditEvent, persistRuntimeError } from "@/lib/frontierguard/repository";

export async function POST(request: Request) {
  const startedAt = Date.now();
  const context = getRequestContext(request);

  try {
    const body = (await request.json()) as {
      missionId: string;
      label: string;
      operatorWallet: string;
      commitmentHash: string;
      nullifier?: string;
    };

    const result = await revealPrivateIntent(body);

    await persistAuditEvent({
      eventType: "starknet_intent_request",
      action: "reveal_private_intent",
      source: "api/frontier/starknet/reveal",
      status: "success",
      requestId: context.requestId,
      correlationId: context.correlationId,
      missionId: body.missionId,
      operatorWallet: body.operatorWallet,
      actorType: "system",
      resource: body.label,
      durationMs: durationMsSince(startedAt),
      metadata: { ...result },
    });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to reveal Starknet private intent.";

    await Promise.all([
      persistAuditEvent({
        eventType: "starknet_intent_request",
        action: "reveal_private_intent",
        source: "api/frontier/starknet/reveal",
        status: "error",
        requestId: context.requestId,
        correlationId: context.correlationId,
        actorType: "system",
        resource: "/api/frontier/starknet/reveal",
        durationMs: durationMsSince(startedAt),
        errorMessage: message,
      }),
      persistRuntimeError({
        scope: "api/frontier/starknet/reveal",
        errorName: error instanceof Error ? error.name : "StarknetRevealRouteError",
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

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
