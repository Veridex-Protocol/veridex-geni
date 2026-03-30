import { NextResponse } from "next/server";
import { pinArtifact } from "@/lib/frontierguard/integrations/storage";
import { durationMsSince, getRequestContext } from "@/lib/frontierguard/observability";
import { persistAuditEvent, persistRuntimeError } from "@/lib/frontierguard/repository";

export async function POST(request: Request) {
  const startedAt = Date.now();
  const context = getRequestContext(request);

  try {
    const body = (await request.json()) as {
      missionId?: string;
      artifact: string;
      payload: unknown;
    };

    const result = await pinArtifact(body.payload, body.artifact, {
      missionId: body.missionId,
      artifactType: body.artifact,
    });

    await persistAuditEvent({
      eventType: "pin_request",
      action: "filecoin_pin",
      source: "api/frontier/filecoin/pin",
      status: "success",
      requestId: context.requestId,
      correlationId: context.correlationId,
      missionId: body.missionId,
      actorType: "storage",
      resource: body.artifact,
      durationMs: durationMsSince(startedAt),
      metadata: {
        provider: result.provider,
        cid: result.cid,
      },
    });

    return NextResponse.json({
      cid: result.cid,
      txHash: result.txHash,
      network: result.network,
      provider: result.provider,
      uri: result.uri,
      live: result.live,
      status: "pinned",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to pin artifact.";

    await Promise.all([
      persistAuditEvent({
        eventType: "pin_request",
        action: "filecoin_pin",
        source: "api/frontier/filecoin/pin",
        status: "error",
        requestId: context.requestId,
        correlationId: context.correlationId,
        actorType: "storage",
        resource: "/api/frontier/filecoin/pin",
        durationMs: durationMsSince(startedAt),
        errorMessage: message,
      }),
      persistRuntimeError({
        scope: "api/frontier/filecoin/pin",
        errorName: error instanceof Error ? error.name : "FilecoinPinRouteError",
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
