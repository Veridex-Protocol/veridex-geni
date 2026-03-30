"use client";

import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { useFrontierAuth } from "@/components/frontierguard/auth-provider";
import { copyText, downloadText } from "@/lib/frontierguard/browser";
import {
  buildAgentLogDocument,
  buildManifestDocument,
  buildMissionSummaryMarkdown,
  buildNotifications,
  buildReceiptDocument,
  createDefaultState,
  EXECUTION_RAIL_LABELS,
  createLaunchInputFromMission,
  createMissionFromInput,
  createViolation,
  getRemainingBudget,
  normalizeFrontierState,
  serializePretty,
  STAGE_ORDER,
  updateStageStatus,
} from "@/lib/frontierguard/mock";
import type {
  ChainTransaction,
  EvidenceArtifact,
  FrontierState,
  LogEvent,
  MemoryRecord,
  Mission,
  MissionDispute,
  MissionLaunchInput,
  NotificationItem,
  PaymentEvent,
  StageKey,
} from "@/lib/frontierguard/types";

const STORAGE_KEY = "veridex-frontierguard-state-v1";

interface RegisterResponse {
  agentId: string;
  erc8004Identity: string;
  network: string;
  registry: string;
  registrationTxHash: string;
  explorerUrl: string;
  trustScore: number;
}

interface FeedbackResponse {
  txHash: string;
  updatedScore: number;
  delta: number;
}

interface MemoryResponse {
  cid: string;
  ucanDelegation: string;
}

interface PinResponse {
  cid: string;
  txHash: string;
  network: string;
  provider?: string;
  uri?: string;
  live?: boolean;
}

interface FlowScheduleResponse {
  scheduleId: string;
  cadence: MissionLaunchInput["scheduleCadence"];
  scheduledFor?: string;
  nextRunAt?: string;
  txHash: string;
  explorerUrl?: string;
  handlerAddress?: string;
  network: string;
  status: "scheduled" | "queued";
  live: boolean;
}

interface FlowStatusResponse {
  scheduleId: string;
  status: "scheduled" | "queued";
  nextRunAt?: string;
  network: string;
  live: boolean;
}

interface StarknetIntentResponse {
  commitmentHash: string;
  nullifier: string;
  txHash: string;
  explorerUrl?: string;
  network: string;
  status: "committed";
  live: boolean;
  blockNumber?: number;
  commitmentVerified?: boolean;
}

interface StarknetRevealResponse {
  revealHash: string;
  revealTxHash: string;
  explorerUrl?: string;
  network: string;
  status: "revealed";
  live: boolean;
  blockNumber?: number;
}

interface ZamaEncryptResponse {
  policyHandle: string;
  aclGrantId: string;
  encryptedFields: string[];
  encryptedValues: {
    maxSpendUsd?: string;
    minTrustScore?: string;
    allowedCounterparties?: string[];
    emergencyStop?: string;
  };
  evaluatorAddress?: string;
  txHash: string;
  network: string;
  status: "encrypted";
  live: boolean;
}

interface ZamaEvaluateResponse {
  allowed: boolean;
  reason: string;
  status: "allowed" | "blocked";
  evaluatedAt: string;
  txHash: string;
  network: string;
  live: boolean;
}

interface ChallengeResponse {
  protocol: "x402";
  merchant: string;
  resource: string;
  challengeId: string;
  amountUsd: number;
  network: string;
  recipient?: string;
  counterpartyTrust: number;
  paymentRequired: true;
}

interface ServiceResponse {
  protocol: "x402";
  settled: true;
  merchant: string;
  paymentTxHash: string;
  paymentExplorerUrl?: string;
  paymentBlockNumber?: number;
  paymentVerified?: boolean;
  live?: boolean;
  proofLevel?: "verified_onchain" | "live_unverified" | "demo";
  proofSummary?: string;
  model?: string;
  modelVersion?: string;
  grounded?: boolean;
  generatedAt?: string;
  researchQuery?: string;
  researchSummary?: string;
  searchQueries?: string[];
  sources?: Array<{
    title: string;
    url: string;
  }>;
  data: Array<{
    asset: string;
    protocol: string;
    apy: string;
    riskScore: number;
    liquidity: string;
    trustScore: number;
    rationale?: string;
    sourceUrls?: string[];
  }>;
}

interface FrontierGuardContextValue {
  state: FrontierState;
  mission: Mission;
  launchDefaults: MissionLaunchInput;
  notifications: NotificationItem[];
  manifestText: string;
  logText: string;
  summaryText: string;
  receiptText: string;
  openDispute?: MissionDispute;
  remainingBudgetUsd: number;
  progressPct: number;
  authenticatePasskey: () => Promise<void>;
  launchMission: (input: MissionLaunchInput) => Promise<void>;
  advanceMission: () => Promise<void>;
  runAutopilot: () => Promise<void>;
  simulateViolation: () => Promise<void>;
  resolveDispute: (strategy: "dismiss" | "override" | "retry") => Promise<void>;
  submitReputation: (rating: number, notes: string) => Promise<void>;
  exportArtifact: (kind: EvidenceArtifact["type"] | "manifest_text" | "log_text" | "summary_text" | "receipt_text") => void;
  copyArtifact: (kind: "manifest" | "log" | "summary" | "receipt") => Promise<void>;
  resetDemo: () => void;
}

const FrontierGuardContext = createContext<FrontierGuardContextValue | null>(null);

function createLog(
  stage: StageKey,
  actor: LogEvent["actor"],
  level: LogEvent["level"],
  title: string,
  message: string,
  detail?: Record<string, unknown>,
  tags?: string[],
): LogEvent {
  return {
    id: `${stage}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    stage,
    actor,
    level,
    title,
    message,
    detail,
    tags,
  };
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw new Error(json.error ?? `Request failed for ${url}`);
  }

  return json;
}

function updateArtifact(
  mission: Mission,
  type: EvidenceArtifact["type"],
  patch: Partial<EvidenceArtifact>,
): EvidenceArtifact[] {
  return mission.artifacts.map((artifact) =>
    artifact.type === type
      ? {
          ...artifact,
          ...patch,
        }
      : artifact,
  );
}

function appendMemory(mission: Mission, record: MemoryRecord): MemoryRecord[] {
  return [record, ...mission.memory];
}

function appendPayment(mission: Mission, payment: PaymentEvent): PaymentEvent[] {
  return [payment, ...mission.payments];
}

function appendChainTransaction(mission: Mission, transaction: ChainTransaction): ChainTransaction[] {
  return [transaction, ...mission.execution.chainTransactions];
}

function appendLogs(mission: Mission, entries: LogEvent[]): LogEvent[] {
  return [...mission.logs, ...entries];
}

function setMissionUpdated(mission: Mission): Mission {
  return {
    ...mission,
    updatedAt: new Date().toISOString(),
  };
}

function getCompletedStages(mission: Mission): StageKey[] {
  return mission.stages.filter((stage) => stage.status === "completed").map((stage) => stage.key);
}

function progressFromMission(mission: Mission): number {
  const completed = mission.stages.filter((stage) => stage.status === "completed").length;
  const activeBonus = mission.status === "completed" ? 1 : 0;
  return Math.round(((completed + activeBonus) / STAGE_ORDER.length) * 100);
}

export function FrontierGuardProvider({ children }: { children: ReactNode }) {
  const auth = useFrontierAuth();
  const pathname = usePathname();
  const [state, setState] = useState<FrontierState>(createDefaultState());
  const [hydrated, setHydrated] = useState(false);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    let nextState = createDefaultState();

    if (raw) {
      try {
        nextState = normalizeFrontierState(JSON.parse(raw) as FrontierState);
      } catch {
        nextState = createDefaultState();
      }
    }

    const frame = window.requestAnimationFrame(() => {
      setState(nextState);
      setHydrated(true);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [hydrated, state]);

  useEffect(() => {
    if (!hydrated || !auth.ready) {
      return;
    }

    startTransition(() => {
      setState((current) => {
        if (!auth.session) {
          if (!current.session.authenticated && current.session.networkStatus === "expired") {
            return current;
          }

          return {
            ...current,
            session: {
              ...current.session,
              authenticated: false,
              operatorName: "Frontier Operator",
              operatorWallet: "passkey-required",
              passkeyCredentialId: "",
              passkeyLabel: "Passkey Required",
              passkeyKeyHash: undefined,
              vaultAddress: undefined,
              sessionId: undefined,
              credentialCount: auth.storedProfiles.length,
              networkStatus: "expired",
            },
          };
        }

        if (
          current.session.passkeyCredentialId === auth.session.passkeyCredentialId &&
          current.session.lastAuthenticatedAt === auth.session.lastAuthenticatedAt &&
          current.session.sessionId === auth.session.sessionId &&
          current.session.credentialCount === auth.session.credentialCount
        ) {
          return current;
        }

        return {
          ...current,
          session: {
            ...current.session,
            ...auth.session,
          },
        };
      });
    });
  }, [auth.ready, auth.session, auth.storedProfiles.length, hydrated]);

  useEffect(() => {
    if (!hydrated || pathname.startsWith("/login")) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void fetch("/api/frontier/state", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({ state }),
      }).catch(() => undefined);
    }, 600);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [hydrated, pathname, state]);

  const normalizedState = normalizeFrontierState(state);
  const mission = normalizedState.mission;
  const manifestText = serializePretty(buildManifestDocument(mission));
  const logText = serializePretty(buildAgentLogDocument(mission));
  const summaryText = buildMissionSummaryMarkdown(mission);
  const receiptText = serializePretty(buildReceiptDocument(mission));

  async function authenticatePasskey(): Promise<void> {
    const session = await auth.signInWithPasskey();
    const now = session.lastAuthenticatedAt;

    setState((current) => ({
      ...current,
      session: {
        ...current.session,
        ...session,
      },
      mission: setMissionUpdated({
        ...current.mission,
        logs: appendLogs(current.mission, [
          createLog(
            "authorize",
            "operator",
            "success",
            "Passkey re-authenticated",
            "Operator refreshed the passkey session before the next irreversible action.",
            { passkeyLabel: session.passkeyLabel },
            ["passkey", "session"],
          ),
        ]),
      }),
      lastUpdatedAt: now,
      error: undefined,
    }));
  }

  async function launchMission(input: MissionLaunchInput): Promise<void> {
    const current = stateRef.current;
    if (!current.session.authenticated || !current.session.passkeyCredentialId) {
      setState({
        ...current,
        error: "Authenticate with a passkey before launching a mission.",
      });
      throw new Error("Authenticate with a passkey before launching a mission.");
    }

    const workingSession = current.session;
    const missionDraft = createMissionFromInput(workingSession, input);

    setState({
      ...current,
      loading: true,
      error: undefined,
      session: workingSession,
      mission: missionDraft,
      lastUpdatedAt: new Date().toISOString(),
    });

    try {
      const registration = await postJson<RegisterResponse>("/api/frontier/erc8004/register", {
        missionId: missionDraft.id,
        agentName: missionDraft.identity.agentName,
        operatorWallet: workingSession.operatorWallet,
        supportedTools: input.allowedTools,
      });

      let missionAfterRegister: Mission = {
        ...missionDraft,
        activeStage: "discover",
        identity: {
          ...missionDraft.identity,
          agentId: registration.agentId,
          erc8004Identity: registration.erc8004Identity,
          network: registration.network,
          registry: registration.registry,
          registrationTxHash: registration.registrationTxHash,
          trustScore: registration.trustScore,
        },
        stages: updateStageStatus(missionDraft, "discover", ["authorize", "register"]),
        logs: appendLogs(missionDraft, [
          createLog(
            "register",
            "trust",
            "success",
            "ERC-8004 registration confirmed",
            "Agent identity registered and ready for bounded execution.",
            { txHash: registration.registrationTxHash, identity: registration.erc8004Identity },
            ["erc-8004", "identity"],
          ),
        ]),
      };

      const manifestPin = await postJson<PinResponse>("/api/frontier/filecoin/pin", {
        missionId: missionAfterRegister.id,
        artifact: "agent.json",
        payload: buildManifestDocument(missionAfterRegister),
      });

      missionAfterRegister = {
        ...missionAfterRegister,
        artifacts: updateArtifact(missionAfterRegister, "manifest", {
          status: "pinned",
          cid: manifestPin.cid,
          txHash: manifestPin.txHash,
          pinnedAt: new Date().toISOString(),
        }),
        logs: appendLogs(missionAfterRegister, [
          createLog(
            "register",
            "storage",
            "success",
            "Manifest pinned",
            "agent.json pinned to Filecoin Pin after ERC-8004 registration.",
            { cid: manifestPin.cid, txHash: manifestPin.txHash },
            ["filecoin", "manifest"],
          ),
        ]),
      };

      if (input.executionRail === "scheduled") {
        const schedule = await postJson<FlowScheduleResponse>("/api/frontier/flow/schedule", {
          missionId: missionAfterRegister.id,
          title: missionAfterRegister.title,
          objective: missionAfterRegister.objective,
          cadence: input.scheduleCadence,
          scheduledFor: input.scheduleAt,
          retryPolicy: input.retryPolicy,
          operatorWallet: workingSession.operatorWallet,
        });

        missionAfterRegister = {
          ...missionAfterRegister,
          execution: {
            ...missionAfterRegister.execution,
            rail: "scheduled",
            status: schedule.status,
            selectorLabel: EXECUTION_RAIL_LABELS.scheduled,
            scheduled: {
              ...missionAfterRegister.execution.scheduled,
              enabled: true,
              cadence: schedule.cadence,
              scheduledFor: schedule.scheduledFor,
              nextRunAt: schedule.nextRunAt,
              retryPolicy: input.retryPolicy,
              status: schedule.status,
              scheduleId: schedule.scheduleId,
              txHash: schedule.txHash,
              explorerUrl: schedule.explorerUrl,
              handlerAddress: schedule.handlerAddress,
              network: schedule.network,
              live: schedule.live,
            },
            chainTransactions: appendChainTransaction(missionAfterRegister, {
              id: `CHAIN-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
              rail: "scheduled",
              chain: "Flow",
              network: schedule.network,
              action: "schedule_mission",
              status: "confirmed",
              txHash: schedule.txHash,
              explorerUrl: schedule.explorerUrl,
              live: schedule.live,
              createdAt: new Date().toISOString(),
              metadata: {
                scheduleId: schedule.scheduleId,
                cadence: schedule.cadence,
              },
            }),
          },
          artifacts: updateArtifact(missionAfterRegister, "scheduled", {
            status: "pinned",
            txHash: schedule.txHash,
            pinnedAt: new Date().toISOString(),
          }),
          logs: appendLogs(missionAfterRegister, [
            createLog(
              "register",
              "system",
              "success",
              "Flow schedule armed",
              "Mission was scheduled on the Flow rail with a retry-aware cadence handler.",
              {
                scheduleId: schedule.scheduleId,
                cadence: schedule.cadence,
                nextRunAt: schedule.nextRunAt,
              },
              ["flow", "scheduled"],
            ),
          ]),
        };
      } else if (input.executionRail === "private") {
        const intent = await postJson<StarknetIntentResponse>("/api/frontier/starknet/intent", {
          missionId: missionAfterRegister.id,
          label: input.privateIntentLabel,
          objective: missionAfterRegister.objective,
          revealWindowHours: input.privateRevealWindowHours,
          operatorWallet: workingSession.operatorWallet,
        });

        missionAfterRegister = {
          ...missionAfterRegister,
          execution: {
            ...missionAfterRegister.execution,
            rail: "private",
            status: "committed",
            selectorLabel: EXECUTION_RAIL_LABELS.private,
            privateIntent: {
              ...missionAfterRegister.execution.privateIntent,
              enabled: true,
              label: input.privateIntentLabel,
              commitmentHash: intent.commitmentHash,
              nullifier: intent.nullifier,
              revealWindowHours: input.privateRevealWindowHours,
              status: intent.status,
              txHash: intent.txHash,
              explorerUrl: intent.explorerUrl,
              network: intent.network,
              live: intent.live,
              blockNumber: intent.blockNumber,
              commitmentVerified: intent.commitmentVerified,
            },
            chainTransactions: appendChainTransaction(missionAfterRegister, {
              id: `CHAIN-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
              rail: "private",
              chain: "Starknet",
              network: intent.network,
              action: "commit_private_intent",
              status: "confirmed",
              txHash: intent.txHash,
              explorerUrl: intent.explorerUrl,
              live: intent.live,
              createdAt: new Date().toISOString(),
              metadata: {
                commitmentHash: intent.commitmentHash,
                blockNumber: intent.blockNumber,
                commitmentVerified: intent.commitmentVerified,
              },
            }),
          },
          artifacts: updateArtifact(missionAfterRegister, "private", {
            status: "pinned",
            txHash: intent.txHash,
            pinnedAt: new Date().toISOString(),
          }),
          logs: appendLogs(missionAfterRegister, [
            createLog(
              "register",
              "system",
              "success",
              "Starknet private intent committed",
              "Mission route preferences were sealed before execution and will reveal later with the receipt bundle.",
              {
                commitmentHash: intent.commitmentHash,
                txHash: intent.txHash,
                blockNumber: intent.blockNumber,
                commitmentVerified: intent.commitmentVerified,
              },
              ["starknet", "private-intent"],
            ),
          ]),
        };
      } else if (input.executionRail === "confidential") {
        const encrypted = await postJson<ZamaEncryptResponse>("/api/frontier/zama/policy/encrypt", {
          missionId: missionAfterRegister.id,
          operatorWallet: workingSession.operatorWallet,
          maxSpendUsd: input.confidentialMaxSpendUsd,
          minTrustScore: input.confidentialMinTrustScore,
          allowedCounterparties: input.confidentialCounterparties,
          emergencyStop: input.confidentialEmergencyStop,
        });

        missionAfterRegister = {
          ...missionAfterRegister,
          execution: {
            ...missionAfterRegister.execution,
            rail: "confidential",
            status: "confidential",
            selectorLabel: EXECUTION_RAIL_LABELS.confidential,
            confidentialPolicy: {
              ...missionAfterRegister.execution.confidentialPolicy,
              enabled: true,
              encryptedFields: encrypted.encryptedFields,
              policyHandle: encrypted.policyHandle,
              aclGrantId: encrypted.aclGrantId,
              evaluatorAddress: encrypted.evaluatorAddress,
              status: encrypted.status,
              summary: "Budget ceiling, trust threshold, allowlist, and emergency stop are encrypted.",
              network: encrypted.network,
              live: encrypted.live,
              encryptedValues: encrypted.encryptedValues,
            },
            chainTransactions: appendChainTransaction(missionAfterRegister, {
              id: `CHAIN-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
              rail: "confidential",
              chain: "fhEVM",
              network: encrypted.network,
              action: "encrypt_confidential_policy",
              status: "confirmed",
              txHash: encrypted.txHash,
              live: encrypted.live,
              createdAt: new Date().toISOString(),
              metadata: {
                policyHandle: encrypted.policyHandle,
                aclGrantId: encrypted.aclGrantId,
              },
            }),
          },
          artifacts: updateArtifact(missionAfterRegister, "confidential", {
            status: "pinned",
            txHash: encrypted.txHash,
            pinnedAt: new Date().toISOString(),
          }),
          logs: appendLogs(missionAfterRegister, [
            createLog(
              "register",
              "policy",
              "success",
              "Confidential policy vault provisioned",
              "Encrypted thresholds were staged in the Zama rail and linked to the mission policy vault.",
              {
                policyHandle: encrypted.policyHandle,
                aclGrantId: encrypted.aclGrantId,
              },
              ["zama", "confidential-policy"],
            ),
          ]),
        };
      }

      setState({
        ...current,
        loading: false,
        error: undefined,
        session: {
          ...workingSession,
          authenticated: true,
          networkStatus: "active",
          lastAuthenticatedAt: new Date().toISOString(),
        },
        mission: setMissionUpdated(missionAfterRegister),
        lastUpdatedAt: new Date().toISOString(),
      });
    } catch (error) {
      setState({
        ...current,
        loading: false,
        error: error instanceof Error ? error.message : "Failed to launch mission.",
      });
    }
  }

  async function advanceMission(): Promise<void> {
    const current = stateRef.current;
    const missionSnapshot = current.mission;

    if (current.loading || missionSnapshot.status === "completed") {
      return;
    }

    setState({ ...current, loading: true, error: undefined });

    try {
      let missionNext = missionSnapshot;
      const completed = getCompletedStages(missionSnapshot);

      if (missionSnapshot.activeStage === "discover") {
        const shortlist = {
          providers: [
            { name: "Veridex Risk Oracle", trustScore: 96.4 },
            { name: "Aave V3", trustScore: 94.1 },
            { name: "Compound V3", trustScore: 91.8 },
          ],
        };

        const memoryResult = await postJson<MemoryResponse>("/api/frontier/storacha/memory", {
          missionId: missionSnapshot.id,
          type: "discovery",
          payload: shortlist,
        });

        missionNext = setMissionUpdated({
          ...missionSnapshot,
          activeStage: "plan",
          stages: updateStageStatus(missionSnapshot, "plan", [...completed, "discover"]),
          memory: appendMemory(missionSnapshot, {
            id: `MEM-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
            type: "research",
            title: "Service shortlist",
            summary: "Planner shortlisted trusted counterparties and stored the ranking in shared memory.",
            owner: "Planner Alpha",
            createdAt: new Date().toISOString(),
            cid: memoryResult.cid,
            content: shortlist,
          }),
          logs: appendLogs(missionSnapshot, [
            createLog(
              "discover",
              "planner",
              "info",
              "Trusted counterparties discovered",
              "Planner ranked counterparties by trust score and wrote the shortlist to Storacha memory.",
              { cid: memoryResult.cid },
              ["storacha", "discovery"],
            ),
          ]),
        });
      } else if (missionSnapshot.activeStage === "plan") {
        const taskPlan = {
          tasks: [
            "Purchase premium market data",
            "Normalize yield and risk metrics",
            "Audit route recommendation",
          ],
        };
        const memoryResult = await postJson<MemoryResponse>("/api/frontier/storacha/memory", {
          missionId: missionSnapshot.id,
          type: "plan",
          payload: taskPlan,
        });
        const flowStatus =
          missionSnapshot.execution.scheduled.enabled &&
          missionSnapshot.execution.scheduled.scheduleId
            ? await postJson<FlowStatusResponse>("/api/frontier/flow/status", {
                missionId: missionSnapshot.id,
                scheduleId: missionSnapshot.execution.scheduled.scheduleId,
                operatorWallet: current.session.operatorWallet,
              })
            : null;

        missionNext = setMissionUpdated({
          ...missionSnapshot,
          activeStage: "execute",
          execution: {
            ...missionSnapshot.execution,
            status:
              missionSnapshot.execution.rail === "scheduled"
                ? flowStatus?.status ?? missionSnapshot.execution.status
                : missionSnapshot.execution.rail === "private"
                  ? "committed"
                  : missionSnapshot.execution.rail === "confidential"
                    ? "confidential"
                    : "executing",
            scheduled: flowStatus
              ? {
                  ...missionSnapshot.execution.scheduled,
                  status: flowStatus.status,
                  nextRunAt: flowStatus.nextRunAt,
                  network: flowStatus.network,
                  live: flowStatus.live,
                }
              : missionSnapshot.execution.scheduled,
          },
          stages: updateStageStatus(missionSnapshot, "execute", [...completed, "plan"]),
          tasks: [
            {
              id: `TASK-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
              title: "Purchase premium yield dataset",
              description: "Request premium market data via x402 challenge-response flow.",
              owner: "Frontier Research Specialist",
              type: "payment",
              counterparty: "Veridex Risk Oracle",
              costUsd: 4.2,
              status: "in_progress",
            },
            {
              id: `TASK-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
              title: "Rank safe routes across policies",
              description: "Normalize APY, trust, and liquidity for treasury-safe recommendations.",
              owner: "Planner Alpha",
              type: "analysis",
              costUsd: 0,
              status: "planned",
            },
            {
              id: `TASK-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
              title: "Prepare final audit note",
              description: "Auditor checks conformance and prepares receipt metadata.",
              owner: "Auditor Delta",
              type: "verification",
              costUsd: 0,
              status: "awaiting_verification",
            },
          ],
          memory: appendMemory(missionSnapshot, {
            id: `MEM-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
            type: "plan",
            title: "Execution plan committed",
            summary: "Planner decomposed mission into paid access, route analysis, and audit tasks.",
            owner: "Planner Alpha",
            createdAt: new Date().toISOString(),
            cid: memoryResult.cid,
            content: taskPlan,
          }),
          logs: appendLogs(missionSnapshot, [
            createLog(
              "plan",
              "planner",
              "info",
              "Mission decomposition complete",
              "Planner created specialist and auditor tasks and synced the plan to shared memory.",
              { cid: memoryResult.cid },
              ["planning", "taskboard"],
            ),
            ...(flowStatus
              ? [
                  createLog(
                    "plan",
                    "system",
                    "info",
                    "Flow schedule refreshed",
                    "Execution board refreshed the scheduled rail before entering runtime.",
                    {
                      nextRunAt: flowStatus.nextRunAt,
                      status: flowStatus.status,
                    },
                    ["flow", "schedule-status"],
                  ),
                ]
              : []),
          ]),
        });
      } else if (missionSnapshot.activeStage === "execute") {
        let confidentialEvaluation: ZamaEvaluateResponse | null = null;

        if (missionSnapshot.execution.confidentialPolicy.enabled) {
          confidentialEvaluation = await postJson<ZamaEvaluateResponse>(
            "/api/frontier/zama/policy/evaluate",
            {
              missionId: missionSnapshot.id,
              operatorWallet: current.session.operatorWallet,
              requestedSpendUsd: missionSnapshot.budget.perTxCapUsd,
              counterpartyTrust: missionSnapshot.policy.minTrustScore + 4,
              minTrustScore:
                missionSnapshot.execution.confidentialPolicy.encryptedValues.minTrustScore
                  ? Number(
                      missionSnapshot.execution.confidentialPolicy.encryptedValues.minTrustScore.replace(
                        "enc:",
                        "",
                      ),
                    )
                  : undefined,
              maxSpendUsd:
                missionSnapshot.execution.confidentialPolicy.encryptedValues.maxSpendUsd
                  ? Number(
                      missionSnapshot.execution.confidentialPolicy.encryptedValues.maxSpendUsd.replace(
                        "enc:",
                        "",
                      ),
                    )
                  : undefined,
              emergencyStop:
                missionSnapshot.execution.confidentialPolicy.encryptedValues.emergencyStop ===
                "enc:true",
            },
          );

          if (!confidentialEvaluation.allowed) {
            const dispute = createViolation(missionSnapshot);

            missionNext = setMissionUpdated({
              ...missionSnapshot,
              status: "blocked",
              execution: {
                ...missionSnapshot.execution,
                status: "blocked",
                confidentialPolicy: {
                  ...missionSnapshot.execution.confidentialPolicy,
                  status: "blocked",
                  summary: confidentialEvaluation.reason,
                  lastEvaluatedAt: confidentialEvaluation.evaluatedAt,
                },
                chainTransactions: appendChainTransaction(missionSnapshot, {
                  id: `CHAIN-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
                  rail: "confidential",
                  chain: "fhEVM",
                  network: confidentialEvaluation.network,
                  action: "evaluate_confidential_policy",
                  status: "completed",
                  txHash: confidentialEvaluation.txHash,
                  live: confidentialEvaluation.live,
                  createdAt: confidentialEvaluation.evaluatedAt,
                  metadata: {
                    allowed: false,
                  },
                }),
              },
              stages: updateStageStatus(missionSnapshot, "execute", completed, "execute"),
              disputes: [dispute, ...missionSnapshot.disputes],
              logs: appendLogs(missionSnapshot, [
                createLog(
                  "execute",
                  "policy",
                  "warning",
                  "Confidential policy blocked execution",
                  confidentialEvaluation.reason,
                  {
                    evaluatedAt: confidentialEvaluation.evaluatedAt,
                    txHash: confidentialEvaluation.txHash,
                  },
                  ["zama", "blocked"],
                ),
              ]),
            });

            setState({
              ...current,
              loading: false,
              error: undefined,
              mission: missionNext,
              lastUpdatedAt: new Date().toISOString(),
            });
            return;
          }
        }

        const challengeResponse = await fetch("/api/frontier/services/premium-yield", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            missionId: missionSnapshot.id,
            objective: missionSnapshot.objective,
          }),
        });

        const challenge = (await challengeResponse.json()) as ChallengeResponse;

        if (
          challenge.amountUsd > missionSnapshot.budget.perTxCapUsd ||
          challenge.counterpartyTrust < missionSnapshot.policy.minTrustScore ||
          challenge.amountUsd > getRemainingBudget(missionSnapshot)
        ) {
          const dispute = createViolation(missionSnapshot);

          missionNext = setMissionUpdated({
            ...missionSnapshot,
            status: "blocked",
            stages: updateStageStatus(missionSnapshot, "execute", completed, "execute"),
            disputes: [dispute, ...missionSnapshot.disputes],
            logs: appendLogs(missionSnapshot, [
              createLog(
                "execute",
                "policy",
                "warning",
                "Policy gate blocked payment",
                "Proposed paid action exceeded mission policy bounds and was routed to operator review.",
                {
                  amountUsd: challenge.amountUsd,
                  perTxCapUsd: missionSnapshot.budget.perTxCapUsd,
                },
                ["blocked", "policy"],
              ),
            ]),
          });
        } else {
          let settled: ServiceResponse;
          settled = await postJson<ServiceResponse>("/api/frontier/agent/premium-yield", {
            missionId: missionSnapshot.id,
            objective: missionSnapshot.objective,
            sessionId: auth.session?.sessionId ?? current.session.sessionId,
            credentialId:
              auth.session?.passkeyCredentialId ?? current.session.passkeyCredentialId,
            passkeyKeyHash:
              auth.session?.passkeyKeyHash ?? current.session.passkeyKeyHash,
            operatorWallet: auth.session?.operatorWallet ?? current.session.operatorWallet,
          });

          const memoryResult = await postJson<MemoryResponse>("/api/frontier/storacha/memory", {
            missionId: missionSnapshot.id,
            type: "research",
            payload: {
              summary: settled.researchSummary,
              query: settled.researchQuery,
              generatedAt: settled.generatedAt,
              model: settled.modelVersion ?? settled.model,
              grounded: settled.grounded,
              searchQueries: settled.searchQueries,
              sources: settled.sources,
              results: settled.data,
            },
          });

          const payment: PaymentEvent = {
            id: `PAY-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
            protocol: "x402",
            merchant: challenge.merchant,
            resource: challenge.resource,
            amountUsd: challenge.amountUsd,
            status: "settled",
            challengeId: challenge.challengeId,
            network: challenge.network,
            counterpartyTrust: challenge.counterpartyTrust,
            txHash: settled.paymentTxHash,
            explorerUrl: settled.paymentExplorerUrl,
            blockNumber: settled.paymentBlockNumber,
            live: settled.live ?? true,
            verified: settled.paymentVerified ?? false,
            createdAt: new Date().toISOString(),
          };

          missionNext = setMissionUpdated({
            ...missionSnapshot,
            status: "verified",
            activeStage: "verify",
            execution: {
              ...missionSnapshot.execution,
              status: "verified",
              confidentialPolicy: confidentialEvaluation
                ? {
                    ...missionSnapshot.execution.confidentialPolicy,
                    status: confidentialEvaluation.status,
                    summary: confidentialEvaluation.reason,
                    lastEvaluatedAt: confidentialEvaluation.evaluatedAt,
                  }
                : missionSnapshot.execution.confidentialPolicy,
              chainTransactions: confidentialEvaluation
                ? appendChainTransaction(missionSnapshot, {
                    id: `CHAIN-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
                    rail: "confidential",
                    chain: "fhEVM",
                    network: confidentialEvaluation.network,
                    action: "evaluate_confidential_policy",
                    status: "completed",
                    txHash: confidentialEvaluation.txHash,
                    live: confidentialEvaluation.live,
                    createdAt: confidentialEvaluation.evaluatedAt,
                    metadata: {
                      allowed: true,
                    },
                  })
                : missionSnapshot.execution.chainTransactions,
            },
            budget: {
              ...missionSnapshot.budget,
              spentUsd: Number((missionSnapshot.budget.spentUsd + challenge.amountUsd).toFixed(2)),
            },
            stages: updateStageStatus(missionSnapshot, "verify", [...completed, "execute"]),
            findings: settled.data.map((item) => ({
              asset: item.asset,
              protocol: item.protocol,
              apy: item.apy,
              riskScore: item.riskScore,
              liquidity: item.liquidity,
              status: item.riskScore <= 0.8 ? "stable" : item.riskScore <= 0.95 ? "caution" : "blocked",
              recommendation:
                item.riskScore <= 0.8
                  ? "Safe within configured trust threshold."
                  : item.riskScore <= 0.95
                    ? "Requires manual review before treasury allocation."
                    : "Rejected by policy gate.",
            })),
            tasks: missionSnapshot.tasks.map((task, index) =>
              index === 0
                ? { ...task, status: "completed", result: "Dataset purchased and normalized." }
                : index === 1
                  ? { ...task, status: "completed", result: "Routes ranked by trust-adjusted yield." }
                  : { ...task, status: "in_progress" },
            ),
            payments: appendPayment(missionSnapshot, payment),
            memory: appendMemory(missionSnapshot, {
              id: `MEM-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
              type: "research",
              title: "Premium market dataset",
              summary:
                settled.researchSummary ??
                "x402-paid service returned Gemini-grounded yield and risk research.",
              owner: "Frontier Research Specialist",
              createdAt: new Date().toISOString(),
              cid: memoryResult.cid,
              content: {
                summary: settled.researchSummary,
                query: settled.researchQuery,
                generatedAt: settled.generatedAt,
                model: settled.modelVersion ?? settled.model,
                grounded: settled.grounded,
                searchQueries: settled.searchQueries,
                sources: settled.sources,
                results: settled.data,
              },
            }),
            logs: appendLogs(missionSnapshot, [
              createLog(
                "execute",
                "payment",
                "info",
                "x402 challenge received",
                "Paid endpoint requested bounded payment authorization before releasing premium data.",
                {
                  amountUsd: challenge.amountUsd,
                  challengeId: challenge.challengeId,
                },
                ["x402", "challenge"],
              ),
              createLog(
                "execute",
                "payment",
                "success",
                "Premium dataset purchased onchain",
                settled.proofSummary ??
                  "Enterprise agent wallet cleared the x402 challenge and returned a verifiable settlement receipt.",
                {
                  txHash: settled.paymentTxHash,
                  amountUsd: challenge.amountUsd,
                  live: settled.live ?? true,
                  verified: settled.paymentVerified ?? false,
                  proofLevel: settled.proofLevel,
                  grounded: settled.grounded ?? false,
                  sourceCount: settled.sources?.length ?? 0,
                  model: settled.modelVersion ?? settled.model,
                },
                ["x402", "settled", settled.proofLevel ?? "live"],
              ),
              createLog(
                "execute",
                "storage",
                "success",
                "Research memory synchronized",
                "Execution outputs were written to Storacha for auditor handoff.",
                { cid: memoryResult.cid },
                ["storacha", "memory"],
              ),
              ...(confidentialEvaluation
                ? [
                    createLog(
                      "execute",
                      "policy",
                      "success",
                      "Confidential policy approved execution",
                      confidentialEvaluation.reason,
                      {
                        txHash: confidentialEvaluation.txHash,
                      },
                      ["zama", "approved"],
                    ),
                  ]
                : []),
            ]),
          });
        }
      } else if (missionSnapshot.activeStage === "verify") {
        const privateReveal =
          missionSnapshot.execution.privateIntent.enabled &&
          missionSnapshot.execution.privateIntent.commitmentHash &&
          !missionSnapshot.execution.privateIntent.revealTxHash
            ? await postJson<StarknetRevealResponse>("/api/frontier/starknet/reveal", {
                missionId: missionSnapshot.id,
                label: missionSnapshot.execution.privateIntent.label,
                operatorWallet: current.session.operatorWallet,
                commitmentHash: missionSnapshot.execution.privateIntent.commitmentHash,
                nullifier: missionSnapshot.execution.privateIntent.nullifier,
              })
            : null;
        const feedback = await postJson<FeedbackResponse>("/api/frontier/erc8004/feedback", {
          missionId: missionSnapshot.id,
          agentId: missionSnapshot.identity.agentId,
          erc8004Identity: missionSnapshot.identity.erc8004Identity,
          rating: missionSnapshot.reputation.rating,
          notes: missionSnapshot.reputation.notes,
        });

        missionNext = setMissionUpdated({
          ...missionSnapshot,
          status: "verified",
          activeStage: "finalize",
          execution: {
            ...missionSnapshot.execution,
            status: "verified",
            privateIntent: privateReveal
              ? {
                  ...missionSnapshot.execution.privateIntent,
                  status: privateReveal.status,
                  revealHash: privateReveal.revealHash,
                  revealTxHash: privateReveal.revealTxHash,
                  explorerUrl: privateReveal.explorerUrl,
                  network: privateReveal.network,
                  live: privateReveal.live,
                  blockNumber: privateReveal.blockNumber ?? missionSnapshot.execution.privateIntent.blockNumber,
                }
              : missionSnapshot.execution.privateIntent,
            chainTransactions: privateReveal
              ? appendChainTransaction(missionSnapshot, {
                  id: `CHAIN-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
                  rail: "private",
                  chain: "Starknet",
                  network: privateReveal.network,
                  action: "reveal_private_intent",
                  status: "revealed",
                  txHash: privateReveal.revealTxHash,
                  explorerUrl: privateReveal.explorerUrl,
                  live: privateReveal.live,
                  createdAt: new Date().toISOString(),
                  metadata: {
                    revealHash: privateReveal.revealHash,
                    blockNumber: privateReveal.blockNumber,
                  },
                })
              : missionSnapshot.execution.chainTransactions,
          },
          identity: {
            ...missionSnapshot.identity,
            feedbackTxHash: feedback.txHash,
            trustScore: feedback.updatedScore,
            trustDelta: feedback.delta,
          },
          stages: updateStageStatus(missionSnapshot, "finalize", [...completed, "verify"]),
          tasks: missionSnapshot.tasks.map((task) =>
            task.type === "verification"
              ? { ...task, status: "completed", result: "Outputs verified and feedback submitted." }
              : task
          ),
          artifacts: updateArtifact(missionSnapshot, "feedback", {
            status: "pinned",
            txHash: feedback.txHash,
            pinnedAt: new Date().toISOString(),
          }),
          logs: appendLogs(missionSnapshot, [
            createLog(
              "verify",
              "auditor",
              "success",
              "Auditor verification passed",
              "Outputs satisfied the mission objective and policy checks remained intact.",
              undefined,
              ["auditor", "verification"],
            ),
            createLog(
              "verify",
              "trust",
              "success",
              "Reputation feedback submitted",
              "ERC-8004 reputation updated with post-task feedback and mission quality score.",
              { txHash: feedback.txHash, updatedScore: feedback.updatedScore },
              ["erc-8004", "feedback"],
            ),
            ...(privateReveal
              ? [
                  createLog(
                    "verify",
                    "auditor",
                    "success",
                    "Private intent revealed",
                    "Starknet reveal proof was attached to the mission before final receipt assembly.",
                    {
                      txHash: privateReveal.revealTxHash,
                      revealHash: privateReveal.revealHash,
                      blockNumber: privateReveal.blockNumber,
                    },
                    ["starknet", "reveal"],
                  ),
                ]
              : []),
          ]),
        });
      } else if (missionSnapshot.activeStage === "finalize") {
        const logPin = await postJson<PinResponse>("/api/frontier/filecoin/pin", {
          missionId: missionSnapshot.id,
          artifact: "agent_log.json",
          payload: buildAgentLogDocument(missionSnapshot),
        });
        const summaryPin = await postJson<PinResponse>("/api/frontier/filecoin/pin", {
          missionId: missionSnapshot.id,
          artifact: "mission_summary.md",
          payload: buildMissionSummaryMarkdown(missionSnapshot),
        });
        const receiptPin = await postJson<PinResponse>("/api/frontier/filecoin/pin", {
          missionId: missionSnapshot.id,
          artifact: "receipt_bundle.json",
          payload: buildReceiptDocument(missionSnapshot),
        });

        let artifacts = updateArtifact(missionSnapshot, "log", {
          status: "pinned",
          cid: logPin.cid,
          txHash: logPin.txHash,
          pinnedAt: new Date().toISOString(),
        });

        const missionWithLogs = { ...missionSnapshot, artifacts };
        artifacts = updateArtifact(missionWithLogs, "summary", {
          status: "pinned",
          cid: summaryPin.cid,
          txHash: summaryPin.txHash,
          pinnedAt: new Date().toISOString(),
        });

        const missionWithSummary = { ...missionSnapshot, artifacts };
        artifacts = updateArtifact(missionWithSummary, "receipt", {
          status: "pinned",
          cid: receiptPin.cid,
          txHash: receiptPin.txHash,
          pinnedAt: new Date().toISOString(),
        });

        if (missionSnapshot.execution.scheduled.enabled) {
          artifacts = updateArtifact({ ...missionSnapshot, artifacts }, "scheduled", {
            status: "pinned",
            cid: receiptPin.cid,
            txHash: missionSnapshot.execution.scheduled.txHash,
            pinnedAt: new Date().toISOString(),
          });
        }

        if (missionSnapshot.execution.privateIntent.enabled) {
          artifacts = updateArtifact({ ...missionSnapshot, artifacts }, "private", {
            status: "pinned",
            cid: receiptPin.cid,
            txHash:
              missionSnapshot.execution.privateIntent.revealTxHash ??
              missionSnapshot.execution.privateIntent.txHash,
            pinnedAt: new Date().toISOString(),
          });
        }

        if (missionSnapshot.execution.confidentialPolicy.enabled) {
          artifacts = updateArtifact({ ...missionSnapshot, artifacts }, "confidential", {
            status: "pinned",
            cid: receiptPin.cid,
            txHash: missionSnapshot.execution.chainTransactions.find(
              (transaction) => transaction.rail === "confidential",
            )?.txHash,
            pinnedAt: new Date().toISOString(),
          });
        }

        missionNext = setMissionUpdated({
          ...missionSnapshot,
          status: "completed",
          execution: {
            ...missionSnapshot.execution,
            status: "completed",
          },
          stages: updateStageStatus(missionSnapshot, "finalize", [...completed, "finalize"]),
          artifacts,
          logs: appendLogs(missionSnapshot, [
            createLog(
              "finalize",
              "storage",
              "success",
              "Evidence bundle finalized",
              "agent_log.json, mission summary, and receipt bundle pinned for durable retrieval.",
              {
                logCid: logPin.cid,
                summaryCid: summaryPin.cid,
                receiptCid: receiptPin.cid,
              },
              ["filecoin", "receipt"],
            ),
          ]),
        });
      }

      setState({
        ...current,
        loading: false,
        error: undefined,
        mission: missionNext,
        lastUpdatedAt: new Date().toISOString(),
      });
    } catch (error) {
      setState({
        ...current,
        loading: false,
        error: error instanceof Error ? error.message : "Failed to advance mission.",
      });
    }
  }

  async function runAutopilot(): Promise<void> {
    setState((snapshot) => ({
      ...snapshot,
      mission: setMissionUpdated({
        ...snapshot.mission,
        logs: appendLogs(snapshot.mission, [
          createLog(
            snapshot.mission.activeStage,
            "operator",
            "info",
            "Autopilot engaged",
            "Operator enabled autonomous progression through the remaining mission stages.",
            undefined,
            ["autopilot", "operator"],
          ),
        ]),
      }),
      lastUpdatedAt: new Date().toISOString(),
    }));

    while (true) {
      const snapshot = stateRef.current;

      if (
        snapshot.loading ||
        snapshot.mission.status === "completed" ||
        snapshot.mission.status === "blocked"
      ) {
        break;
      }

      await advanceMission();

      const next = stateRef.current;
      if (next.mission.status === "completed" || next.mission.status === "blocked") {
        break;
      }
    }

    setState((snapshot) => ({
      ...snapshot,
      mission: setMissionUpdated({
        ...snapshot.mission,
        logs: appendLogs(snapshot.mission, [
          createLog(
            snapshot.mission.activeStage,
            "operator",
            snapshot.mission.status === "completed" ? "success" : "warning",
            snapshot.mission.status === "completed"
              ? "Autopilot completed mission"
              : "Autopilot paused",
            snapshot.mission.status === "completed"
              ? "Autonomous execution finished and all remaining stages were resolved."
              : "Autonomous execution stopped because the mission reached a blocked state or required intervention.",
            { missionStatus: snapshot.mission.status },
            ["autopilot", snapshot.mission.status],
          ),
        ]),
      }),
      lastUpdatedAt: new Date().toISOString(),
    }));
  }

  async function simulateViolation(): Promise<void> {
    const current = stateRef.current;

    if (current.mission.disputes.some((dispute) => dispute.status === "open")) {
      return;
    }

    const dispute = createViolation(current.mission);
    const updatedMission = setMissionUpdated({
      ...current.mission,
      status: "blocked",
      execution: {
        ...current.mission.execution,
        status: "blocked",
      },
      disputes: [dispute, ...current.mission.disputes],
      stages: updateStageStatus(current.mission, current.mission.activeStage, getCompletedStages(current.mission), current.mission.activeStage),
      logs: appendLogs(current.mission, [
        createLog(
          current.mission.activeStage,
          "policy",
          "warning",
          "Policy violation injected for review",
          "Demo mode created a blocked action to showcase the incident workflow.",
          { violatedPolicy: dispute.violatedPolicy },
          ["dispute", "policy"],
        ),
      ]),
    });

    setState({
      ...current,
      mission: updatedMission,
      lastUpdatedAt: new Date().toISOString(),
      error: undefined,
    });
  }

  async function resolveDispute(strategy: "dismiss" | "override" | "retry"): Promise<void> {
    const current = stateRef.current;
    const openDispute = current.mission.disputes.find((dispute) => dispute.status === "open");

    if (!openDispute) {
      return;
    }

    const disputes = current.mission.disputes.map((dispute) =>
      dispute.id === openDispute.id
        ? {
            ...dispute,
            status: (strategy === "dismiss" ? "dismissed" : "resolved") as "dismissed" | "resolved",
            resolution:
              strategy === "override"
                ? "Operator widened the per-transaction cap and allowed execution to continue."
                : strategy === "retry"
                  ? "Operator requested a safe retry with the original policy intact."
                  : "Incident dismissed after operator review.",
          }
        : dispute,
    );

    const policy =
      strategy === "override"
        ? {
            ...current.mission.policy,
            minTrustScore: Math.max(80, current.mission.policy.minTrustScore - 4),
          }
        : current.mission.policy;

    const budget =
      strategy === "override"
        ? {
            ...current.mission.budget,
            perTxCapUsd: current.mission.budget.perTxCapUsd + 5,
          }
        : current.mission.budget;

    const updatedMission = setMissionUpdated({
      ...current.mission,
      status: strategy === "dismiss" ? "blocked" : "running",
      execution: {
        ...current.mission.execution,
        status: strategy === "dismiss" ? "blocked" : "ready",
      },
      policy,
      budget,
      disputes,
      stages: updateStageStatus(
        current.mission,
        strategy === "dismiss" ? current.mission.activeStage : current.mission.activeStage,
        getCompletedStages(current.mission),
      ),
      logs: appendLogs(current.mission, [
        createLog(
          current.mission.activeStage,
          "operator",
          strategy === "dismiss" ? "warning" : "success",
          strategy === "override" ? "Operator override applied" : strategy === "retry" ? "Safe retry approved" : "Incident dismissed",
          strategy === "override"
            ? "Operator broadened the policy bounds so execution can resume."
            : strategy === "retry"
              ? "Operator requested a rerun while keeping existing policy thresholds."
              : "Operator kept the mission blocked and archived the incident.",
          undefined,
          ["dispute", strategy],
        ),
      ]),
    });

    setState({
      ...current,
      mission: updatedMission,
      lastUpdatedAt: new Date().toISOString(),
      error: undefined,
    });
  }

  async function submitReputation(rating: number, notes: string): Promise<void> {
    const current = stateRef.current;
    const response = await postJson<FeedbackResponse>("/api/frontier/erc8004/feedback", {
      missionId: current.mission.id,
      agentId: current.mission.identity.agentId,
      erc8004Identity: current.mission.identity.erc8004Identity,
      rating,
      notes,
    });

    const updatedMission = setMissionUpdated({
      ...current.mission,
      reputation: {
        rating,
        notes,
        submittedAt: new Date().toISOString(),
        txHash: response.txHash,
      },
      identity: {
        ...current.mission.identity,
        feedbackTxHash: response.txHash,
        trustScore: response.updatedScore,
        trustDelta: response.delta,
      },
      artifacts: updateArtifact(current.mission, "feedback", {
        status: "pinned",
        txHash: response.txHash,
        pinnedAt: new Date().toISOString(),
      }),
      logs: appendLogs(current.mission, [
        createLog(
          "verify",
          "trust",
          "success",
          "Reputation submission refreshed",
          "Operator updated the final mission rating and re-posted feedback to ERC-8004.",
          { txHash: response.txHash, rating },
          ["erc-8004", "reputation"],
        ),
      ]),
    });

    setState({
      ...current,
      mission: updatedMission,
      lastUpdatedAt: new Date().toISOString(),
      error: undefined,
    });
  }

  function exportArtifact(kind: EvidenceArtifact["type"] | "manifest_text" | "log_text" | "summary_text" | "receipt_text"): void {
    const currentMission = stateRef.current.mission;

    if (kind === "manifest_text" || kind === "manifest") {
      downloadText("agent.json", serializePretty(buildManifestDocument(currentMission)));
      return;
    }
    if (kind === "log_text" || kind === "log") {
      downloadText("agent_log.json", serializePretty(buildAgentLogDocument(currentMission)));
      return;
    }
    if (kind === "summary_text" || kind === "summary") {
      downloadText("mission_summary.md", buildMissionSummaryMarkdown(currentMission), "text/markdown");
      return;
    }

    downloadText("receipt_bundle.json", serializePretty(buildReceiptDocument(currentMission)));
  }

  async function copyArtifact(kind: "manifest" | "log" | "summary" | "receipt"): Promise<void> {
    const currentMission = stateRef.current.mission;

    if (kind === "manifest") {
      await copyText(serializePretty(buildManifestDocument(currentMission)));
      return;
    }
    if (kind === "log") {
      await copyText(serializePretty(buildAgentLogDocument(currentMission)));
      return;
    }
    if (kind === "summary") {
      await copyText(buildMissionSummaryMarkdown(currentMission));
      return;
    }

    await copyText(serializePretty(buildReceiptDocument(currentMission)));
  }

  function resetDemo(): void {
    const baseline = createDefaultState();
    const nextState = auth.session
      ? normalizeFrontierState({
          ...baseline,
          session: auth.session,
          mission: createMissionFromInput(auth.session, createLaunchInputFromMission(baseline.mission)),
        })
      : baseline;
    setState(nextState);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  }

  const contextValue: FrontierGuardContextValue = {
    state: normalizedState,
    mission,
    launchDefaults: createLaunchInputFromMission(mission),
    notifications: buildNotifications(normalizedState),
    manifestText,
    logText,
    summaryText,
    receiptText,
    openDispute: mission.disputes.find((dispute) => dispute.status === "open"),
    remainingBudgetUsd: getRemainingBudget(mission),
    progressPct: progressFromMission(mission),
    authenticatePasskey,
    launchMission,
    advanceMission,
    runAutopilot,
    simulateViolation,
    resolveDispute,
    submitReputation,
    exportArtifact,
    copyArtifact,
    resetDemo,
  };

  return <FrontierGuardContext.Provider value={contextValue}>{children}</FrontierGuardContext.Provider>;
}

export function useFrontierGuard(): FrontierGuardContextValue {
  const context = useContext(FrontierGuardContext);

  if (!context) {
    throw new Error("useFrontierGuard must be used within FrontierGuardProvider");
  }

  return context;
}
