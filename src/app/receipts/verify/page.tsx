"use client";

import Link from "next/link";
import { CodePanel } from "@/components/frontierguard/code-panel";
import { FrontierShell } from "@/components/frontierguard/frontier-shell";
import { StatusPill, WorkspaceSection } from "@/components/frontierguard/workspace-primitives";
import { useFrontierGuard } from "@/components/frontierguard/provider";

export default function ReceiptForensicsPage() {
  const { mission, receiptText, copyArtifact, exportArtifact } = useFrontierGuard();

  return (
    <FrontierShell
      eyebrow="Receipt Forensics"
      title="Verification details for the current bundle"
      description="Inspect the trust, payment, and storage proof surface behind the operator-facing receipt bundle."
      actions={
        <>
          <button
            type="button"
            onClick={() => void copyArtifact("receipt")}
            className="workspace-button-secondary rounded-xl px-4 py-2 text-sm font-semibold"
          >
            Copy receipt
          </button>
          <Link href="/receipts" className="workspace-button-secondary inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold">
            Back to receipts
          </Link>
        </>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <WorkspaceSection eyebrow="Verification Surface" title="Bundle checks">
          <div className="space-y-4 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-zinc-500">ERC-8004 registration</span>
              <span className="font-mono text-zinc-300">{mission.identity.registrationTxHash.slice(0, 16)}...</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-zinc-500">Feedback submission</span>
              <span className="font-mono text-zinc-300">{mission.identity.feedbackTxHash ? `${mission.identity.feedbackTxHash.slice(0, 16)}...` : "pending"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-zinc-500">Pinned artifacts</span>
              <span className="text-zinc-300">{mission.artifacts.filter((artifact) => artifact.status === "pinned").length}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-zinc-500">x402 settlement</span>
              <span className="font-mono text-zinc-300">
                {mission.payments[0]?.txHash ? `${mission.payments[0].txHash.slice(0, 16)}...` : "pending"}
              </span>
            </div>
          </div>

          {mission.execution.rail === "private" ? (
            <div className="mt-6 workspace-subpanel rounded-3xl p-5">
              <div className="flex items-center gap-3">
                <p className="font-semibold text-white">Starknet commitment verification</p>
                <StatusPill label={mission.execution.privateIntent.commitmentVerified ? "Matched" : "Pending"} tone={mission.execution.privateIntent.commitmentVerified ? "ready" : "warning"} />
              </div>
              <p className="mt-3 text-sm text-zinc-400">
                {mission.execution.privateIntent.commitmentVerified
                  ? "Stored commitment matches the mission commitment hash."
                  : "Commitment verification is still pending or running in demo mode."}
              </p>
            </div>
          ) : null}
        </WorkspaceSection>

        <CodePanel title="receipt_bundle.json" value={receiptText} onCopy={() => copyArtifact("receipt")} onDownload={() => exportArtifact("receipt")} />
      </div>
    </FrontierShell>
  );
}
