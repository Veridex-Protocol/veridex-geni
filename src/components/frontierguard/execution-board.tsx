"use client";

import { FlowScheduleCard } from "@/components/frontierguard/flow-schedule-card";
import { RailBadge } from "@/components/frontierguard/rail-badge";
import { StarknetPrivateIntentCard } from "@/components/frontierguard/starknet-private-intent-card";
import { ZamaConfidentialPolicyCard } from "@/components/frontierguard/zama-confidential-policy-card";
import type { Mission } from "@/lib/frontierguard/types";

export function ExecutionBoard({ mission }: { mission: Mission }) {
  return (
    <div className="workspace-panel rounded-3xl p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Unified Execution Board</p>
          <h2 className="mt-2 text-2xl font-bold text-white">One mission surface, multiple sponsor rails</h2>
          <p className="mt-3 max-w-2xl text-sm text-zinc-400">
            FrontierGuard decides when the mission executes, how privately it executes, and which proofs survive.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <RailBadge rail={mission.execution.rail} />
          <span className="rounded-full border border-zinc-700/80 bg-zinc-800/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">
            {mission.execution.status}
          </span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <div className="workspace-subpanel rounded-2xl p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">Mission Composer</p>
          <p className="mt-2 font-semibold text-white">{mission.template}</p>
        </div>
        <div className="workspace-subpanel rounded-2xl p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">Policy Vault</p>
          <p className="mt-2 font-semibold text-white">
            {mission.execution.confidentialPolicy.enabled ? "Encrypted + Public" : "Public Policy"}
          </p>
        </div>
        <div className="workspace-subpanel rounded-2xl p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">Trust Layer</p>
          <p className="mt-2 font-semibold text-white">{mission.identity.trustScore.toFixed(1)} trust score</p>
        </div>
        <div className="workspace-subpanel rounded-2xl p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">Durable Receipts</p>
          <p className="mt-2 font-semibold text-white">{mission.artifacts.filter((artifact) => artifact.status === "pinned").length} pinned objects</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <FlowScheduleCard schedule={mission.execution.scheduled} />
        <StarknetPrivateIntentCard intent={mission.execution.privateIntent} />
        <ZamaConfidentialPolicyCard policy={mission.execution.confidentialPolicy} />
      </div>
    </div>
  );
}
