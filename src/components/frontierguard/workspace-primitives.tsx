"use client";

import type { ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Loader2,
  ShieldAlert,
} from "lucide-react";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function WorkspaceSection({
  eyebrow,
  title,
  description,
  actions,
  children,
  className = "",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("relative overflow-hidden workspace-panel rounded-[32px] p-6 sm:p-8 border border-zinc-800/80 bg-zinc-950/40 backdrop-blur-xl shadow-2xl transition-all duration-500 hover:border-zinc-700/80 hover:bg-zinc-950/60 group/section", className)}>
      <div className="absolute top-0 right-0 p-32 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none opacity-0 group-hover/section:opacity-100 transition-opacity duration-1000" />
      <div className="relative flex flex-col gap-5 border-b border-zinc-800/80 pb-6 sm:flex-row sm:items-start sm:justify-between z-10">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400/80 mb-3 bg-cyan-500/10 px-2 py-1 rounded-md border border-cyan-500/20">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="text-2xl font-light tracking-tight text-white sm:text-3xl drop-shadow-sm">
            {title}
          </h2>
          {description ? (
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-400">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
      </div>
      <div className="relative mt-8 z-10">{children}</div>
    </section>
  );
}

const STATUS_STYLES = {
  ready: {
    wrapper: "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]",
    icon: CheckCircle2,
  },
  warning: {
    wrapper: "border border-amber-500/30 bg-amber-500/10 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]",
    icon: AlertTriangle,
  },
  blocked: {
    wrapper: "border border-red-500/30 bg-red-500/10 text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]",
    icon: ShieldAlert,
  },
  waiting: {
    wrapper: "border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.3)]",
    icon: Loader2,
  },
  neutral: {
    wrapper: "border border-zinc-500/30 bg-zinc-900/80 text-zinc-300 drop-shadow-sm",
    icon: CircleDashed,
  },
} as const;

export function StatusPill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: keyof typeof STATUS_STYLES;
}) {
  const Icon = STATUS_STYLES[tone].icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-[0.2em] shadow-sm backdrop-blur-sm transition-all duration-300 hover:scale-105",
        STATUS_STYLES[tone].wrapper,
      )}
    >
      <Icon className={cn("h-3 w-3 opacity-80", tone === "waiting" && "animate-spin")} />
      <span>{label}</span>
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="workspace-subpanel rounded-3xl border border-dashed border-white/10 px-5 py-6 text-sm text-zinc-400">
      <p className="font-semibold text-zinc-100">{title}</p>
      <p className="mt-2 leading-6">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export interface ReadinessItem {
  label: string;
  description: string;
  status: keyof typeof STATUS_STYLES;
}

export function ReadinessStrip({ items }: { items: ReadinessItem[] }) {
  // Use a map or explicitly define classes to ensure Tailwind compiles them
  const gridClass = items.length === 1 ? "grid-cols-1" : items.length === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";

  return (
    <div className={`grid gap-4 ${gridClass}`}>
      {items.map((item) => (
        <div key={item.label} className="group relative overflow-hidden rounded-[24px] border border-zinc-800/80 bg-zinc-950/40 p-5 backdrop-blur-xl shadow-lg transition-all duration-500 hover:border-zinc-700 hover:bg-zinc-900/60">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-[40px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <div className="relative flex flex-col sm:flex-row sm:items-start justify-between gap-4 z-10">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 group-hover:text-zinc-400 transition-colors mb-2">
                {item.label}
              </p>
              <p className="text-sm leading-relaxed text-zinc-400 font-light">{item.description}</p>
            </div>
            <div className="shrink-0 mt-2 sm:mt-0">
              <StatusPill
                label={item.status === "ready" ? "Ready" : item.status}
                tone={item.status}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function FieldRow({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  tone?: "default" | "success" | "warning";
}) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-white/6 py-3 last:border-b-0 last:pb-0">
      <dt className="text-sm text-zinc-500">{label}</dt>
      <dd
        className={cn(
          "max-w-[60%] text-right text-sm font-medium break-all",
          tone === "success"
            ? "text-emerald-300"
            : tone === "warning"
              ? "text-amber-300"
              : "text-zinc-100",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
