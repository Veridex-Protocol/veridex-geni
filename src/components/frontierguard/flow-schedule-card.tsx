"use client";

import type { ScheduledExecution } from "@/lib/frontierguard/types";

export function FlowScheduleCard({ schedule }: { schedule: ScheduledExecution }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Flow Rail</p>
          <h3 className="mt-2 text-lg font-bold">Scheduled Mission</h3>
        </div>
        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-500">
          {schedule.status}
        </span>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Cadence</p>
          <p className="mt-2 font-semibold">{schedule.cadence}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Retry Policy</p>
          <p className="mt-2 font-semibold">{schedule.retryPolicy}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Scheduled For</p>
          <p className="mt-2 text-sm">{schedule.scheduledFor ? new Date(schedule.scheduledFor).toLocaleString() : "Pending"}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Next Run</p>
          <p className="mt-2 text-sm">{schedule.nextRunAt ? new Date(schedule.nextRunAt).toLocaleString() : "Pending"}</p>
        </div>
      </div>
    </div>
  );
}
