"use client";

import { FrontierShell } from "@/components/frontierguard/frontier-shell";
import { MetricCard } from "@/components/frontierguard/metric-card";
import { EmptyState, StatusPill, WorkspaceSection } from "@/components/frontierguard/workspace-primitives";
import { useFrontierGuard } from "@/components/frontierguard/provider";

export default function PolicyControlsPage() {
  const { mission, openDispute, simulateViolation, resolveDispute } = useFrontierGuard();
  const readiness =
    openDispute ? "Attention required" : mission.budget.perTxCapUsd <= mission.budget.totalUsd ? "Ready" : "Invalid";

  return (
    <FrontierShell
      eyebrow="Policy Controls"
      title="Guardrails, allowlists, and escalations"
      description="Keep the primary mission path bounded and operator-reviewable. Secondary policy modules should support the mission, not overwhelm it."
      actions={
        <>
          <button
            type="button"
            onClick={() => void simulateViolation()}
            className="workspace-button-danger rounded-xl px-4 py-2 text-sm font-semibold"
          >
            Test Violation
          </button>
          {openDispute ? (
            <button
              type="button"
              onClick={() => void resolveDispute("override")}
              className="workspace-button-primary rounded-xl px-4 py-2 text-sm font-semibold"
            >
              Approve Override
            </button>
          ) : null}
        </>
      }
    >
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Readiness" value={readiness} helper={openDispute ? openDispute.title : "All mission thresholds are coherent"} tone={openDispute ? "danger" : "success"} />
          <MetricCard label="Mission Budget" value={`$${mission.budget.totalUsd.toFixed(2)}`} helper="Total spend ceiling" tone="primary" />
          <MetricCard label="Per-Tx Cap" value={`$${mission.budget.perTxCapUsd.toFixed(2)}`} helper="Bounded payment gate" tone="warning" />
          <MetricCard label="Min Trust Score" value={`${mission.policy.minTrustScore}+`} helper="Counterparty requirement" tone="primary" />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <WorkspaceSection eyebrow="Budget" title="Financial guardrails">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="workspace-subpanel rounded-3xl p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Total budget</p>
                <p className="mt-2 text-2xl font-semibold text-white">${mission.budget.totalUsd.toFixed(2)}</p>
                <p className="mt-2 text-sm text-zinc-400">Configured on launch and enforced across the mission loop.</p>
              </div>
              <div className="workspace-subpanel rounded-3xl p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Per transaction</p>
                <p className="mt-2 text-2xl font-semibold text-white">${mission.budget.perTxCapUsd.toFixed(2)}</p>
                <p className="mt-2 text-sm text-zinc-400">Every payment-gated tool call is checked against this cap.</p>
              </div>
            </div>

            <div className="mt-4 workspace-subpanel rounded-3xl p-4">
              <p className="text-sm font-semibold text-white">
                Manual escalation above {mission.policy.escalationThresholdPct}% of session budget
              </p>
              <p className="mt-2 text-sm text-zinc-400">
                {mission.policy.requireManualEscalation
                  ? "Enabled. High-risk actions block until the operator intervenes."
                  : "Disabled. The agent can approve actions autonomously if all other bounds pass."}
              </p>
            </div>
          </WorkspaceSection>

          <WorkspaceSection eyebrow="Allowlists" title="Tools, chains, and counterparties">
            <div className="space-y-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Allowed tools</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {mission.policy.allowedTools.map((tool) => (
                    <span key={tool} className="workspace-badge rounded-full px-3 py-1 text-xs font-semibold">{tool}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Allowed chains</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {mission.policy.allowedChains.map((chain) => (
                    <span key={chain} className="workspace-badge rounded-full px-3 py-1 text-xs font-semibold">{chain}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Approved counterparties</p>
                <div className="mt-3 space-y-3">
                  {mission.policy.allowedCounterparties.map((counterparty) => (
                    <div key={counterparty} className="workspace-subpanel rounded-3xl p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-white">{counterparty}</p>
                        <StatusPill label={`${mission.policy.minTrustScore}+ trust`} tone="neutral" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </WorkspaceSection>
        </section>

        <WorkspaceSection eyebrow="Escalations" title="Incident posture">
          {openDispute ? (
            <div className="workspace-subpanel rounded-3xl border border-red-500/18 bg-red-500/8 p-5">
              <p className="font-semibold text-red-200">{openDispute.title}</p>
              <p className="mt-2 text-sm text-red-100/80">{openDispute.description}</p>
            </div>
          ) : (
            <EmptyState title="No active policy violations" description="The mission is currently within the configured boundaries." />
          )}
        </WorkspaceSection>
      </div>
    </FrontierShell>
  );
}
