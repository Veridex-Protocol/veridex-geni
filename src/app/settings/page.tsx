"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Database,
  ExternalLink,
  FileArchive,
  Fingerprint,
  Globe,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { FrontierShell } from "@/components/frontierguard/frontier-shell";
import { LogoutButton } from "@/components/frontierguard/logout-button";
import { useFrontierStatus } from "@/components/frontierguard/use-frontier-status";
import {
  EmptyState,
  FieldRow,
  StatusPill,
  WorkspaceSection,
} from "@/components/frontierguard/workspace-primitives";
import { useFrontierAuth } from "@/components/frontierguard/auth-provider";
import { useFrontierGuard } from "@/components/frontierguard/provider";

function truncate(value: string, start = 10, end = 8): string {
  if (value.length <= start + end + 3) {
    return value;
  }

  return `${value.slice(0, start)}...${value.slice(-end)}`;
}

function formatSignerSource(
  value: "session_wallet" | "erc8004_private_key" | "unavailable" | undefined,
): string {
  switch (value) {
    case "session_wallet":
      return "Enterprise session signer";
    case "erc8004_private_key":
      return "Dedicated ERC-8004 signer";
    default:
      return "Unavailable";
  }
}

export default function SettingsPage() {
  const auth = useFrontierAuth();
  const { mission, authenticatePasskey, state } = useFrontierGuard();
  const { status, loading, error, readiness } = useFrontierStatus();
  const origin =
    typeof window === "undefined" ? "" : window.location.origin;
  const machineAccess = useMemo(
    () => [
      {
        label: "Agent registration",
        href: `${origin}/.well-known/agent-registration.json`,
        readiness: readiness.runtimeWalletBound,
      },
      {
        label: "UCP discovery",
        href: `${origin}/.well-known/ucp`,
        readiness: readiness.x402Ready,
      },
      {
        label: "ACP checkout",
        href: `${origin}/.well-known/acp-checkout`,
        readiness: readiness.x402Ready,
      },
      {
        label: "AP2 mandate",
        href: `${origin}/.well-known/ap2-mandate`,
        readiness: readiness.runtimeWalletBound,
      },
      {
        label: "Premium yield service",
        href: `${origin}/api/frontier/agent/premium-yield`,
        readiness: readiness.liveProofReady,
      },
    ],
    [origin, readiness.liveProofReady, readiness.runtimeWalletBound, readiness.x402Ready],
  );
  const storageArtifacts = mission.artifacts.filter((artifact) => artifact.status === "pinned");
  const memoryAnchors = mission.memory.filter((record) => Boolean(record.cid));

  return (
    <FrontierShell
      eyebrow="Workspace Settings"
      title="Session, readiness, and machine access"
      description="Review the operator session, production readiness, and the exact endpoints or resources that agents can use on this control plane."
      actions={<LogoutButton />}
    >
      <div className="space-y-6">
        {error ? (
          <div className="rounded-2xl border border-red-500/18 bg-red-500/8 px-5 py-4 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <WorkspaceSection
              eyebrow="Session and Passkey"
              title={auth.session?.operatorName ?? "Guest operator"}
              actions={
                <StatusPill
                  label={auth.session?.authenticated ? "Authenticated" : "Passkey required"}
                  tone={auth.session?.authenticated ? "ready" : "blocked"}
                />
              }
            >
              <dl>
                <FieldRow
                  label="Operator wallet"
                  value={truncate(
                    auth.session?.vaultAddress ?? auth.session?.operatorWallet ?? "passkey-required",
                  )}
                />
                <FieldRow
                  label="Credential"
                  value={truncate(auth.session?.passkeyCredentialId ?? "none")}
                />
                <FieldRow
                  label="Passkey label"
                  value={auth.session?.passkeyLabel ?? "Unavailable"}
                />
                <FieldRow
                  label="Stored profiles"
                  value={String(auth.storedProfiles.length)}
                />
              </dl>

              {!auth.session?.authenticated ? (
                <div className="mt-5">
                  <button
                    type="button"
                    onClick={() => void authenticatePasskey()}
                    className="workspace-button-primary rounded-xl px-4 py-2 text-sm font-semibold"
                  >
                    Re-authenticate
                  </button>
                </div>
              ) : null}
            </WorkspaceSection>

            <WorkspaceSection eyebrow="Runtime" title="Production path readiness">
              <div className="grid gap-3">
                <div className="workspace-subpanel rounded-3xl p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="h-5 w-5 text-cyan-300" />
                      <p className="font-semibold text-white">Core sponsor proof path</p>
                    </div>
                    <StatusPill
                      label={readiness.liveProofReady ? "Ready" : "Needs session or infra"}
                      tone={readiness.liveProofReady ? "ready" : "warning"}
                    />
                  </div>
                </div>
                <div className="workspace-subpanel rounded-3xl p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Wallet className="h-5 w-5 text-cyan-400" />
                      <p className="font-semibold text-white">Enterprise runtime wallet</p>
                    </div>
                    <StatusPill
                      label={readiness.runtimeWalletBound ? "Ready" : loading ? "Checking" : "Waiting"}
                      tone={readiness.runtimeWalletBound ? "ready" : loading ? "waiting" : "warning"}
                    />
                  </div>
                </div>
                <div className="workspace-subpanel rounded-3xl p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-emerald-400" />
                      <p className="font-semibold text-white">x402 payment path</p>
                    </div>
                    <StatusPill
                      label={readiness.x402Ready ? "Verifiable" : "Blocked"}
                      tone={readiness.x402Ready ? "ready" : "warning"}
                    />
                  </div>
                </div>
                <div className="workspace-subpanel rounded-3xl p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="h-5 w-5 text-emerald-400" />
                      <p className="font-semibold text-white">ERC-8004 trust path</p>
                    </div>
                    <StatusPill
                      label={readiness.erc8004Ready ? "Verifiable" : "Blocked"}
                      tone={readiness.erc8004Ready ? "ready" : "warning"}
                    />
                  </div>
                </div>
                <div className="workspace-subpanel rounded-3xl p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Fingerprint className="h-5 w-5 text-amber-300" />
                      <p className="font-semibold text-white">Starknet proof rail</p>
                    </div>
                    <StatusPill
                      label={status?.sponsorPath.starknetReady ? "Configured" : "Waiting for contract"}
                      tone={status?.sponsorPath.starknetReady ? "ready" : "warning"}
                    />
                  </div>
                </div>
              </div>
              {status?.runtimeHealth ? (
                <div className="mt-4 rounded-3xl border border-white/8 bg-black/10 p-5">
                  <dl>
                    <FieldRow
                      label="Live signer source"
                      value={formatSignerSource(status.runtimeHealth.signerSource)}
                      tone={status.runtimeHealth.available ? "success" : "warning"}
                    />
                    <FieldRow
                      label="Signer address"
                      value={truncate(status.runtimeHealth.walletAddress ?? "unresolved")}
                      tone={status.runtimeHealth.walletAddress ? "success" : "warning"}
                    />
                    <FieldRow
                      label="Native gas balance"
                      value={
                        status.runtimeHealth.nativeBalanceFormatted
                          ? `${status.runtimeHealth.nativeBalanceFormatted} ETH`
                          : "Unavailable"
                      }
                      tone={status.runtimeHealth.liveWriteReady ? "success" : "warning"}
                    />
                    <FieldRow
                      label="Payment balance"
                      value={
                        status.runtimeHealth.assetBalanceFormatted
                          ? `${status.runtimeHealth.assetBalanceFormatted} ${status.runtimeHealth.assetSymbol ?? "USDC"}`
                          : "Unavailable"
                      }
                      tone={status.runtimeHealth.livePaymentReady ? "success" : "warning"}
                    />
                    <FieldRow
                      label="Live write capability"
                      value={status.runtimeHealth.liveWriteReady ? "Ready" : "Top up gas"}
                      tone={status.runtimeHealth.liveWriteReady ? "success" : "warning"}
                    />
                    <FieldRow
                      label="Live payment capability"
                      value={status.runtimeHealth.livePaymentReady ? "Ready" : "Top up paywall asset"}
                      tone={status.runtimeHealth.livePaymentReady ? "success" : "warning"}
                    />
                  </dl>
                  {status.runtimeHealth.warnings.length ? (
                    <div className="mt-4 space-y-2 text-sm leading-6 text-amber-200/85">
                      {status.runtimeHealth.warnings.map((warning) => (
                        <p key={warning}>{warning}</p>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
              {status?.sponsorPath.missing?.length ? (
                <p className="mt-4 text-sm leading-6 text-zinc-500">
                  Missing env or infra: {status.sponsorPath.missing.join(", ")}
                </p>
              ) : null}
            </WorkspaceSection>
          </div>

          <div className="space-y-6">
            <WorkspaceSection
              eyebrow="Machine Access"
              title="Endpoints agents can discover and pay for"
              description="This is the operator-facing surface for agents like OpenClaw. It shows what is routable, what requires auth, and what is production-ready."
            >
              <div className="space-y-3">
                {machineAccess.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="workspace-subpanel workspace-hover flex items-center justify-between gap-4 rounded-3xl p-4"
                  >
                    <div>
                      <p className="font-semibold text-white">{item.label}</p>
                      <p className="mt-1 font-mono text-xs text-zinc-500">{item.href}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusPill label={item.readiness ? "Ready" : "Blocked"} tone={item.readiness ? "ready" : "warning"} />
                      <ExternalLink className="h-4 w-4 text-zinc-400" />
                    </div>
                  </a>
                ))}
              </div>

              <div className="mt-5 rounded-3xl border border-white/8 bg-black/10 p-5">
                <dl>
                  <FieldRow label="Auth requirement" value="Passkey-backed operator session" />
                  <FieldRow
                    label="Manifest availability"
                    value={mission.artifacts.some((artifact) => artifact.type === "manifest") ? "Available" : "Pending"}
                    tone={mission.artifacts.some((artifact) => artifact.type === "manifest") ? "success" : "warning"}
                  />
                  <FieldRow
                    label="Receipt bundle"
                    value="Exportable from receipts vault"
                    tone="success"
                  />
                </dl>
              </div>
            </WorkspaceSection>

            <WorkspaceSection
              eyebrow="Evidence State"
              title="Storage and audit posture"
              description="Storage stays secondary until the primary sponsor path is stable, but the operator still needs to see whether evidence and memory are recoverable."
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="workspace-subpanel rounded-3xl p-5">
                  <div className="flex items-center gap-3">
                    <FileArchive className="h-5 w-5 text-cyan-400" />
                    <p className="font-semibold text-white">Evidence artifacts</p>
                  </div>
                  <div className="mt-4">
                    <StatusPill
                      label={storageArtifacts.length > 0 ? "Pinned" : "Waiting"}
                      tone={storageArtifacts.length > 0 ? "ready" : "warning"}
                    />
                  </div>
                  <p className="mt-3 text-sm text-zinc-400">
                    {storageArtifacts.length} artifact(s) are already storage-backed.
                  </p>
                </div>
                <div className="workspace-subpanel rounded-3xl p-5">
                  <div className="flex items-center gap-3">
                    <Database className="h-5 w-5 text-emerald-400" />
                    <p className="font-semibold text-white">Shared memory</p>
                  </div>
                  <div className="mt-4">
                    <StatusPill
                      label={memoryAnchors.length > 0 ? "Anchored" : "Waiting"}
                      tone={memoryAnchors.length > 0 ? "ready" : "warning"}
                    />
                  </div>
                  <p className="mt-3 text-sm text-zinc-400">
                    {memoryAnchors.length} memory record(s) have durable references.
                  </p>
                </div>
              </div>
            </WorkspaceSection>

            <WorkspaceSection eyebrow="Stored Profiles" title="Passkeys already preserved on this device">
              {auth.storedProfiles.length > 0 ? (
                <div className="space-y-3">
                  {auth.storedProfiles.map((profile) => (
                    <div key={profile.credentialId} className="workspace-subpanel rounded-3xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-white">{profile.displayName}</p>
                          <p className="mt-1 text-sm text-zinc-400">{profile.username}</p>
                        </div>
                        <StatusPill label={profile.passkeyLabel} tone="neutral" />
                      </div>
                      <p className="mt-3 font-mono text-xs text-zinc-500">
                        {truncate(profile.vaultAddress)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No stored passkeys"
                  description="Create a passkey from the login screen or re-authenticate to bind this browser to an operator profile."
                  action={
                    <Link
                      href="/login"
                      className="workspace-button-primary inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold"
                    >
                      Go to login
                    </Link>
                  }
                />
              )}
            </WorkspaceSection>
          </div>
        </section>
      </div>
    </FrontierShell>
  );
}
