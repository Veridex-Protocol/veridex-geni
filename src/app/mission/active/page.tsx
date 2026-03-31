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
import { WithHelp } from "@/components/frontierguard/help-sys";

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
  const runtimeHealth = status?.runtimeHealth;

  return (
    <FrontierShell
      eyebrow="Execution Board"
      title="Live Runtime Telemetry"
      description="Operate the primary path first: passkey control, x402 settlement, ERC-8004 trust, and exportable evidence."
      actions={
        <div className="flex items-center gap-2">
          <WithHelp id="btn-active-next" text="Progress the execution context to the next sequential stage.">
            <button
              type="button"
              onClick={() => void advanceMission()}
              disabled={state.loading || mission.status === "completed"}
              className="workspace-button-secondary rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              Run Next Stage
            </button>
          </WithHelp>
          <WithHelp id="btn-active-auto" text="Enable fully autonomous progression across all execution layers.">
            <button
              type="button"
              onClick={() => void runAutopilot()}
              disabled={state.loading || mission.status === "completed"}
              className="workspace-button-primary rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              Autopilot
            </button>
          </WithHelp>
          <WithHelp id="btn-active-sim" text="Inject a mock policy violation to test operator dispute handling.">
            <button
              type="button"
              onClick={() => void simulateViolation()}
              className="workspace-button-danger rounded-xl px-4 py-2 text-sm font-semibold"
            >
              Simulate Incident
            </button>
          </WithHelp>
        </div>
      }
    >
      <div className="space-y-6 max-w-[1400px] mx-auto animate-in fade-in zoom-in-95 duration-500">
        {state.error ? (
          <div className="rounded-2xl border border-red-500/18 bg-red-500/8 px-5 py-4 text-sm text-red-200">
            {state.error}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <WithHelp id="active-runtime" text="Percentage of total planned tasks that have been successfully settled.">
            <MetricCard
              label="Runtime Progress"
              value={`${progressPct}%`}
              helper={`Stage: ${mission.activeStage}`}
              tone="primary"
            />
          </WithHelp>
          <WithHelp id="active-budget" text="Capital pool remaining for x402 resource access.">
            <MetricCard
              label="Remaining Budget"
              value={`$${remainingBudgetUsd.toFixed(2)}`}
              helper={`Spent: $${mission.budget.spentUsd.toFixed(2)}`}
              tone="success"
            />
          </WithHelp>
          <WithHelp id="active-payments" text="Count of premium actions paid for programmatically.">
            <MetricCard
              label="Total Payments"
              value={String(mission.payments.length)}
              helper={`${livePayments.length} with receipts`}
              tone={livePayments.length > 0 ? "success" : "warning"}
            />
          </WithHelp>
          <WithHelp id="active-tasks" text="Number of parallel execution threads currently active.">
            <MetricCard
              label="Open Tasks"
              value={String(activeTasks.length)}
              helper={`${mission.findings.length} findings ready`}
              tone="primary"
            />
          </WithHelp>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <WorkspaceSection
            eyebrow="Current Run"
            title={mission.title}
            description={mission.objective}
            actions={
              <WithHelp id="btn-view-evidence" text="View verified trust receipts mapped to this mission.">
                <div className="flex items-center gap-3">
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
                    className="workspace-button-secondary inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold hover:bg-zinc-800 transition-colors"
                  >
                    Open Receipts
                  </Link>
                </div>
              </WithHelp>
            }
          >
            <div className="space-y-6">
              <div className="bg-zinc-950/60 p-5 rounded-3xl border border-zinc-800/80 shadow-inner">
                <StageStrip stages={mission.stages} />
              </div>
              <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
                <WithHelp id="stage-summary" text="The immediate lifecycle phase the agents are navigating.">
                  <div className="relative overflow-hidden workspace-subpanel rounded-3xl p-6 border-zinc-800">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-[40px] pointer-events-none" />
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-500 mb-2">
                      Active Stage Summary
                    </p>
                    <div className="mt-2 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xl font-semibold text-white tracking-tight">{activeStage.label}</p>
                        <p className="mt-2 text-sm leading-6 text-zinc-400 max-w-sm">{activeStage.summary}</p>
                      </div>
                      <StatusPill label={activeStage.status} tone={statusTone(activeStage.status)} />
                    </div>
                  </div>
                </WithHelp>

                <WithHelp id="paid-execution" text="Verifiable x402 commercial access to premium APIs and compute networks.">
                  <div className="workspace-subpanel rounded-3xl p-6 border-zinc-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Wallet className="h-4 w-4 text-emerald-400" />
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-500">
                        Paid Execution
                      </p>
                    </div>
                    {paymentSummary ? (
                      <div className="mt-2 space-y-4">
                        <div>
                          <p className="font-semibold text-white">{paymentSummary.merchant}</p>
                          <p className="mt-1 text-sm text-zinc-400">{paymentSummary.resource}</p>
                        </div>
                        <div className="flex items-center justify-between border-t border-zinc-800/80 pt-4">
                          <div>
                            <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Amount</p>
                            <p className="text-sm font-semibold text-white">${paymentSummary.amountUsd.toFixed(2)}</p>
                          </div>
                          <StatusPill
                            label={paymentSummary.status}
                            tone={statusTone(paymentSummary.status)}
                          />
                        </div>
                        {paymentSummary.txHash && (
                          <a
                            href={paymentSummary.explorerUrl ?? "#"}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 hover:text-emerald-200"
                          >
                            View settlement proof <ArrowUpRight className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    ) : (
                      <div className="mt-4">
                        <EmptyState
                          title="No settlement yet"
                          description="Premium action receipts will appear when the stage triggers payment."
                        />
                      </div>
                    )}
                  </div>
                </WithHelp>
              </div>
            </div>
          </WorkspaceSection>

          <div className="space-y-6">
            {runtimeHealth ? (
              <WorkspaceSection eyebrow="Live Proof Checklist" title="Judge-critical runtime health">
                <div className="grid gap-3">
                  <div className="workspace-subpanel rounded-3xl p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-white">Signer path</p>
                      <StatusPill
                        label={
                          runtimeHealth.signerSource === "session_wallet"
                            ? "Session signer"
                            : runtimeHealth.signerSource === "erc8004_private_key"
                              ? "Dedicated signer"
                              : "Unavailable"
                        }
                        tone={runtimeHealth.available ? "ready" : "warning"}
                      />
                    </div>
                  </div>
                  <div className="workspace-subpanel rounded-3xl p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-white">ERC-8004 write</p>
                      <StatusPill
                        label={runtimeHealth.liveWriteReady ? "Ready" : "Gas required"}
                        tone={runtimeHealth.liveWriteReady ? "ready" : "warning"}
                      />
                    </div>
                  </div>
                  <div className="workspace-subpanel rounded-3xl p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-white">x402 payment</p>
                      <StatusPill
                        label={runtimeHealth.livePaymentReady ? "Ready" : "Asset required"}
                        tone={runtimeHealth.livePaymentReady ? "ready" : "warning"}
                      />
                    </div>
                  </div>
                  {runtimeHealth.warnings.length ? (
                    <div className="rounded-3xl border border-amber-500/20 bg-amber-500/8 p-4 text-sm leading-6 text-amber-100">
                      {runtimeHealth.warnings[0]}
                    </div>
                  ) : null}
                </div>
              </WorkspaceSection>
            ) : null}

            <WithHelp id="operator-escalation" text="Policy-violation handler. Allows the human-in-the-loop to override or block actions exceeding the budget.">
              <WorkspaceSection eyebrow="Incident Workflow" title="Escalations Center">
                {openDispute ? (
                  <div className="space-y-4">
                    <div className="rounded-3xl border border-red-500/20 bg-gradient-to-br from-red-500/10 to-red-500/5 p-5 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                      <div className="flex items-start gap-4">
                        <div className="bg-red-500/20 p-2.5 rounded-xl border border-red-500/30">
                          <CircleAlert className="h-5 w-5 text-red-400" />
                        </div>
                        <div className="pt-0.5">
                          <p className="font-semibold text-red-200">{openDispute.title}</p>
                          <p className="mt-1 text-sm leading-6 text-red-200/70">
                            {openDispute.description}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => void resolveDispute("override")}
                        className="workspace-button-primary rounded-xl px-4 py-3 text-sm font-semibold"
                      >
                        Override
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
                        className="workspace-button-danger rounded-xl px-4 py-3 text-sm font-semibold col-span-2 xl:col-span-1"
                      >
                        Keep Blocked
                      </button>
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    title="No incidents open"
                    description="Mission follows policy. Simulate an incident above to test."
                  />
                )}
              </WorkspaceSection>
            </WithHelp>

            <WithHelp id="identity-verify" text="Passkey-bound wallet and operator identity validation.">
              <WorkspaceSection eyebrow="Operator Session" title="Runtime Identity">
                <div className="bg-zinc-900/40 p-5 rounded-3xl border border-zinc-800/80 space-y-3">
                  <FieldRow label="Operator" value={state.session.operatorName} />
                  <FieldRow label="Wallet" value={<span className="font-mono text-cyan-400 truncate w-32 inline-block ml-auto">{state.session.operatorWallet}</span>} />
                  <FieldRow label="Passkey" value={state.session.passkeyLabel} />
                  <FieldRow
                    label="Machine path"
                    value={status?.sponsorPath.enterpriseAgentWalletReady ? "Ready" : "Blocked"}
                    tone={status?.sponsorPath.enterpriseAgentWalletReady ? "success" : "warning"}
                  />
                </div>
              </WorkspaceSection>
            </WithHelp>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <WithHelp id="active-activities" text="Unified streaming telemetry combining logs, policy evaluations, and API outputs.">
            <WorkspaceSection
              eyebrow="Execution Stream"
              title="Live Console Output"
              actions={
                <Link
                  href="/logs"
                  className="text-xs font-mono text-cyan-500 hover:text-cyan-400 bg-cyan-500/10 px-3 py-1.5 rounded-lg border border-cyan-500/20"
                >
                  [EXPAND_LOGS]
                </Link>
              }
            >
              <div className="space-y-3 bg-zinc-950/80 p-5 rounded-3xl border border-zinc-800 border-l-2 border-l-cyan-500 shadow-inner">
                {recentLogs.map((entry) => (
                  <div key={entry.id} className="grid grid-cols-[60px_1fr] gap-4 py-2 border-b border-zinc-900/50 last:border-0 hover:bg-zinc-900/30 rounded-lg px-2 -mx-2 transition-colors">
                    <span className="text-[10px] text-zinc-600 font-mono self-center">
                      {new Date(entry.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
                    </span>
                    <div className="flex items-start gap-2">
                      <span className={`px-1.5 py-0.5 rounded-[4px] text-[9px] uppercase tracking-wider font-bold shrink-0 mt-px
                          ${entry.level === 'error' ? 'bg-red-500/15 text-red-400' 
                          : entry.level === 'warning' ? 'bg-amber-500/15 text-amber-400'
                          : entry.level === 'success' ? 'bg-cyan-500/15 text-cyan-400'
                          : 'bg-zinc-800 text-zinc-300'}
                        `}>{entry.stage}</span>
                      <span className="text-xs text-zinc-300 font-mono leading-relaxed">{entry.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            </WorkspaceSection>
          </WithHelp>

          <WithHelp id="active-findings" text="Structured outputs and intelligence gathered from mission execution.">
            <WorkspaceSection
              eyebrow="Task Board"
              title="Worker Discoveries"
            >
              <div className="space-y-4">
                <div className="rounded-3xl border border-zinc-800/80 bg-gradient-to-br from-emerald-500/5 to-transparent p-6 shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] pointer-events-none" />
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="bg-emerald-500/20 p-2 rounded-xl ring-1 ring-emerald-500/30">
                      <Coins className="h-5 w-5 text-emerald-400" />
                    </div>
                    <p className="text-lg font-light tracking-tight text-white">Aggregated Findings</p>
                  </div>
                  <div className="mt-5 space-y-3 relative z-10">
                    {mission.findings.length > 0 ? (
                      mission.findings.map((finding) => (
                        <div key={`${finding.asset}-${finding.protocol}`} className="rounded-2xl border border-zinc-700/50 bg-zinc-900/60 p-4 transition-colors hover:border-emerald-500/30 hover:bg-zinc-900/80">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-white tracking-tight text-sm">
                                {finding.asset} <span className="text-zinc-500 font-normal mx-1">via</span> {finding.protocol}
                              </p>
                              <p className="mt-1 text-xs text-zinc-400">{finding.recommendation}</p>
                            </div>
                            <StatusPill label={finding.status} tone={statusTone(finding.status)} />
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-zinc-500 italic bg-black/20 p-4 rounded-xl border border-zinc-800/50">
                        Awaiting execution to complete before summarizing intelligence...
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </WorkspaceSection>
          </WithHelp>
        </section>

        <WithHelp id="secondary-rails" text="Optional cryptographic proof subsystems. E.g., Starknet verification, distributed Filecoin logs.">
          <WorkspaceSection
            eyebrow="Secondary Modules"
            title="Evidence & Scaling Rails"
            description="Starknet, Filecoin, and Storacha conditionally surface when actively utilized."
          >
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="workspace-subpanel rounded-3xl p-6 border-zinc-800 hover:border-amber-500/30 transition-colors group">
                <div className="flex items-center gap-3 justify-between mb-4 pb-4 border-b border-zinc-800/80">
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-500/10 p-2 rounded-xl border border-amber-500/20 group-hover:bg-amber-500/20 transition-colors">
                      <ShieldCheck className="h-5 w-5 text-amber-400" />
                    </div>
                    <p className="font-semibold text-white tracking-tight">Starknet</p>
                  </div>
                  <StatusPill
                    label={status?.sponsorPath.starknetReady ? "Ready" : "Waiting"}
                    tone={status?.sponsorPath.starknetReady ? "ready" : "warning"}
                  />
                </div>
                <p className="text-xs leading-relaxed text-zinc-400">
                  {secondaryRailTransactions.some((item) => item.rail === "private")
                    ? "Private intent receipts successfully generated and bridged."
                    : "Zero-knowledge scaling path standing by."}
                </p>
              </div>

              <div className="workspace-subpanel rounded-3xl p-6 border-zinc-800 hover:border-cyan-500/30 transition-colors group">
                <div className="flex items-center gap-3 justify-between mb-4 pb-4 border-b border-zinc-800/80">
                  <div className="flex items-center gap-3">
                    <div className="bg-cyan-500/10 p-2 rounded-xl border border-cyan-500/20 group-hover:bg-cyan-500/20 transition-colors">
                      <FileArchive className="h-5 w-5 text-cyan-400" />
                    </div>
                    <p className="font-semibold text-white tracking-tight">Filecoin</p>
                  </div>
                  <StatusPill
                    label={mission.artifacts.some((artifact) => artifact.cid) ? "Attached" : "Waiting"}
                    tone={mission.artifacts.some((artifact) => artifact.cid) ? "ready" : "warning"}
                  />
                </div>
                <p className="text-xs leading-relaxed text-zinc-400">
                  Secure immutable storage of event payloads and policy bundles natively pinned to IPFS.
                </p>
              </div>

              <div className="workspace-subpanel rounded-3xl p-6 border-zinc-800 hover:border-emerald-500/30 transition-colors group">
                <div className="flex items-center gap-3 justify-between mb-4 pb-4 border-b border-zinc-800/80">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
                      <Bot className="h-5 w-5 text-emerald-400" />
                    </div>
                    <p className="font-semibold text-white tracking-tight">Storacha</p>
                  </div>
                  <StatusPill
                    label={mission.memory.some((item) => item.cid) ? "Attached" : "Waiting"}
                    tone={mission.memory.some((item) => item.cid) ? "ready" : "warning"}
                  />
                </div>
                <p className="text-xs leading-relaxed text-zinc-400">
                  Multi-agent swarming context storage, allowing robust deterministic runtime retrieval.
                </p>
              </div>
            </div>
          </WorkspaceSection>
        </WithHelp>
      </div>
    </FrontierShell>
  );
}
