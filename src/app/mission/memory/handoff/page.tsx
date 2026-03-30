"use client";

import Link from "next/link";
import { FrontierShell } from "@/components/frontierguard/frontier-shell";
import { StatusPill, WorkspaceSection } from "@/components/frontierguard/workspace-primitives";
import { useFrontierGuard } from "@/components/frontierguard/provider";

export default function MemoryHandoffPage() {
  const { mission } = useFrontierGuard();

  return (
    <FrontierShell
      eyebrow="Handoff Timeline"
      title="Planner to specialist to auditor"
      description="Follow how shared memory moved across the mission and when durable references were attached."
      actions={
        <Link href="/mission/memory" className="workspace-button-secondary inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold">
          Back to memory board
        </Link>
      }
    >
      <WorkspaceSection eyebrow="Timeline" title="Shared mission handoffs">
        <div className="relative space-y-6 before:absolute before:left-5 before:top-4 before:h-[calc(100%-2rem)] before:w-px before:bg-white/8">
          {mission.memory.map((record) => (
            <div key={record.id} className="relative ml-12 workspace-subpanel rounded-3xl p-5">
              <div className="absolute -left-[2.95rem] top-5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/16 text-emerald-300">
                <span className="material-symbols-outlined text-sm">sync_alt</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-white">{record.title}</p>
                  <p className="mt-1 text-sm text-zinc-400">{record.summary}</p>
                </div>
                <StatusPill label={record.owner} tone="neutral" />
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-white/6 bg-black/15 p-4 text-sm text-zinc-300">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Timestamp</p>
                  <p className="mt-2">{new Date(record.createdAt).toLocaleString()}</p>
                </div>
                <div className="rounded-2xl border border-white/6 bg-black/15 p-4 text-sm text-zinc-300">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">CID</p>
                  <p className="mt-2 font-mono text-xs">{record.cid ?? "pending-cid"}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </WorkspaceSection>
    </FrontierShell>
  );
}
