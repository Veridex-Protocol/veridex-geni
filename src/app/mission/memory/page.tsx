"use client";

import Link from "next/link";
import { Database } from "lucide-react";
import { FrontierShell } from "@/components/frontierguard/frontier-shell";
import { MetricCard } from "@/components/frontierguard/metric-card";
import { CodePanel } from "@/components/frontierguard/code-panel";
import { EmptyState, StatusPill, WorkspaceSection } from "@/components/frontierguard/workspace-primitives";
import { WithHelp } from "@/components/frontierguard/help-sys";
import { useFrontierGuard } from "@/components/frontierguard/provider";

export default function SharedMemoryTaskBoardPage() {
  const { mission, summaryText, copyArtifact, exportArtifact } = useFrontierGuard();

  const planned = mission.tasks.filter((task) => task.status === "planned");
  const inProgress = mission.tasks.filter((task) => task.status === "in_progress");
  const awaitingVerification = mission.tasks.filter((task) => task.status === "awaiting_verification");
  const completed = mission.tasks.filter((task) => task.status === "completed");
  const columns = [
    { label: "Planned", tasks: planned },
    { label: "In Progress", tasks: inProgress },
    { label: "Awaiting Verification", tasks: awaitingVerification },
    { label: "Completed", tasks: completed },
  ];

  return (
    <FrontierShell
      eyebrow="Shared Memory"
      title="Task board and shared mission context"
      description="Keep multi-agent state, handoffs, and durable memory attached to the mission without distracting from the primary runtime path."
      actions={
        <div className="flex items-center gap-2">
          <WithHelp id="mem-copy" text="Copy the latest task graph and multi-agent memory state to the clipboard.">
            <button
              type="button"
              onClick={() => void copyArtifact("summary")}
              className="workspace-button-secondary rounded-xl px-4 py-2 text-sm font-semibold hover:-translate-y-0.5 transition-transform"
            >
              Copy Summary
            </button>
          </WithHelp>
          <WithHelp id="mem-export" text="Download a JSON export of the current deterministic task ledger.">
            <button
              type="button"
              onClick={() => exportArtifact("summary")}
              className="workspace-button-primary rounded-xl px-4 py-2 text-sm font-semibold hover:-translate-y-0.5 transition-transform"
            >
              Export State
            </button>
          </WithHelp>
        </div>
      }
    >
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Mission" value={mission.id} helper={mission.template} tone="primary" />
          <MetricCard label="Shared Records" value={String(mission.memory.length)} helper="Mission state entries" tone="success" />
          <MetricCard label="Active Tasks" value={String(inProgress.length)} helper="Currently executing" tone="primary" />
          <MetricCard label="Completed Tasks" value={String(completed.length)} helper="Ready for receipts" tone="success" />
        </section>

        <WorkspaceSection
          eyebrow="Task Board"
          title={mission.title}
          actions={
            <div className="flex items-center gap-2">
              <WithHelp id="mem-handoff" text="View the multi-agent state timeline and worker transitions.">
                <Link href="/mission/memory/handoff" className="workspace-button-secondary inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold hover:-translate-y-0.5 transition-transform">
                  Handoff timeline
                </Link>
              </WithHelp>
              <WithHelp id="mem-history" text="Browse the full append-only storage ledger of context entries.">
                <Link href="/mission/memory/history" className="workspace-button-secondary inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold hover:-translate-y-0.5 transition-transform">
                  Record ledger
                </Link>
              </WithHelp>
            </div>
          }
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {columns.map((column) => (
              <div key={column.label} className="workspace-subpanel rounded-3xl p-4 flex flex-col h-full min-h-[300px]">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">{column.label}</p>
                  <StatusPill label={String(column.tasks.length)} tone="neutral" />
                </div>
                <div className="space-y-3 flex-1">
                  {column.tasks.length > 0 ? (
                    column.tasks.map((task) => (
                      <div key={task.id} className="rounded-2xl border border-white/6 bg-black/15 p-4 shadow-sm backdrop-blur-sm">
                        <p className="font-semibold text-white">{task.title}</p>
                        <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{task.description}</p>
                        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-3 text-xs text-zinc-500">
                          <span className="truncate">{task.owner}</span>
                          <span className="truncate">{task.counterparty ?? task.type}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <EmptyState title="No tasks here" description="This lane is empty right now." />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </WorkspaceSection>

        <section className="grid gap-6 xl:grid-cols-2">
          <WorkspaceSection eyebrow="Shared Records" title="Durable context">
            <div className="space-y-4">
              {mission.memory.map((record) => (
                <div key={record.id} className="workspace-subpanel rounded-3xl p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <Database className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">{record.title}</p>
                        <p className="mt-1 text-sm text-zinc-400 leading-relaxed">{record.summary}</p>
                        <p className="mt-3 font-mono text-[10px] text-zinc-500 truncate max-w-[300px]">{record.cid ?? "pending-cid"}</p>
                      </div>
                    </div>
                    <StatusPill label={record.type} tone="neutral" />
                  </div>
                </div>
              ))}
            </div>
          </WorkspaceSection>

          <CodePanel title="mission_summary.md" value={summaryText} onCopy={() => copyArtifact("summary")} onDownload={() => exportArtifact("summary")} />
        </section>
      </div>
    </FrontierShell>
  );
}
