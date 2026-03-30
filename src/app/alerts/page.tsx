"use client";

import Link from "next/link";
import { FrontierShell } from "@/components/frontierguard/frontier-shell";
import { StatusPill, WorkspaceSection } from "@/components/frontierguard/workspace-primitives";
import { useFrontierGuard } from "@/components/frontierguard/provider";

export default function GlobalStatusAlertsPage() {
  const { notifications, mission } = useFrontierGuard();

  return (
    <FrontierShell
      eyebrow="Notification Console"
      title="Mission-wide alerts and operator prompts"
      description={`This surface keeps session state, policy incidents, and evidence updates together for ${mission.id}.`}
    >
      <WorkspaceSection eyebrow="Alerts" title="Mission-wide notifications">
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`workspace-subpanel rounded-3xl p-5 ${
                notification.kind === "critical"
                  ? "border border-red-500/18 bg-red-500/8"
                  : notification.kind === "success"
                    ? "border border-emerald-500/18 bg-emerald-500/8"
                    : ""
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-white">{notification.title}</p>
                    <StatusPill
                      label={notification.kind}
                      tone={
                        notification.kind === "critical"
                          ? "blocked"
                          : notification.kind === "success"
                            ? "ready"
                            : "neutral"
                      }
                    />
                  </div>
                </div>
                <span className="text-xs font-mono text-zinc-500">{new Date(notification.timestamp).toLocaleString()}</span>
              </div>
              <p className="mt-3 text-sm text-zinc-400">{notification.message}</p>
              {notification.href ? (
                <div className="mt-4">
                  <Link href={notification.href} className="text-sm font-semibold text-emerald-300">
                    {notification.actionLabel ?? "Open"}
                  </Link>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </WorkspaceSection>
    </FrontierShell>
  );
}
