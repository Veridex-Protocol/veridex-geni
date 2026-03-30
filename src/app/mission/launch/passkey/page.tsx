"use client";

import Link from "next/link";
import { CheckCircle2, Fingerprint, TimerOff, Terminal, Code2 } from "lucide-react";
import { FrontierShell } from "@/components/frontierguard/frontier-shell";
import { StatusPill, WorkspaceSection } from "@/components/frontierguard/workspace-primitives";
import { WithHelp } from "@/components/frontierguard/help-sys";

export default function PasskeyAuthStatesPage() {
  return (
    <FrontierShell
      eyebrow="Secure Protocol"
      title="Passkey Authorization"
      description="Securely signing delegation fragments for mission deployment. Ensure your hardware key or biometric device is ready."
      actions={
        <Link href="/mission/launch" className="workspace-button-secondary rounded-xl px-4 py-2 text-sm font-semibold hover:-translate-y-0.5 transition-transform">
          Back to Launch
        </Link>
      }
    >
      <div className="space-y-6 max-w-[1400px] mx-auto animate-in fade-in zoom-in-95 duration-500">
        <section className="grid gap-6 lg:grid-cols-3">
          <WithHelp id="pk-state-1" text="Pending hardware or biometric signature from the user.">
            <div className="flex flex-col gap-4 group">
              <div className="flex items-center justify-between px-2">
                <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest">State 01</span>
                <span className="text-[10px] text-zinc-500 font-mono">ID: AUTH_REQ_01</span>
              </div>
              <WorkspaceSection title="Requesting Signature" className="h-[380px] flex flex-col justify-between border-cyan-500/20 group-hover:border-cyan-500/40">
                <div className="flex items-center gap-3 mb-6">
                  <div className="size-2 rounded-full bg-cyan-500 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]"></div>
                  <span className="text-sm font-medium text-cyan-400">Awaiting Signature...</span>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center gap-6 relative">
                  <div className="absolute inset-0 bg-cyan-500/5 blur-2xl rounded-full"></div>
                  <div className="relative size-20 rounded-full border-2 border-cyan-500/50 flex items-center justify-center bg-cyan-500/10">
                    <Fingerprint className="text-cyan-400 w-8 h-8" />
                  </div>
                  <div className="w-full bg-zinc-900 rounded-full h-1 overflow-hidden relative">
                    <div className="absolute inset-y-0 left-0 bg-cyan-500 h-full w-1/3 rounded-full animate-[pulse_2s_linear_infinite]"></div>
                  </div>
                  <p className="text-[10px] font-mono text-zinc-500 text-center tracking-widest mt-2 uppercase">LISTEN_EVENT: WEB_AUTHN_PROMPT</p>
                </div>
              </WorkspaceSection>
            </div>
          </WithHelp>

          <WithHelp id="pk-state-2" text="Successful delegation fragment cryptographic signature.">
            <div className="flex flex-col gap-4 group">
              <div className="flex items-center justify-between px-2">
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">State 02</span>
                <span className="text-[10px] text-zinc-500 font-mono">ID: AUTH_SUCCESS_02</span>
              </div>
              <WorkspaceSection title="Mission Authorized" className="h-[380px] flex flex-col justify-between border-emerald-500/20 group-hover:border-emerald-500/40">
                <div className="flex items-center gap-3 mb-6">
                  <div className="size-2 rounded-full bg-emerald-500"></div>
                  <span className="text-sm font-medium text-emerald-400">Verification Complete</span>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center gap-6 relative">
                  <div className="absolute inset-0 bg-emerald-500/5 blur-2xl rounded-full"></div>
                  <div className="relative size-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 ring-1 ring-emerald-500/30">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div className="bg-zinc-950/80 p-4 rounded-xl border border-zinc-800 font-mono text-xs w-full">
                    <div className="grid grid-cols-[100px_1fr] gap-2 mb-1">
                      <span className="text-zinc-500 uppercase">signature:</span>
                      <span className="text-emerald-400 truncate">0x7f3ab2e948c2...</span>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] gap-2 mb-1">
                      <span className="text-zinc-500 uppercase">fragment:</span>
                      <span className="text-emerald-400">DLG_8821_X</span>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] gap-2">
                      <span className="text-zinc-500 uppercase">status:</span>
                      <span className="text-emerald-400">COMMITTED</span>
                    </div>
                  </div>
                  <button className="workspace-button-primary w-full py-3 rounded-xl text-sm font-semibold hover:scale-[1.02] transition-transform">
                    Deploy Mission
                  </button>
                </div>
              </WorkspaceSection>
            </div>
          </WithHelp>

          <WithHelp id="pk-state-3" text="Failure or timeout state for hardware signing event.">
            <div className="flex flex-col gap-4 group">
              <div className="flex items-center justify-between px-2">
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">State 03</span>
                <span className="text-[10px] text-zinc-500 font-mono">ID: AUTH_ERR_03</span>
              </div>
              <WorkspaceSection title="Timeout Occurred" className="h-[380px] flex flex-col justify-between border-red-500/20 group-hover:border-red-500/40">
                <div className="flex items-center gap-3 mb-6">
                  <div className="size-2 rounded-full bg-red-500"></div>
                  <span className="text-sm font-medium text-red-400">Request Failed</span>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center gap-6 relative">
                  <div className="absolute inset-0 bg-red-500/5 blur-2xl rounded-full"></div>
                  <div className="relative size-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 ring-1 ring-red-500/30">
                    <TimerOff className="w-8 h-8" />
                  </div>
                  <div className="text-center">
                    <p className="font-mono text-xs text-red-400 mb-2 bg-red-500/10 inline-block px-2 py-1 rounded">ERR_TIMEOUT_0x04</p>
                    <p className="text-xs text-zinc-400 px-4 leading-relaxed">The device did not respond within the 60-second window.</p>
                  </div>
                  <div className="flex gap-3 w-full mt-2">
                    <button className="workspace-button-secondary flex-1 py-3 rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-colors">Abort</button>
                    <button className="workspace-button-primary flex-1 py-3 rounded-xl text-sm font-semibold hover:scale-[1.02] transition-transform bg-gradient-to-r from-red-600 to-red-500">Retry</button>
                  </div>
                </div>
              </WorkspaceSection>
            </div>
          </WithHelp>
        </section>

        <WorkspaceSection
          eyebrow="Integration Guide"
          title="Developer Transition Logic"
          description="Guidelines for engineering teams implementing these authenticators."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 pl-2">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-cyan-500/10 p-2.5 rounded-xl border border-cyan-500/20 shrink-0">
                  <Terminal className="h-4 w-4 text-cyan-400" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2">1 → 2: Success Transition</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Trigger on <code className="bg-cyan-500/10 text-cyan-300 px-1.5 py-0.5 rounded text-[10px] font-mono border border-cyan-500/20">onSuccess()</code> callback from WebAuthn API. Ensure state transition is immediate to prevent user confusion.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-red-500/10 p-2.5 rounded-xl border border-red-500/20 shrink-0">
                  <Terminal className="h-4 w-4 text-red-400" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2">1 → 3: Failure Transition</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Trigger on <code className="bg-red-500/10 text-red-300 px-1.5 py-0.5 rounded text-[10px] font-mono border border-red-500/20">DOMException: TimeoutError</code> or manual cancellation. Ensure fallback UI provides retry path.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-zinc-800/50 p-2.5 rounded-xl border border-zinc-700/50 shrink-0">
                  <Code2 className="h-4 w-4 text-zinc-300" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2">Biometric Focus & Density</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                    If no hardware key is detected, fallback to the platform authenticator (TouchID/FaceID) automatically instead of failing.
                  </p>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Keep the modal size compact (max-width: 440px) across all viewports to mimic native OS authorization prompts to prevent phishing panic.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </WorkspaceSection>
      </div>
    </FrontierShell>
  );
}
