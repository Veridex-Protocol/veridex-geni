import React from "react";
import Link from "next/link";

export default function PasskeyAuthStatesPage() {
  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-background-light dark:bg-[#101722] overflow-x-hidden font-display text-slate-900 dark:text-slate-100 antialiased">
      <div className="layout-container flex h-full grow flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 lg:px-40 py-4 sticky top-0 bg-[#f5f7f8]/80 dark:bg-[#101722]/80 backdrop-blur-md z-50">
          <div className="flex items-center gap-3">
            <Link href="/" className="size-8 bg-blue-500 rounded-lg flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-xl">rocket_launch</span>
            </Link>
            <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-tight">Mission Launch</h2>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center justify-center rounded-lg h-10 w-10 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
              <span className="material-symbols-outlined text-slate-700 dark:text-slate-300">security</span>
            </button>
            <button className="flex items-center justify-center rounded-lg h-10 w-10 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
              <span className="material-symbols-outlined text-slate-700 dark:text-slate-300">close</span>
            </button>
          </div>
        </header>

        <main className="px-6 lg:px-40 py-10 flex flex-1 justify-center">
          <div className="layout-content-container flex flex-col max-w-5xl w-full gap-12">
            <section className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-blue-500 font-semibold text-sm uppercase tracking-widest">
                <span className="material-symbols-outlined text-sm">verified_user</span>
                <span>Secure Protocol</span>
              </div>
              <h1 className="text-slate-900 dark:text-white text-4xl font-extrabold tracking-tight">Passkey Authorization</h1>
              <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl">
                Securely signing delegation fragments for mission deployment. Ensure your hardware key or biometric device is ready.
              </p>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-2">
                  <span className="text-xs font-bold text-blue-500 uppercase">State 01</span>
                  <span className="text-[10px] text-slate-500 font-mono">ID: AUTH_REQ_01</span>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col">
                  <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="size-2 rounded-full bg-blue-500 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]"></div>
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Awaiting Signature...</span>
                    </div>
                    <h3 className="text-xl font-bold dark:text-white mb-2">Requesting Signature</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Confirm the request on your trusted device.</p>
                  </div>
                  <div className="p-6 flex flex-col items-center justify-center gap-6 min-h-[240px]">
                    <div className="relative">
                      <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full"></div>
                      <div className="relative size-20 rounded-full border-2 border-blue-500 flex items-center justify-center">
                        <span className="material-symbols-outlined text-4xl text-blue-500">fingerprint</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 overflow-hidden">
                      <div className="bg-blue-500 h-full w-1/3 rounded-full"></div>
                    </div>
                    <p className="text-xs font-mono text-slate-400 text-center">LISTEN_EVENT: WEB_AUTHN_PROMPT</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] leading-relaxed text-slate-400 italic">
                      Dev Note: Trigger browser native navigator.credentials.get()
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-2">
                  <span className="text-xs font-bold text-emerald-500 uppercase">State 02</span>
                  <span className="text-[10px] text-slate-500 font-mono">ID: AUTH_SUCCESS_02</span>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-emerald-500/30 dark:border-emerald-500/20 rounded-xl overflow-hidden shadow-xl flex flex-col">
                  <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-emerald-50/50 dark:bg-emerald-500/5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="size-2 rounded-full bg-emerald-500"></div>
                      <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Verification Complete</span>
                    </div>
                    <h3 className="text-xl font-bold dark:text-white mb-2">Mission Authorized</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Signed delegation fragment received.</p>
                  </div>
                  <div className="p-6 flex flex-col gap-4 min-h-[240px] overflow-hidden">
                    <div className="flex items-center justify-center py-4">
                      <div className="size-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <span className="material-symbols-outlined text-4xl">check_circle</span>
                      </div>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-950 p-3 rounded border border-slate-200 dark:border-slate-800 font-mono text-[10px] text-slate-600 dark:text-slate-400 break-all leading-tight">
                      <span className="text-emerald-500">"signature":</span> "0x7f3a...b2e9",<br/>
                      <span className="text-emerald-500">"fragment_id":</span> "DLG_8821_X",<br/>
                      <span className="text-emerald-500">"status":</span> "COMMITTED"
                    </div>
                    <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 rounded transition-colors text-sm">
                      Deploy Mission
                    </button>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] leading-relaxed text-slate-400 italic">
                      Dev Note: On success, update UI to reflect "Signed" status and enable primary CTA.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-2">
                  <span className="text-xs font-bold text-rose-500 uppercase">State 03</span>
                  <span className="text-[10px] text-slate-500 font-mono">ID: AUTH_ERR_03</span>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-rose-500/30 dark:border-rose-500/20 rounded-xl overflow-hidden shadow-xl flex flex-col">
                  <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-rose-50/50 dark:bg-rose-500/5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="size-2 rounded-full bg-rose-500"></div>
                      <span className="text-sm font-medium text-rose-600 dark:text-rose-400">Request Failed</span>
                    </div>
                    <h3 className="text-xl font-bold dark:text-white mb-2">Timeout Occurred</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">The authorization request expired.</p>
                  </div>
                  <div className="p-6 flex flex-col items-center justify-center gap-6 min-h-[240px]">
                    <div className="size-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
                      <span className="material-symbols-outlined text-4xl">timer_off</span>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">ERR_TIMEOUT_0x04</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 px-4">The device did not respond within the 60-second window.</p>
                    </div>
                    <div className="flex gap-2 w-full">
                      <button className="flex-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-2 rounded text-sm">Cancel</button>
                      <button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 rounded text-sm">Retry Request</button>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] leading-relaxed text-slate-400 italic">
                      Dev Note: Implement exponential backoff for retry button logic.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 p-8 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/30">
              <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-500">terminal</span>
                Developer Transition Logic
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-slate-600 dark:text-slate-400">
                <ul className="space-y-3 list-disc pl-5">
                  <li>
                    <strong className="text-slate-900 dark:text-slate-200">1 → 2:</strong> Trigger on{" "}
                    <code className="bg-blue-500/10 text-blue-500 px-1 rounded">onSuccess()</code> callback from WebAuthn API. Ensure state transition is immediate to prevent user confusion.
                  </li>
                  <li>
                    <strong className="text-slate-900 dark:text-slate-200">1 → 3:</strong> Trigger on{" "}
                    <code className="bg-rose-500/10 text-rose-500 px-1 rounded">DOMException: TimeoutError</code> or manual cancellation.
                  </li>
                </ul>
                <ul className="space-y-3 list-disc pl-5">
                  <li>
                    <strong className="text-slate-900 dark:text-slate-200">Biometric Focus:</strong> If no hardware key detected, fallback to platform authenticator (TouchID/FaceID) automatically.
                  </li>
                  <li>
                    <strong className="text-slate-900 dark:text-slate-200">Density:</strong> Keep modal size compact (max-width: 440px) to mimic native OS authorization prompts.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </main>

        <footer className="px-6 lg:px-40 py-10 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="size-6 bg-slate-200 dark:bg-slate-800 rounded flex items-center justify-center">
                <span className="material-symbols-outlined text-sm">code</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono tracking-tighter">
                v2.4.0-STABLE // MISSION_CONTROL_CORE
              </p>
            </div>
            <div className="flex gap-6 text-xs font-bold uppercase tracking-widest text-slate-400">
              <Link className="hover:text-blue-500 transition-colors" href="#">Documentation</Link>
              <Link className="hover:text-blue-500 transition-colors" href="#">Security Audit</Link>
              <Link className="hover:text-blue-500 transition-colors" href="#">System Status</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
