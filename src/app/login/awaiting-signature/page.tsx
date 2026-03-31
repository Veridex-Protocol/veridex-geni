"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Fingerprint, Loader2, ShieldCheck } from "lucide-react";
import { useFrontierAuth } from "@/components/frontierguard/auth-provider";
import { useFrontierStatus } from "@/components/frontierguard/use-frontier-status";
import { StatusPill } from "@/components/frontierguard/workspace-primitives";

function wait(durationMs: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, durationMs);
  });
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<{ timedOut: false; value: T } | { timedOut: true }> {
  return Promise.race([
    promise.then((value) => ({ timedOut: false as const, value })),
    wait(timeoutMs).then(() => ({ timedOut: true as const })),
  ]);
}

function AwaitingSignatureScreen() {
  const auth = useFrontierAuth();
  const { refresh: refreshStatus } = useFrontierStatus({ auto: false });
  const router = useRouter();
  const searchParams = useSearchParams();
  const action = searchParams.get("action") === "register" ? "register" : "login";
  const username = searchParams.get("username")?.trim() ?? "";
  const displayName = searchParams.get("displayName")?.trim() ?? "";
  const missingRegistrationFields = action === "register" && (!username || !displayName);
  const [phase, setPhase] = useState<
    "arming" | "waiting" | "verifying" | "success" | "error"
  >("arming");
  const [localError, setLocalError] = useState<string>();
  const [verificationDetail, setVerificationDetail] = useState<string>();
  const hasStartedRef = useRef(false);
  const hasRedirectedRef = useRef(false);

  const verifyOperationalSession = useCallback(async () => {
    let lastWarning =
      "Passkey authenticated, but runtime verification did not complete yet.";

    for (let attempt = 0; attempt < 4; attempt += 1) {
      const session = await auth.refreshSession({ silent: true }).catch(() => null);
      const status = await refreshStatus({ silent: true }).catch(() => null);
      const runtimeBound = Boolean(status?.runtime.available);
      const sessionSignerBound = status?.runtimeHealth.signerSource === "session_wallet";

      if (session?.authenticated && (runtimeBound || sessionSignerBound)) {
        return {
          ok: true as const,
          detail: sessionSignerBound
            ? "Cookie-backed operator session is bound to a live runtime signer."
            : "Cookie-backed operator session is verified and the runtime wallet is bound.",
        };
      }

      lastWarning =
        status?.runtimeHealth.warnings[0] ??
        (session?.authenticated
          ? "Operator session is live, but the runtime wallet has not finished binding."
          : lastWarning);

      await wait(700);
    }

    return {
      ok: false as const,
      error: lastWarning,
    };
  }, [auth.refreshSession, refreshStatus]);

  useEffect(() => {
    if (phase !== "success" || hasRedirectedRef.current) {
      return;
    }

    hasRedirectedRef.current = true;
    const redirectTimer = window.setTimeout(() => {
      router.replace("/login/session-initialized");
    }, 350);

    return () => {
      window.clearTimeout(redirectTimer);
    };
  }, [phase, router]);

  useEffect(() => {
    if (!auth.ready || hasStartedRef.current || missingRegistrationFields) {
      return;
    }

    let active = true;
    hasStartedRef.current = true;

    const run = async () => {
      setPhase("waiting");
      setVerificationDetail(undefined);

      try {
        const nextSession =
          action === "register"
            ? await auth.registerPasskey({
                username,
                displayName,
                passkeyLabel: "",
              })
            : await auth.signInWithPasskey();

        if (!active) {
          return;
        }

        setPhase("verifying");
        setVerificationDetail(
          "Verifying server session, runtime wallet binding, and signer path.",
        );

        const verification = await withTimeout(verifyOperationalSession(), 3500);
        if (!active) {
          return;
        }

        if (verification.timedOut) {
          setVerificationDetail(
            "Passkey session established. Runtime verification is continuing in the background.",
          );
          setPhase("success");
          return;
        }

        const result = verification.value;

        if (!result.ok && nextSession?.authenticated) {
          setVerificationDetail(
            "Passkey session established. Runtime verification is still warming up and can continue from the command center.",
          );
          setPhase("success");
          return;
        }

        if (!result.ok) {
          setPhase("error");
          setLocalError(result.error);
          hasStartedRef.current = false;
          return;
        }

        setVerificationDetail(result.detail);
        setPhase("success");
      } catch (error) {
        if (!active) {
          return;
        }

        setPhase("error");
        setLocalError(error instanceof Error ? error.message : "Passkey request failed.");
        hasStartedRef.current = false;
      }
    };

    void run();

    return () => {
      active = false;
    };
  }, [
    action,
    auth.ready,
    auth.refreshSession,
    auth.registerPasskey,
    auth.signInWithPasskey,
    displayName,
    missingRegistrationFields,
    username,
    verifyOperationalSession,
  ]);

  const effectivePhase = missingRegistrationFields ? "error" : phase;
  const effectiveError =
    missingRegistrationFields
      ? "Enter both username and display name before creating a new passkey."
      : localError ?? auth.error;
  const progress =
    effectivePhase === "arming"
      ? 20
      : effectivePhase === "waiting"
        ? 62
        : effectivePhase === "verifying"
          ? 88
          : 100;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-emerald-950/20 via-transparent to-cyan-950/10" />
      <main className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6 py-10">
        <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="workspace-panel rounded-[32px] p-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-400">
              Secure Ceremony
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">
              {action === "register" ? "Creating operator credential" : "Awaiting passkey signature"}
            </h1>
            <p className="mt-4 text-sm leading-7 text-zinc-400">
              {effectivePhase === "success"
                ? verificationDetail ??
                  "The passkey ceremony completed successfully and the operator session is fully verified."
                : effectivePhase === "error"
                  ? effectiveError ?? "The secure handshake did not complete."
                  : effectivePhase === "verifying"
                    ? verificationDetail ??
                      "Passkey accepted. Verifying the cookie-backed operator session and runtime signer."
                  : action === "register"
                    ? "Approve the biometric or PIN prompt to create a new operator credential on this device."
                    : "Approve the passkey prompt to refresh this operator session before mission launch or execution."}
            </p>

            <div className="mt-8 space-y-4">
              <div className="workspace-subpanel rounded-3xl p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                      Progress
                    </p>
                    <p className="mt-2 text-sm font-semibold text-white">
                      {effectivePhase === "success"
                        ? "Verification complete"
                        : effectivePhase === "error"
                          ? "Action required"
                          : effectivePhase === "verifying"
                            ? "Binding runtime session"
                          : "Waiting on secure prompt"}
                    </p>
                  </div>
                  <StatusPill
                    label={
                      effectivePhase === "success"
                        ? "Ready"
                        : effectivePhase === "error"
                          ? "Error"
                          : effectivePhase === "verifying"
                            ? "Verifying"
                          : "In progress"
                    }
                    tone={
                      effectivePhase === "success"
                        ? "ready"
                        : effectivePhase === "error"
                          ? "blocked"
                          : "waiting"
                    }
                  />
                </div>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/6">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      effectivePhase === "error"
                        ? "bg-red-500"
                        : "bg-gradient-to-r from-emerald-500 to-cyan-500"
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="workspace-subpanel rounded-3xl p-5">
                <div className="flex items-start gap-3">
                  {effectivePhase === "success" ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-400" />
                  ) : effectivePhase === "error" ? (
                    <ShieldCheck className="mt-0.5 h-5 w-5 text-red-300" />
                  ) : (
                    <Loader2 className="mt-0.5 h-5 w-5 animate-spin text-cyan-400" />
                  )}
                  <div>
                    <p className="font-semibold text-white">
                      {effectivePhase === "success"
                        ? "Secure link established"
                        : effectivePhase === "error"
                          ? "Prompt needs attention"
                          : effectivePhase === "verifying"
                            ? "Runtime verification in progress"
                          : "Secure prompt in progress"}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">
                      {effectivePhase === "verifying"
                        ? "We are confirming that the server cookie, runtime wallet, and session signer all resolve from this passkey ceremony."
                        : "Your private credential stays on-device. Only the public credential metadata is bound to the operator session."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="workspace-button-secondary inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold"
              >
                Cancel Request
              </Link>
              {effectivePhase === "error" && auth.session?.authenticated ? (
                <Link
                  href="/settings"
                  className="workspace-button-secondary inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold"
                >
                  Inspect Live Status
                </Link>
              ) : null}
            </div>
          </section>

          <section className="workspace-panel rounded-[32px] p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                  Operator Handshake
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Passkey → Runtime</h2>
              </div>
              <Fingerprint className="h-7 w-7 text-cyan-400" />
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border border-cyan-500/25 bg-cyan-500/10">
                  <Fingerprint className="h-9 w-9 text-cyan-300" />
                </div>
                <p className="text-sm font-semibold text-white">
                  {action === "register" ? "Enroll" : "Passkey"}
                </p>
              </div>
              <div className="h-px bg-white/8 sm:h-[2px] sm:w-28">
                <div
                  className={`h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500 ${
                    effectivePhase === "success"
                      ? "w-full"
                      : effectivePhase === "verifying"
                        ? "w-5/6"
                      : effectivePhase === "waiting"
                        ? "w-2/3"
                        : "w-1/4"
                  }`}
                />
              </div>
              <div className="flex flex-col items-center gap-3">
                <div
                  className={`flex h-20 w-20 items-center justify-center rounded-full border ${
                    effectivePhase === "success"
                      ? "border-emerald-500/25 bg-emerald-500/10"
                      : effectivePhase === "verifying"
                        ? "border-cyan-500/25 bg-cyan-500/10"
                      : "border-white/8 bg-black/15"
                  }`}
                >
                  {effectivePhase === "success" ? (
                    <CheckCircle2 className="h-9 w-9 text-emerald-300" />
                  ) : effectivePhase === "verifying" ? (
                    <Loader2 className="h-9 w-9 animate-spin text-cyan-300" />
                  ) : (
                    <ShieldCheck className="h-9 w-9 text-zinc-500" />
                  )}
                </div>
                <p className="text-sm font-semibold text-white">Runtime</p>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <div className="rounded-3xl border border-white/6 bg-black/15 p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                  Session promise
                </p>
                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  After a successful signature, the app now verifies that the cookie-backed session can actually bind to the runtime before continuing. There should be no green UI with a dead runtime underneath it.
                </p>
              </div>
              {effectiveError ? (
                <div className="rounded-3xl border border-red-500/18 bg-red-500/8 p-5 text-sm text-red-200">
                  {effectiveError}
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default function AwaitingSignaturePage() {
  return (
    <Suspense fallback={null}>
      <AwaitingSignatureScreen />
    </Suspense>
  );
}
