"use client";

import Link from "next/link";
import { FrontierShell } from "@/components/frontierguard/frontier-shell";
import { EmptyState, StatusPill, WorkspaceSection } from "@/components/frontierguard/workspace-primitives";
import { useFrontierGuard } from "@/components/frontierguard/provider";

export default function IncidentResolutionPage() {
  const { mission } = useFrontierGuard();
  const resolved = mission.disputes.filter((dispute) => dispute.status !== "open");

  return (
    <FrontierShell
      eyebrow="Resolution Ledger"
      title="Resolved and dismissed incidents"
      description="Keep a visible record of how operator escalations were handled after the primary mission path completed or was interrupted."
      actions={
        <Link href="/dispute" className="workspace-button-secondary inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold">
          Back to incidents
        </Link>
      }
    >
      <WorkspaceSection eyebrow="Ledger" title="Incident history">
        <div className="space-y-4">
          {resolved.length > 0 ? (
            resolved.map((dispute) => (
              <div key={dispute.id} className="workspace-subpanel rounded-3xl p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-white">{dispute.title}</p>
                    <p className="mt-2 text-sm text-zinc-400">{dispute.resolution ?? "Resolution pending notes."}</p>
                  </div>
                  <StatusPill label={dispute.status} tone="ready" />
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              title="No resolved incidents yet"
              description="Resolve an open dispute from the incident console to populate this ledger."
            />
          )}
        </div>
      </WorkspaceSection>
    </FrontierShell>
  );
}
