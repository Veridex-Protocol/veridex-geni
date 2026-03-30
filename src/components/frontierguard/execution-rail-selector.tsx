"use client";

import type { ExecutionRail } from "@/lib/frontierguard/types";
import { RailBadge } from "@/components/frontierguard/rail-badge";
import { StatusPill } from "@/components/frontierguard/workspace-primitives";

const RAIL_OPTIONS: Array<{
  value: ExecutionRail;
  title: string;
  description: string;
}> = [
  {
    value: "immediate",
    title: "Immediate",
    description: "Use the native Veridex control plane for direct execution after authorization.",
  },
  {
    value: "scheduled",
    title: "Scheduled",
    description: "Arm Flow for delayed or recurring execution windows with retry policies.",
  },
  {
    value: "private",
    title: "Private",
    description: "Seal the route strategy on Starknet before reveal and settlement.",
  },
  {
    value: "confidential",
    title: "Confidential",
    description: "Protect thresholds and allowlists in the Zama confidential policy vault.",
  },
];

type RailAvailability = "available" | "gated" | "hidden";

export interface ExecutionRailState {
  availability: RailAvailability;
  statusLabel?: string;
  reason?: string;
  description?: string;
}

export function ExecutionRailSelector({
  value,
  onChange,
  states,
}: {
  value: ExecutionRail;
  onChange: (value: ExecutionRail) => void;
  states?: Partial<Record<ExecutionRail, ExecutionRailState>>;
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {RAIL_OPTIONS.map((option) => {
        const state = states?.[option.value];
        const availability = state?.availability ?? "available";

        if (availability === "hidden") {
          return null;
        }

        const selected = value === option.value;
        const disabled = availability !== "available";

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              if (!disabled) {
                onChange(option.value);
              }
            }}
            disabled={disabled}
            className={`workspace-subpanel workspace-hover rounded-3xl p-5 text-left ${
              selected
                ? "border-emerald-500/28 bg-emerald-500/6"
                : disabled
                  ? "opacity-70"
                  : ""
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">{option.title}</p>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  {state?.description ?? option.description}
                </p>
              </div>
              <RailBadge rail={option.value} />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {availability === "available" ? (
                <StatusPill label={selected ? "Selected" : "Available"} tone="ready" />
              ) : (
                <StatusPill
                  label={state?.statusLabel ?? "Gated"}
                  tone={availability === "gated" ? "warning" : "neutral"}
                />
              )}
              {state?.reason ? <span className="text-xs text-zinc-500">{state.reason}</span> : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}
