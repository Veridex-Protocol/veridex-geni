"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useFrontierAuth } from "@/components/frontierguard/auth-provider";

export function LogoutButton({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const auth = useFrontierAuth();
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        auth.signOut();
        router.push("/login");
      }}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700/80 bg-zinc-800/90 ${compact ? "h-10 w-10 px-0 py-0" : "px-4 py-2"} text-sm font-semibold text-zinc-100 transition-colors hover:bg-zinc-700 ${className}`.trim()}
    >
      <LogOut className="h-4 w-4" />
      {!compact ? "Log Out" : null}
    </button>
  );
}
