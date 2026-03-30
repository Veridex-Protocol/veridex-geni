"use client";

import Link from "next/link";
import { CodePanel } from "@/components/frontierguard/code-panel";
import { FrontierShell } from "@/components/frontierguard/frontier-shell";
import { WorkspaceSection } from "@/components/frontierguard/workspace-primitives";
import { useFrontierGuard } from "@/components/frontierguard/provider";

export default function MemoryHistoryPage() {
  const { mission } = useFrontierGuard();

  return (
    <FrontierShell
      eyebrow="Memory Ledger"
      title="Shared memory history"
      description="Inspect the durable record ledger behind the shared mission context."
      actions={
        <Link href="/mission/memory" className="workspace-button-secondary inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold">
          Back to board
        </Link>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <WorkspaceSection eyebrow="Record Ledger" title="Mission records">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                  <th className="pb-3 pr-4">Type</th>
                  <th className="pb-3 pr-4">Owner</th>
                  <th className="pb-3 pr-4">CID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/6">
                {mission.memory.map((record) => (
                  <tr key={record.id}>
                    <td className="py-4 pr-4 font-semibold text-white">{record.type}</td>
                    <td className="py-4 pr-4 text-zinc-300">{record.owner}</td>
                    <td className="py-4 font-mono text-xs text-zinc-500">{record.cid ?? "pending-cid"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </WorkspaceSection>

        <CodePanel title="memory_records.json" value={JSON.stringify(mission.memory, null, 2)} />
      </div>
    </FrontierShell>
  );
}
