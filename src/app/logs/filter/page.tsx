"use client";

import { useState } from "react";
import Link from "next/link";
import { CodePanel } from "@/components/frontierguard/code-panel";
import { useFrontierGuard } from "@/components/frontierguard/provider";

export default function LogFilterSearchPage() {
  const { mission } = useFrontierGuard();
  const [term, setTerm] = useState("payment");
  const [level, setLevel] = useState<"all" | "info" | "success" | "warning" | "error">("all");

  const filtered = mission.logs.filter((entry) => {
    const matchesLevel = level === "all" ? true : entry.level === level;
    const matchesTerm = `${entry.title} ${entry.message} ${entry.actor} ${entry.stage}`
      .toLowerCase()
      .includes(term.toLowerCase());
    return matchesLevel && matchesTerm;
  });

  return (
    <div className="min-h-screen bg-background-light font-display text-slate-900 dark:bg-background-dark dark:text-slate-100">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/85 backdrop-blur-md dark:border-slate-800 dark:bg-background-dark/85">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-lg font-bold">Advanced Log Filtering</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Search + category drilldown</p>
          </div>
          <Link href="/logs" className="text-sm font-semibold text-primary">
            Back to logs
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-8 px-6 py-8 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h1 className="text-2xl font-bold">Filter Controls</h1>
          <div className="mt-6 space-y-4">
            <input
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-colors focus:border-primary dark:border-slate-700 dark:bg-slate-800"
            />
            <div className="flex flex-wrap gap-2">
              {(["all", "info", "success", "warning", "error"] as const).map((value) => (
                <button
                  key={value}
                  onClick={() => setLevel(value)}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                    level === value
                      ? "bg-primary text-white"
                      : "border border-slate-200 bg-white hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {filtered.map((entry) => (
              <div key={entry.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{entry.title}</p>
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">{entry.level}</span>
                </div>
                <p className="mt-2 text-sm text-slate-500">{entry.message}</p>
              </div>
            ))}
          </div>
        </section>

        <CodePanel title="filtered_events.json" value={JSON.stringify(filtered, null, 2)} />
      </main>
    </div>
  );
}
