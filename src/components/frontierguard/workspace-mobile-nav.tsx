"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FRONTIER_MOBILE_NAV,
  isFrontierNavActive,
} from "@/components/frontierguard/navigation";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function FrontierWorkspaceMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="safe-area-inset-bottom fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800/90 bg-zinc-900/95 backdrop-blur-xl lg:hidden">
      <div className="grid h-20 grid-cols-5 px-2">
        {FRONTIER_MOBILE_NAV.map((item) => {
          const active = isFrontierNavActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-medium transition-colors",
                active ? "text-white" : "text-zinc-500 hover:text-zinc-200",
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-2xl transition-colors",
                  active
                    ? "bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-400"
                    : "bg-transparent",
                )}
              >
                <item.icon className="h-5 w-5" />
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
