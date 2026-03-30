"use client";

import Link from "next/link";
import { FileJson2 } from "lucide-react";
import { CodePanel } from "@/components/frontierguard/code-panel";
import { FrontierShell } from "@/components/frontierguard/frontier-shell";
import { MetricCard } from "@/components/frontierguard/metric-card";
import { WorkspaceSection } from "@/components/frontierguard/workspace-primitives";
import { useFrontierGuard } from "@/components/frontierguard/provider";

export default function AgentManifestPage() {
  const { mission, manifestText, copyArtifact, exportArtifact } = useFrontierGuard();

  return (
    <FrontierShell
      eyebrow="Capability Manifest"
      title="agent.json for the live mission"
      description="The manifest is generated from the current mission policy and exported as the machine-readable capability surface for the runtime."
      actions={
        <>
          <button
            type="button"
            onClick={() => void copyArtifact("manifest")}
            className="workspace-button-secondary rounded-xl px-4 py-2 text-sm font-semibold"
          >
            Copy JSON
          </button>
          <button
            type="button"
            onClick={() => exportArtifact("manifest")}
            className="workspace-button-primary rounded-xl px-4 py-2 text-sm font-semibold"
          >
            Download
          </button>
        </>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
        <div className="space-y-6">
          <section className="grid gap-4">
            <MetricCard label="Agent" value={mission.identity.agentName} helper={mission.identity.erc8004Identity} tone="primary" />
            <MetricCard label="Budget Cap" value={`$${mission.budget.totalUsd.toFixed(2)}`} helper={`Per tx $${mission.budget.perTxCapUsd.toFixed(2)}`} tone="success" />
            <MetricCard label="Trust Threshold" value={`${mission.policy.minTrustScore}+`} helper="Minimum counterparty score" tone="default" />
          </section>

          <WorkspaceSection
            eyebrow="Manifest Notes"
            title="How this document is used"
            actions={
              <Link href="/mission/agent" className="workspace-button-secondary inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold">
                Open trust profile
              </Link>
            }
          >
            <div className="space-y-4 text-sm leading-6 text-zinc-400">
              <div className="workspace-subpanel rounded-3xl p-4">
                The manifest is derived from the live mission policy object and exported for operator review or machine discovery.
              </div>
              <div className="workspace-subpanel rounded-3xl p-4">
                It is pinned after the ERC-8004 identity registration step so the trust story and the capability surface stay aligned.
              </div>
              <div className="workspace-subpanel rounded-3xl p-4">
                Fields include supported tools, chains, categories, and compute limits for the current mission envelope.
              </div>
              <div className="workspace-subpanel rounded-3xl p-4">
                <div className="flex items-center gap-3">
                  <FileJson2 className="h-5 w-5 text-cyan-400" />
                  <p className="font-semibold text-white">Production rule</p>
                </div>
                <p className="mt-3">
                  The manifest should remain a faithful reflection of the mission, not an aspirational list of sponsor features that are not active.
                </p>
              </div>
            </div>
          </WorkspaceSection>
        </div>

        <CodePanel
          title="agent.json"
          value={manifestText}
          onCopy={() => copyArtifact("manifest")}
          onDownload={() => exportArtifact("manifest")}
        />
      </div>
    </FrontierShell>
  );
}
