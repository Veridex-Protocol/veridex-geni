"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  CircleDashed,
  LockKeyhole,
  Rocket,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import {
  type ExecutionRailState,
  ExecutionRailSelector,
} from "@/components/frontierguard/execution-rail-selector";
import { FrontierShell } from "@/components/frontierguard/frontier-shell";
import { MetricCard } from "@/components/frontierguard/metric-card";
import { useFrontierStatus } from "@/components/frontierguard/use-frontier-status";
import {
  EmptyState,
  ReadinessStrip,
  StatusPill,
  WorkspaceSection,
} from "@/components/frontierguard/workspace-primitives";
import { useFrontierGuard } from "@/components/frontierguard/provider";
import { WithHelp } from "@/components/frontierguard/help-sys";
import type { MissionLaunchInput } from "@/lib/frontierguard/types";

type LaunchFormState = {
  title: string;
  objective: string;
  template: string;
  executionRail: MissionLaunchInput["executionRail"];
  totalUsd: string;
  perTxCapUsd: string;
  expiryHours: string;
  allowedTools: string;
  allowedChains: string;
  allowedCounterparties: string;
  escalationThresholdPct: string;
  minTrustScore: string;
  requireManualEscalation: boolean;
  scheduleCadence: MissionLaunchInput["scheduleCadence"];
  scheduleAt: string;
  retryPolicy: MissionLaunchInput["retryPolicy"];
  privateIntentLabel: string;
  privateRevealWindowHours: string;
  confidentialMaxSpendUsd: string;
  confidentialMinTrustScore: string;
  confidentialCounterparties: string;
  confidentialEmergencyStop: boolean;
};

function toList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toFormState(input: MissionLaunchInput): LaunchFormState {
  return {
    title: input.title,
    objective: input.objective,
    template: input.template,
    executionRail: input.executionRail,
    totalUsd: String(input.totalUsd),
    perTxCapUsd: String(input.perTxCapUsd),
    expiryHours: String(input.expiryHours),
    allowedTools: input.allowedTools.join(", "),
    allowedChains: input.allowedChains.join(", "),
    allowedCounterparties: input.allowedCounterparties.join(", "),
    escalationThresholdPct: String(input.escalationThresholdPct),
    minTrustScore: String(input.minTrustScore),
    requireManualEscalation: input.requireManualEscalation,
    scheduleCadence: input.scheduleCadence,
    scheduleAt: input.scheduleAt ?? "",
    retryPolicy: input.retryPolicy,
    privateIntentLabel: input.privateIntentLabel,
    privateRevealWindowHours: String(input.privateRevealWindowHours),
    confidentialMaxSpendUsd:
      input.confidentialMaxSpendUsd != null ? String(input.confidentialMaxSpendUsd) : "",
    confidentialMinTrustScore:
      input.confidentialMinTrustScore != null ? String(input.confidentialMinTrustScore) : "",
    confidentialCounterparties: input.confidentialCounterparties.join(", "),
    confidentialEmergencyStop: input.confidentialEmergencyStop,
  };
}

export default function MissionLaunchPage() {
  const router = useRouter();
  const { state, launchDefaults, launchMission, authenticatePasskey, resetDemo } = useFrontierGuard();
  const { status, loading, readiness } = useFrontierStatus();
  const [form, setForm] = useState<LaunchFormState>(() => toFormState(launchDefaults));
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setForm(toFormState(launchDefaults));
  }, [launchDefaults]);

  useEffect(() => {
    if (form.executionRail === "scheduled" || form.executionRail === "confidential") {
      setForm((current) => ({ ...current, executionRail: "immediate" }));
    }
  }, [form.executionRail]);

  function updateField<Key extends keyof LaunchFormState>(key: Key, value: LaunchFormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function buildPayload(): MissionLaunchInput {
    return {
      title: form.title,
      objective: form.objective,
      template: form.template,
      executionRail: form.executionRail,
      totalUsd: Number(form.totalUsd),
      perTxCapUsd: Number(form.perTxCapUsd),
      expiryHours: Number(form.expiryHours),
      allowedTools: toList(form.allowedTools),
      allowedChains: toList(form.allowedChains),
      allowedCounterparties: toList(form.allowedCounterparties),
      escalationThresholdPct: Number(form.escalationThresholdPct),
      minTrustScore: Number(form.minTrustScore),
      requireManualEscalation: form.requireManualEscalation,
      scheduleCadence: form.scheduleCadence,
      scheduleAt: form.scheduleAt || undefined,
      retryPolicy: form.retryPolicy,
      privateIntentLabel: form.privateIntentLabel,
      privateRevealWindowHours: Number(form.privateRevealWindowHours),
      confidentialMaxSpendUsd: form.confidentialMaxSpendUsd
        ? Number(form.confidentialMaxSpendUsd)
        : undefined,
      confidentialMinTrustScore: form.confidentialMinTrustScore
        ? Number(form.confidentialMinTrustScore)
        : undefined,
      confidentialCounterparties: toList(form.confidentialCounterparties),
      confidentialEmergencyStop: form.confidentialEmergencyStop,
    };
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = buildPayload();

    startTransition(async () => {
      await launchMission(payload);
      router.push("/mission/active");
    });
  }

  const validation = useMemo(() => {
    const issues: string[] = [];

    if (form.title.trim().length < 4) {
      issues.push("Mission title must be at least 4 characters.");
    }
    if (form.objective.trim().length < 20) {
      issues.push("Objective should clearly describe the operator outcome.");
    }
    if (Number(form.totalUsd) <= 0) {
      issues.push("Total budget must be greater than zero.");
    }
    if (Number(form.perTxCapUsd) <= 0) {
      issues.push("Per-transaction cap must be greater than zero.");
    }
    if (Number(form.perTxCapUsd) > Number(form.totalUsd)) {
      issues.push("Per-transaction cap cannot exceed the total budget.");
    }
    if (Number(form.minTrustScore) < 0 || Number(form.minTrustScore) > 100) {
      issues.push("Minimum trust score must stay between 0 and 100.");
    }
    if (toList(form.allowedTools).length === 0) {
      issues.push("Add at least one allowed tool.");
    }
    if (toList(form.allowedChains).length === 0) {
      issues.push("Add at least one allowed chain.");
    }
    if (toList(form.allowedCounterparties).length === 0) {
      issues.push("Add at least one approved counterparty.");
    }
    if (!state.session.authenticated || !state.session.passkeyCredentialId) {
      issues.push("A live passkey session is required before launch.");
    }

    return issues;
  }, [form, state.session.authenticated, state.session.passkeyCredentialId]);

  const canLaunch = validation.length === 0 && !isPending && !state.loading;
  const railStates: Partial<Record<MissionLaunchInput["executionRail"], ExecutionRailState>> = {
    immediate: {
      availability: "available",
      statusLabel: "Primary",
      description:
        "Default production path: passkey-authenticated control, x402 paid execution, and ERC-8004 trust receipts.",
    },
    private: {
      availability: status?.sponsorPath.starknetReady ? "available" : "gated",
      statusLabel: status?.sponsorPath.starknetReady ? "Ready" : "Waiting",
      reason: status?.sponsorPath.starknetReady
        ? "Starknet proof rail is configured."
        : "Starknet stays visible but gated until contract and keys are live.",
      description:
        "Private intent rail for sealed strategy or sensitive routing. Enable only when the Starknet path is fully configured.",
    },
    scheduled: {
      availability: "hidden",
    },
    confidential: {
      availability: "hidden",
    },
  };
  const summaryCards = [
    {
      label: "Session",
      value: state.session.authenticated ? "Bound" : "Missing",
      helper: state.session.passkeyLabel,
      tone: state.session.authenticated ? "success" : "danger",
    },
    {
      label: "Runtime",
      value: readiness.runtimeWalletBound ? "Ready" : "Pending",
      helper: loading ? "Checking runtime" : "Enterprise wallet handoff",
      tone: readiness.runtimeWalletBound ? "success" : "warning",
    },
    {
      label: "x402",
      value: readiness.x402Ready ? "Ready" : "Blocked",
      helper: "Paid service settlement path",
      tone: readiness.x402Ready ? "success" : "warning",
    },
    {
      label: "ERC-8004",
      value: readiness.erc8004Ready ? "Ready" : "Blocked",
      helper: "Trust registration and feedback path",
      tone: readiness.erc8004Ready ? "success" : "warning",
    },
  ] as const;
  const readinessItems = [
    {
      label: "Core Launch Path",
      description: readiness.corePathReady
        ? "The primary sponsor path is ready for a production-style demo."
        : "Finish the passkey/runtime/x402/ERC-8004 path before using live claims.",
      status: readiness.corePathReady ? "ready" : "warning",
    },
    {
      label: "Passkey Session",
      description: state.session.authenticated
        ? "This operator is already authenticated for launch."
        : "The operator needs a live passkey session before launch.",
      status: state.session.authenticated ? "ready" : "blocked",
    },
    {
      label: "Secondary Rails",
      description: status?.sponsorPath.starknetReady
        ? "Starknet is configured and can be attached intentionally."
        : "Private rail stays visible but gated until fully configured.",
      status: status?.sponsorPath.starknetReady ? "ready" : "waiting",
    },
  ] as const;

  return (
    <FrontierShell
      eyebrow="Mission Launch"
      title="Compose a bounded operator mission"
      description="Define the job, policy envelope, and execution path for the best-bet sponsor stack first. Secondary rails stay visible but gated until they are ready."
      actions={
        <div className="flex items-center gap-2">
          {!state.session.authenticated ? (
            <WithHelp id="launch-auth" text="A hardware-bound passkey session is required to authorize the launch of a new mission.">
              <button
                type="button"
                onClick={() => void authenticatePasskey()}
                className="workspace-button-primary rounded-xl px-4 py-2 text-sm font-semibold hover:-translate-y-0.5 transition-transform"
              >
                Re-authenticate
              </button>
            </WithHelp>
          ) : null}
          <WithHelp id="launch-reset" text="Reset the mission manifest to its default template configuration.">
            <button
              type="button"
              onClick={resetDemo}
              className="workspace-button-secondary rounded-xl px-4 py-2 text-sm font-semibold hover:-translate-y-0.5 transition-transform"
            >
              Reset Defaults
            </button>
          </WithHelp>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {state.error ? (
          <div className="rounded-2xl border border-red-500/18 bg-red-500/8 px-5 py-4 text-sm text-red-200">
            {state.error}
          </div>
        ) : null}

        <ReadinessStrip items={readinessItems.map((item) => ({ ...item }))} />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <MetricCard
              key={card.label}
              label={card.label}
              value={card.value}
              helper={card.helper}
              tone={card.tone}
            />
          ))}
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <WorkspaceSection
              eyebrow="Step 1"
              title="Mission definition"
              description="Describe the operator objective clearly enough that the mission can be reviewed, executed, and audited."
            >
              <div className="grid gap-4">
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-zinc-200">Mission title</span>
                  <input
                    value={form.title}
                    onChange={(event) => updateField("title", event.target.value)}
                    className="workspace-input rounded-2xl px-4 py-3 text-sm"
                    placeholder="Autonomous treasury yield review"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-zinc-200">Operator objective</span>
                  <textarea
                    value={form.objective}
                    onChange={(event) => updateField("objective", event.target.value)}
                    className="workspace-input min-h-36 rounded-2xl px-4 py-3 text-sm leading-6"
                    placeholder="Discover one premium yield route, pay for the source if policy allows it, verify the evidence, and finalize a receipt bundle."
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-zinc-200">Mission template</span>
                  <input
                    value={form.template}
                    onChange={(event) => updateField("template", event.target.value)}
                    className="workspace-input rounded-2xl px-4 py-3 text-sm"
                  />
                </label>
              </div>
            </WorkspaceSection>

            <WorkspaceSection
              eyebrow="Step 2"
              title="Budget and policy envelope"
              description="Keep the mission inside one clear operating boundary. This is what makes the control plane credible for enterprise operators."
            >
              <div className="grid gap-4 lg:grid-cols-3">
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-zinc-200">Total budget (USD)</span>
                  <input
                    type="number"
                    value={form.totalUsd}
                    onChange={(event) => updateField("totalUsd", event.target.value)}
                    className="workspace-input rounded-2xl px-4 py-3 text-sm"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-zinc-200">Per-transaction cap</span>
                  <input
                    type="number"
                    value={form.perTxCapUsd}
                    onChange={(event) => updateField("perTxCapUsd", event.target.value)}
                    className="workspace-input rounded-2xl px-4 py-3 text-sm"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-zinc-200">Expiry (hours)</span>
                  <input
                    type="number"
                    value={form.expiryHours}
                    onChange={(event) => updateField("expiryHours", event.target.value)}
                    className="workspace-input rounded-2xl px-4 py-3 text-sm"
                  />
                </label>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-zinc-200">Allowed tools</span>
                  <input
                    value={form.allowedTools}
                    onChange={(event) => updateField("allowedTools", event.target.value)}
                    className="workspace-input rounded-2xl px-4 py-3 text-sm"
                    placeholder="premium-yield, filecoin-pin, storacha-sync"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-zinc-200">Allowed chains</span>
                  <input
                    value={form.allowedChains}
                    onChange={(event) => updateField("allowedChains", event.target.value)}
                    className="workspace-input rounded-2xl px-4 py-3 text-sm"
                    placeholder="base-sepolia, starknet-sepolia"
                  />
                </label>
                <label className="grid gap-2 lg:col-span-2">
                  <span className="text-sm font-medium text-zinc-200">Approved counterparties</span>
                  <input
                    value={form.allowedCounterparties}
                    onChange={(event) => updateField("allowedCounterparties", event.target.value)}
                    className="workspace-input rounded-2xl px-4 py-3 text-sm"
                    placeholder="yield_hub, filecoin_pin, storacha_network"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-zinc-200">Escalation threshold (%)</span>
                  <input
                    type="number"
                    value={form.escalationThresholdPct}
                    onChange={(event) => updateField("escalationThresholdPct", event.target.value)}
                    className="workspace-input rounded-2xl px-4 py-3 text-sm"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-zinc-200">Minimum trust score</span>
                  <input
                    type="number"
                    value={form.minTrustScore}
                    onChange={(event) => updateField("minTrustScore", event.target.value)}
                    className="workspace-input rounded-2xl px-4 py-3 text-sm"
                  />
                </label>
              </div>

              <label className="mt-4 flex items-center justify-between rounded-3xl border border-white/8 bg-black/10 px-5 py-4">
                <div>
                  <p className="font-medium text-white">Require manual escalation</p>
                  <p className="mt-1 text-sm text-zinc-500">
                    Block high-risk actions until the operator approves them.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={form.requireManualEscalation}
                  onChange={(event) => updateField("requireManualEscalation", event.target.checked)}
                  className="h-5 w-5 rounded border-white/20 bg-zinc-900 text-emerald-500 focus:ring-emerald-500"
                />
              </label>
            </WorkspaceSection>

            <WorkspaceSection
              eyebrow="Step 3"
              title="Execution mode"
              description="Keep the primary mission path dominant. Secondary rails remain gated until their live path is proven."
            >
              <ExecutionRailSelector
                value={form.executionRail}
                onChange={(nextRail) => updateField("executionRail", nextRail)}
                states={railStates}
              />

              {form.executionRail === "private" ? (
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-zinc-200">Private intent label</span>
                    <input
                      value={form.privateIntentLabel}
                      onChange={(event) => updateField("privateIntentLabel", event.target.value)}
                      className="workspace-input rounded-2xl px-4 py-3 text-sm"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-zinc-200">Reveal window (hours)</span>
                    <input
                      type="number"
                      value={form.privateRevealWindowHours}
                      onChange={(event) =>
                        updateField("privateRevealWindowHours", event.target.value)
                      }
                      className="workspace-input rounded-2xl px-4 py-3 text-sm"
                    />
                  </label>
                </div>
              ) : null}
            </WorkspaceSection>
          </div>

          <div className="space-y-6">
            <WorkspaceSection
              eyebrow="Step 4"
              title="Review and launch"
              description="Launch only when the operator session and the core sponsor path are ready."
            >
              <div className="space-y-4">
                <div className="workspace-subpanel rounded-3xl p-5">
                  <div className="flex items-center gap-3">
                    <Rocket className="h-5 w-5 text-emerald-400" />
                    <div>
                      <p className="font-semibold text-white">{form.title || "Untitled mission"}</p>
                      <p className="mt-1 text-sm text-zinc-400">{form.template}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-zinc-300">
                    {form.objective || "Add an operator objective to continue."}
                  </p>
                </div>

                <div className="workspace-subpanel rounded-3xl p-5">
                  <div className="flex items-center gap-3">
                    <Wallet className="h-5 w-5 text-cyan-400" />
                    <p className="font-semibold text-white">Budget and policy summary</p>
                  </div>
                  <div className="mt-4 grid gap-3 text-sm text-zinc-300">
                    <div className="flex items-center justify-between gap-4">
                      <span>Total budget</span>
                      <span>${Number(form.totalUsd || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>Per-transaction cap</span>
                      <span>${Number(form.perTxCapUsd || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>Min trust score</span>
                      <span>{form.minTrustScore || "0"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>Execution mode</span>
                      <StatusPill
                        label={form.executionRail}
                        tone={form.executionRail === "immediate" ? "ready" : "warning"}
                      />
                    </div>
                  </div>
                </div>

                <div className="workspace-subpanel rounded-3xl p-5">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-emerald-400" />
                    <p className="font-semibold text-white">Launch checklist</p>
                  </div>
                  <div className="mt-4 space-y-3">
                    {validation.length === 0 ? (
                      <div className="rounded-2xl border border-emerald-500/18 bg-emerald-500/8 px-4 py-4 text-sm text-emerald-200">
                        The mission is ready to launch on the primary sponsor path.
                      </div>
                    ) : (
                      validation.map((issue) => (
                        <div
                          key={issue}
                          className="rounded-2xl border border-white/8 bg-black/10 px-4 py-3 text-sm text-zinc-400"
                        >
                          {issue}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <WithHelp id="launch-submit" text="Sign the deterministic execution manifest and dispatch it to the runtime layer.">
                  <button
                    type="submit"
                    disabled={!canLaunch}
                    className="workspace-button-primary inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 hover:scale-[1.01] transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {isPending ? "Configuring systems..." : "Initialize Runtime Context"}
                  </button>
                </WithHelp>

                {!state.session.authenticated ? (
                  <WithHelp id="launch-auth-empty" text="Before launching, you must authenticate as a trusted operator bound by hardware cryptography.">
                    <EmptyState
                      title="Passkey session requirement"
                      description="Connect your operator credentials to unlock enterprise deployment boundaries."
                      action={
                        <button
                          type="button"
                          onClick={() => void authenticatePasskey()}
                          className="workspace-button-primary rounded-xl px-4 py-2 text-sm font-semibold hover:-translate-y-0.5 transition-transform"
                        >
                          Sign in with passkey
                        </button>
                      }
                    />
                  </WithHelp>
                ) : null}
              </div>
            </WorkspaceSection>

            <WorkspaceSection
              eyebrow="Operator Notes"
              title="Secondary modules"
              description="The workspace stays focused on the best-bet path. Additional modules surface only when they can be defended."
            >
              <div className="space-y-4">
                <div className="workspace-subpanel rounded-3xl p-5">
                  <div className="flex items-center gap-3">
                    <LockKeyhole className="h-5 w-5 text-amber-300" />
                    <p className="font-semibold text-white">Starknet</p>
                    <StatusPill
                      label={status?.sponsorPath.starknetReady ? "Configured" : "Waiting"}
                      tone={status?.sponsorPath.starknetReady ? "ready" : "warning"}
                    />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-zinc-400">
                    Private intent stays visible but gated until the account, contract, and keys are ready for explorer-backed proofs.
                  </p>
                </div>
                <div className="workspace-subpanel rounded-3xl p-5">
                  <div className="flex items-center gap-3">
                    <CircleDashed className="h-5 w-5 text-zinc-400" />
                    <p className="font-semibold text-white">Flow and Zama</p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-zinc-400">
                    These rails are intentionally removed from the primary launch surface for this pass. They can return after the core path is fully live.
                  </p>
                </div>
              </div>
            </WorkspaceSection>

            <div className="flex items-center justify-between gap-3 rounded-3xl border border-white/8 bg-black/10 px-5 py-4 text-sm text-zinc-400">
              <span>Need the proof posture before launch?</span>
              <Link href="/settings" className="text-sm font-semibold text-emerald-300">
                Open settings
              </Link>
            </div>
          </div>
        </div>
      </form>
    </FrontierShell>
  );
}
