"use client";

import Link from "next/link";
import { Fingerprint, ShieldCheck, Users } from "lucide-react";
import { FrontierShell } from "@/components/frontierguard/frontier-shell";
import { MetricCard } from "@/components/frontierguard/metric-card";
import {
  FieldRow,
  StatusPill,
  WorkspaceSection,
} from "@/components/frontierguard/workspace-primitives";
import { useFrontierGuard } from "@/components/frontierguard/provider";

export default function AgentTrustProfilePage() {
  const { mission, copyArtifact, exportArtifact } = useFrontierGuard();

  return (
    <FrontierShell
      eyebrow="Trust Profile"
      title="Agent identity, capabilities, and portable trust"
      description="Keep the ERC-8004 trust story attached to the mission without turning it into a separate product surface."
      actions={
        <>
          <button
            type="button"
            onClick={() => void copyArtifact("manifest")}
            className="workspace-button-secondary rounded-xl px-4 py-2 text-sm font-semibold"
          >
            Copy Manifest
          </button>
          <button
            type="button"
            onClick={() => exportArtifact("manifest")}
            className="workspace-button-primary rounded-xl px-4 py-2 text-sm font-semibold"
          >
            Download agent.json
          </button>
        </>
      }
    >
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Trust Score" value={mission.identity.trustScore.toFixed(1)} helper="Portable machine reputation" tone="primary" />
          <MetricCard label="Trust Delta" value={mission.identity.trustDelta.toFixed(2)} helper="Latest feedback change" tone={mission.identity.trustDelta >= 0 ? "success" : "danger"} />
          <MetricCard label="Payments" value={String(mission.payments.length)} helper="Bounded paid actions" tone="success" />
          <MetricCard label="Pinned Artifacts" value={String(mission.artifacts.filter((artifact) => artifact.status === "pinned").length)} helper="Receipts and evidence" tone="primary" />
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <WorkspaceSection eyebrow="Identity" title={mission.identity.agentName}>
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/10">
                <Fingerprint className="h-8 w-8 text-emerald-300" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-semibold text-white">{mission.identity.agentName}</p>
                  <StatusPill label="ERC-8004" tone="ready" />
                </div>
                <p className="mt-2 font-mono text-xs text-zinc-500">{mission.identity.erc8004Identity}</p>
              </div>
            </div>
            <div className="mt-6">
              <dl>
                <FieldRow label="Registration tx" value={mission.identity.registrationTxHash.slice(0, 18).concat("...")} tone="success" />
                <FieldRow label="Operator wallet" value={mission.identity.operatorWallet} />
                <FieldRow label="Feedback tx" value={mission.identity.feedbackTxHash ? `${mission.identity.feedbackTxHash.slice(0, 18)}...` : "Pending"} tone={mission.identity.feedbackTxHash ? "success" : "warning"} />
              </dl>
            </div>
          </WorkspaceSection>

          <div className="space-y-6">
            <WorkspaceSection
              eyebrow="Capability Surface"
              title="Tools, chains, and cooperating agents"
              actions={
                <Link href="/mission/manifest" className="workspace-button-secondary inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold">
                  Open manifest
                </Link>
              }
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="workspace-subpanel rounded-3xl p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Allowed tools</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {mission.policy.allowedTools.map((tool) => (
                      <span key={tool} className="workspace-badge rounded-full px-3 py-1 text-xs font-semibold">
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="workspace-subpanel rounded-3xl p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Allowed chains</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {mission.policy.allowedChains.map((chain) => (
                      <span key={chain} className="workspace-badge rounded-full px-3 py-1 text-xs font-semibold">
                        {chain}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {mission.agents.map((agent) => (
                  <div key={agent.id} className="workspace-subpanel rounded-3xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <Users className="mt-0.5 h-4 w-4 text-cyan-400" />
                        <div>
                          <p className="font-semibold text-white">{agent.name}</p>
                          <p className="mt-1 text-sm text-zinc-400">{agent.role}</p>
                        </div>
                      </div>
                      <StatusPill label={agent.status} tone={agent.status === "ready" ? "ready" : "neutral"} />
                    </div>
                  </div>
                ))}
              </div>
            </WorkspaceSection>

            <WorkspaceSection
              eyebrow="Counterparties"
              title="Trust-gated counterparties"
              actions={
                <Link href="/mission/policies" className="workspace-button-secondary inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold">
                  Policy view
                </Link>
              }
            >
              <div className="space-y-3">
                {mission.policy.allowedCounterparties.map((counterparty) => (
                  <div key={counterparty} className="workspace-subpanel rounded-3xl p-4">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-400" />
                      <div>
                        <p className="font-semibold text-white">{counterparty}</p>
                        <p className="mt-2 text-sm text-zinc-400">
                          Must meet trust threshold {mission.policy.minTrustScore}+ before execution can settle.
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </WorkspaceSection>
          </div>
        </section>
      </div>
    </FrontierShell>
  );
}
