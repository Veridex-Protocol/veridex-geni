import { NextResponse } from "next/server";
import { storeSharedMemory } from "@/lib/frontierguard/integrations/storage";
import { durationMsSince, getRequestContext } from "@/lib/frontierguard/observability";
import { persistAuditEvent, persistRuntimeError } from "@/lib/frontierguard/repository";

export async function POST(request: Request) {
  const startedAt = Date.now();
  const context = getRequestContext(request);

  try {
    const body = (await request.json()) as {
      missionId?: string;
      type?: string;
      payload: unknown;
    };

    const result = await storeSharedMemory(body.payload, body.type ?? "memory", {
      missionId: body.missionId,
    });

    await persistAuditEvent({
      eventType: "memory_request",
      action: "storacha_memory",
      source: "api/frontier/storacha/memory",
      status: "success",
      requestId: context.requestId,
      correlationId: context.correlationId,
      missionId: body.missionId,
      actorType: "storage",
      resource: body.type ?? "memory",
      durationMs: durationMsSince(startedAt),
      metadata: {
        cid: result.cid,
        provider: result.provider,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to synchronize shared memory.";
    console.error("[storacha/memory] ERROR:", message, error instanceof Error ? error.stack?.split("\n").slice(0, 4).join("\n") : "");

    await Promise.all([
      persistAuditEvent({
        eventType: "memory_request",
        action: "storacha_memory",
        source: "api/frontier/storacha/memory",
        status: "error",
        requestId: context.requestId,
        correlationId: context.correlationId,
        actorType: "storage",
        resource: "/api/frontier/storacha/memory",
        durationMs: durationMsSince(startedAt),
        errorMessage: message,
      }),
      persistRuntimeError({
        scope: "api/frontier/storacha/memory",
        errorName: error instanceof Error ? error.name : "StorachaMemoryRouteError",
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
