import { NextResponse } from "next/server";
import { scheduleFlowMission } from "@/lib/frontierguard/integrations/flow";
import { durationMsSince, getRequestContext } from "@/lib/frontierguard/observability";
import { persistAuditEvent, persistRuntimeError } from "@/lib/frontierguard/repository";

export async function POST(request: Request) {
  const startedAt = Date.now();
  const context = getRequestContext(request);

  try {
    const body = (await request.json()) as {
      missionId: string;
      title: string;
      objective: string;
      cadence: "once" | "hourly" | "daily" | "weekly";
      scheduledFor?: string;
      retryPolicy: "manual" | "retry-once" | "retry-thrice";
      operatorWallet: string;
    };

    const result = await scheduleFlowMission(body);

    await persistAuditEvent({
      eventType: "flow_schedule_request",
      action: "schedule_flow_mission",
      source: "api/frontier/flow/schedule",
      status: "success",
      requestId: context.requestId,
      correlationId: context.correlationId,
      missionId: body.missionId,
      operatorWallet: body.operatorWallet,
      actorType: "system",
      resource: result.scheduleId,
      durationMs: durationMsSince(startedAt),
      metadata: { ...result },
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to schedule Flow mission.";

    await Promise.all([
      persistAuditEvent({
        eventType: "flow_schedule_request",
        action: "schedule_flow_mission",
        source: "api/frontier/flow/schedule",
        status: "error",
        requestId: context.requestId,
        correlationId: context.correlationId,
        actorType: "system",
        resource: "/api/frontier/flow/schedule",
        durationMs: durationMsSince(startedAt),
        errorMessage: message,
      }),
      persistRuntimeError({
        scope: "api/frontier/flow/schedule",
        errorName: error instanceof Error ? error.name : "FlowScheduleRouteError",
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
