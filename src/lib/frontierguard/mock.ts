import type {
  AgentLogDocument,
  AgentIdentity,
  ChainTransaction,
  ConfidentialPolicy,
  EvidenceArtifact,
  ExecutionRail,
  FlowCadence,
  FrontierSession,
  FrontierState,
  LogEvent,
  ManifestDocument,
  MemoryRecord,
  Mission,
  MissionAgent,
  MissionBudget,
  MissionDispute,
  MissionExecution,
  MissionFinding,
  MissionLaunchInput,
  MissionPolicy,
  MissionStage,
  MissionTask,
  NotificationItem,
  PaymentEvent,
  PrivateIntent,
  ReceiptDocument,
  ReputationSubmission,
  RetryPolicy,
  ScheduledExecution,
  StageKey,
} from "@/lib/frontierguard/types";

export const STAGE_ORDER: StageKey[] = [
  "authorize",
  "register",
  "discover",
  "plan",
  "execute",
  "verify",
  "finalize",
];

export const STAGE_LABELS: Record<StageKey, string> = {
  authorize: "Authorize",
  register: "Register",
  discover: "Discover",
  plan: "Plan",
  execute: "Execute",
  verify: "Verify",
  finalize: "Finalize",
};

export const EXECUTION_RAIL_LABELS: Record<ExecutionRail, string> = {
  immediate: "Immediate",
  scheduled: "Scheduled",
  private: "Private",
  confidential: "Confidential",
};

function isoWithOffset(minutes: number): string {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

function money(value: number): number {
  return Number(value.toFixed(2));
}

function createId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function nextCadenceAt(cadence: FlowCadence, scheduledFor?: string): string | undefined {
  if (!scheduledFor) {
    return undefined;
  }

  const base = new Date(scheduledFor);
  if (Number.isNaN(base.getTime())) {
    return undefined;
  }

  if (cadence === "once") {
    return scheduledFor;
  }

  const next = new Date(base);
  if (cadence === "hourly") {
    next.setHours(next.getHours() + 1);
  } else if (cadence === "daily") {
    next.setDate(next.getDate() + 1);
  } else {
    next.setDate(next.getDate() + 7);
  }

  return next.toISOString();
}

export function getRemainingBudget(mission: Mission): number {
  return money(mission.budget.totalUsd - mission.budget.spentUsd);
}

export function createSession(): FrontierSession {
  return {
    authenticated: false,
    operatorName: "Frontier Operator",
    operatorWallet: "passkey-required",
    passkeyCredentialId: "",
    passkeyLabel: "Passkey Required",
    lastAuthenticatedAt: isoWithOffset(-18),
    expiresAt: new Date().toISOString(),
    networkStatus: "expired",
  };
}

export function createDefaultPolicy(): MissionPolicy {
  return {
    allowedTools: [
      "Premium Yield API",
      "Risk Index Engine",
      "Protocol Compare",
      "Receipt Compiler",
      "Flow Scheduler",
      "Starknet Intent Committer",
      "Zama Policy Vault",
    ],
    allowedChains: ["Base", "Ethereum", "Flow", "Starknet", "fhEVM"],
    allowedCounterparties: ["Aave V3", "Compound V3", "Veridex Risk Oracle"],
    escalationThresholdPct: 50,
    minTrustScore: 88,
    requireManualEscalation: true,
  };
}

export function createDefaultBudget(): MissionBudget {
  return {
    totalUsd: 25,
    perTxCapUsd: 10,
    spentUsd: 8.4,
    expiryHours: 2,
  };
}

export function createMissionAgents(): MissionAgent[] {
  return [
    { id: "planner-alpha", name: "Planner Alpha", role: "planner", status: "ready" },
    { id: "specialist-frontier", name: "Frontier Research Specialist", role: "specialist", status: "active" },
    { id: "auditor-delta", name: "Auditor Delta", role: "auditor", status: "idle" },
  ];
}

export function createStageStates(activeStage: StageKey, completed: StageKey[] = []): MissionStage[] {
  return STAGE_ORDER.map((key) => ({
    key,
    label: STAGE_LABELS[key],
    status: completed.includes(key) ? "completed" : key === activeStage ? "active" : "pending",
    summary:
      key === "authorize"
        ? "Operator passkey session bound to mission."
        : key === "register"
          ? "ERC-8004 identity anchored and manifest pinned."
          : key === "discover"
            ? "Services and counterparties shortlisted."
            : key === "plan"
              ? "Planner agent decomposed the mission into bounded tasks."
              : key === "execute"
                ? "Selected rail performs payment-gated or deferred work."
                : key === "verify"
                  ? "Auditor validates outputs, policy conformance, and rail receipts."
                  : "Artifacts pinned and receipt bundle published.",
  }));
}

function createIdentity(session: FrontierSession): AgentIdentity {
  return {
    agentName: "Frontier Research Specialist",
    manifestName: "agent.json",
    agentId: "FRONTIER-RESEARCH-SPECIALIST",
    erc8004Identity: "ERC-8004-DEMO",
    operatorWallet: session.operatorWallet,
    registry: "Base Mainnet Demo",
    network: "Base",
    registrationTxHash: "0x0",
    trustScore: 96.8,
    trustDelta: 0,
  };
}

function createReputation(): ReputationSubmission {
  return {
    rating: 4.6,
    notes: "Autonomous mission stayed within budget, chose trusted counterparties, and returned verifiable evidence.",
    submittedAt: isoWithOffset(-5),
  };
}

function createScheduledExecution(
  rail: ExecutionRail,
  input?: Partial<MissionLaunchInput>,
): ScheduledExecution {
  const cadence = input?.scheduleCadence ?? "daily";
  const scheduledFor = input?.scheduleAt ?? isoWithOffset(90);

  return {
    enabled: rail === "scheduled",
    cadence,
    scheduledFor: rail === "scheduled" ? scheduledFor : undefined,
    nextRunAt: rail === "scheduled" ? nextCadenceAt(cadence, scheduledFor) : undefined,
    retryPolicy: input?.retryPolicy ?? "retry-once",
    status: rail === "scheduled" ? "scheduled" : "idle",
    scheduleId: rail === "scheduled" ? "flow-schedule-demo-001" : undefined,
    txHash: rail === "scheduled" ? "0xflowdemo001" : undefined,
    explorerUrl: rail === "scheduled" ? "https://www.flowscan.io/transaction/0xflowdemo001" : undefined,
    handlerAddress: rail === "scheduled" ? "A.0ae53cb6e3f42a79.FrontierMissionScheduler" : undefined,
    network: rail === "scheduled" ? "Flow Testnet" : undefined,
    live: false,
  };
}

function createPrivateIntent(
  rail: ExecutionRail,
  input?: Partial<MissionLaunchInput>,
): PrivateIntent {
  return {
    enabled: rail === "private",
    label: input?.privateIntentLabel ?? "Treasury route selection",
    commitmentHash: rail === "private" ? "0xstarkcommitdemo001" : undefined,
    nullifier: rail === "private" ? "0xstarknullifier001" : undefined,
    revealWindowHours: input?.privateRevealWindowHours ?? 6,
    status: rail === "private" ? "committed" : "idle",
    txHash: rail === "private" ? "0xstarktxdemo001" : undefined,
    revealTxHash: undefined,
    explorerUrl: rail === "private" ? "https://sepolia.starkscan.co/tx/0xstarktxdemo001" : undefined,
    network: rail === "private" ? "Starknet Sepolia" : undefined,
    live: false,
  };
}

function createConfidentialPolicy(
  rail: ExecutionRail,
  input?: Partial<MissionLaunchInput>,
): ConfidentialPolicy {
  const encryptedFields =
    rail === "confidential"
      ? ["maxSpendUsd", "minTrustScore", "allowedCounterparties", "emergencyStop"]
      : [];

  return {
    enabled: rail === "confidential",
    encryptedFields,
    policyHandle: rail === "confidential" ? "zama-policy-handle-demo-001" : undefined,
    aclGrantId: rail === "confidential" ? "zama-acl-demo-001" : undefined,
    evaluatorAddress: rail === "confidential" ? "0xZamaPolicyVaultDemo" : undefined,
    status: rail === "confidential" ? "encrypted" : "idle",
    summary:
      rail === "confidential"
        ? "Budget ceiling, counterparty allowlist, trust threshold, and emergency stop are encrypted."
        : "All policy fields are public.",
    lastEvaluatedAt: rail === "confidential" ? isoWithOffset(-3) : undefined,
    network: rail === "confidential" ? "fhEVM Sepolia" : undefined,
    live: false,
    encryptedValues: {
      maxSpendUsd:
        rail === "confidential" && input?.confidentialMaxSpendUsd != null
          ? `enc:${input.confidentialMaxSpendUsd}`
          : rail === "confidential"
            ? "enc:12"
            : undefined,
      minTrustScore:
        rail === "confidential" && input?.confidentialMinTrustScore != null
          ? `enc:${input.confidentialMinTrustScore}`
          : rail === "confidential"
            ? "enc:90"
            : undefined,
      allowedCounterparties:
        rail === "confidential"
          ? input?.confidentialCounterparties ?? ["Aave V3", "Veridex Risk Oracle"]
          : undefined,
      emergencyStop:
        rail === "confidential"
          ? input?.confidentialEmergencyStop
            ? "enc:true"
            : "enc:false"
          : undefined,
    },
  };
}

function createExecution(
  rail: ExecutionRail,
  input?: Partial<MissionLaunchInput>,
): MissionExecution {
  return {
    rail,
    status:
      rail === "scheduled"
        ? "scheduled"
        : rail === "private"
          ? "committed"
          : rail === "confidential"
            ? "confidential"
            : "ready",
    selectorLabel: EXECUTION_RAIL_LABELS[rail],
    scheduled: createScheduledExecution(rail, input),
    privateIntent: createPrivateIntent(rail, input),
    confidentialPolicy: createConfidentialPolicy(rail, input),
    chainTransactions: [],
  };
}

function createArtifacts(rail: ExecutionRail): EvidenceArtifact[] {
  const artifacts: EvidenceArtifact[] = [
    {
      id: "manifest",
      name: "agent.json",
      type: "manifest",
      description: "Machine-readable capability manifest for the registered agent.",
      route: "/mission/manifest",
      sizeLabel: "1.2 KB",
      status: "pinned",
      cid: "bafydemomanifest0001",
      txHash: "0xfeed0001",
      pinnedAt: isoWithOffset(-14),
    },
    {
      id: "log",
      name: "agent_log.json",
      type: "log",
      description: "Structured execution logs across the full mission loop.",
      route: "/logs",
      sizeLabel: "8.4 KB",
      status: "draft",
    },
    {
      id: "summary",
      name: "mission_summary.md",
      type: "summary",
      description: "Human-readable mission summary and recommendation.",
      route: "/receipts/assembly",
      sizeLabel: "3.1 KB",
      status: "draft",
    },
    {
      id: "receipt",
      name: "receipt_bundle.json",
      type: "receipt",
      description: "Final evidence bundle with CIDs, payments, and trust receipts.",
      route: "/receipts/verify",
      sizeLabel: "4.7 KB",
      status: "draft",
    },
    {
      id: "feedback",
      name: "reputation_feedback.json",
      type: "feedback",
      description: "Post-task ERC-8004 reputation submission.",
      route: "/mission/reputation",
      sizeLabel: "1.3 KB",
      status: "draft",
    },
  ];

  if (rail === "scheduled") {
    artifacts.push({
      id: "scheduled",
      name: "flow_schedule_receipt.json",
      type: "scheduled",
      description: "Flow schedule receipt including cadence, handler, and next execution window.",
      route: "/receipts/verify",
      sizeLabel: "1.9 KB",
      status: "draft",
    });
  }

  if (rail === "private") {
    artifacts.push({
      id: "private",
      name: "starknet_private_intent.json",
      type: "private",
      description: "Starknet commitment and reveal proof for the private mission lane.",
      route: "/receipts/verify",
      sizeLabel: "2.1 KB",
      status: "draft",
    });
  }

  if (rail === "confidential") {
    artifacts.push({
      id: "confidential",
      name: "zama_confidential_policy.json",
      type: "confidential",
      description: "Confidential policy vault receipt with encrypted handles and ACL references.",
      route: "/mission/policies",
      sizeLabel: "2.4 KB",
      status: "draft",
    });
  }

  return artifacts;
}

function createSeedTasks(rail: ExecutionRail): MissionTask[] {
  const tasks: MissionTask[] = [
    {
      id: "TASK-401",
      title: "Query Risk Index for treasury execution routes",
      description: "Call the premium yield service and retrieve protocol risk metadata.",
      owner: "Frontier Research Specialist",
      type: "analysis",
      counterparty: "Veridex Risk Oracle",
      costUsd: 4.2,
      status: "in_progress",
    },
    {
      id: "TASK-402",
      title: "Compare trust-adjusted route options",
      description: "Rank the safest treasury deployment route after risk normalization.",
      owner: "Planner Alpha",
      type: "analysis",
      costUsd: 0,
      status: "planned",
    },
    {
      id: "TASK-398",
      title: "Verify rail receipts and summarize operator brief",
      description: "Auditor checks outputs and prepares the final narrative.",
      owner: "Auditor Delta",
      type: "verification",
      costUsd: 0,
      status: "awaiting_verification",
    },
  ];

  if (rail === "scheduled") {
    tasks.unshift({
      id: "TASK-399",
      title: "Schedule recurring Flow execution",
      description: "Bind the mission to a Flow cadence handler and retry policy.",
      owner: "Planner Alpha",
      type: "finalize",
      costUsd: 0,
      status: "completed",
    });
  }

  if (rail === "private") {
    tasks.unshift({
      id: "TASK-397",
      title: "Commit sealed strategy intent",
      description: "Anchor the mission route preference as a private Starknet commitment before reveal.",
      owner: "Frontier Research Specialist",
      type: "analysis",
      costUsd: 0,
      status: "completed",
    });
  }

  if (rail === "confidential") {
    tasks.unshift({
      id: "TASK-396",
      title: "Encrypt confidential operator thresholds",
      description: "Store hidden budget ceilings and trust bounds in the Zama policy vault.",
      owner: "Planner Alpha",
      type: "analysis",
      costUsd: 0,
      status: "completed",
    });
  }

  return tasks;
}

function createSeedMemory(rail: ExecutionRail): MemoryRecord[] {
  const records: MemoryRecord[] = [
    {
      id: "MEM-101",
      type: "plan",
      title: "Mission Plan",
      summary: "Planner agent decomposed the mission into discovery, execution, and audit steps.",
      owner: "Planner Alpha",
      createdAt: isoWithOffset(-16),
      cid: "bafydemoplan0001",
      content: {
        stages: ["discover", "plan", "execute", "verify", "finalize"],
        targetProtocols: ["Aave V3", "Compound V3"],
      },
    },
    {
      id: "MEM-102",
      type: "research",
      title: "Premium Yield Snapshot",
      summary: "Paid market data retrieved through an x402 challenge-response flow.",
      owner: "Frontier Research Specialist",
      createdAt: isoWithOffset(-8),
      cid: "bafydemodata0002",
      content: {
        counterparty: "Veridex Risk Oracle",
        protocol: "x402",
        spendUsd: 4.2,
      },
    },
    {
      id: "MEM-103",
      type: "handoff",
      title: "Auditor Handoff",
      summary: "Specialist handed normalized findings to the auditor for conformance checks.",
      owner: "Auditor Delta",
      createdAt: isoWithOffset(-2),
      cid: "bafydemohandoff0003",
      content: {
        needsVerification: true,
        openQuestions: ["Confirm trust threshold on Aave V3 route"],
      },
    },
  ];

  if (rail === "scheduled") {
    records.unshift({
      id: "MEM-104",
      type: "summary",
      title: "Flow schedule descriptor",
      summary: "Mission cadence and retry policy were synced before the first deferred execution.",
      owner: "Planner Alpha",
      createdAt: isoWithOffset(-10),
      cid: "bafyflowschedule0004",
      content: {
        cadence: "daily",
        nextRunAt: isoWithOffset(150),
      },
    });
  }

  if (rail === "private") {
    records.unshift({
      id: "MEM-105",
      type: "summary",
      title: "Private intent commitment",
      summary: "Sealed route intent anchored before the mission entered execution.",
      owner: "Frontier Research Specialist",
      createdAt: isoWithOffset(-11),
      cid: "bafystarkintent0005",
      content: {
        commitmentHash: "0xstarkcommitdemo001",
      },
    });
  }

  if (rail === "confidential") {
    records.unshift({
      id: "MEM-106",
      type: "summary",
      title: "Confidential policy handles",
      summary: "Encrypted thresholds and ACL grants prepared for evaluation at execution time.",
      owner: "Planner Alpha",
      createdAt: isoWithOffset(-12),
      cid: "bafyzamapolicy0006",
      content: {
        policyHandle: "zama-policy-handle-demo-001",
        aclGrantId: "zama-acl-demo-001",
      },
    });
  }

  return records;
}

function createSeedPayments(): PaymentEvent[] {
  return [
    {
      id: "PAY-201",
      protocol: "x402",
      merchant: "Veridex Risk Oracle",
      resource: "/api/frontier/services/premium-yield",
      amountUsd: 4.2,
      status: "settled",
      challengeId: "challenge_demo_201",
      network: "base-sepolia",
      counterpartyTrust: 96.4,
      txHash: "0x97d4f5fee1a2c003",
      createdAt: isoWithOffset(-8),
    },
  ];
}

function createSeedFindings(): MissionFinding[] {
  return [
    {
      asset: "USDC",
      protocol: "Aave V3",
      apy: "8.42%",
      riskScore: 0.72,
      liquidity: "$4.2B",
      status: "stable",
      recommendation: "Safest route with strong liquidity and score below operator threshold.",
    },
    {
      asset: "USDC",
      protocol: "Compound V3",
      apy: "8.91%",
      riskScore: 0.84,
      liquidity: "$2.8B",
      status: "caution",
      recommendation: "Higher yield but crosses the caution threshold; require manual approval.",
    },
    {
      asset: "DAI",
      protocol: "Morpho Blue",
      apy: "11.14%",
      riskScore: 1.1,
      liquidity: "$611M",
      status: "blocked",
      recommendation: "Outside policy bounds due to insufficient trust score and elevated liquidation risk.",
    },
  ];
}

function createSeedLogs(rail: ExecutionRail): LogEvent[] {
  const logs: LogEvent[] = [
    {
      id: "LOG-001",
      timestamp: isoWithOffset(-18),
      level: "success",
      actor: "operator",
      stage: "authorize",
      title: "Passkey session active",
      message: "Operator authenticated with Touch ID and authorized a bounded mission session.",
      tags: ["passkey", "session"],
    },
    {
      id: "LOG-002",
      timestamp: isoWithOffset(-17),
      level: "success",
      actor: "trust",
      stage: "register",
      title: "ERC-8004 identity registered",
      message: "Agent identity anchored and linked to the operator wallet on Base.",
      tags: ["erc-8004", "identity"],
      detail: { txHash: "0xfeed0001" },
    },
    {
      id: "LOG-003",
      timestamp: isoWithOffset(-16),
      level: "info",
      actor: "planner",
      stage: "discover",
      title: "Counterparty shortlist created",
      message: "Planner selected trusted data providers and stored the shortlist in shared memory.",
      tags: ["storacha", "discovery"],
    },
    {
      id: "LOG-004",
      timestamp: isoWithOffset(-15),
      level: "info",
      actor: "planner",
      stage: "plan",
      title: "Mission decomposed",
      message: "Planner split the treasury review into analysis, payment, and audit tasks.",
      tags: ["planning"],
    },
    {
      id: "LOG-005",
      timestamp: isoWithOffset(-8),
      level: "success",
      actor: "payment",
      stage: "execute",
      title: "x402 challenge settled",
      message: "Payment for premium yield data approved within budget and retried successfully.",
      tags: ["x402", "payment", "settled"],
      detail: { amountUsd: 4.2, txHash: "0x97d4f5fee1a2c003" },
    },
    {
      id: "LOG-006",
      timestamp: isoWithOffset(-3),
      level: "info",
      actor: "specialist",
      stage: "execute",
      title: "Research findings normalized",
      message: "Specialist agent normalized APY, liquidity, and trust scores for downstream verification.",
      tags: ["analysis", "memory"],
    },
  ];

  if (rail === "scheduled") {
    logs.push({
      id: "LOG-007",
      timestamp: isoWithOffset(-12),
      level: "success",
      actor: "system",
      stage: "register",
      title: "Flow schedule prepared",
      message: "Mission was bound to a Flow scheduler contract with a retry policy.",
      tags: ["flow", "schedule"],
    });
  }

  if (rail === "private") {
    logs.push({
      id: "LOG-008",
      timestamp: isoWithOffset(-12),
      level: "success",
      actor: "system",
      stage: "register",
      title: "Private intent committed",
      message: "Sealed route commitment anchored on Starknet before execution.",
      tags: ["starknet", "private-intent"],
    });
  }

  if (rail === "confidential") {
    logs.push({
      id: "LOG-009",
      timestamp: isoWithOffset(-12),
      level: "success",
      actor: "policy",
      stage: "plan",
      title: "Confidential policy encrypted",
      message: "Zama vault stored encrypted policy values and ACL grants for runtime evaluation.",
      tags: ["zama", "confidential-policy"],
    });
  }

  return logs;
}

function createSeedChainTransactions(rail: ExecutionRail): ChainTransaction[] {
  if (rail === "scheduled") {
    return [
      {
        id: "CHAIN-001",
        rail: "scheduled",
        chain: "Flow",
        network: "Flow Testnet",
        action: "schedule_mission",
        status: "confirmed",
        txHash: "0xflowdemo001",
        explorerUrl: "https://www.flowscan.io/transaction/0xflowdemo001",
        live: false,
        createdAt: isoWithOffset(-12),
      },
    ];
  }

  if (rail === "private") {
    return [
      {
        id: "CHAIN-002",
        rail: "private",
        chain: "Starknet",
        network: "Sepolia",
        action: "commit_private_intent",
        status: "confirmed",
        txHash: "0xstarktxdemo001",
        explorerUrl: "https://sepolia.starkscan.co/tx/0xstarktxdemo001",
        live: false,
        createdAt: isoWithOffset(-12),
      },
    ];
  }

  if (rail === "confidential") {
    return [
      {
        id: "CHAIN-003",
        rail: "confidential",
        chain: "fhEVM",
        network: "Sepolia",
        action: "store_confidential_policy",
        status: "confirmed",
        txHash: "0xzamapolicydemo001",
        live: false,
        createdAt: isoWithOffset(-12),
      },
    ];
  }

  return [];
}

export function createDefaultMission(session: FrontierSession): Mission {
  const execution = createExecution("immediate");
  return {
    id: "MSG-9402-DELTA",
    title: "Stablecoin Yield Risk Review",
    objective:
      "Research the safest stablecoin yield route for treasury funds, buy premium market data if required, compare the top options, and return a recommendation with receipts.",
    template: "Treasury Research",
    createdAt: isoWithOffset(-18),
    updatedAt: isoWithOffset(-2),
    status: "running",
    activeStage: "execute",
    stages: createStageStates("execute", ["authorize", "register", "discover", "plan"]),
    budget: createDefaultBudget(),
    policy: createDefaultPolicy(),
    execution: {
      ...execution,
      status: "executing",
      chainTransactions: createSeedChainTransactions("immediate"),
    },
    identity: createIdentity(session),
    agents: createMissionAgents(),
    tasks: createSeedTasks("immediate"),
    memory: createSeedMemory("immediate"),
    payments: createSeedPayments(),
    logs: createSeedLogs("immediate"),
    artifacts: createArtifacts("immediate"),
    findings: createSeedFindings(),
    disputes: [],
    reputation: createReputation(),
  };
}

export function createDefaultState(): FrontierState {
  const session = createSession();
  return {
    session,
    mission: createDefaultMission(session),
    loading: false,
    lastUpdatedAt: isoWithOffset(-2),
  };
}

export function normalizeMission(
  mission: Mission | undefined,
  session: FrontierSession,
): Mission {
  const fallback = createDefaultMission(session);

  if (!mission) {
    return fallback;
  }

  return {
    ...fallback,
    ...mission,
    identity: {
      ...fallback.identity,
      ...mission.identity,
    },
    budget: {
      ...fallback.budget,
      ...mission.budget,
    },
    policy: {
      ...fallback.policy,
      ...mission.policy,
    },
    execution: {
      ...fallback.execution,
      ...(mission.execution ?? {}),
      scheduled: {
        ...fallback.execution.scheduled,
        ...(mission.execution?.scheduled ?? {}),
      },
      privateIntent: {
        ...fallback.execution.privateIntent,
        ...(mission.execution?.privateIntent ?? {}),
      },
      confidentialPolicy: {
        ...fallback.execution.confidentialPolicy,
        ...(mission.execution?.confidentialPolicy ?? {}),
        encryptedValues: {
          ...fallback.execution.confidentialPolicy.encryptedValues,
          ...(mission.execution?.confidentialPolicy?.encryptedValues ?? {}),
        },
      },
      chainTransactions: mission.execution?.chainTransactions ?? fallback.execution.chainTransactions,
    },
    stages: mission.stages?.length ? mission.stages : fallback.stages,
    agents: mission.agents?.length ? mission.agents : fallback.agents,
    tasks: mission.tasks ?? [],
    memory: mission.memory ?? [],
    payments: mission.payments ?? [],
    logs: mission.logs ?? [],
    artifacts: mission.artifacts?.length ? mission.artifacts : fallback.artifacts,
    findings: mission.findings ?? [],
    disputes: mission.disputes ?? [],
    reputation: {
      ...fallback.reputation,
      ...mission.reputation,
    },
  };
}

export function normalizeFrontierState(state?: FrontierState | null): FrontierState {
  const fallback = createDefaultState();

  if (!state) {
    return fallback;
  }

  const session = {
    ...fallback.session,
    ...state.session,
  };

  return {
    ...fallback,
    ...state,
    session,
    mission: normalizeMission(state.mission, session),
    lastUpdatedAt: state.lastUpdatedAt ?? fallback.lastUpdatedAt,
  };
}

export function createLaunchInputFromMission(mission: Mission): MissionLaunchInput {
  const normalizedMission = normalizeMission(mission, mission.identity ? {
    authenticated: true,
    operatorName: mission.identity.agentName,
    operatorWallet: mission.identity.operatorWallet,
    passkeyCredentialId: "",
    passkeyLabel: "Recovered Session",
    lastAuthenticatedAt: mission.updatedAt,
    expiresAt: mission.updatedAt,
    networkStatus: "active",
  } : createSession());

  return {
    title: normalizedMission.title,
    objective: normalizedMission.objective,
    template: normalizedMission.template,
    executionRail: normalizedMission.execution.rail,
    totalUsd: normalizedMission.budget.totalUsd,
    perTxCapUsd: normalizedMission.budget.perTxCapUsd,
    expiryHours: normalizedMission.budget.expiryHours,
    allowedTools: normalizedMission.policy.allowedTools,
    allowedChains: normalizedMission.policy.allowedChains,
    allowedCounterparties: normalizedMission.policy.allowedCounterparties,
    escalationThresholdPct: normalizedMission.policy.escalationThresholdPct,
    minTrustScore: normalizedMission.policy.minTrustScore,
    requireManualEscalation: normalizedMission.policy.requireManualEscalation,
    scheduleCadence: normalizedMission.execution.scheduled.cadence,
    scheduleAt: normalizedMission.execution.scheduled.scheduledFor,
    retryPolicy: normalizedMission.execution.scheduled.retryPolicy,
    privateIntentLabel: normalizedMission.execution.privateIntent.label,
    privateRevealWindowHours: normalizedMission.execution.privateIntent.revealWindowHours,
    confidentialMaxSpendUsd: normalizedMission.execution.confidentialPolicy.encryptedValues.maxSpendUsd
      ? Number(normalizedMission.execution.confidentialPolicy.encryptedValues.maxSpendUsd.replace("enc:", ""))
      : undefined,
    confidentialMinTrustScore: normalizedMission.execution.confidentialPolicy.encryptedValues.minTrustScore
      ? Number(normalizedMission.execution.confidentialPolicy.encryptedValues.minTrustScore.replace("enc:", ""))
      : undefined,
    confidentialCounterparties:
      normalizedMission.execution.confidentialPolicy.encryptedValues.allowedCounterparties ?? [],
    confidentialEmergencyStop:
      normalizedMission.execution.confidentialPolicy.encryptedValues.emergencyStop === "enc:true",
  };
}

export function createMissionFromInput(session: FrontierSession, input: MissionLaunchInput): Mission {
  const now = new Date().toISOString();
  const identity = createIdentity(session);
  const execution = createExecution(input.executionRail, input);

  return {
    id: createId("MSG"),
    title: input.title,
    objective: input.objective,
    template: input.template,
    createdAt: now,
    updatedAt: now,
    status: "running",
    activeStage: "register",
    stages: createStageStates("register", ["authorize"]),
    budget: {
      totalUsd: input.totalUsd,
      perTxCapUsd: input.perTxCapUsd,
      spentUsd: 0,
      expiryHours: input.expiryHours,
    },
    policy: {
      allowedTools: input.allowedTools,
      allowedChains: input.allowedChains,
      allowedCounterparties: input.allowedCounterparties,
      escalationThresholdPct: input.escalationThresholdPct,
      minTrustScore: input.minTrustScore,
      requireManualEscalation: input.requireManualEscalation,
    },
    execution,
    identity,
    agents: createMissionAgents(),
    tasks: [],
    memory: [],
    payments: [],
    logs: [
      {
        id: createId("LOG"),
        timestamp: now,
        level: "success",
        actor: "operator",
        stage: "authorize",
        title: "Mission authorized",
        message: `Operator created mission "${input.title}" with the ${EXECUTION_RAIL_LABELS[input.executionRail]} rail selected.`,
        tags: ["passkey", "authorize", input.executionRail],
      },
      {
        id: createId("LOG"),
        timestamp: now,
        level: "info",
        actor: "system",
        stage: "register",
        title: "Agent registration queued",
        message: "Preparing ERC-8004 registration, manifest pinning, and rail setup.",
        tags: ["erc-8004", "manifest", input.executionRail],
      },
    ],
    artifacts: createArtifacts(input.executionRail).map((artifact) => ({
      ...artifact,
      status: "draft",
      cid: undefined,
      txHash: undefined,
      pinnedAt: undefined,
    })),
    findings: [],
    disputes: [],
    reputation: {
      rating: 4.5,
      notes: "Mission complete and policy-compliant.",
      submittedAt: now,
    },
  };
}

export function updateStageStatus(
  mission: Mission,
  activeStage: StageKey,
  completed: StageKey[],
  blockedStage?: StageKey,
): MissionStage[] {
  return STAGE_ORDER.map((key) => {
    let status: MissionStage["status"] = "pending";

    if (completed.includes(key)) {
      status = "completed";
    } else if (blockedStage === key) {
      status = "blocked";
    } else if (key === activeStage) {
      status = "active";
    }

    const existing = mission.stages.find((stage) => stage.key === key);

    return {
      key,
      label: STAGE_LABELS[key],
      status,
      summary: existing?.summary ?? "",
      startedAt: existing?.startedAt,
      completedAt:
        status === "completed"
          ? existing?.completedAt ?? new Date().toISOString()
          : existing?.completedAt,
    };
  });
}

export function buildManifestDocument(mission: Mission): ManifestDocument {
  const normalizedMission = normalizeMission(mission, createSession());
  return {
    agent_name: normalizedMission.identity.agentName,
    operator_wallet: normalizedMission.identity.operatorWallet,
    erc8004_identity: normalizedMission.identity.erc8004Identity,
    mission_id: normalizedMission.id,
    execution_rail: normalizedMission.execution.rail,
    supported_tools: normalizedMission.policy.allowedTools,
    supported_chains: normalizedMission.policy.allowedChains,
    task_categories: ["research", "risk_analysis", "payment_gated_access", "audit"],
    compute_constraints: {
      max_budget_usd: normalizedMission.budget.totalUsd,
      per_tx_cap_usd: normalizedMission.budget.perTxCapUsd,
      expiry_hours: normalizedMission.budget.expiryHours,
    },
    policy_bounds: {
      min_counterparty_trust: normalizedMission.policy.minTrustScore,
      escalation_threshold_pct: normalizedMission.policy.escalationThresholdPct,
      require_manual_escalation: normalizedMission.policy.requireManualEscalation,
      allowlisted_counterparties: normalizedMission.policy.allowedCounterparties,
    },
    rail_configuration: {
      scheduled: normalizedMission.execution.scheduled.enabled
        ? {
            cadence: normalizedMission.execution.scheduled.cadence,
            scheduled_for: normalizedMission.execution.scheduled.scheduledFor,
            retry_policy: normalizedMission.execution.scheduled.retryPolicy,
          }
        : undefined,
      private_intent: normalizedMission.execution.privateIntent.enabled
        ? {
            label: normalizedMission.execution.privateIntent.label,
            reveal_window_hours: normalizedMission.execution.privateIntent.revealWindowHours,
          }
        : undefined,
      confidential_policy: normalizedMission.execution.confidentialPolicy.enabled
        ? {
            encrypted_fields: normalizedMission.execution.confidentialPolicy.encryptedFields,
            summary: normalizedMission.execution.confidentialPolicy.summary,
          }
        : undefined,
    },
  };
}

export function buildAgentLogDocument(mission: Mission): AgentLogDocument {
  const normalizedMission = normalizeMission(mission, createSession());
  return {
    mission_id: normalizedMission.id,
    status: normalizedMission.status,
    active_stage: normalizedMission.activeStage,
    generated_at: new Date().toISOString(),
    events: normalizedMission.logs.map((event) => ({
      id: event.id,
      timestamp: event.timestamp,
      actor: event.actor,
      level: event.level,
      stage: event.stage,
      title: event.title,
      message: event.message,
      detail: event.detail,
    })),
  };
}

export function buildReceiptDocument(mission: Mission): ReceiptDocument {
  const normalizedMission = normalizeMission(mission, createSession());
  return {
    mission_id: normalizedMission.id,
    title: normalizedMission.title,
    objective: normalizedMission.objective,
    status: normalizedMission.status,
    execution_rail: normalizedMission.execution.rail,
    execution_status: normalizedMission.execution.status,
    operator_wallet: normalizedMission.identity.operatorWallet,
    erc8004_identity: normalizedMission.identity.erc8004Identity,
    total_spend_usd: normalizedMission.budget.spentUsd,
    remaining_budget_usd: getRemainingBudget(normalizedMission),
    payment_count: normalizedMission.payments.length,
    payments: normalizedMission.payments.map((payment) => ({
      protocol: payment.protocol,
      merchant: payment.merchant,
      resource: payment.resource,
      amount_usd: payment.amountUsd,
      status: payment.status,
      network: payment.network,
      tx_hash: payment.txHash,
      explorer_url: payment.explorerUrl,
      block_number: payment.blockNumber,
      live: payment.live ?? false,
      verified: payment.verified ?? false,
    })),
    artifacts: normalizedMission.artifacts.map((artifact) => ({
      name: artifact.name,
      cid: artifact.cid,
      tx_hash: artifact.txHash,
      type: artifact.type,
    })),
    chain_transactions: normalizedMission.execution.chainTransactions.map((transaction) => ({
      rail: transaction.rail,
      chain: transaction.chain,
      network: transaction.network,
      action: transaction.action,
      tx_hash: transaction.txHash,
      explorer_url: transaction.explorerUrl,
      live: transaction.live,
    })),
    rail_receipts: {
      scheduled: normalizedMission.execution.scheduled.enabled
        ? {
            schedule_id: normalizedMission.execution.scheduled.scheduleId,
            cadence: normalizedMission.execution.scheduled.cadence,
            next_run_at: normalizedMission.execution.scheduled.nextRunAt,
            tx_hash: normalizedMission.execution.scheduled.txHash,
            live: normalizedMission.execution.scheduled.live,
          }
        : undefined,
      private_intent: normalizedMission.execution.privateIntent.enabled
        ? {
            label: normalizedMission.execution.privateIntent.label,
            commitment_hash: normalizedMission.execution.privateIntent.commitmentHash,
            commitment_verified:
              normalizedMission.execution.privateIntent.commitmentVerified,
            tx_hash: normalizedMission.execution.privateIntent.txHash,
            reveal_hash: normalizedMission.execution.privateIntent.revealHash,
            reveal_tx_hash: normalizedMission.execution.privateIntent.revealTxHash,
            block_number: normalizedMission.execution.privateIntent.blockNumber,
            live: normalizedMission.execution.privateIntent.live,
          }
        : undefined,
      confidential_policy: normalizedMission.execution.confidentialPolicy.enabled
        ? {
            policy_handle: normalizedMission.execution.confidentialPolicy.policyHandle,
            acl_grant_id: normalizedMission.execution.confidentialPolicy.aclGrantId,
            encrypted_fields: normalizedMission.execution.confidentialPolicy.encryptedFields,
            status: normalizedMission.execution.confidentialPolicy.status,
            live: normalizedMission.execution.confidentialPolicy.live,
          }
        : undefined,
    },
  };
}

export function buildMissionSummaryMarkdown(mission: Mission): string {
  const normalizedMission = normalizeMission(mission, createSession());
  const recommendation = normalizedMission.findings.find((finding) => finding.status === "stable");
  const totalPinned = normalizedMission.artifacts.filter((artifact) => artifact.status === "pinned").length;

  return [
    `# ${normalizedMission.title}`,
    "",
    `- Mission ID: ${normalizedMission.id}`,
    `- Status: ${normalizedMission.status}`,
    `- Execution Rail: ${EXECUTION_RAIL_LABELS[normalizedMission.execution.rail]}`,
    `- Rail Status: ${normalizedMission.execution.status}`,
    `- ERC-8004 Identity: ${normalizedMission.identity.erc8004Identity}`,
    `- Total Spend: $${normalizedMission.budget.spentUsd.toFixed(2)}`,
    `- Remaining Budget: $${getRemainingBudget(normalizedMission).toFixed(2)}`,
    `- Evidence Objects Pinned: ${totalPinned}/${normalizedMission.artifacts.length}`,
    "",
    "## Objective",
    normalizedMission.objective,
    "",
    "## Best Route",
    recommendation
      ? `${recommendation.protocol} on ${recommendation.asset} at ${recommendation.apy} with risk ${recommendation.riskScore}. ${recommendation.recommendation}`
      : "Mission still in progress; no stable route has been finalized yet.",
    "",
    "## Rail Summary",
    normalizedMission.execution.scheduled.enabled
      ? `- Flow schedule ${normalizedMission.execution.scheduled.scheduleId ?? "pending"} next runs at ${normalizedMission.execution.scheduled.nextRunAt ?? "pending"}.`
      : normalizedMission.execution.privateIntent.enabled
        ? `- Starknet commitment ${normalizedMission.execution.privateIntent.commitmentHash ?? "pending"} protects route strategy before reveal.`
        : normalizedMission.execution.confidentialPolicy.enabled
          ? `- Zama policy handle ${normalizedMission.execution.confidentialPolicy.policyHandle ?? "pending"} protects operator thresholds.`
          : "- Mission executed immediately after authorization.",
    "",
    "## Evidence",
    ...normalizedMission.artifacts.map((artifact) => `- ${artifact.name}: ${artifact.cid ?? "pending pin"}`),
  ].join("\n");
}

export function serializePretty(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export function buildNotifications(state: FrontierState): NotificationItem[] {
  const normalizedState = normalizeFrontierState(state);
  const notifications: NotificationItem[] = [];
  const openDispute = normalizedState.mission.disputes.find((dispute) => dispute.status === "open");

  if (openDispute) {
    notifications.push({
      id: openDispute.id,
      kind: "critical",
      title: openDispute.title,
      message: openDispute.description,
      timestamp: openDispute.createdAt,
      actionLabel: "Review incident",
      href: "/dispute",
    });
  }

  const pinnedArtifacts = normalizedState.mission.artifacts.filter((artifact) => artifact.status === "pinned");

  if (pinnedArtifacts.length > 0) {
    notifications.push({
      id: "notif-pinned",
      kind: "success",
      title: "Evidence bundle updated",
      message: `${pinnedArtifacts.length} artifact${pinnedArtifacts.length === 1 ? "" : "s"} now have durable Filecoin-backed references.`,
      timestamp: normalizedState.lastUpdatedAt,
      actionLabel: "Open receipts",
      href: "/receipts",
    });
  }

  if (normalizedState.mission.execution.scheduled.enabled) {
    notifications.push({
      id: "notif-flow-schedule",
      kind: "info",
      title: "Scheduled mission armed",
      message: `Flow will execute the next mission cycle at ${new Date(
        normalizedState.mission.execution.scheduled.nextRunAt ?? normalizedState.lastUpdatedAt,
      ).toLocaleString()}.`,
      timestamp: normalizedState.lastUpdatedAt,
      actionLabel: "Open board",
      href: "/mission/overview",
    });
  }

  if (normalizedState.mission.execution.privateIntent.enabled) {
    notifications.push({
      id: "notif-private-intent",
      kind: "info",
      title: "Private intent committed",
      message: "Route strategy is sealed on Starknet until the mission reaches reveal time.",
      timestamp: normalizedState.lastUpdatedAt,
      actionLabel: "Verify receipt",
      href: "/receipts/verify",
    });
  }

  if (normalizedState.mission.execution.confidentialPolicy.enabled) {
    notifications.push({
      id: "notif-confidential-policy",
      kind:
        normalizedState.mission.execution.confidentialPolicy.status === "blocked" ? "critical" : "info",
      title: "Confidential policy vault active",
      message: normalizedState.mission.execution.confidentialPolicy.summary,
      timestamp:
        normalizedState.mission.execution.confidentialPolicy.lastEvaluatedAt ?? normalizedState.lastUpdatedAt,
      actionLabel: "Open policy vault",
      href: "/mission/policies",
    });
  }

  notifications.push({
    id: "notif-session",
    kind: normalizedState.session.networkStatus === "active" ? "info" : "critical",
    title: normalizedState.session.networkStatus === "active" ? "Passkey session active" : "Passkey session expired",
    message:
      normalizedState.session.networkStatus === "active"
        ? `Operator session bound to ${normalizedState.session.passkeyLabel}.`
        : "Re-authentication required before the next irreversible action.",
    timestamp: normalizedState.session.lastAuthenticatedAt,
    actionLabel: normalizedState.session.networkStatus === "active" ? "Open launch" : "Re-authenticate",
    href: normalizedState.session.networkStatus === "active" ? "/mission/launch" : "/login",
  });

  return notifications;
}

export function createViolation(mission: Mission): MissionDispute {
  return {
    id: createId("INC"),
    title: "Policy threshold exceeded",
    severity: "high",
    status: "open",
    createdAt: new Date().toISOString(),
    violatedPolicy: "Per-transaction spend cap",
    description: `Requested spend would exceed the mission cap of $${mission.budget.perTxCapUsd.toFixed(2)} without manual approval.`,
    recommendedAction: "Override policy, retry with a lower cap, or revoke the mission.",
  };
}
