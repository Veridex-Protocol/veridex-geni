"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Bot,
  CircleAlert,
  FileCheck2,
  Fingerprint,
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
  ReadinessStrip,
  StatusPill,
  WorkspaceSection,
} from "@/components/frontierguard/workspace-primitives";
import { useFrontierGuard } from "@/components/frontierguard/provider";

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString();
}

export default function OverviewCommandCenterPage() {
  const {
    mission,
    notifications,
    openDispute,
    remainingBudgetUsd,
    progressPct,
    advanceMission,
    runAutopilot,
    resetDemo,
    state,
  } = useFrontierGuard();
  const { status, loading, readiness } = useFrontierStatus();

  const activeStage =
    mission.stages.find((stage) => stage.key === mission.activeStage) ?? mission.stages[0];
  const activeTasks = mission.tasks.filter((task) => task.status !== "completed");
  const latestLogs = mission.logs.slice(-5).reverse();
  const pinnedArtifacts = mission.artifacts.filter((artifact) => artifact.status === "pinned").length;
  const readinessItems = [
    {
      label: "Core Path",
      description: readiness.corePathReady
        ? "Passkey session, runtime wallet, x402, and ERC-8004 are aligned."
        : "Complete passkey session and sponsor-path infra before live operator use.",
      status: readiness.corePathReady ? "ready" : state.session.authenticated ? "warning" : "blocked",
    },
    {
      label: "Runtime Wallet",
      description: readiness.runtimeWalletBound
        ? "Server runtime can bind this operator to enterprise execution."
        : "Waiting for an authenticated passkey-backed operator session.",
      status: readiness.runtimeWalletBound ? "ready" : "waiting",
    },
    {
      label: "x402 Payments",
      description: readiness.x402Ready
        ? "Payment-gated services are ready for live settlement and receipts."
        : "Paywall path is not fully configured yet.",
      status: readiness.x402Ready ? "ready" : "warning",
    },
    {
      label: "ERC-8004 Trust",
      description: readiness.erc8004Ready
        ? "Identity and reputation writes are ready for explorer-backed proofs."
        : "Trust receipts are still blocked on write access.",
      status: readiness.erc8004Ready ? "ready" : "warning",
    },
    {
      label: "Secondary Rails",
      description: readiness.secondaryRailsReady
        ? "Optional Starknet or storage modules can be attached when needed."
        : "Starknet, Filecoin, and Storacha remain gated until configured.",
      status: readiness.secondaryRailsReady ? "ready" : "waiting",
    },
  ] as const;

  return (
    <FrontierShell
      eyebrow="Operator Workspace"
      title="Mission control for bounded autonomous execution"
      description="Launch, monitor, and verify one production-grade mission flow: passkey-authenticated control, x402 settlement, ERC-8004 trust, and durable receipts."
      actions={
        <>
          <Link
            href="/mission/launch"
            className="workspace-button-primary inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold"
          >
            Launch Mission
          </Link>
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
            className="workspace-button-secondary rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            Autopilot
          </button>
          <button
            type="button"
            onClick={resetDemo}
            className="workspace-button-secondary rounded-xl px-4 py-2 text-sm font-semibold"
          >
            Reset
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

        <ReadinessStrip items={readinessItems.map((item) => ({ ...item }))} />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Mission Status"
            value={mission.status.toUpperCase()}
            helper={`${progressPct}% lifecycle progress`}
            tone={mission.status === "blocked" ? "danger" : mission.status === "completed" ? "success" : "primary"}
          />
          <MetricCard
            label="Budget Remaining"
            value={`$${remainingBudgetUsd.toFixed(2)}`}
            helper={`$${mission.budget.spentUsd.toFixed(2)} already committed`}
            tone="success"
          />
          <MetricCard
            label="Trust Score"
            value={`${mission.identity.trustScore.toFixed(1)} / 100`}
            helper={`Agent: ${mission.identity.agentName}`}
            tone="primary"
          />
          <MetricCard
            label="Evidence Vault"
            value={`${pinnedArtifacts}/${mission.artifacts.length}`}
            helper="Artifacts pinned and recoverable"
            tone={pinnedArtifacts > 0 ? "success" : "warning"}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <WorkspaceSection
            eyebrow="Active Mission"
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
                  href="/mission/active"
                  className="workspace-button-secondary inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold"
                >
                  Open Execution
                </Link>
              </>
            }
          >
            <div className="space-y-6">
              <StageStrip stages={mission.stages} />

              <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="workspace-subpanel rounded-3xl p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                        Current Stage
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-white">{activeStage.label}</h3>
                    </div>
                    <StatusPill
                      label={activeStage.status}
                      tone={
                        activeStage.status === "completed"
                          ? "ready"
                          : activeStage.status === "blocked"
                            ? "blocked"
                            : activeStage.status === "active"
                              ? "waiting"
                              : "neutral"
                      }
                    />
                  </div>
                  <p className="mt-4 text-sm leading-6 text-zinc-400">{activeStage.summary}</p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      href="/mission/launch"
                      className="workspace-button-primary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
                    >
                      Reconfigure Mission
                    </Link>
                    <Link
                      href="/receipts"
                      className="workspace-button-secondary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
                    >
                      Open Receipts
                    </Link>
                  </div>
                </div>

                <div className="workspace-subpanel rounded-3xl p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                    Primary Mission Path
                  </p>
                  <div className="mt-4 space-y-4">
                    <div className="flex items-start gap-3">
                      <Fingerprint className="mt-0.5 h-4 w-4 text-emerald-400" />
                      <p className="text-sm leading-6 text-zinc-300">
                        Passkey-backed operator session controls irreversible actions.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <Wallet className="mt-0.5 h-4 w-4 text-cyan-400" />
                      <p className="text-sm leading-6 text-zinc-300">
                        x402 paid services settle through the runtime wallet under budget bounds.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-400" />
                      <p className="text-sm leading-6 text-zinc-300">
                        ERC-8004 identity and reputation produce portable trust receipts for the run.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <FileCheck2 className="mt-0.5 h-4 w-4 text-cyan-400" />
                      <p className="text-sm leading-6 text-zinc-300">
                        Evidence artifacts stay attached to the mission and ready for export.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </WorkspaceSection>

          <div className="space-y-6">
            <WorkspaceSection eyebrow="Operator Queue" title="Immediate attention">
              {openDispute ? (
                <div className="workspace-subpanel rounded-3xl border border-red-500/18 bg-red-500/8 p-5">
                  <div className="flex items-start gap-3">
                    <CircleAlert className="mt-0.5 h-5 w-5 text-red-300" />
                    <div>
                      <p className="font-semibold text-red-200">{openDispute.title}</p>
                      <p className="mt-2 text-sm leading-6 text-red-100/80">
                        {openDispute.description}
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/dispute"
                    className="workspace-button-danger mt-4 inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold"
                  >
                    Review Escalation
                  </Link>
                </div>
              ) : (
                <EmptyState
                  title="No operator escalations"
                  description="The mission is still within its policy bounds. Simulate an incident from Execution to demo manual intervention."
                />
              )}
            </WorkspaceSection>

            <WorkspaceSection eyebrow="Proof Posture" title="Trust and runtime snapshot">
              <dl>
                <FieldRow label="ERC-8004 Identity" value={mission.identity.erc8004Identity} />
                <FieldRow
                  label="Registration Tx"
                  value={mission.identity.registrationTxHash.slice(0, 18).concat("...")}
                  tone="success"
                />
                <FieldRow label="Runtime Wallet" value={state.session.operatorWallet} />
                <FieldRow
                  label="Machine Access"
                  value={loading ? "Checking readiness..." : readiness.corePathReady ? "Ready" : "Needs configuration"}
                  tone={readiness.corePathReady ? "success" : "warning"}
                />
              </dl>
            </WorkspaceSection>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <WorkspaceSection
            eyebrow="Task Board"
            title="Current operator workload"
            actions={
              <Link
                href="/mission/memory"
                className="workspace-button-secondary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
              >
                Open Memory
              </Link>
            }
          >
            <div className="space-y-3">
              {activeTasks.length > 0 ? (
                activeTasks.slice(0, 4).map((task) => (
                  <div key={task.id} className="workspace-subpanel rounded-3xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">{task.title}</p>
                        <p className="mt-2 text-sm leading-6 text-zinc-400">{task.description}</p>
                      </div>
                      <StatusPill
                        label={task.status.replaceAll("_", " ")}
                        tone={
                          task.status === "blocked"
                            ? "blocked"
                            : task.status === "in_progress"
                              ? "waiting"
                              : task.status === "completed"
                                ? "ready"
                                : "neutral"
                        }
                      />
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                      <span>{task.owner}</span>
                      <span>${task.costUsd.toFixed(2)} estimated</span>
                      {task.counterparty ? <span>{task.counterparty}</span> : null}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No active tasks yet"
                  description="The planner will open task cards once the mission reaches discovery and planning."
                />
              )}
            </div>
          </WorkspaceSection>

          <WorkspaceSection
            eyebrow="Latest Activity"
            title="Recent mission events"
            actions={
              <Link
                href="/logs"
                className="workspace-button-secondary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
              >
                Open Logs
              </Link>
            }
          >
            <div className="space-y-3">
              {latestLogs.map((entry) => (
                <div key={entry.id} className="workspace-subpanel rounded-3xl p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-white">{entry.title}</p>
                        <StatusPill
                          label={entry.stage}
                          tone={
                            entry.level === "error"
                              ? "blocked"
                              : entry.level === "warning"
                                ? "warning"
                                : entry.level === "success"
                                  ? "ready"
                                  : "neutral"
                          }
                        />
                      </div>
                      <p className="mt-2 text-sm leading-6 text-zinc-400">{entry.message}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 text-xs text-zinc-500">
                      <span>{formatTimestamp(entry.timestamp)}</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </div>
              ))}

              {notifications.length > 0 ? (
                <div className="workspace-subpanel rounded-3xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                    Latest Notifications
                  </p>
                  <div className="mt-3 space-y-3">
                    {notifications.slice(0, 2).map((notification) => (
                      <div key={notification.id} className="rounded-2xl border border-white/6 bg-black/15 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-zinc-100">{notification.title}</p>
                            <p className="mt-1 text-sm text-zinc-400">{notification.message}</p>
                          </div>
                          <StatusPill
                            label={notification.kind}
                            tone={
                              notification.kind === "critical"
                                ? "blocked"
                                : notification.kind === "success"
                                  ? "ready"
                                  : "neutral"
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </WorkspaceSection>
        </section>

        <WorkspaceSection
          eyebrow="Agent Control Plane"
          title="Production posture for autonomous clients"
          description="This workspace is being hardened for real operators and agent clients, not just a hackathon demo. Machine access, paid actions, and trust proofs stay scoped to the same mission model."
        >
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="workspace-subpanel rounded-3xl p-5">
              <div className="flex items-center gap-3">
                <Bot className="h-5 w-5 text-emerald-400" />
                <p className="font-semibold text-white">Agent Runtime</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                OpenClaw-style agents can be bound to the same operator session and pay for premium actions on the control plane.
              </p>
            </div>
            <div className="workspace-subpanel rounded-3xl p-5">
              <div className="flex items-center gap-3">
                <Wallet className="h-5 w-5 text-cyan-400" />
                <p className="font-semibold text-white">Paid Services</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                x402 remains the default commercial path so paid resources can be invoked without breaking the mission narrative.
              </p>
            </div>
            <div className="workspace-subpanel rounded-3xl p-5">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <p className="font-semibold text-white">Proof Surfaces</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                ERC-8004, receipts, and evidence artifacts are kept operator-facing first and sponsor-facing second.
              </p>
            </div>
          </div>
        </WorkspaceSection>
      </div>
    </FrontierShell>
  );
}
