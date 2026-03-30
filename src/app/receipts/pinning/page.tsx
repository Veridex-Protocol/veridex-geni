"use client";

import Link from "next/link";
import { FrontierShell } from "@/components/frontierguard/frontier-shell";
import { StatusPill, WorkspaceSection } from "@/components/frontierguard/workspace-primitives";
import { useFrontierGuard } from "@/components/frontierguard/provider";

export default function FilecoinPinningPage() {
  const { mission } = useFrontierGuard();

  return (
    <FrontierShell
      eyebrow="Filecoin Pinning"
      title="Artifact storage anchors"
      description="Inspect the artifact-to-storage mapping without breaking out of the operator workspace."
      actions={
        <Link href="/receipts" className="workspace-button-secondary inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold">
          Back to receipts
        </Link>
      }
    >
      <WorkspaceSection eyebrow="Pinned Artifacts" title="Filecoin references">
        <div className="space-y-4">
          {mission.artifacts.map((artifact) => (
            <div key={artifact.id} className="workspace-subpanel rounded-3xl p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-white">{artifact.name}</p>
                  <p className="mt-2 text-sm text-zinc-400">{artifact.description}</p>
                </div>
                <StatusPill label={artifact.status} tone={artifact.status === "pinned" ? "ready" : "warning"} />
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-white/6 bg-black/15 p-4 text-sm text-zinc-300">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">CID</p>
                  <p className="mt-2 font-mono text-xs">{artifact.cid ?? "pending-cid"}</p>
                </div>
                <div className="rounded-2xl border border-white/6 bg-black/15 p-4 text-sm text-zinc-300">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Calibration tx</p>
                  <p className="mt-2 font-mono text-xs">{artifact.txHash ?? "pending-tx"}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </WorkspaceSection>
    </FrontierShell>
  );
}
