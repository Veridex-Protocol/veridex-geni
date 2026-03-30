"use client";

import { useState } from "react";
import Link from "next/link";
import { CodePanel } from "@/components/frontierguard/code-panel";
import { FrontierShell } from "@/components/frontierguard/frontier-shell";
import { MetricCard } from "@/components/frontierguard/metric-card";
import { EmptyState, StatusPill, WorkspaceSection } from "@/components/frontierguard/workspace-primitives";
import { useFrontierGuard } from "@/components/frontierguard/provider";

export default function ExecutionLogViewerPage() {
  const { mission, logText, copyArtifact, exportArtifact } = useFrontierGuard();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "success" | "warning" | "error">("all");
  const [railFilter, setRailFilter] = useState<"all" | "immediate" | "scheduled" | "private" | "confidential">("all");

  const filteredLogs = mission.logs.filter((entry) => {
    const matchesFilter = filter === "all" ? true : entry.level === filter;
    const haystack = `${entry.title} ${entry.message} ${entry.actor} ${entry.stage}`.toLowerCase();
    const matchesRail = railFilter === "all" ? true : (entry.tags ?? []).includes(railFilter);
    return matchesFilter && matchesRail && haystack.includes(query.toLowerCase());
  });

  const failures = mission.logs.filter((entry) => entry.level === "error").length;
  const warnings = mission.logs.filter((entry) => entry.level === "warning").length;

  return (
    <FrontierShell
      eyebrow="Structured Logs"
      title="Search and inspect the execution stream"
      description="Logs remain a single operator timeline even when the mission uses private or storage-backed secondary modules."
      actions={
        <>
          <button
            type="button"
            onClick={() => void copyArtifact("log")}
            className="workspace-button-secondary rounded-xl px-4 py-2 text-sm font-semibold"
          >
            Copy Log
          </button>
          <button
            type="button"
            onClick={() => exportArtifact("log")}
            className="workspace-button-primary rounded-xl px-4 py-2 text-sm font-semibold"
          >
            Download Log
          </button>
        </>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="All Events" value={String(mission.logs.length)} helper={mission.id} tone="primary" />
            <MetricCard label="Warnings" value={String(warnings)} helper="Policy or operator attention" tone="warning" />
            <MetricCard label="Failures" value={String(failures)} helper="Terminal execution errors" tone={failures > 0 ? "danger" : "success"} />
            <MetricCard label="Payments" value={String(mission.payments.length)} helper="Bounded paid calls" tone="success" />
          </section>

          <WorkspaceSection
            eyebrow="Execution Stream"
            title="Filter the mission log"
            actions={
              <>
                <Link href="/logs/stream" className="workspace-button-secondary inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold">
                  Stream detail
                </Link>
                <Link href="/logs/filter" className="workspace-button-secondary inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold">
                  Advanced filters
                </Link>
              </>
            }
          >
            <div className="flex flex-col gap-4 lg:flex-row">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search title, actor, stage, or message..."
                className="workspace-input w-full rounded-2xl px-4 py-3 text-sm"
              />
              <div className="flex flex-wrap gap-2">
                {(["all", "success", "warning", "error"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFilter(value)}
                    className={filter === value ? "workspace-button-primary rounded-xl px-4 py-3 text-sm font-semibold" : "workspace-button-secondary rounded-xl px-4 py-3 text-sm font-semibold"}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {(["all", "immediate", "scheduled", "private", "confidential"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRailFilter(value)}
                  className={railFilter === value ? "workspace-button-primary rounded-full px-3 py-2 text-xs font-semibold" : "workspace-button-secondary rounded-full px-3 py-2 text-xs font-semibold"}
                >
                  {value}
                </button>
              ))}
            </div>

            <div className="mt-6 space-y-3">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((entry) => (
                  <div key={entry.id} className="workspace-subpanel rounded-3xl p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-white">{entry.title}</span>
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
                          <StatusPill label={entry.actor} tone="neutral" />
                        </div>
                        <p className="mt-2 text-sm text-zinc-400">{entry.message}</p>
                      </div>
                      <div className="text-right text-[11px] font-mono text-zinc-500">
                        {new Date(entry.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState title="No matching log entries" description="Adjust the search query or filter state to see more events." />
              )}
            </div>
          </WorkspaceSection>
        </div>

        <CodePanel
          title="agent_log.json"
          value={logText}
          onCopy={() => copyArtifact("log")}
          onDownload={() => exportArtifact("log")}
        />
      </div>
    </FrontierShell>
  );
}
