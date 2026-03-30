"use client";

import type { ExecutionRail } from "@/lib/frontierguard/types";

const RAIL_STYLES: Record<ExecutionRail, string> = {
  immediate: "border border-zinc-700/80 bg-zinc-800/80 text-zinc-200",
  scheduled: "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  private: "border border-amber-500/20 bg-amber-500/10 text-amber-400",
  confidential: "border border-cyan-500/20 bg-cyan-500/10 text-cyan-400",
};

const RAIL_LABELS: Record<ExecutionRail, string> = {
  immediate: "Immediate",
  scheduled: "Scheduled",
  private: "Private",
  confidential: "Confidential",
};

export function RailBadge({
  rail,
  className = "",
  compact = false,
}: {
  rail: ExecutionRail;
  className?: string;
  compact?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full ${compact ? "px-2.5 py-1" : "px-3 py-1.5"} text-[10px] font-bold uppercase tracking-[0.18em] ${RAIL_STYLES[rail]} ${className}`.trim()}
    >
      {RAIL_LABELS[rail]}
    </span>
  );
}
