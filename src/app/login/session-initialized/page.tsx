"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { CheckCircle2, FileCheck2, ShieldCheck, Wallet } from "lucide-react";
import { useFrontierAuth } from "@/components/frontierguard/auth-provider";
import { useFrontierStatus } from "@/components/frontierguard/use-frontier-status";
import { StatusPill } from "@/components/frontierguard/workspace-primitives";

function truncateMiddle(value: string, start = 8, end = 6): string {
  if (value.length <= start + end + 3) {
    return value;
  }

  return `${value.slice(0, start)}...${value.slice(-end)}`;
}

export default function SessionInitializedPage() {
  const auth = useFrontierAuth();
  const router = useRouter();
  const { status, loading, refresh } = useFrontierStatus({ auto: false });

  useEffect(() => {
    if (!auth.ready) {
      return;
    }

    let active = true;
    let retryTimer: number | undefined;

    const hydrate = async (attempt = 0) => {
      const restoredSession =
        auth.session ?? (await auth.refreshSession({ silent: true }).catch(() => null));

      if (!active) {
        return;
      }

      if (!restoredSession) {
        router.replace("/login");
        return;
      }

      const snapshot = await refresh({ silent: true }).catch(() => null);
      if (!active) {
        return;
      }

      const runtimeBound = Boolean(snapshot?.runtime.available);
      const signerBound = snapshot?.runtimeHealth.signerSource === "session_wallet";

      if (!runtimeBound && !signerBound && attempt < 4) {
        retryTimer = window.setTimeout(() => {
          void hydrate(attempt + 1);
        }, 900);
      }
    };

    void hydrate();

    return () => {
      active = false;
      if (retryTimer) {
        window.clearTimeout(retryTimer);
      }
    };
  }, [auth.ready, auth.refreshSession, auth.session, refresh, router]);

  const session = auth.session;
  const profile = session
    ? auth.storedProfiles.find((item) => item.credentialId === session.passkeyCredentialId)
    : null;
  const runtimeBound = Boolean(status?.runtime.available);
  const sessionSignerBound = status?.runtimeHealth.signerSource === "session_wallet";
  const liveProofReady = Boolean(
    status?.runtimeHealth.liveWriteReady && status?.runtimeHealth.livePaymentReady,
  );
  const leadWarning = status?.runtimeHealth.warnings[0];

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-emerald-950/20 via-transparent to-cyan-950/10" />
      <main className="relative z-10 mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6 py-10">
        <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="workspace-panel rounded-[32px] p-8">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/14">
              <CheckCircle2 className="h-8 w-8 text-emerald-300" />
            </div>
            <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-400">
              Session Ready
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">
              Operator channel initialized.
            </h1>
            <p className="mt-4 text-sm leading-7 text-zinc-400">
              Your passkey-backed session is now ready to launch or operate missions inside the control plane. Existing credentials remain preserved for future sign-ins on this browser.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="workspace-subpanel rounded-3xl p-5">
                <Wallet className="h-5 w-5 text-cyan-400" />
                <p className="mt-4 font-semibold text-white">Runtime wallet</p>
                <p className="mt-2 text-sm text-zinc-400">
                  {truncateMiddle(session.vaultAddress ?? session.operatorWallet, 10, 6)}
                </p>
              </div>
              <div className="workspace-subpanel rounded-3xl p-5">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <p className="mt-4 font-semibold text-white">Passkey label</p>
                <p className="mt-2 text-sm text-zinc-400">{session.passkeyLabel}</p>
              </div>
              <div className="workspace-subpanel rounded-3xl p-5">
                <FileCheck2 className="h-5 w-5 text-cyan-400" />
                <p className="mt-4 font-semibold text-white">Stored credentials</p>
                <p className="mt-2 text-sm text-zinc-400">
                  {session.credentialCount ?? auth.storedProfiles.length}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-white/6 bg-black/15 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                    Operational proof
                  </p>
                  <p className="mt-2 text-sm text-zinc-400">
                    This screen confirms that the passkey ceremony is usable by the runtime, not just locally cached in the browser.
                  </p>
                </div>
                <StatusPill
                  label={
                    runtimeBound || sessionSignerBound
                      ? "Operational"
                      : loading
                        ? "Checking"
                        : "Pending"
                  }
                  tone={
                    runtimeBound || sessionSignerBound
                      ? "ready"
                      : loading
                        ? "waiting"
                        : "warning"
                  }
                />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="workspace-subpanel rounded-2xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                    Cookie session
                  </p>
                  <p className="mt-3 text-sm font-semibold text-white">
                    {session.sessionId ? "Verified" : "Unresolved"}
                  </p>
                </div>
                <div className="workspace-subpanel rounded-2xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                    Runtime wallet
                  </p>
                  <p className="mt-3 text-sm font-semibold text-white">
                    {runtimeBound ? "Bound" : loading ? "Checking" : "Pending"}
                  </p>
                </div>
                <div className="workspace-subpanel rounded-2xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                    Signer source
                  </p>
                  <p className="mt-3 text-sm font-semibold text-white">
                    {sessionSignerBound
                      ? "Session wallet"
                      : status?.runtimeHealth.signerSource === "erc8004_private_key"
                        ? "Dedicated key"
                        : loading
                          ? "Checking"
                          : "Unavailable"}
                  </p>
                </div>
              </div>

              {leadWarning ? (
                <p className="mt-4 text-sm text-amber-300">{leadWarning}</p>
              ) : null}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/mission/overview"
                className="workspace-button-primary inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold"
              >
                Enter command center
              </Link>
              <Link
                href="/settings"
                className="workspace-button-secondary inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold"
              >
                Open settings
              </Link>
            </div>
          </section>

          <section className="workspace-panel rounded-[32px] p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                  Bound Operator
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  {profile?.displayName ?? session.operatorName}
                </h2>
              </div>
              <StatusPill label="Authenticated" tone="ready" />
            </div>

            <div className="mt-8 rounded-3xl border border-white/6 bg-black/15 p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                Session details
              </p>
              <div className="mt-4 space-y-3 text-sm text-zinc-300">
                <p>
                  <span className="text-zinc-500">Credential:</span>{" "}
                  {truncateMiddle(session.passkeyCredentialId, 12, 10)}
                </p>
                <p>
                  <span className="text-zinc-500">Key hash:</span>{" "}
                  {session.passkeyKeyHash
                    ? truncateMiddle(session.passkeyKeyHash, 12, 10)
                    : "unavailable"}
                </p>
                <p>
                  <span className="text-zinc-500">Network status:</span> {session.networkStatus}
                </p>
                <p>
                  <span className="text-zinc-500">Runtime bound:</span>{" "}
                  {runtimeBound ? "yes" : loading ? "checking" : "no"}
                </p>
                <p>
                  <span className="text-zinc-500">Live proof posture:</span>{" "}
                  {liveProofReady ? "fully funded" : "session-ready, funding still required"}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="workspace-subpanel rounded-3xl p-5">
                <p className="font-semibold text-white">What happens next</p>
                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  Move into the command center to launch or monitor missions. The workspace will use this passkey session for guarded actions, paid services, and trust receipts.
                </p>
              </div>
              <div className="workspace-subpanel rounded-3xl p-5">
                <p className="font-semibold text-white">No credential overwrite</p>
                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  Existing credentials on this device remain available. New passkey registrations add to the preserved local profile set instead of replacing previous ones.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
