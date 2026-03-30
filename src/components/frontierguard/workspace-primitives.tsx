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
    <section className={cn("workspace-panel rounded-[28px] p-6 sm:p-7", className)}>
      <div className="flex flex-col gap-4 border-b border-white/6 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">
            {title}
          </h2>
          {description ? (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

const STATUS_STYLES = {
  ready: {
    wrapper: "border border-emerald-500/18 bg-emerald-500/8 text-emerald-300",
    icon: CheckCircle2,
  },
  warning: {
    wrapper: "border border-amber-500/18 bg-amber-500/8 text-amber-300",
    icon: AlertTriangle,
  },
  blocked: {
    wrapper: "border border-red-500/18 bg-red-500/8 text-red-300",
    icon: ShieldAlert,
  },
  waiting: {
    wrapper: "border border-cyan-500/18 bg-cyan-500/8 text-cyan-300",
    icon: Loader2,
  },
  neutral: {
    wrapper: "border border-white/8 bg-zinc-900/70 text-zinc-300",
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
        "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em]",
        STATUS_STYLES[tone].wrapper,
      )}
    >
      <Icon className={cn("h-3.5 w-3.5", tone === "waiting" && "animate-spin")} />
      {label}
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
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      {items.map((item) => (
        <div key={item.label} className="workspace-subpanel rounded-2xl px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                {item.label}
              </p>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{item.description}</p>
            </div>
            <StatusPill
              label={item.status === "ready" ? "Ready" : item.status}
              tone={item.status}
            />
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
          "max-w-[60%] text-right text-sm font-medium",
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
