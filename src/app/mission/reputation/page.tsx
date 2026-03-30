"use client";

import { useState } from "react";
import Link from "next/link";
import { FrontierShell } from "@/components/frontierguard/frontier-shell";
import { MetricCard } from "@/components/frontierguard/metric-card";
import { StatusPill, WorkspaceSection } from "@/components/frontierguard/workspace-primitives";
import { useFrontierGuard } from "@/components/frontierguard/provider";

export default function ReputationFeedbackPage() {
  const { mission, submitReputation, state } = useFrontierGuard();
  const [rating, setRating] = useState(mission.reputation.rating);
  const [notes, setNotes] = useState(mission.reputation.notes);

  return (
    <FrontierShell
      eyebrow="Reputation Feedback"
      title="Post-mission evaluation for ERC-8004"
      description="Publish a final mission evaluation only when the operator is satisfied that the receipts and evidence bundle are complete."
      actions={
        <Link href="/receipts" className="workspace-button-secondary inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold">
          Back to receipts
        </Link>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-4">
          <MetricCard label="Current Score" value={mission.identity.trustScore.toFixed(1)} helper={mission.identity.erc8004Identity} tone="primary" />
          <MetricCard label="Latest Delta" value={mission.identity.trustDelta.toFixed(2)} helper="Most recent feedback adjustment" tone={mission.identity.trustDelta >= 0 ? "success" : "danger"} />
          <MetricCard label="Feedback Tx" value={mission.identity.feedbackTxHash ? `${mission.identity.feedbackTxHash.slice(0, 12)}...` : "Pending"} helper="Onchain reputation receipt" tone="success" />
        </div>

        <WorkspaceSection eyebrow="Evaluation" title="Submit mission feedback">
          <p className="text-sm leading-6 text-zinc-400">
            Rate the mission outcome and publish an updated reputation record for the agent once the run has been reviewed.
          </p>

          <div className="mt-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Success rating</p>
            <div className="mt-3 flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className={`rounded-full px-4 py-3 text-sm font-semibold transition-colors ${
                    rating >= value
                      ? "bg-emerald-500/14 text-emerald-300"
                      : "workspace-button-secondary"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          <label className="mt-6 grid gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Technical post-mortem</span>
            <textarea
              rows={8}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="workspace-input rounded-3xl px-4 py-3 text-sm leading-6"
            />
          </label>

          <div className="mt-6 rounded-3xl border border-white/8 bg-black/10 p-5">
            <div className="flex items-center gap-3">
              <StatusPill label={mission.identity.feedbackTxHash ? "Existing tx" : "New tx"} tone={mission.identity.feedbackTxHash ? "ready" : "warning"} />
              <p className="text-sm text-zinc-400">
                {mission.identity.feedbackTxHash ?? "A new ERC-8004 feedback transaction will be created."}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void submitReputation(rating, notes)}
              disabled={state.loading}
              className="workspace-button-primary rounded-xl px-6 py-3 text-sm font-semibold disabled:opacity-50"
            >
              Finalize and commit rating
            </button>
            <Link href="/receipts" className="workspace-button-secondary inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold">
              Cancel
            </Link>
          </div>
        </WorkspaceSection>
      </div>
    </FrontierShell>
  );
}
