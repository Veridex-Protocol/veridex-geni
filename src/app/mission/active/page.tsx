"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Bot,
  CircleAlert,
  Coins,
  FileArchive,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { FrontierShell } from "@/components/frontierguard/frontier-shell";
import { MetricCard } from "@/components/frontierguard/metric-card";
import { StageStrip } from "@/components/frontierguard/stage-strip";
import { useFrontierStatus } from "@/components/frontierguard/use-frontier-status";
import {
  EmptyState,
  FieldRow,
  StatusPill,
  WorkspaceSection,
} from "@/components/frontierguard/workspace-primitives";
import { useFrontierGuard } from "@/components/frontierguard/provider";

function statusTone(level: string): "neutral" | "ready" | "warning" | "blocked" {
  if (level === "success" || level === "completed" || level === "settled") {
    return "ready";
  }
  if (level === "warning" || level === "queued" || level === "challenged") {
    return "warning";
  }
  if (level === "error" || level === "blocked" || level === "failed") {
    return "blocked";
  }
  return "neutral";
}

export default function ActiveMissionPage() {
  const {
    mission,
    remainingBudgetUsd,
    progressPct,
    openDispute,
    advanceMission,
    runAutopilot,
    simulateViolation,
    resolveDispute,
    state,
  } = useFrontierGuard();
  const { status } = useFrontierStatus();
  const livePayments = mission.payments.filter((payment) => Boolean(payment.txHash));
  const recentLogs = mission.logs.slice(-6).reverse();
  const activeTasks = mission.tasks.filter((task) => task.status !== "completed");
  const activeStage =
    mission.stages.find((stage) => stage.key === mission.activeStage) ?? mission.stages[0];
  const paymentSummary =
    livePayments.length > 0 ? livePayments[0] : mission.payments[mission.payments.length - 1];
  const secondaryRailTransactions = mission.execution.chainTransactions.filter(
    (item) => item.rail !== "immediate",
  );

  return (
    <FrontierShell
      eyebrow="Execution Board"
      title="Live runtime for one bounded mission"
      description="Operate the primary path first: passkey control, x402 settlement, ERC-8004 trust, and exportable evidence. Secondary rails stay conditional until live."
      actions={
        <>
          <button
            type="button"
            onClick={() => void advanceMission()}
            disabled={state.loading || mission.status === "completed"}
            className="workspace-button-secondary rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            Run Next Stage
          </button>
          <button
            type="button"
            onClick={() => void runAutopilot()}
            disabled={state.loading || mission.status === "completed"}
            className="workspace-button-primary rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            Autopilot
          </button>
          <button
            type="button"
            onClick={() => void simulateViolation()}
            className="workspace-button-danger rounded-xl px-4 py-2 text-sm font-semibold"
          >
            Simulate Incident
          </button>
        </>
      }
    >
      <div className="space-y-6">
        {state.error ? (
          <div className="rounded-2xl border border-red-500/18 bg-red-500/8 px-5 py-4 text-sm text-red-200">
            {state.error}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Runtime Progress"
            value={`${progressPct}%`}
            helper={`Stage: ${mission.activeStage}`}
            tone="primary"
          />
          <MetricCard
            label="Budget Remaining"
            value={`$${remainingBudgetUsd.toFixed(2)}`}
            helper={`Spent: $${mission.budget.spentUsd.toFixed(2)}`}
            tone="success"
          />
          <MetricCard
            label="Payments"
            value={String(mission.payments.length)}
            helper={`${livePayments.length} with receipts`}
            tone={livePayments.length > 0 ? "success" : "warning"}
          />
          <MetricCard
            label="Open Tasks"
            value={String(activeTasks.length)}
            helper={`${mission.findings.length} findings ready`}
            tone="primary"
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <WorkspaceSection
            eyebrow="Current Run"
            title={mission.title}
            description={mission.objective}
            actions={
              <>
                <StatusPill
                  label={mission.status}
                  tone={
                    mission.status === "completed"
                      ? "ready"
                      : mission.status === "blocked"
                        ? "blocked"
                        : "waiting"
                  }
                />
                <Link
                  href="/receipts"
                  className="workspace-button-secondary inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold"
                >
                  Open Receipts
                </Link>
              </>
            }
          >
            <div className="space-y-6">
              <StageStrip stages={mission.stages} />
              <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="workspace-subpanel rounded-3xl p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                    Active Stage Summary
                  </p>
                  <div className="mt-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-white">{activeStage.label}</p>
                      <p className="mt-2 text-sm leading-6 text-zinc-400">{activeStage.summary}</p>
                    </div>
                    <StatusPill label={activeStage.status} tone={statusTone(activeStage.status)} />
                  </div>
                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/6 bg-black/15 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                        Execution rail
                      </p>
                      <p className="mt-2 text-sm font-semibold text-white">
                        {mission.execution.selectorLabel}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/6 bg-black/15 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                        Runtime status
                      </p>
                      <p className="mt-2 text-sm font-semibold text-white">
                        {mission.execution.status}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="workspace-subpanel rounded-3xl p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                    Paid Execution
                  </p>
                  {paymentSummary ? (
                    <div className="mt-4 space-y-4">
                      <div className="flex items-start gap-3">
                        <Wallet className="mt-0.5 h-5 w-5 text-cyan-400" />
                        <div>
                          <p className="font-semibold text-white">{paymentSummary.merchant}</p>
                          <p className="mt-1 text-sm text-zinc-400">{paymentSummary.resource}</p>
                        </div>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-2xl border border-white/6 bg-black/15 p-4">
                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                            Amount
                          </p>
                          <p className="mt-2 text-sm font-semibold text-white">
                            ${paymentSummary.amountUsd.toFixed(2)}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/6 bg-black/15 p-4">
                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                            Status
                          </p>
                          <div className="mt-2">
                            <StatusPill
                              label={paymentSummary.status}
                              tone={statusTone(paymentSummary.status)}
                            />
                          </div>
                        </div>
                      </div>
                      {paymentSummary.txHash ? (
                        <a
                          href={paymentSummary.explorerUrl ?? "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-300"
                        >
                          View settlement proof
                          <ArrowUpRight className="h-4 w-4" />
                        </a>
                      ) : (
                        <p className="text-sm text-zinc-500">
                          Payment receipt will appear after settlement completes.
                        </p>
                      )}
                    </div>
                  ) : (
                    <EmptyState
                      title="No payment event yet"
                      description="The premium service receipt will appear here when the execution stage reaches a payment-gated action."
                    />
                  )}
                </div>
              </div>
            </div>
          </WorkspaceSection>

          <div className="space-y-6">
            <WorkspaceSection eyebrow="Operator Session" title="Runtime identity">
              <dl>
                <FieldRow label="Operator" value={state.session.operatorName} />
                <FieldRow label="Wallet" value={state.session.operatorWallet} />
                <FieldRow label="Passkey" value={state.session.passkeyLabel} />
                <FieldRow
                  label="Machine path"
                  value={status?.sponsorPath.enterpriseAgentWalletReady ? "Ready" : "Blocked"}
                  tone={status?.sponsorPath.enterpriseAgentWalletReady ? "success" : "warning"}
                />
              </dl>
            </WorkspaceSection>

            <WorkspaceSection eyebrow="Incident Workflow" title="Escalations and overrides">
              {openDispute ? (
                <div className="space-y-4">
                  <div className="rounded-3xl border border-red-500/18 bg-red-500/8 p-5">
                    <div className="flex items-start gap-3">
                      <CircleAlert className="mt-0.5 h-5 w-5 text-red-300" />
                      <div>
                        <p className="font-semibold text-red-200">{openDispute.title}</p>
                        <p className="mt-2 text-sm leading-6 text-red-100/80">
                          {openDispute.description}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-3">
                    <button
                      type="button"
                      onClick={() => void resolveDispute("override")}
                      className="workspace-button-primary rounded-xl px-4 py-3 text-sm font-semibold"
                    >
                      Override Policy
                    </button>
                    <button
                      type="button"
                      onClick={() => void resolveDispute("retry")}
                      className="workspace-button-secondary rounded-xl px-4 py-3 text-sm font-semibold"
                    >
                      Retry Safely
                    </button>
                    <button
                      type="button"
                      onClick={() => void resolveDispute("dismiss")}
                      className="workspace-button-danger rounded-xl px-4 py-3 text-sm font-semibold"
                    >
                      Keep Blocked
                    </button>
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="No incidents open"
                  description="The mission is within policy bounds right now. Use the simulate action to demonstrate human intervention."
                />
              )}
            </WorkspaceSection>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <WorkspaceSection
            eyebrow="Execution Stream"
            title="What the mission is doing now"
            actions={
              <Link
                href="/logs"
                className="workspace-button-secondary inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold"
              >
                Full Logs
              </Link>
            }
          >
            <div className="space-y-3">
              {recentLogs.map((entry) => (
                <div key={entry.id} className="workspace-subpanel rounded-3xl p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-white">{entry.title}</p>
                        <StatusPill label={entry.stage} tone={statusTone(entry.level)} />
                      </div>
                      <p className="mt-2 text-sm leading-6 text-zinc-400">{entry.message}</p>
                    </div>
                    <span className="shrink-0 text-xs text-zinc-500">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </WorkspaceSection>

          <WorkspaceSection
            eyebrow="Task Board"
            title="Current work and findings"
            actions={
              <Link
                href="/mission/memory"
                className="workspace-button-secondary inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold"
              >
                Open Memory
              </Link>
            }
          >
            <div className="space-y-4">
              {activeTasks.length > 0 ? (
                activeTasks.map((task) => (
                  <div key={task.id} className="workspace-subpanel rounded-3xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">{task.title}</p>
                        <p className="mt-2 text-sm leading-6 text-zinc-400">{task.description}</p>
                      </div>
                      <StatusPill
                        label={task.status.replaceAll("_", " ")}
                        tone={statusTone(task.status)}
                      />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3 text-xs text-zinc-500">
                      <span>{task.owner}</span>
                      <span>${task.costUsd.toFixed(2)} est.</span>
                      {task.counterparty ? <span>{task.counterparty}</span> : null}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="Planner has not opened tasks yet"
                  description="Tasks appear when the mission moves through discovery and planning."
                />
              )}

              <div className="rounded-3xl border border-white/8 bg-black/10 p-5">
                <div className="flex items-center gap-3">
                  <Coins className="h-5 w-5 text-emerald-400" />
                  <p className="font-semibold text-white">Findings</p>
                </div>
                <div className="mt-4 space-y-3">
                  {mission.findings.length > 0 ? (
                    mission.findings.map((finding) => (
                      <div key={`${finding.asset}-${finding.protocol}`} className="rounded-2xl border border-white/6 bg-black/15 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-white">
                              {finding.asset} via {finding.protocol}
                            </p>
                            <p className="mt-1 text-sm text-zinc-400">{finding.recommendation}</p>
                          </div>
                          <StatusPill label={finding.status} tone={statusTone(finding.status)} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-zinc-500">
                      Findings will populate after the execution stage completes.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </WorkspaceSection>
        </section>

        <WorkspaceSection
          eyebrow="Secondary Modules"
          title="Conditionally attached rails and evidence"
          description="Starknet, Filecoin, and Storacha only surface when they are configured or already attached to the mission. They do not compete with the primary runtime story."
        >
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="workspace-subpanel rounded-3xl p-5">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-amber-300" />
                <p className="font-semibold text-white">Starknet</p>
                <StatusPill
                  label={status?.sponsorPath.starknetReady ? "Ready" : "Waiting"}
                  tone={status?.sponsorPath.starknetReady ? "ready" : "warning"}
                />
              </div>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                {secondaryRailTransactions.some((item) => item.rail === "private")
                  ? "Private intent receipts are attached to this mission."
                  : "Private intent remains out of the operator path until the proof rail is fully configured."}
              </p>
            </div>
            <div className="workspace-subpanel rounded-3xl p-5">
              <div className="flex items-center gap-3">
                <FileArchive className="h-5 w-5 text-cyan-400" />
                <p className="font-semibold text-white">Filecoin</p>
                <StatusPill
                  label={mission.artifacts.some((artifact) => artifact.cid) ? "Attached" : "Waiting"}
                  tone={mission.artifacts.some((artifact) => artifact.cid) ? "ready" : "warning"}
                />
              </div>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                Durable evidence is exposed through the receipts vault once manifests and bundles are pinned.
              </p>
            </div>
            <div className="workspace-subpanel rounded-3xl p-5">
              <div className="flex items-center gap-3">
                <Bot className="h-5 w-5 text-emerald-400" />
                <p className="font-semibold text-white">Storacha</p>
                <StatusPill
                  label={mission.memory.some((item) => item.cid) ? "Attached" : "Waiting"}
                  tone={mission.memory.some((item) => item.cid) ? "ready" : "warning"}
                />
              </div>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                Shared memory remains secondary until the core execution path is proven and stable.
              </p>
            </div>
          </div>
        </WorkspaceSection>
      </div>
    </FrontierShell>
  );
}
