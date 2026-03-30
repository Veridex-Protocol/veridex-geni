import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Database,
  FileJson,
  Fingerprint,
  Gauge,
  LayoutDashboard,
  Receipt,
  Rocket,
  ScrollText,
  Settings,
  ShieldCheck,
  Waypoints,
} from "lucide-react";

export interface FrontierNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
}

export const FRONTIER_PRIMARY_NAV: FrontierNavItem[] = [
  {
    label: "Overview",
    href: "/mission/overview",
    icon: LayoutDashboard,
    description: "Mission control center",
  },
  {
    label: "Launch",
    href: "/mission/launch",
    icon: Rocket,
    description: "Compose a new mission",
  },
  {
    label: "Execution",
    href: "/mission/active",
    icon: Gauge,
    description: "Live mission runtime",
  },
  {
    label: "Policies",
    href: "/mission/policies",
    icon: ShieldCheck,
    description: "Guardrails and thresholds",
  },
  {
    label: "Receipts",
    href: "/receipts",
    icon: Receipt,
    description: "Proofs and evidence",
  },
  {
    label: "Logs",
    href: "/logs",
    icon: ScrollText,
    description: "Execution trace stream",
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Operator preferences and access",
  },
];

export const FRONTIER_SECONDARY_NAV: FrontierNavItem[] = [
  {
    label: "Memory",
    href: "/mission/memory",
    icon: Database,
    description: "Shared mission context",
  },
  {
    label: "Trust Profile",
    href: "/mission/agent",
    icon: Fingerprint,
    description: "Agent identity and ERC-8004",
  },
  {
    label: "Manifest",
    href: "/mission/manifest",
    icon: FileJson,
    description: "Capability documents",
  },
  {
    label: "Alerts",
    href: "/alerts",
    icon: Bell,
    description: "Escalations and notices",
  },
  {
    label: "Workflow Map",
    href: "/flows",
    icon: Waypoints,
    description: "All linked screens",
  },
];

export const FRONTIER_MOBILE_NAV = [
  FRONTIER_PRIMARY_NAV[0],
  FRONTIER_PRIMARY_NAV[1],
  FRONTIER_PRIMARY_NAV[2],
  FRONTIER_PRIMARY_NAV[4],
  FRONTIER_PRIMARY_NAV[6],
];

export function isFrontierNavActive(pathname: string, href: string): boolean {
  return href === "/mission/overview"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}
