"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Fingerprint, KeyRound, ShieldCheck, Wallet } from "lucide-react";
import { useFrontierAuth } from "@/components/frontierguard/auth-provider";
import { StatusPill } from "@/components/frontierguard/workspace-primitives";

export default function LoginPrimaryAuthPage() {
  const router = useRouter();
  const auth = useFrontierAuth();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");

  const canCreatePasskey = useMemo(
    () => username.trim().length > 1 && displayName.trim().length > 1,
    [displayName, username],
  );
  const signInLabel =
    auth.storedProfiles.length > 0
      ? `Sign in with passkey (${auth.storedProfiles.length})`
      : "Sign in with passkey";

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-emerald-950/20 via-transparent to-cyan-950/10" />
      <header className="relative z-10 border-b border-white/6">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500">
              <span className="text-sm font-black text-white">V</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">FrontierGuard</p>
              <p className="text-xs text-zinc-500">Enterprise operator control plane</p>
            </div>
          </div>
          <StatusPill
            label={auth.platformAuthenticatorAvailable ? "Passkey ready" : "Checking device"}
            tone={auth.platformAuthenticatorAvailable ? "ready" : "waiting"}
          />
        </div>
      </header>

      <main className="relative z-10 mx-auto grid min-h-[calc(100vh-81px)] max-w-7xl gap-10 px-6 py-10 lg:grid-cols-[1fr_480px] lg:items-center">
        <section className="max-w-2xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-400">
            Best-Bet Sponsor Path
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-6xl">
            Passkey-authenticated mission control for autonomous execution.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-zinc-400 sm:text-lg">
            Authorize an operator with a passkey, launch a bounded mission, settle paid actions over x402, and export ERC-8004 trust receipts without losing control of the narrative.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="workspace-panel rounded-3xl p-5">
              <Fingerprint className="h-5 w-5 text-emerald-400" />
              <p className="mt-4 font-semibold text-white">Passkey access</p>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                No passwords. Hardware-backed operator sessions only.
              </p>
            </div>
            <div className="workspace-panel rounded-3xl p-5">
              <Wallet className="h-5 w-5 text-cyan-400" />
              <p className="mt-4 font-semibold text-white">Paid execution</p>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Mission actions can pay for premium resources over x402.
              </p>
            </div>
            <div className="workspace-panel rounded-3xl p-5">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <p className="mt-4 font-semibold text-white">Trust receipts</p>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Portable identity and receipts stay bound to the same run.
              </p>
            </div>
          </div>
        </section>

        <section className="workspace-panel rounded-[32px] p-7 sm:p-8">
          <div className="border-b border-white/6 pb-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
              Operator Access
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Enter the workspace</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Use an existing passkey or enroll a new operator credential on this device. Existing credentials remain preserved for future sign-ins.
            </p>
          </div>

          <div className="mt-6 grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-zinc-200">Username</span>
              <input
                className="workspace-input rounded-2xl px-4 py-3 text-sm"
                placeholder="operator@veridex.network"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-zinc-200">Display name</span>
              <input
                className="workspace-input rounded-2xl px-4 py-3 text-sm"
                placeholder="Frontier Operator"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </label>
          </div>

          <div className="mt-6 grid gap-3">
            <button
              type="button"
              onClick={() => router.push("/login/awaiting-signature?action=login")}
              disabled={!auth.ready || auth.busy || !auth.isSupported}
              className="workspace-button-primary inline-flex h-14 items-center justify-center gap-3 rounded-2xl text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Fingerprint className="h-4 w-4" />
              {signInLabel}
            </button>
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/login/awaiting-signature?action=register&username=${encodeURIComponent(
                    username.trim(),
                  )}&displayName=${encodeURIComponent(displayName.trim())}`,
                )
              }
              disabled={!auth.ready || auth.busy || !auth.isSupported || !canCreatePasskey}
              className="workspace-button-secondary inline-flex h-14 items-center justify-center gap-3 rounded-2xl text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              <KeyRound className="h-4 w-4" />
              Create new passkey
            </button>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill
                label={auth.isSupported ? "WebAuthn supported" : "Unsupported browser"}
                tone={auth.isSupported ? "ready" : "blocked"}
              />
              <StatusPill
                label={`${auth.storedProfiles.length} stored credential${auth.storedProfiles.length === 1 ? "" : "s"}`}
                tone="neutral"
              />
            </div>
            {auth.error ? (
              <div className="rounded-2xl border border-red-500/18 bg-red-500/8 px-4 py-3 text-sm text-red-200">
                {auth.error}
              </div>
            ) : null}
            {!auth.isSupported ? (
              <div className="rounded-2xl border border-amber-500/18 bg-amber-500/8 px-4 py-3 text-sm text-amber-200">
                This browser does not support WebAuthn passkeys. Use a modern Chrome, Safari, Edge, or Firefox build.
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}
