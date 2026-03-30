export type StageKey =
  | "authorize"
  | "register"
  | "discover"
  | "plan"
  | "execute"
  | "verify"
  | "finalize";

export type StageStatus = "pending" | "active" | "completed" | "blocked";
export type MissionStatus = "draft" | "running" | "blocked" | "verified" | "completed";
export type TaskStatus = "planned" | "in_progress" | "awaiting_verification" | "completed" | "blocked";
export type EvidenceStatus = "draft" | "pinned";
export type NotificationKind = "critical" | "info" | "success";
export type ExecutionRail = "immediate" | "scheduled" | "private" | "confidential";
export type FlowCadence = "once" | "hourly" | "daily" | "weekly";
export type RetryPolicy = "manual" | "retry-once" | "retry-thrice";

export interface FrontierSession {
  authenticated: boolean;
  operatorName: string;
  operatorWallet: string;
  passkeyCredentialId: string;
  passkeyLabel: string;
  passkeyKeyHash?: string;
  vaultAddress?: string;
  sessionId?: string;
  credentialCount?: number;
  lastAuthenticatedAt: string;
  expiresAt: string;
  networkStatus: "active" | "expired";
}

export interface MissionStage {
  key: StageKey;
  label: string;
  status: StageStatus;
  summary: string;
  startedAt?: string;
  completedAt?: string;
}

export interface MissionBudget {
  totalUsd: number;
  perTxCapUsd: number;
  spentUsd: number;
  expiryHours: number;
}

export interface MissionPolicy {
  allowedTools: string[];
  allowedChains: string[];
  allowedCounterparties: string[];
  escalationThresholdPct: number;
  minTrustScore: number;
  requireManualEscalation: boolean;
}

export interface ScheduledExecution {
  enabled: boolean;
  cadence: FlowCadence;
  scheduledFor?: string;
  nextRunAt?: string;
  retryPolicy: RetryPolicy;
  status: "idle" | "scheduled" | "queued" | "running" | "completed" | "failed";
  scheduleId?: string;
  txHash?: string;
  explorerUrl?: string;
  handlerAddress?: string;
  network?: string;
  live: boolean;
}

export interface PrivateIntent {
  enabled: boolean;
  label: string;
  commitmentHash?: string;
  commitmentVerified?: boolean;
  nullifier?: string;
  revealWindowHours: number;
  status: "idle" | "committed" | "revealed" | "settled";
  txHash?: string;
  revealHash?: string;
  revealTxHash?: string;
  explorerUrl?: string;
  network?: string;
  live: boolean;
  blockNumber?: number;
}

export interface ConfidentialPolicy {
  enabled: boolean;
  encryptedFields: string[];
  policyHandle?: string;
  aclGrantId?: string;
  evaluatorAddress?: string;
  status: "idle" | "encrypted" | "allowed" | "blocked";
  summary: string;
  lastEvaluatedAt?: string;
  network?: string;
  live: boolean;
  encryptedValues: {
    maxSpendUsd?: string;
    minTrustScore?: string;
    allowedCounterparties?: string[];
    emergencyStop?: string;
  };
}

export interface ChainTransaction {
  id: string;
  rail: ExecutionRail;
  chain: string;
  network: string;
  action: string;
  status: "prepared" | "confirmed" | "revealed" | "completed";
  txHash: string;
  explorerUrl?: string;
  live: boolean;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface MissionExecution {
  rail: ExecutionRail;
  status: "ready" | "preparing" | "scheduled" | "queued" | "committed" | "confidential" | "executing" | "verified" | "completed" | "blocked";
  selectorLabel: string;
  scheduled: ScheduledExecution;
  privateIntent: PrivateIntent;
  confidentialPolicy: ConfidentialPolicy;
  chainTransactions: ChainTransaction[];
}

export interface AgentIdentity {
  agentName: string;
  manifestName: string;
  agentId: string;
  erc8004Identity: string;
  operatorWallet: string;
  registry: string;
  network: string;
  registrationTxHash: string;
  feedbackTxHash?: string;
  trustScore: number;
  trustDelta: number;
}

export interface MissionAgent {
  id: string;
  name: string;
  role: "planner" | "specialist" | "auditor";
  status: "idle" | "active" | "ready";
}

export interface MissionTask {
  id: string;
  title: string;
  description: string;
  owner: string;
  type: "discovery" | "analysis" | "payment" | "verification" | "finalize";
  counterparty?: string;
  costUsd: number;
  status: TaskStatus;
  result?: string;
}

export interface MemoryRecord {
  id: string;
  type: "plan" | "task" | "research" | "handoff" | "summary";
  title: string;
  summary: string;
  owner: string;
  createdAt: string;
  cid?: string;
  content: unknown;
}

export interface PaymentEvent {
  id: string;
  protocol: "x402" | "flow" | "starknet" | "zama";
  merchant: string;
  resource: string;
  amountUsd: number;
  status: "challenged" | "authorized" | "settled" | "blocked";
  challengeId?: string;
  network: string;
  counterpartyTrust: number;
  txHash?: string;
  explorerUrl?: string;
  blockNumber?: number;
  live?: boolean;
  verified?: boolean;
  createdAt: string;
}

export interface MissionFinding {
  asset: string;
  protocol: string;
  apy: string;
  riskScore: number;
  liquidity: string;
  status: "stable" | "caution" | "blocked";
  recommendation: string;
}

export interface LogEvent {
  id: string;
  timestamp: string;
  level: "info" | "success" | "warning" | "error";
  actor: "system" | "operator" | "planner" | "specialist" | "auditor" | "policy" | "payment" | "storage" | "trust";
  stage: StageKey;
  title: string;
  message: string;
  code?: string;
  tags?: string[];
  detail?: Record<string, unknown>;
}

export interface EvidenceArtifact {
  id: string;
  name: string;
  type: "manifest" | "log" | "summary" | "receipt" | "memory" | "feedback" | "scheduled" | "private" | "confidential";
  description: string;
  route: string;
  sizeLabel: string;
  status: EvidenceStatus;
  cid?: string;
  txHash?: string;
  pinnedAt?: string;
}

export interface MissionDispute {
  id: string;
  title: string;
  severity: "low" | "medium" | "high";
  status: "open" | "resolved" | "dismissed";
  createdAt: string;
  violatedPolicy: string;
  description: string;
  recommendedAction: string;
  resolution?: string;
}

export interface ReputationSubmission {
  rating: number;
  notes: string;
  submittedAt: string;
  txHash?: string;
}

export interface Mission {
  id: string;
  title: string;
  objective: string;
  template: string;
  createdAt: string;
  updatedAt: string;
  status: MissionStatus;
  activeStage: StageKey;
  stages: MissionStage[];
  budget: MissionBudget;
  policy: MissionPolicy;
  execution: MissionExecution;
  identity: AgentIdentity;
  agents: MissionAgent[];
  tasks: MissionTask[];
  memory: MemoryRecord[];
  payments: PaymentEvent[];
  logs: LogEvent[];
  artifacts: EvidenceArtifact[];
  findings: MissionFinding[];
  disputes: MissionDispute[];
  reputation: ReputationSubmission;
}

export interface NotificationItem {
  id: string;
  kind: NotificationKind;
  title: string;
  message: string;
  timestamp: string;
  actionLabel?: string;
  href?: string;
}

export interface FrontierState {
  session: FrontierSession;
  mission: Mission;
  loading: boolean;
  error?: string;
  lastUpdatedAt: string;
}

export interface MissionLaunchInput {
  title: string;
  objective: string;
  template: string;
  executionRail: ExecutionRail;
  totalUsd: number;
  perTxCapUsd: number;
  expiryHours: number;
  allowedTools: string[];
  allowedChains: string[];
  allowedCounterparties: string[];
  escalationThresholdPct: number;
  minTrustScore: number;
  requireManualEscalation: boolean;
  scheduleCadence: FlowCadence;
  scheduleAt?: string;
  retryPolicy: RetryPolicy;
  privateIntentLabel: string;
  privateRevealWindowHours: number;
  confidentialMaxSpendUsd?: number;
  confidentialMinTrustScore?: number;
  confidentialCounterparties: string[];
  confidentialEmergencyStop: boolean;
}

export interface ManifestDocument {
  agent_name: string;
  operator_wallet: string;
  erc8004_identity: string;
  mission_id: string;
  execution_rail: ExecutionRail;
  supported_tools: string[];
  supported_chains: string[];
  task_categories: string[];
  compute_constraints: {
    max_budget_usd: number;
    per_tx_cap_usd: number;
    expiry_hours: number;
  };
  policy_bounds: {
    min_counterparty_trust: number;
    escalation_threshold_pct: number;
    require_manual_escalation: boolean;
    allowlisted_counterparties: string[];
  };
  rail_configuration: {
    scheduled?: {
      cadence: FlowCadence;
      scheduled_for?: string;
      retry_policy: RetryPolicy;
    };
    private_intent?: {
      label: string;
      reveal_window_hours: number;
    };
    confidential_policy?: {
      encrypted_fields: string[];
      summary: string;
    };
  };
}

export interface AgentLogDocument {
  mission_id: string;
  status: MissionStatus;
  active_stage: StageKey;
  generated_at: string;
  events: Array<{
    id: string;
    timestamp: string;
    actor: LogEvent["actor"];
    level: LogEvent["level"];
    stage: StageKey;
    title: string;
    message: string;
    detail?: Record<string, unknown>;
  }>;
}

export interface ReceiptDocument {
  mission_id: string;
  title: string;
  objective: string;
  status: MissionStatus;
  execution_rail: ExecutionRail;
  execution_status: MissionExecution["status"];
  operator_wallet: string;
  erc8004_identity: string;
  total_spend_usd: number;
  remaining_budget_usd: number;
  payment_count: number;
  payments: Array<{
    protocol: PaymentEvent["protocol"];
    merchant: string;
    resource: string;
    amount_usd: number;
    status: PaymentEvent["status"];
    network: string;
    tx_hash?: string;
    explorer_url?: string;
    block_number?: number;
    live: boolean;
    verified: boolean;
  }>;
  artifacts: Array<{
    name: string;
    cid?: string;
      tx_hash?: string;
      type: EvidenceArtifact["type"];
  }>;
  chain_transactions: Array<{
    rail: ExecutionRail;
    chain: string;
    network: string;
    action: string;
    tx_hash: string;
    explorer_url?: string;
    live: boolean;
  }>;
  rail_receipts: {
    scheduled?: {
      schedule_id?: string;
      cadence: FlowCadence;
      next_run_at?: string;
      tx_hash?: string;
      live: boolean;
    };
    private_intent?: {
      label: string;
      commitment_hash?: string;
      commitment_verified?: boolean;
      tx_hash?: string;
      reveal_hash?: string;
      reveal_tx_hash?: string;
      block_number?: number;
      live: boolean;
    };
    confidential_policy?: {
      policy_handle?: string;
      acl_grant_id?: string;
      encrypted_fields: string[];
      status: ConfidentialPolicy["status"];
      live: boolean;
    };
  };
}
