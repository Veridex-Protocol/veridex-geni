"use client";

import Link from "next/link";
import { ArrowUpRight, Database, FileArchive, ShieldCheck, Wallet } from "lucide-react";
import { CodePanel } from "@/components/frontierguard/code-panel";
import { FrontierShell } from "@/components/frontierguard/frontier-shell";
import { MetricCard } from "@/components/frontierguard/metric-card";
import { ReceiptGroup } from "@/components/frontierguard/receipt-group";
import { useFrontierStatus } from "@/components/frontierguard/use-frontier-status";
import {
  EmptyState,
  FieldRow,
  StatusPill,
  WorkspaceSection,
} from "@/components/frontierguard/workspace-primitives";
import { WithHelp } from "@/components/frontierguard/help-sys";
import { useFrontierGuard } from "@/components/frontierguard/provider";

function compactHash(value?: string | null, head = 12, tail = 8): string {
  if (!value) {
    return "pending";
  }

  if (value.length <= head + tail + 3) {
    return value;
  }

  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}

export default function ReceiptsEvidencePage() {
  const { mission, receiptText, summaryText, copyArtifact, exportArtifact } = useFrontierGuard();
  const { status, readiness } = useFrontierStatus();
  const pinnedArtifacts = mission.artifacts.filter((artifact) => artifact.status === "pinned");
  const paymentReceipts = mission.payments.filter((payment) => Boolean(payment.txHash));
  const verifiedLivePayments = paymentReceipts.filter(
    (payment) => payment.live && payment.verified,
  );
  const privateReceipts = mission.execution.chainTransactions.filter((item) => item.rail === "private");
  const filecoinReady = pinnedArtifacts.some((artifact) => Boolean(artifact.cid));
  const storachaReady = mission.memory.some((record) => Boolean(record.cid));

  return (
    <FrontierShell
      eyebrow="Receipts Vault"
      title="Proofs and Execution Evidence"
      description="Keep the operator story simple: payment receipts, ERC-8004 trust proofs, and evidence artifacts stay grouped under one mission instead of being scattered."
      actions={
        <div className="flex items-center gap-2">
          <WithHelp id="receipts-copy" text="Copy the latest cryptographic receipts bundle to clipboard for external verification.">
            <button
              type="button"
              onClick={() => void copyArtifact("receipt")}
              className="workspace-button-secondary rounded-xl px-4 py-2 text-sm font-semibold hover:-translate-y-0.5 transition-transform"
            >
              Copy Receipt
            </button>
          </WithHelp>
          <WithHelp id="receipts-export" text="Download a fully verifiable ZIP evidence bundle for enterprise auditors.">
            <button
              type="button"
              onClick={() => exportArtifact("receipt")}
              className="workspace-button-primary rounded-xl px-4 py-2 text-sm font-semibold hover:-translate-y-0.5 transition-transform"
            >
              Export Bundle
            </button>
          </WithHelp>
        </div>
      }
    >
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Mission Status"
            value={mission.status.toUpperCase()}
            helper={mission.id}
            tone={mission.status === "completed" ? "success" : "primary"}
          />
          <MetricCard
            label="Evidence Artifacts"
            value={`${pinnedArtifacts.length}/${mission.artifacts.length}`}
            helper="Pinned and exportable"
            tone={pinnedArtifacts.length > 0 ? "success" : "warning"}
          />
          <MetricCard
            label="Payment Receipts"
            value={String(verifiedLivePayments.length)}
            helper="Verified on-chain x402 settlements"
            tone={verifiedLivePayments.length > 0 ? "success" : "warning"}
          />
          <MetricCard
            label="Trust Readiness"
            value={readiness.erc8004Ready ? "READY" : "BLOCKED"}
            helper={mission.identity.erc8004Identity}
            tone={readiness.erc8004Ready ? "success" : "warning"}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <WorkspaceSection
              eyebrow="Trust Surface"
              title="Primary receipt posture"
              description="The best-bet sponsor path should be undeniable here: settlement, identity, and evidence all point back to the same mission."
            >
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="workspace-subpanel rounded-3xl p-5">
                  <div className="flex items-center gap-3">
                    <Wallet className="h-5 w-5 text-cyan-400" />
                    <p className="font-semibold text-white">x402 Settlement</p>
                  </div>
                  <div className="mt-4">
                    <StatusPill
                      label={verifiedLivePayments.length > 0 ? "Verified live" : "Pending"}
                      tone={verifiedLivePayments.length > 0 ? "ready" : "warning"}
                    />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-zinc-400">
                    Payment receipts are attached directly to the mission and exported with the final bundle.
                  </p>
                </div>
                <div className="workspace-subpanel rounded-3xl p-5">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-emerald-400" />
                    <p className="font-semibold text-white">ERC-8004</p>
                  </div>
                  <div className="mt-4">
                    <StatusPill
                      label={readiness.erc8004Ready ? "Ready" : "Waiting"}
                      tone={readiness.erc8004Ready ? "ready" : "warning"}
                    />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-zinc-400">
                    Identity and feedback receipts are grouped here instead of forcing a separate trust workflow.
                  </p>
                </div>
                <div className="workspace-subpanel rounded-3xl p-5">
                  <div className="flex items-center gap-3">
                    <FileArchive className="h-5 w-5 text-cyan-400" />
                    <p className="font-semibold text-white">Evidence Vault</p>
                  </div>
                  <div className="mt-4">
                    <StatusPill
                      label={filecoinReady ? "Pinned" : "Pending"}
                      tone={filecoinReady ? "ready" : "warning"}
                    />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-zinc-400">
                    Receipt bundles and manifests stay attached to evidence storage only after the core path is already coherent.
                  </p>
                </div>
              </div>
            </WorkspaceSection>

            <ReceiptGroup eyebrow="Payments" title="Settlement receipts">
              {paymentReceipts.length > 0 ? (
                paymentReceipts.map((payment) => (
                  <div key={payment.id} className="workspace-subpanel rounded-3xl p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-white">{payment.merchant}</p>
                          <StatusPill
                            label={
                              payment.verified
                                ? "verified"
                                : payment.live
                                  ? "live-unverified"
                                  : payment.status
                            }
                            tone={payment.verified ? "ready" : payment.status === "settled" ? "warning" : "warning"}
                          />
                        </div>
                        <p className="mt-2 text-sm text-zinc-400">{payment.resource}</p>
                        <div className="mt-4 grid gap-2 text-sm text-zinc-300">
                          <p>${payment.amountUsd.toFixed(2)} on {payment.network}</p>
                          <p className="font-mono text-xs text-zinc-500">{compactHash(payment.txHash)}</p>
                          <p className="text-xs text-zinc-500">
                            {payment.verified
                              ? "Settlement verified on-chain."
                              : payment.live
                                ? "Live settlement returned without proof verification."
                                : "Demo or hybrid settlement path."}
                          </p>
                        </div>
                      </div>
                      {payment.explorerUrl ? (
                        <a
                          href={payment.explorerUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-emerald-300"
                        >
                          Explorer
                          <ArrowUpRight className="h-4 w-4" />
                        </a>
                      ) : null}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No payment receipt yet"
                  description="The paid service proof will appear here after a premium mission action settles."
                />
              )}
            </ReceiptGroup>

            <ReceiptGroup eyebrow="Trust" title="Identity and reputation receipts">
              <div className="workspace-subpanel rounded-3xl p-5">
                <dl>
                  <FieldRow label="ERC-8004 Identity" value={mission.identity.erc8004Identity} />
                  <FieldRow
                    label="Registration Tx"
                    value={compactHash(mission.identity.registrationTxHash)}
                    tone="success"
                  />
                  <FieldRow
                    label="Feedback Tx"
                    value={compactHash(mission.identity.feedbackTxHash)}
                    tone={mission.identity.feedbackTxHash ? "success" : "warning"}
                  />
                  <FieldRow label="Trust Score" value={`${mission.identity.trustScore.toFixed(1)} / 100`} />
                </dl>
              </div>
            </ReceiptGroup>

            <ReceiptGroup eyebrow="Evidence" title="Artifacts and storage anchors">
              <div className="grid gap-4 lg:grid-cols-2">
                {mission.artifacts.map((artifact) => (
                  <div key={artifact.id} className="workspace-subpanel rounded-3xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-white">{artifact.name}</p>
                          <StatusPill
                            label={artifact.status}
                            tone={artifact.status === "pinned" ? "ready" : "warning"}
                          />
                        </div>
                        <p className="mt-2 text-sm text-zinc-400">{artifact.description}</p>
                        <div className="mt-4 space-y-1 text-xs text-zinc-500">
                          <p>{artifact.cid ? `CID: ${compactHash(artifact.cid)}` : "CID pending"}</p>
                          <p>{artifact.txHash ? `Tx: ${compactHash(artifact.txHash)}` : "Tx pending"}</p>
                        </div>
                      </div>
                      <Link
                        href={artifact.route}
                        className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-cyan-300"
                      >
                        Open
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </ReceiptGroup>

            {(privateReceipts.length > 0 || filecoinReady || storachaReady) ? (
              <ReceiptGroup eyebrow="Secondary Modules" title="Conditionally attached proofs">
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="workspace-subpanel rounded-3xl p-4">
                    <p className="font-semibold text-white">Starknet</p>
                    <div className="mt-3">
                      <StatusPill
                        label={privateReceipts.length > 0 ? "Attached" : status?.sponsorPath.starknetReady ? "Configured" : "Waiting"}
                        tone={
                          privateReceipts.length > 0
                            ? "ready"
                            : status?.sponsorPath.starknetReady
                              ? "warning"
                              : "warning"
                        }
                      />
                    </div>
                    <p className="mt-3 text-sm text-zinc-400">
                      {privateReceipts.length > 0
                        ? `${privateReceipts.length} private intent receipt(s) attached to this mission.`
                        : "Private intent remains secondary until the primary path is already strong."}
                    </p>
                  </div>
                  <div className="workspace-subpanel rounded-3xl p-4">
                    <p className="font-semibold text-white">Filecoin</p>
                    <div className="mt-3">
                      <StatusPill label={filecoinReady ? "Pinned" : "Waiting"} tone={filecoinReady ? "ready" : "warning"} />
                    </div>
                    <p className="mt-3 text-sm text-zinc-400">
                      Durable evidence is present only when mission artifacts have real storage anchors.
                    </p>
                  </div>
                  <div className="workspace-subpanel rounded-3xl p-4">
                    <div className="flex items-center gap-3">
                      <Database className="h-5 w-5 text-emerald-400" />
                      <p className="font-semibold text-white">Storacha</p>
                    </div>
                    <div className="mt-3">
                      <StatusPill label={storachaReady ? "Attached" : "Waiting"} tone={storachaReady ? "ready" : "warning"} />
                    </div>
                    <p className="mt-3 text-sm text-zinc-400">
                      Shared memory records appear here once they have durable storage references.
                    </p>
                  </div>
                </div>
              </ReceiptGroup>
            ) : null}
          </div>

          <div className="space-y-6">
            <WorkspaceSection
              eyebrow="Bundle Summary"
              title="Mission summary"
              actions={
                <button
                  type="button"
                  onClick={() => void copyArtifact("summary")}
                  className="workspace-button-secondary rounded-xl px-4 py-2 text-sm font-semibold"
                >
                  Copy summary
                </button>
              }
            >
              <div className="rounded-3xl border border-white/6 bg-zinc-950/70 p-5 font-mono text-xs leading-6 text-zinc-300">
                <pre className="whitespace-pre-wrap">{summaryText}</pre>
              </div>
            </WorkspaceSection>

            <CodePanel
              title="receipt_bundle.json"
              value={receiptText}
              onCopy={() => copyArtifact("receipt")}
              onDownload={() => exportArtifact("receipt")}
            />
          </div>
        </section>
      </div>
    </FrontierShell>
  );
}
