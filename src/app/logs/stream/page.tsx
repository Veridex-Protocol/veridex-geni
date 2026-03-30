"use client";

import Link from "next/link";
import { StageStrip } from "@/components/frontierguard/stage-strip";
import { useFrontierGuard } from "@/components/frontierguard/provider";

export default function ExecutionStreamDetailPage() {
  const { mission, openDispute } = useFrontierGuard();

  return (
    <div className="min-h-screen bg-background-light font-display text-slate-900 dark:bg-background-dark dark:text-slate-100">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/85 backdrop-blur-md dark:border-slate-800 dark:bg-background-dark/85">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-4">
          <div>
            <p className="text-lg font-bold">Execution Stream Detail</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{mission.id}</p>
          </div>
          <div className="flex gap-3 text-sm">
            <Link href="/logs" className="font-semibold text-primary">All logs</Link>
            <Link href="/dispute" className="font-semibold text-primary">Incident console</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1440px] gap-8 px-6 py-8 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Mission Stages</p>
                <h1 className="mt-2 text-2xl font-bold">{mission.title}</h1>
              </div>
              <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${mission.status === "blocked" ? "bg-red-500/10 text-red-500" : "bg-primary/10 text-primary"}`}>
                {mission.status}
              </span>
            </div>
            <div className="mt-6">
              <StageStrip stages={mission.stages} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-950 p-6 shadow-sm dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Live stream</h2>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-500">
                live
              </span>
            </div>
            <div className="mt-5 max-h-[520px] space-y-3 overflow-y-auto font-mono text-xs">
              {mission.logs.slice().reverse().map((entry) => (
                <div key={entry.id} className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-slate-300">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold uppercase text-primary">{entry.actor}</span>
                      <span className="rounded bg-slate-800 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-slate-400">
                        {entry.stage}
                      </span>
                    </div>
                    <span className="text-slate-500">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="mt-2 text-sm text-white">{entry.title}</p>
                  <p className="mt-1 text-slate-400">{entry.message}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xl font-bold">Verification Context</h2>
            <div className="mt-5 space-y-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">ERC-8004 Identity</p>
                <p className="mt-2 font-mono text-sm">{mission.identity.erc8004Identity}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Filecoin Artifacts</p>
                <p className="mt-2 text-sm">{mission.artifacts.filter((artifact) => artifact.status === "pinned").length} pinned</p>
              </div>
              {openDispute ? (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
                  <p className="font-semibold text-red-500">{openDispute.title}</p>
                  <p className="mt-2 text-sm text-red-400">{openDispute.description}</p>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
