"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, Search, X } from "lucide-react";
import { RailBadge } from "@/components/frontierguard/rail-badge";
import { LogoutButton } from "@/components/frontierguard/logout-button";
import { FrontierWorkspaceMobileNav } from "@/components/frontierguard/workspace-mobile-nav";
import { FrontierWorkspaceSidebar } from "@/components/frontierguard/workspace-sidebar";
import { useFrontierAuth } from "@/components/frontierguard/auth-provider";
import { useFrontierGuard } from "@/components/frontierguard/provider";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function FrontierShell({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const auth = useFrontierAuth();
  const { mission } = useFrontierGuard();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-emerald-950/20 via-transparent to-cyan-950/10" />

      <header className="safe-area-inset-top fixed left-0 right-0 top-0 z-50 flex h-16 items-center justify-between border-b border-zinc-800/90 bg-zinc-900/95 px-4 backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800/70 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-white"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link href="/mission/overview" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500">
              <span className="text-sm font-black text-white">V</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">FrontierGuard</p>
              <p className="text-[11px] text-zinc-500">{eyebrow}</p>
            </div>
          </Link>
        </div>
        <RailBadge rail={mission.execution.rail} compact />
      </header>

      {mobileMenuOpen ? (
        <button
          type="button"
          aria-label="Close navigation overlay"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      ) : null}

      <div
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-72 transform transition-transform duration-300 ease-in-out lg:hidden",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <FrontierWorkspaceSidebar
          mobile
          onToggle={() => setMobileMenuOpen(false)}
          onNavigate={() => setMobileMenuOpen(false)}
        />
      </div>

      <div className="hidden lg:block">
        <FrontierWorkspaceSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((value) => !value)}
        />
      </div>

      <main
        className={cn(
          "relative min-h-screen pb-24 pt-16 transition-all duration-300 ease-in-out lg:pb-0 lg:pt-0",
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-72",
        )}
      >
        <section className="sticky top-16 z-30 border-b border-zinc-800/90 bg-zinc-900/80 backdrop-blur-lg lg:top-0">
          <div className="px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400">
                    {eyebrow}
                  </p>
                  <span className="rounded-full border border-zinc-700/80 bg-zinc-800/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">
                    {mission.execution.status}
                  </span>
                </div>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  {title}
                </h1>
                {description ? (
                  <p className="mt-2 max-w-3xl text-sm text-zinc-400">{description}</p>
                ) : null}
              </div>

              <div className="flex flex-col gap-3 xl:items-end">
                <div className="hidden items-center gap-3 md:flex">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <input
                      readOnly
                      value=""
                      placeholder="Search mission, receipts, or logs"
                      className="workspace-input h-11 w-72 rounded-xl pl-10 pr-4 text-sm"
                    />
                  </div>
                  <RailBadge rail={mission.execution.rail} />
                  <LogoutButton compact />
                </div>

                <div className="flex flex-wrap items-center gap-3 xl:justify-end">
                  {actions}
                  {pathname !== "/settings" ? (
                    <Link
                      href="/settings"
                      className="workspace-button-secondary inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold"
                    >
                      Settings
                    </Link>
                  ) : null}
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 px-4 py-2 text-right">
                    <p className="text-sm font-semibold text-white">
                      {auth.session?.operatorName ?? "Guest Operator"}
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      {auth.session?.passkeyLabel ?? "Passkey Required"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </main>

      <FrontierWorkspaceMobileNav />
    </div>
  );
}
