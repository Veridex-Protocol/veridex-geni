"use client";

import Link from "next/link";
import { FrontierShell } from "@/components/frontierguard/frontier-shell";
import { MetricCard } from "@/components/frontierguard/metric-card";
import { EmptyState, StatusPill, WorkspaceSection } from "@/components/frontierguard/workspace-primitives";
import { useFrontierGuard } from "@/components/frontierguard/provider";

export default function DisputeIncidentReviewPage() {
  const { mission, openDispute, simulateViolation, resolveDispute } = useFrontierGuard();

  return (
    <FrontierShell
      eyebrow="Incident Review"
      title="Policy escalation and operator overrides"
      description="Review blocked actions, apply overrides, or keep the mission halted when risk thresholds are breached."
      actions={
        <>
          <button
            type="button"
            onClick={() => void simulateViolation()}
            className="workspace-button-danger rounded-xl px-4 py-2 text-sm font-semibold"
          >
            Create Demo Incident
          </button>
          <Link href="/logs" className="workspace-button-secondary inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold">
            Open Logs
          </Link>
        </>
      }
    >
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Mission Status" value={mission.status.toUpperCase()} helper={mission.id} tone={mission.status === "blocked" ? "danger" : "primary"} />
          <MetricCard label="Open Incidents" value={String(mission.disputes.filter((dispute) => dispute.status === "open").length)} helper="Current escalation queue" tone={openDispute ? "danger" : "success"} />
          <MetricCard label="Resolved" value={String(mission.disputes.filter((dispute) => dispute.status === "resolved").length)} helper="Operator-approved outcomes" tone="success" />
          <MetricCard label="Dismissed" value={String(mission.disputes.filter((dispute) => dispute.status === "dismissed").length)} helper="Archived incidents" tone="default" />
        </section>

        {openDispute ? (
          <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <WorkspaceSection eyebrow="Open Incident" title={openDispute.title}>
              <div className="flex items-center justify-between gap-4">
                <StatusPill label={openDispute.severity} tone="blocked" />
                <StatusPill label={openDispute.status} tone="warning" />
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="workspace-subpanel rounded-3xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Violated policy</p>
                  <p className="mt-2 font-semibold text-white">{openDispute.violatedPolicy}</p>
                </div>
                <div className="workspace-subpanel rounded-3xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Recommended action</p>
                  <p className="mt-2 font-semibold text-white">{openDispute.recommendedAction}</p>
                </div>
              </div>
              <p className="mt-6 text-sm text-zinc-400">{openDispute.description}</p>
            </WorkspaceSection>

            <div className="space-y-6">
              <WorkspaceSection eyebrow="Actions" title="Operator response">
                <div className="grid gap-3">
                  <button
                    type="button"
                    onClick={() => void resolveDispute("override")}
                    className="workspace-button-primary rounded-xl px-4 py-3 text-sm font-semibold"
                  >
                    Override policy and continue
                  </button>
                  <button
                    type="button"
                    onClick={() => void resolveDispute("retry")}
                    className="workspace-button-secondary rounded-xl px-4 py-3 text-sm font-semibold"
                  >
                    Retry with existing policy
                  </button>
                  <button
                    type="button"
                    onClick={() => void resolveDispute("dismiss")}
                    className="workspace-button-danger rounded-xl px-4 py-3 text-sm font-semibold"
                  >
                    Keep mission blocked
                  </button>
                </div>
              </WorkspaceSection>

              <WorkspaceSection eyebrow="Latest Policy Logs" title="Context for the incident">
                <div className="space-y-3">
                  {mission.logs
                    .filter((entry) => entry.actor === "policy" || entry.actor === "operator")
                    .slice(-4)
                    .reverse()
                    .map((entry) => (
                      <div key={entry.id} className="workspace-subpanel rounded-3xl p-4">
                        <p className="font-semibold text-white">{entry.title}</p>
                        <p className="mt-2 text-sm text-zinc-400">{entry.message}</p>
                      </div>
                    ))}
                </div>
              </WorkspaceSection>
            </div>
          </section>
        ) : (
          <WorkspaceSection eyebrow="No Active Incident" title="The mission is inside policy bounds">
            <EmptyState
              title="No incident to resolve"
              description="Use the demo incident button above if you want to show the override and retry flow during the demo."
            />
          </WorkspaceSection>
        )}
      </div>
    </FrontierShell>
  );
}
