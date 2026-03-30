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
  Activity,
  Layers,
  Lock,
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

  return (
    <FrontierShell
      eyebrow="Mission Command Center"
      title="FrontierGuard Operations"
      description="Centralized view for your agentic fleets. Launch missions, monitor telemetry, and review cryptographic proofs of execution."
      actions={
        <div className="flex items-center gap-2">
          <WithHelp id="btn-launch" text="Launch a completely new mission with a defined workflow and budget.">
            <Link
              href="/mission/launch"
              className="workspace-button-primary inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold hover:bg-zinc-100 transition-colors"
            >
              Launch Mission
            </Link>
          </WithHelp>
          <WithHelp id="btn-next" text="Manually advance the current mission to its next logical stage.">
            <button
              type="button"
              onClick={() => void advanceMission()}
              disabled={state.loading || mission.status === "completed"}
              className="workspace-button-secondary bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/50 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50 transition-colors"
            >
              Next Stage
            </button>
          </WithHelp>
          <WithHelp id="btn-auto" text="Enable Autopilot to let the system execute the remaining stages automatically.">
            <button
              type="button"
              onClick={() => void runAutopilot()}
              disabled={state.loading || mission.status === "completed"}
              className="workspace-button-secondary bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] border border-cyan-500/30 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50 transition-all active:scale-95"
            >
              Autopilot
            </button>
          </WithHelp>
          <WithHelp id="btn-reset" text="Reset the demo environment and wipe current mission state.">
            <button
              type="button"
              onClick={resetDemo}
              className="workspace-button-secondary bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
            >
              Reset
            </button>
          </WithHelp>
        </div>
      }
    >
      <div className="space-y-6 max-w-[1400px] mx-auto animate-in fade-in duration-500">
        {state.error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-200">
            {state.error}
          </div>
        ) : null}

        {/* Elevated top row: Core metrics & Alert */}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <WithHelp id="metric-status" text="Displays the current lifecycle state of the entire fleet.">
            <MetricCard
              label="Mission Status"
              value={mission.status.replace("_", " ").toUpperCase()}
              helper={`${progressPct}% lifecycle progress`}
              tone={mission.status === "blocked" ? "danger" : mission.status === "completed" ? "success" : "primary"}
            />
          </WithHelp>
          <WithHelp id="metric-budget" text="Remaining operational budget bound by policy constraints.">
            <MetricCard
              label="Budget Remaining"
              value={`$${remainingBudgetUsd.toFixed(2)}`}
              helper={`$${mission.budget.spentUsd.toFixed(2)} deployed`}
              tone="success"
            />
          </WithHelp>
          <WithHelp id="metric-trust" text="Real-time computation of trust based on ERC-8004 reputation receipts.">
            <MetricCard
              label="Trust Score"
              value={`${mission.identity.trustScore.toFixed(1)} / 100`}
              helper={`Agent: ${mission.identity.agentName}`}
              tone="primary"
            />
          </WithHelp>
          <WithHelp id="metric-evidence" text="Vault containing zero-knowledge execution proofs and immutable artifacts.">
            <MetricCard
              label="Evidence Vault"
              value={`${pinnedArtifacts}/${mission.artifacts.length}`}
              helper="Pinned cryptographic receipts"
              tone={pinnedArtifacts > 0 ? "success" : "warning"}
            />
          </WithHelp>
        </section>

        {openDispute && (
          <WithHelp id="operator-queue" text="Urgent operator interventions required by smart policy anomalies.">
            <div className="rounded-3xl border border-red-500/30 bg-gradient-to-r from-red-500/10 to-red-500/5 p-6 flex items-center justify-between backdrop-blur-sm shadow-[0_0_30px_rgba(239,68,68,0.1)]">
              <div className="flex items-center gap-4">
                <div className="bg-red-500/20 p-3 rounded-2xl ring-1 ring-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                  <CircleAlert className="h-6 w-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-red-200">{openDispute.title}</h3>
                  <p className="mt-1 text-sm text-red-200/70">{openDispute.description}</p>
                </div>
              </div>
              <Link
                href="/dispute"
                className="workspace-button-danger rounded-xl px-6 py-3 text-sm font-bold shadow-lg shadow-red-500/20 hover:scale-[1.02] transition-transform active:scale-95"
              >
                Resolve Incident
              </Link>
            </div>
          </WithHelp>
        )}

        <div className="grid gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {/* Main Execution View (consumes 2-3 columns depending on screen size) */}
          <div className="lg:col-span-2 xl:col-span-3 space-y-6">
            <WithHelp id="active-execution" text="Live visualization of the multi-agent pipeline and progress through configured stages.">
              <WorkspaceSection
                eyebrow="Execution Pipeline"
                title={mission.title}
                description={mission.objective}
                actions={
                  <Link
                    href="/mission/active"
                    className="workspace-button-secondary text-sm px-4 py-2 rounded-xl transition-colors hover:bg-zinc-800"
                  >
                    View Timeline
                  </Link>
                }
              >
                <div className="space-y-6">
                  <div className="bg-zinc-950/60 p-5 rounded-3xl border border-zinc-800/80 shadow-inner">
                    <StageStrip stages={mission.stages} />
                  </div>
                  
                  <div className="relative overflow-hidden workspace-subpanel rounded-3xl p-6 border-zinc-800 shadow-lg">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-bl-[100px] pointer-events-none" />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.15em] text-cyan-400/80 mb-2 font-bold">Active Operation</p>
                        <h3 className="text-2xl font-light text-white tracking-tight">{activeStage.label}</h3>
                      </div>
                      <StatusPill
                        label={activeStage.status.toUpperCase()}
                        tone={
                          activeStage.status === "completed" ? "ready"
                          : activeStage.status === "blocked" ? "blocked"
                          : activeStage.status === "active" ? "waiting" : "neutral"
                        }
                      />
                    </div>
                    <p className="mt-4 text-sm text-zinc-400 leading-relaxed max-w-2xl">{activeStage.summary}</p>
                  </div>

                  <WithHelp id="task-queue" text="A ledger of atomic tasks executed by agent workers in the current stage.">
                    <div className="space-y-4">
                      <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold ml-1">Atomic Execution Graph</p>
                      <div className="grid gap-4 md:grid-cols-2">
                        {activeTasks.length > 0 ? (
                          activeTasks.slice(0, 4).map((task) => (
                            <div key={task.id} className="group workspace-subpanel rounded-2xl p-5 border border-zinc-800/80 hover:border-cyan-500/30 hover:bg-cyan-950/10 transition-all duration-300">
                              <div className="flex justify-between items-start mb-3">
                                <p className="font-medium text-zinc-100 text-sm line-clamp-1 group-hover:text-cyan-100 transition-colors">{task.title}</p>
                                <StatusPill label={task.status.replace("_", " ")} tone={task.status === "completed" ? "ready" : "waiting"} />
                              </div>
                              <p className="text-xs text-zinc-500 line-clamp-2 mb-4 group-hover:text-zinc-400 transition-colors">{task.description}</p>
                              <div className="flex justify-between items-center text-[10px] text-zinc-600 font-mono pt-3 border-t border-zinc-800/50">
                                <span className="flex items-center gap-1.5"><Bot className="w-3.5 h-3.5"/> {task.owner}</span>
                                <span className="text-cyan-500/70 bg-cyan-500/10 px-2 py-0.5 rounded">${task.costUsd.toFixed(2)}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-2">
                            <EmptyState
                              title="No pending tasks"
                              description="Agents are currently idle or planning next steps."
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </WithHelp>
                </div>
              </WorkspaceSection>
            </WithHelp>

            <WithHelp id="live-telemetry" text="Real-time unified log stream tracking state mutations, warnings, and success events across the pipeline.">
              <WorkspaceSection
                eyebrow="Telemetry Log"
                title="Live System Feed"
                actions={
                  <Link href="/logs" className="text-xs font-mono text-cyan-500 hover:text-cyan-400 transition-colors flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-cyan-500/10">
                    [EXPAND LOGS] <ArrowUpRight className="w-3 h-3" />
                  </Link>
                }
              >
                <div className="bg-zinc-950 rounded-2xl p-5 border border-zinc-800/80 shadow-inner overflow-hidden font-mono text-[11px] leading-relaxed relative">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-500/20 to-transparent" />
                  {latestLogs.map((entry) => (
                    <div key={entry.id} className="grid grid-cols-[70px_1fr] gap-4 py-2 border-b border-zinc-900/50 last:border-0 hover:bg-zinc-900/40 transition-colors rounded-lg px-2 -mx-2">
                      <div className="text-zinc-600 self-center">{new Date(entry.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}</div>
                      <div className="flex items-start gap-2">
                        <span className={`px-1.5 py-0.5 rounded-[4px] text-[9px] uppercase tracking-wider font-bold shrink-0 mt-px
                          ${entry.level === 'error' ? 'bg-red-500/15 text-red-400' 
                          : entry.level === 'warning' ? 'bg-amber-500/15 text-amber-400'
                          : entry.level === 'success' ? 'bg-cyan-500/15 text-cyan-400'
                          : 'bg-zinc-800 text-zinc-300'}
                        `}>{entry.stage}</span>
                        <span className="text-zinc-300 tracking-tight">{entry.message}</span>
                      </div>
                    </div>
                  ))}
                  {latestLogs.length === 0 && <span className="text-zinc-600 block px-2 italic">Listening for events...</span>}
                </div>
              </WorkspaceSection>
            </WithHelp>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6 lg:col-span-1 xl:col-span-1">
            <WithHelp id="identity-posture" text="Cryptographic primitives assigned to the operator and agent, ensuring trustless execution.">
              <WorkspaceSection eyebrow="Trust Configuration" title="Security Posture">
                <div className="bg-zinc-900/80 rounded-3xl border border-zinc-800/80 p-5 space-y-5 shadow-lg">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Fingerprint className="w-4 h-4 text-emerald-400" />
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">ERC-8004 Identity</p>
                    </div>
                    <p className="text-xs font-mono text-zinc-300 bg-black/40 px-3 py-2 rounded-lg border border-zinc-800 truncate">{mission.identity.erc8004Identity}</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Lock className="w-4 h-4 text-cyan-400" />
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Registry Tx</p>
                    </div>
                    <Link href="#" className="block text-xs font-mono text-cyan-400 hover:text-cyan-300 bg-cyan-950/20 px-3 py-2 rounded-lg border border-cyan-500/20 hover:border-cyan-500/40 transition-colors truncate">
                      {mission.identity.registrationTxHash}
                    </Link>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Wallet className="w-4 h-4 text-purple-400" />
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Runtime Wallet</p>
                    </div>
                    <p className="text-xs font-mono text-purple-200 bg-purple-950/20 px-3 py-2 rounded-lg border border-purple-500/20 truncate">{state.session.operatorWallet}</p>
                  </div>
                </div>
              </WorkspaceSection>
            </WithHelp>

            <WithHelp id="system-readiness" text="Overall assessment of protocol layers. Shows whether the infrastructure is bound, funded, and verifiable.">
              <WorkspaceSection eyebrow="Network Checks" title="Subsystem Status">
                <div className="bg-black/40 rounded-3xl border border-zinc-800/80 p-5 space-y-4 shadow-lg">
                  <div className="flex justify-between items-center group">
                    <span className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors flex items-center gap-2.5"><Activity className="w-4 h-4 text-zinc-500"/> Machine Comm</span>
                    <StatusPill label={readiness.corePathReady ? "Bound" : "Offline"} tone={readiness.corePathReady ? "ready" : "blocked"} />
                  </div>
                  <div className="w-full h-px bg-zinc-800/50" />
                  <div className="flex justify-between items-center group">
                    <span className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors flex items-center gap-2.5"><Layers className="w-4 h-4 text-zinc-500"/> x402 Settled</span>
                    <StatusPill label={readiness.x402Ready ? "Ready" : "Degraded"} tone={readiness.x402Ready ? "ready" : "warning"} />
                  </div>
                  <div className="w-full h-px bg-zinc-800/50" />
                  <div className="flex justify-between items-center group">
                    <span className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors flex items-center gap-2.5"><ShieldCheck className="w-4 h-4 text-zinc-500"/> ERC Trust</span>
                    <StatusPill label={readiness.erc8004Ready ? "Verified" : "Pending"} tone={readiness.erc8004Ready ? "ready" : "neutral"} />
                  </div>
                  <div className="w-full h-px bg-zinc-800/50" />
                  <div className="flex justify-between items-center group">
                    <span className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors flex items-center gap-2.5"><FileCheck2 className="w-4 h-4 text-zinc-500"/> Data Rails</span>
                    <StatusPill label={readiness.secondaryRailsReady ? "Active" : "Idle"} tone={readiness.secondaryRailsReady ? "waiting" : "neutral"} />
                  </div>
                </div>
              </WorkspaceSection>
            </WithHelp>
          </div>
        </div>
      </div>
    </FrontierShell>
  );
}
