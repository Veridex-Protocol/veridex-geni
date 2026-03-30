import React from "react";
import Link from "next/link";

export default function Page() {
  return (
    <>
      {/* BEGIN: Navigation */}
      <nav
        className="fixed top-0 w-full z-50 border-b border-subtle bg-black/80 backdrop-blur-md"
        data-purpose="main-nav"
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* Logo Icon */}
            <div className="w-6 h-6 border-2 border-white flex items-center justify-center">
              <div className="w-2 h-2 bg-white"></div>
            </div>
            <span className="font-bold tracking-tighter text-lg uppercase">
              Veridex
            </span>
          </div>
          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-muted-foreground">
            <Link href="#" className="hover:text-white transition-colors">
              Protocol
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Security
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Documentation
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Network Status
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login" className="px-4 py-2 text-sm font-medium hover:text-white transition-colors">
              Log In
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium bg-white text-black hover:bg-zinc-200 transition-colors"
            >
              Launch Mission
            </Link>
          </div>
        </div>
      </nav>
      {/* END: Navigation */}

      <main>
        {/* BEGIN: Hero Section */}
        <section
          className="relative pt-32 pb-20 overflow-hidden hero-gradient"
          data-purpose="hero"
        >
          <div className="max-w-7xl mx-auto px-6 text-center">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-subtle bg-zinc-900/50 text-[10px] uppercase tracking-widest text-zinc-400 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>v1.0 Mainnet Live: ERC-8004 Compliant</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-light tracking-tight mb-6 max-w-4xl mx-auto">
              Portable Trust. Bounded Autonomy.{" "}
              <span className="text-zinc-500">Verifiable Execution.</span>
            </h1>
            <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              The control plane for autonomous agents. Authorize with passkeys, enforce policy bounds, and collect
              durable Filecoin-backed evidence.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-4 bg-white text-black font-semibold rounded-none hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
              >
                Launch Mission{" "}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  ></path>
                </svg>
              </Link>
              <Link
                href="/mission/overview"
                className="w-full sm:w-auto px-8 py-4 bg-zinc-900 border border-zinc-800 text-white font-semibold rounded-none hover:bg-zinc-800 transition-all"
              >
                Read Whitepaper
              </Link>
            </div>
          </div>
          {/* Hero Visual: Terminal Interface */}
          <div className="max-w-5xl mx-auto mt-20 px-6" data-purpose="hero-visual">
            <div className="glass-panel border-subtle rounded-t-lg p-1">
              <div className="flex items-center space-x-2 px-4 py-2 border-b border-subtle">
                <div className="flex space-x-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-700"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-700"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-700"></div>
                </div>
                <div className="text-[10px] text-zinc-500 font-mono flex-1 text-center">
                  frontierguard_manifest.yaml — 128-bit Encrypted
                </div>
              </div>
              <div className="p-6 font-mono text-sm overflow-hidden h-64 md:h-96 relative">
                <div className="space-y-2">
                  <p className="text-emerald-500">system: initializing_agent_id_4492</p>
                  <p className="text-zinc-500">policy: checking_budget_constraints...</p>
                  <p className="text-white">budget_limit: 0.50 ETH / 24h</p>
                  <p className="text-white">allow_list: ["uni-v3-swap", "storacha-pin"]</p>
                  <p className="text-zinc-500">auth: verifying_passkey_signature...</p>
                  <p className="text-emerald-500">auth: success (portable_id: 0x71C...8004)</p>
                  <p className="text-white">action: executing_bounded_trade</p>
                  <p className="text-zinc-500">evidence: generating_zk_proof...</p>
                  <p className="text-zinc-500">storage: archiving_to_filecoin...</p>
                  <div className="animate-pulse inline-block w-2 h-4 bg-white align-middle"></div>
                </div>
                {/* Mission Control Snippet overlay */}
                <div
                  className="absolute bottom-6 right-6 p-4 glass-panel border-white/10 hidden md:block"
                  data-purpose="trust-badge"
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Trust Score</div>
                      <div className="text-lg font-bold">99.98%</div>
                    </div>
                    <div className="h-10 w-[1px] bg-zinc-800"></div>
                    <div>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Network Load</div>
                      <div className="text-lg font-bold">14.2 TPS</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* END: Hero Section */}

        {/* BEGIN: Pillars Section */}
        <section className="py-24 border-t border-subtle bg-zinc-950" data-purpose="features">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Pillar 1 */}
              <div className="p-8 border border-subtle hover:border-zinc-500 transition-colors bg-zinc-900/50" data-purpose="pillar">
                <div className="w-10 h-10 mb-6 flex items-center justify-center border border-zinc-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    ></path>
                    <path
                      d="M12 1v22M5 5l14 14M19 5L5 14"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    ></path>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-3">Bounded Budgets</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Enforce strict financial guardrails at the protocol level. No agent can exceed authorized limits
                  without human-in-the-loop validation.
                </p>
              </div>
              {/* Pillar 2 */}
              <div className="p-8 border border-subtle hover:border-zinc-500 transition-colors bg-zinc-900/50" data-purpose="pillar">
                <div className="w-10 h-10 mb-6 flex items-center justify-center border border-zinc-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    ></path>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-3">Shared Memory</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Integrated with Storacha for high-performance, decentralized state management across multi-agent
                  swarms with cryptographic consistency.
                </p>
              </div>
              {/* Pillar 3 */}
              <div className="p-8 border border-subtle hover:border-zinc-500 transition-colors bg-zinc-900/50" data-purpose="pillar">
                <div className="w-10 h-10 mb-6 flex items-center justify-center border border-zinc-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    ></path>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-3">Portable Identity</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Leveraging ERC-8004 standards to ensure your agent's identity and reputation are portable across
                  networks and execution environments.
                </p>
              </div>
              {/* Pillar 4 */}
              <div className="p-8 border border-subtle hover:border-zinc-500 transition-colors bg-zinc-900/50" data-purpose="pillar">
                <div className="w-10 h-10 mb-6 flex items-center justify-center border border-zinc-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M9 17v-2m3 2v-4m3 4v-6m2 10H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    ></path>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-3">Durable Proofs</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Automated audit logs backed by Filecoin storage. Every action is verifiable, immutable, and accessible
                  for compliance reporting.
                </p>
              </div>
            </div>
          </div>
        </section>
        {/* END: Pillars Section */}

        {/* BEGIN: Architecture Block */}
        <section className="py-24" data-purpose="architecture">
          <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6 tracking-tight">Mission Control for Autonomy</h2>
              <p className="text-zinc-400 mb-8 leading-relaxed">
                The FrontierGuard Network operates as an arbitration layer between your private LLM infrastructure and
                the public web3 economy. By decoupling the 'brain' from the 'bank', we enable enterprise-scale
                deployment without compromising security.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start space-x-3">
                  <div className="mt-1 flex-shrink-0 w-1.5 h-1.5 bg-white"></div>
                  <span className="text-sm text-zinc-300">
                    <strong className="text-white">Passkey Authorization:</strong> Secure agent activation via
                    hardware-backed credentials.
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="mt-1 flex-shrink-0 w-1.5 h-1.5 bg-white"></div>
                  <span className="text-sm text-zinc-300">
                    <strong className="text-white">Execution Manifests:</strong> Declarative policies that define what
                    an agent can and cannot do.
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="mt-1 flex-shrink-0 w-1.5 h-1.5 bg-white"></div>
                  <span className="text-sm text-zinc-300">
                    <strong className="text-white">Real-time Telemetry:</strong> Live monitoring of agent performance,
                    spending, and latency.
                  </span>
                </li>
              </ul>
            </div>
            <div className="relative group" data-purpose="ui-snippet">
              <div className="absolute -inset-1 bg-gradient-to-r from-zinc-800 to-zinc-700 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
              <div className="relative glass-panel rounded-lg overflow-hidden border-subtle">
                <div className="bg-zinc-900/80 px-4 py-3 border-b border-subtle flex items-center justify-between">
                  <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest">
                    Active Manifest: v2.4.2
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                    Operational
                  </span>
                </div>
                <div className="p-8">
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="p-4 bg-zinc-950 border border-subtle">
                      <div className="text-[10px] text-zinc-500 mb-1 uppercase">Uptime</div>
                      <div className="text-xl font-mono">142d 12h 04m</div>
                    </div>
                    <div className="p-4 bg-zinc-950 border border-subtle">
                      <div className="text-[10px] text-zinc-500 mb-1 uppercase">Allocated</div>
                      <div className="text-xl font-mono">2,500 USDC</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-white w-2/3"></div>
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                      <span>BUDGET CONSUMPTION: 67%</span>
                      <span>RESET IN 14h</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* END: Architecture Block */}

        {/* BEGIN: CTA Section */}
        <section className="py-24 border-t border-subtle" data-purpose="final-cta">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-light mb-6">Secure Your Frontier.</h2>
            <p className="text-zinc-400 mb-10">
              Join the early access program for enterprise deployments. Orchestrate your autonomous workforce with
              precision and peace of mind.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <input
                className="bg-zinc-900 border-zinc-800 focus:ring-zinc-700 text-white px-6 py-4 w-full sm:w-72 rounded-none"
                placeholder="enterprise@company.com"
                type="email"
              />
              <Link
                href="/login"
                className="bg-white text-black px-8 py-4 font-bold hover:bg-zinc-200 transition-all uppercase tracking-tight"
              >
                Request Access
              </Link>
            </div>
          </div>
        </section>
        {/* END: CTA Section */}
      </main>

      {/* BEGIN: Footer */}
      <footer className="py-12 border-t border-subtle bg-zinc-950 text-zinc-500" data-purpose="footer">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 border border-zinc-500 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-zinc-500"></div>
            </div>
            <span className="font-bold tracking-tighter text-sm uppercase text-zinc-300">
              Veridex FrontierGuard
            </span>
          </div>
          <div className="flex space-x-8 text-xs uppercase tracking-widest">
            <Link href="#" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Terms
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Security Audit
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Twitter
            </Link>
          </div>
          <div className="text-[10px] font-mono">© 2024 VERIDEX PROTOCOL LABS. ALL RIGHTS RESERVED.</div>
        </div>
      </footer>
      {/* END: Footer */}
    </>
  );
}
