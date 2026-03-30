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

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
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
            <div className="grid gap-4 xl:grid-cols-4">
              {columns.map((column) => (
                <div key={column.label} className="workspace-subpanel rounded-3xl p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">{column.label}</p>
                    <StatusPill label={String(column.tasks.length)} tone="neutral" />
                  </div>
                  <div className="mt-4 space-y-3">
                    {column.tasks.length > 0 ? (
                      column.tasks.map((task) => (
                        <div key={task.id} className="rounded-2xl border border-white/6 bg-black/15 p-4">
                          <p className="font-semibold text-white">{task.title}</p>
                          <p className="mt-2 text-sm text-zinc-400">{task.description}</p>
                          <div className="mt-3 flex items-center justify-between gap-3 text-xs text-zinc-500">
                            <span>{task.owner}</span>
                            <span>{task.counterparty ?? task.type}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <EmptyState title="No tasks here" description="This lane is empty right now." />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </WorkspaceSection>

          <div className="space-y-6">
            <WorkspaceSection eyebrow="Shared Records" title="Durable context">
              <div className="space-y-3">
                {mission.memory.map((record) => (
                  <div key={record.id} className="workspace-subpanel rounded-3xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <Database className="mt-0.5 h-4 w-4 text-emerald-400" />
                        <div>
                          <p className="font-semibold text-white">{record.title}</p>
                          <p className="mt-2 text-sm text-zinc-400">{record.summary}</p>
                        </div>
                      </div>
                      <StatusPill label={record.type} tone="neutral" />
                    </div>
                    <p className="mt-3 font-mono text-xs text-zinc-500">{record.cid ?? "pending-cid"}</p>
                  </div>
                ))}
              </div>
            </WorkspaceSection>

            <CodePanel title="mission_summary.md" value={summaryText} onCopy={() => copyArtifact("summary")} onDownload={() => exportArtifact("summary")} />
          </div>
        </section>
      </div>
    </FrontierShell>
  );
}
