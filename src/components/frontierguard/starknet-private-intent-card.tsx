"use client";

import type { PrivateIntent } from "@/lib/frontierguard/types";

export function StarknetPrivateIntentCard({ intent }: { intent: PrivateIntent }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Starknet Rail</p>
          <h3 className="mt-2 text-lg font-bold">Private Intent Receipt</h3>
        </div>
        <span className="rounded-full bg-amber-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-500">
          {intent.status}
        </span>
      </div>
      <div className="mt-4 space-y-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Intent Label</p>
          <p className="mt-2 font-semibold">{intent.label}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs dark:border-slate-800 dark:bg-slate-800/50">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Commitment Hash</p>
          <p className="mt-2 break-all">{intent.commitmentHash ?? "Pending"}</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Reveal Window</p>
            <p className="mt-2 font-semibold">{intent.revealWindowHours}h</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs dark:border-slate-800 dark:bg-slate-800/50">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Reveal Tx</p>
            <p className="mt-2 break-all">{intent.revealTxHash ?? "Awaiting reveal"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
