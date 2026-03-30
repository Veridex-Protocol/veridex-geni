import { NextResponse } from "next/server";
import { registerFrontierAgent } from "@/lib/frontierguard/integrations/identity";
import { durationMsSince, getRequestContext } from "@/lib/frontierguard/observability";
import { persistAuditEvent, persistRuntimeError } from "@/lib/frontierguard/repository";

export async function POST(request: Request) {
  const startedAt = Date.now();
  const context = getRequestContext(request);

  try {
    const body = (await request.json()) as {
      missionId: string;
      agentName: string;
      operatorWallet: string;
      supportedTools: string[];
    };

    const result = await registerFrontierAgent(request, {
      missionId: body.missionId,
      agentName: body.agentName,
      operatorWallet: body.operatorWallet,
      supportedTools: body.supportedTools,
    });

    await persistAuditEvent({
      eventType: "erc8004_request",
      action: "erc8004_register",
      source: "api/frontier/erc8004/register",
      status: "success",
      requestId: context.requestId,
      correlationId: context.correlationId,
      missionId: body.missionId,
      operatorWallet: body.operatorWallet,
      actorType: "trust",
      actorId: result.agentId,
      resource: body.agentName,
      durationMs: durationMsSince(startedAt),
      metadata: {
        identity: result.erc8004Identity,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to register agent identity.";

    await Promise.all([
      persistAuditEvent({
        eventType: "erc8004_request",
        action: "erc8004_register",
        source: "api/frontier/erc8004/register",
        status: "error",
        requestId: context.requestId,
        correlationId: context.correlationId,
        actorType: "trust",
        resource: "/api/frontier/erc8004/register",
        durationMs: durationMsSince(startedAt),
        errorMessage: message,
      }),
      persistRuntimeError({
        scope: "api/frontier/erc8004/register",
        errorName: error instanceof Error ? error.name : "ERC8004RegisterRouteError",
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
