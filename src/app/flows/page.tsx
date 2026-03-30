import Link from "next/link";

const sections = [
  {
    title: "Landing + Desktop Auth",
    links: [
      { href: "/", label: "Landing", design: "product_landing_page" },
      { href: "/login", label: "Primary Auth", design: "login_primary_auth" },
      {
        href: "/login/awaiting-signature",
        label: "Awaiting Signature",
        design: "login_awaiting_signature",
      },
      {
        href: "/login/session-initialized",
        label: "Session Initialized",
        design: "login_session_initialized",
      },
      {
        href: "/mission/launch/passkey",
        label: "Passkey Auth States",
        design: "interaction_passkey_auth_states",
      },
    ],
  },
  {
    title: "Mobile Auth",
    links: [
      {
        href: "/login/mobile",
        label: "Primary Auth Mobile",
        design: "login_primary_auth_mobile_theme_refinement",
      },
      {
        href: "/login/awaiting-signature/mobile",
        label: "Awaiting Signature Mobile",
        design: "login_awaiting_signature_mobile_theme_refinement",
      },
      {
        href: "/login/session-initialized/mobile",
        label: "Session Initialized Mobile",
        design: "login_session_initialized_mobile_theme_refinement",
      },
    ],
  },
  {
    title: "Mission Control",
    links: [
      { href: "/mission/overview", label: "Command Center", design: "overview_command_center" },
      { href: "/mission/launch", label: "Mission Launch", design: "mission_launch_configuration" },
      { href: "/mission/active", label: "Active Mission", design: "active_mission_view" },
      { href: "/alerts", label: "Global Status Alerts", design: "interaction_global_status_alerts" },
      { href: "/mission/policies", label: "Policy Risk States", design: "interaction_policy_risk_states" },
    ],
  },
  {
    title: "Agent, Trust + Memory",
    links: [
      { href: "/mission/agent", label: "Agent Trust Profile", design: "agent_trust_profile" },
      { href: "/mission/manifest", label: "Agent Manifest", design: "agent_manifest_agent.json" },
      { href: "/mission/memory", label: "Shared Memory Board", design: "shared_memory_task_board" },
      {
        href: "/mission/memory/handoff",
        label: "Memory Handoff",
        design: "interaction_memory_handoff_sync",
      },
      {
        href: "/mission/memory/history",
        label: "Memory Version History",
        design: "interaction_memory_version_history",
      },
      {
        href: "/mission/reputation",
        label: "Reputation Feedback",
        design: "interaction_reputation_feedback_flow",
      },
    ],
  },
  {
    title: "Logs + Evidence",
    links: [
      { href: "/logs", label: "Execution Log Viewer", design: "execution_log_viewer" },
      {
        href: "/logs/filter",
        label: "Log Filter Search",
        design: "interaction_log_filter_search",
      },
      {
        href: "/logs/stream",
        label: "Execution Stream Detail",
        design: "interaction_execution_stream_detail",
      },
      { href: "/receipts", label: "Receipts & Evidence", design: "receipts_evidence_view" },
      {
        href: "/receipts/assembly",
        label: "Evidence Assembly",
        design: "interaction_evidence_assembly",
      },
      {
        href: "/receipts/pinning",
        label: "Filecoin Pinning",
        design: "interaction_filecoin_pinning_flow",
      },
      {
        href: "/receipts/verify",
        label: "Receipt Forensics",
        design: "interaction_receipt_forensic_detail",
      },
    ],
  },
  {
    title: "Disputes + Resolution",
    links: [
      { href: "/dispute", label: "Incident Review", design: "dispute_incident_review" },
      {
        href: "/dispute/resolution",
        label: "Incident Resolution",
        design: "interaction_incident_resolution_flow",
      },
    ],
  },
];

export default function FlowIndexPage() {
  return (
    <div className="min-h-screen bg-background-dark px-6 py-12 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 flex flex-col gap-4">
          <Link href="/" className="text-sm font-bold uppercase tracking-[0.24em] text-primary">
            Veridex FrontierGuard
          </Link>
          <h1 className="text-4xl font-black tracking-tight">PL_Genesis Flow Index</h1>
          <p className="max-w-2xl text-slate-400">
            Route map for the hand-built hackathon screens. Each entry below maps directly to a design folder so we can
            verify parity and move through the full product story from one place.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {sections.map((section) => (
            <section key={section.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="mb-4 text-lg font-bold">{section.title}</h2>
              <div className="space-y-3">
                {section.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center justify-between rounded-xl border border-white/8 bg-black/20 px-4 py-3 text-sm transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    <div className="flex flex-col">
                      <span>{link.label}</span>
                      <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{link.design}</span>
                    </div>
                    <span className="material-symbols-outlined text-base">open_in_new</span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
