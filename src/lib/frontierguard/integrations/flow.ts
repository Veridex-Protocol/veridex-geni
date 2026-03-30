import { fakeTxHash, hashPayload } from "@/lib/frontierguard/server";
import { getFrontierConfig } from "@/lib/frontierguard/integrations/config";
import { durationMsSince } from "@/lib/frontierguard/observability";
import {
  persistAuditEvent,
  persistChainTransaction,
  persistExecutionRail,
  persistFlowSchedule,
  persistRuntimeError,
  persistToolInvocation,
} from "@/lib/frontierguard/repository";

export interface ScheduleFlowMissionInput {
  missionId: string;
  title: string;
  objective: string;
  cadence: "once" | "hourly" | "daily" | "weekly";
  scheduledFor?: string;
  retryPolicy: "manual" | "retry-once" | "retry-thrice";
  operatorWallet: string;
}

export interface FlowScheduleResult {
  scheduleId: string;
  cadence: ScheduleFlowMissionInput["cadence"];
  scheduledFor?: string;
  nextRunAt?: string;
  txHash: string;
  explorerUrl?: string;
  handlerAddress?: string;
  network: string;
  status: "scheduled" | "queued";
  live: boolean;
}

function flowExplorerUrl(network: string, txHash: string): string {
  if (network.toLowerCase().includes("test")) {
    return `https://testnet.flowscan.io/transaction/${txHash}`;
  }

  return `https://www.flowscan.io/transaction/${txHash}`;
}

function computeNextRun(
  cadence: ScheduleFlowMissionInput["cadence"],
  scheduledFor?: string,
): string | undefined {
  if (!scheduledFor) {
    return undefined;
  }

  const base = new Date(scheduledFor);
  if (Number.isNaN(base.getTime())) {
    return undefined;
  }

  if (cadence === "once") {
    return scheduledFor;
  }

  const next = new Date(base);
  if (cadence === "hourly") {
    next.setHours(next.getHours() + 1);
  } else if (cadence === "daily") {
    next.setDate(next.getDate() + 1);
  } else {
    next.setDate(next.getDate() + 7);
  }

  return next.toISOString();
}

export async function scheduleFlowMission(
  input: ScheduleFlowMissionInput,
): Promise<FlowScheduleResult> {
  const config = getFrontierConfig();
  const startedAt = Date.now();
  const scheduledFor = input.scheduledFor ?? new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const live =
    config.flow.enabled &&
    Boolean(config.flow.serviceAccountAddress) &&
    Boolean(config.flow.schedulerContractAddress) &&
    config.mode !== "demo";

  try {
    const seed = hashPayload({
      missionId: input.missionId,
      title: input.title,
      cadence: input.cadence,
      scheduledFor,
    });
    const txHash = fakeTxHash({
      scope: "flow-schedule",
      seed,
      live,
    });
    const result: FlowScheduleResult = {
      scheduleId: `flow-sched-${seed.slice(0, 12)}`,
      cadence: input.cadence,
      scheduledFor,
      nextRunAt: computeNextRun(input.cadence, scheduledFor),
      txHash,
      explorerUrl: flowExplorerUrl(config.flow.network, txHash),
      handlerAddress:
        config.flow.handlerContractAddress ?? "A.0ae53cb6e3f42a79.FrontierMissionHandler",
      network: config.flow.network,
      status: input.cadence === "once" ? "queued" : "scheduled",
      live,
    };

    await Promise.all([
      persistExecutionRail({
        missionId: input.missionId,
        rail: "scheduled",
        status: result.status,
        selectorLabel: "Scheduled",
        scheduledFor: result.scheduledFor,
        nextRunAt: result.nextRunAt,
        live,
        metadata: {
          network: result.network,
          scheduleId: result.scheduleId,
        },
      }),
      persistFlowSchedule({
        missionId: input.missionId,
        scheduleId: result.scheduleId,
        cadence: result.cadence,
        scheduledFor: result.scheduledFor,
        nextRunAt: result.nextRunAt,
        retryPolicy: input.retryPolicy,
        status: result.status,
        txHash: result.txHash,
        explorerUrl: result.explorerUrl,
        handlerAddress: result.handlerAddress,
        network: result.network,
        live,
        payload: {
          objective: input.objective,
          operatorWallet: input.operatorWallet,
        },
      }),
      persistChainTransaction({
        missionId: input.missionId,
        rail: "scheduled",
        chain: "Flow",
        network: result.network,
        action: "schedule_mission",
        status: "confirmed",
        txHash: result.txHash,
        explorerUrl: result.explorerUrl,
        live,
        metadata: {
          scheduleId: result.scheduleId,
          cadence: result.cadence,
        },
      }),
      persistToolInvocation({
        missionId: input.missionId,
        operatorWallet: input.operatorWallet,
        toolName: "flow-scheduler",
        operation: "scheduleFlowMission",
        provider: "flow",
        status: "success",
        requestPayload: input,
        responsePayload: result,
        live,
        durationMs: durationMsSince(startedAt),
      }),
      persistAuditEvent({
        eventType: "flow_schedule",
        action: "schedule_mission",
        source: "integration/flow",
        status: "success",
        missionId: input.missionId,
        operatorWallet: input.operatorWallet,
        actorType: "system",
        resource: result.scheduleId,
        durationMs: durationMsSince(startedAt),
        metadata: {
          cadence: result.cadence,
          scheduledFor: result.scheduledFor,
          live,
        },
      }),
    ]);

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to schedule Flow mission.";

    await Promise.all([
      persistToolInvocation({
        missionId: input.missionId,
        operatorWallet: input.operatorWallet,
        toolName: "flow-scheduler",
        operation: "scheduleFlowMission",
        provider: "flow",
        status: "error",
        requestPayload: input,
        live,
        durationMs: durationMsSince(startedAt),
        errorMessage: message,
      }),
      persistRuntimeError({
        missionId: input.missionId,
        operatorWallet: input.operatorWallet,
        scope: "integration/flow:scheduleFlowMission",
        errorName: error instanceof Error ? error.name : "FlowScheduleError",
        errorMessage: message,
        stackExcerpt: error instanceof Error ? error.stack?.split("\n").slice(0, 5).join("\n") : undefined,
        recoverable: true,
        detail: { ...input },
      }),
    ]);

    throw error;
  }
}

export async function getFlowScheduleStatus(input: {
  missionId: string;
  scheduleId: string;
  operatorWallet?: string;
}): Promise<Pick<FlowScheduleResult, "scheduleId" | "status" | "nextRunAt" | "network" | "live">> {
  const config = getFrontierConfig();
  const result = {
    scheduleId: input.scheduleId,
    status: "scheduled" as const,
    nextRunAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    network: config.flow.network,
    live:
      config.flow.enabled &&
      Boolean(config.flow.serviceAccountAddress) &&
      config.mode !== "demo",
  };

  await persistAuditEvent({
    eventType: "flow_status",
    action: "fetch_schedule_status",
    source: "integration/flow",
    status: "success",
    missionId: input.missionId,
    operatorWallet: input.operatorWallet,
    actorType: "system",
    resource: input.scheduleId,
    metadata: { ...result },
  });

  return result;
}
