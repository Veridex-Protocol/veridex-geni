"use client";

import Link from "next/link";
import { CodePanel } from "@/components/frontierguard/code-panel";
import { FrontierShell } from "@/components/frontierguard/frontier-shell";
import { WorkspaceSection } from "@/components/frontierguard/workspace-primitives";
import { useFrontierGuard } from "@/components/frontierguard/provider";

export default function EvidenceAssemblyPage() {
  const { summaryText, copyArtifact, exportArtifact } = useFrontierGuard();

  return (
    <FrontierShell
      eyebrow="Evidence Assembly"
      title="mission_summary.md"
      description="Review the human-readable mission summary that travels with the final receipt bundle."
      actions={
        <>
          <button
            type="button"
            onClick={() => void copyArtifact("summary")}
            className="workspace-button-secondary rounded-xl px-4 py-2 text-sm font-semibold"
          >
            Copy markdown
          </button>
          <Link href="/receipts" className="workspace-button-secondary inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold">
            Back to receipts
          </Link>
        </>
      }
    >
      <WorkspaceSection eyebrow="Summary Bundle" title="Mission summary export">
        <CodePanel title="mission_summary.md" value={summaryText} onCopy={() => copyArtifact("summary")} onDownload={() => exportArtifact("summary")} />
      </WorkspaceSection>
    </FrontierShell>
  );
}
