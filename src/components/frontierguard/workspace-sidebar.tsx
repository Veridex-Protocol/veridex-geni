"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, PanelLeftClose, Shield } from "lucide-react";
import { useFrontierAuth } from "@/components/frontierguard/auth-provider";
import {
  FRONTIER_PRIMARY_NAV,
  FRONTIER_SECONDARY_NAV,
  isFrontierNavActive,
} from "@/components/frontierguard/navigation";
import { LogoutButton } from "@/components/frontierguard/logout-button";
import { RailBadge } from "@/components/frontierguard/rail-badge";
import { useFrontierGuard } from "@/components/frontierguard/provider";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function truncate(value: string, start = 6, end = 4) {
  if (value.length <= start + end + 3) {
    return value;
  }

  return `${value.slice(0, start)}...${value.slice(-end)}`;
}

export function FrontierWorkspaceSidebar({
  collapsed = false,
  mobile = false,
  onToggle,
  onNavigate,
}: {
  collapsed?: boolean;
  mobile?: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const auth = useFrontierAuth();
  const { mission } = useFrontierGuard();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen transition-all duration-300 ease-in-out",
        "bg-gradient-to-b from-zinc-900 to-zinc-950 border-r border-zinc-800/90",
        mobile ? "w-72" : collapsed ? "w-20" : "w-72",
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center justify-between border-b border-zinc-800/90 px-4">
          <Link
            href="/mission/overview"
            className="flex items-center gap-3"
            onClick={onNavigate}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/25">
              <Shield className="h-5 w-5 text-white" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white">FrontierGuard</span>
                <span className="text-[11px] text-zinc-500">Veridex Network</span>
              </div>
            )}
          </Link>

          {!mobile && onToggle ? (
            <button
              type="button"
              onClick={onToggle}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
            >
              <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
            </button>
          ) : null}

          {mobile && onToggle ? (
            <button
              type="button"
              onClick={onToggle}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        {!collapsed && (
          <div className="border-b border-zinc-800/80 px-3 py-4">
            <div className="workspace-subpanel rounded-2xl p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 mb-1">
                    Active Rail
                  </p>
                  <p className="text-sm font-semibold text-white truncate">
                    {mission.execution.selectorLabel}
                  </p>
                </div>
                <RailBadge rail={mission.execution.rail} compact />
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            {FRONTIER_PRIMARY_NAV.map((item) => {
              const active = isFrontierNavActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    active
                      ? "bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-white border border-emerald-500/25"
                      : "text-zinc-400 hover:bg-zinc-800/60 hover:text-white",
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 shrink-0",
                      active
                        ? "text-emerald-400"
                        : "text-zinc-500 transition-colors group-hover:text-emerald-400",
                    )}
                  />
                  {!collapsed && (
                    <div className="min-w-0">
                      <div>{item.label}</div>
                      {active && (
                        <div className="truncate text-xs text-zinc-500">
                          {item.description}
                        </div>
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>

          <div className="my-4 h-px bg-zinc-800" />

          <div className="space-y-1">
            {FRONTIER_SECONDARY_NAV.map((item) => {
              const active = isFrontierNavActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    active
                      ? "bg-zinc-800/90 text-white"
                      : "text-zinc-400 hover:bg-zinc-800/60 hover:text-white",
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 shrink-0",
                      active
                        ? "text-zinc-200"
                        : "text-zinc-500 transition-colors group-hover:text-zinc-300",
                    )}
                  />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-zinc-800/90 p-4">
          {!collapsed && (
            <div className="mb-4 rounded-2xl border border-emerald-500/18 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 p-4">
              <p className="text-sm font-semibold text-white">Primary Mission Path</p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                Passkey access, x402 settlement, and ERC-8004 trust stay front and center.
              </p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-sm font-semibold text-white">
              {(auth.session?.operatorName ?? "FO").slice(0, 2).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {auth.session?.operatorName ?? "Frontier Operator"}
                </p>
                <p className="truncate text-xs text-zinc-500">
                  {truncate(
                    auth.session?.vaultAddress ??
                      auth.session?.operatorWallet ??
                      "passkey-required",
                  )}
                </p>
              </div>
            )}
            <LogoutButton
              compact
              className="h-9 w-9 px-0 py-0"
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
