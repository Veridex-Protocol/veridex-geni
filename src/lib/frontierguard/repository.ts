import type { PasskeyCredential } from "@veridex/sdk";
import { ensureDatabaseReady, isDatabaseConfigured } from "@/lib/db";
import { buildNotifications } from "@/lib/frontierguard/mock";
import type {
  ExecutionRail,
  FrontierState,
  LogEvent,
  MissionDispute,
  NotificationItem,
  PaymentEvent,
} from "@/lib/frontierguard/types";
import { deriveVaultAddressForCredential } from "@/lib/frontierguard/veridex";

type RepositorySql = NonNullable<Awaited<ReturnType<typeof ensureDatabaseReady>>>;

export interface PersistedPasskeyCredential {
  credentialId: string;
  keyHash: string;
  publicKeyX: string;
  publicKeyY: string;
  username?: string;
  displayName?: string;
  passkeyLabel: string;
  operatorWallet: string;
  vaultAddress: string;
  lastAuthenticatedAt: string;
  metadata?: Record<string, unknown>;
}

export interface PersistedAuthSession {
  id: string;
  credentialId: string;
  operatorWallet: string;
  operatorName: string;
  vaultAddress: string;
  sessionOrigin: "register" | "login";
  expiresAt: string;
  userAgent?: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
}

export interface StoredAuthSession {
  id: string;
  credentialId: string;
  operatorWallet: string;
  operatorName: string;
  vaultAddress: string;
  sessionOrigin: string;
  expiresAt: string;
  createdAt: string;
  lastSeenAt: string;
  status: string;
}

export interface PersistedArtifactInput {
  missionId?: string;
  artifactName: string;
  artifactType: string;
  provider: string;
  network?: string;
  status: string;
  cid?: string;
  uri?: string;
  txHash?: string;
  payload: unknown;
  metadata?: Record<string, unknown>;
}

export interface PersistedMemoryInput {
  missionId: string;
  recordType: string;
  cid?: string;
  provider: string;
  network?: string;
  ucanDelegation?: string;
  payload: unknown;
}

export interface PersistedAgentRegistrationInput {
  missionId: string;
  agentId: string;
  onchainAgentId?: string;
  erc8004Identity: string;
  registry: string;
  network: string;
  registrationTxHash: string;
  explorerUrl: string;
  registrationFileUri: string;
  canonicalUAI: string;
  live: boolean;
  payload: unknown;
}

export interface PersistedFeedbackInput {
  missionId: string;
  agentId?: string;
  rating: number;
  notes: string;
  txHash: string;
  explorerUrl: string;
  updatedScore: number;
  delta: number;
  live: boolean;
  payload: unknown;
}

export interface PersistedAuditEventInput {
  id?: string;
  eventType: string;
  action: string;
  source: string;
  status: string;
  requestId?: string;
  correlationId?: string;
  missionId?: string;
  sessionId?: string;
  credentialId?: string;
  operatorWallet?: string;
  actorType?: string;
  actorId?: string;
  resource?: string;
  durationMs?: number;
  errorCode?: string;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

export interface PersistedToolInvocationInput {
  id?: string;
  missionId?: string;
  sessionId?: string;
  credentialId?: string;
  operatorWallet?: string;
  toolName: string;
  operation: string;
  endpoint?: string;
  provider?: string;
  attempt?: number;
  status: string;
  requestPayload?: unknown;
  responsePayload?: unknown;
  live?: boolean;
  durationMs?: number;
  errorCode?: string;
  errorMessage?: string;
}

export interface PersistedPolicyEvaluationInput {
  id?: string;
  missionId?: string;
  sessionId?: string;
  credentialId?: string;
  operatorWallet?: string;
  stage?: string;
  action: string;
  decision: string;
  ruleName?: string;
  threshold?: Record<string, unknown>;
  observed?: Record<string, unknown>;
  rationale?: string;
  blocked?: boolean;
}

export interface PersistedPaymentRecordInput {
  id?: string;
  missionId?: string;
  sessionId?: string;
  credentialId?: string;
  operatorWallet?: string;
  challengeId?: string;
  merchant: string;
  resource: string;
  protocol: string;
  amountUsd: number;
  network?: string;
  recipient?: string;
  txHash?: string;
  counterpartyTrust?: number;
  status: string;
  live?: boolean;
  detail?: Record<string, unknown>;
}

export interface PersistedAuthCeremonyInput {
  id?: string;
  ceremonyType: string;
  status: string;
  credentialId?: string;
  keyHash?: string;
  username?: string;
  displayName?: string;
  passkeyLabel?: string;
  operatorWallet?: string;
  vaultAddress?: string;
  knownCredential?: boolean;
  sessionId?: string;
  requestId?: string;
  correlationId?: string;
  userAgent?: string;
  ipAddress?: string;
  rpId?: string;
  origin?: string;
  durationMs?: number;
  errorCode?: string;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

export interface PersistedExternalOperationInput {
  id?: string;
  missionId?: string;
  operationType: string;
  provider: string;
  resource: string;
  network?: string;
  cid?: string;
  uri?: string;
  txHash?: string;
  explorerUrl?: string;
  live?: boolean;
  status: string;
  requestPayload?: unknown;
  responsePayload?: unknown;
  errorMessage?: string;
}

export interface PersistedRuntimeErrorInput {
  id?: string;
  missionId?: string;
  sessionId?: string;
  credentialId?: string;
  operatorWallet?: string;
  scope: string;
  errorName?: string;
  errorMessage: string;
  errorCode?: string;
  stackExcerpt?: string;
  recoverable?: boolean;
  detail?: Record<string, unknown>;
}

export interface PersistedExecutionRailInput {
  missionId: string;
  rail: ExecutionRail;
  status: string;
  selectorLabel: string;
  scheduledFor?: string;
  nextRunAt?: string;
  live?: boolean;
  metadata?: Record<string, unknown>;
}

export interface PersistedFlowScheduleInput {
  missionId: string;
  scheduleId?: string;
  cadence: string;
  scheduledFor?: string;
  nextRunAt?: string;
  retryPolicy: string;
  status: string;
  txHash?: string;
  explorerUrl?: string;
  handlerAddress?: string;
  network?: string;
  live?: boolean;
  payload?: unknown;
}

export interface PersistedStarknetPrivateIntentInput {
  missionId: string;
  label: string;
  commitmentHash?: string;
  nullifier?: string;
  revealWindowHours: number;
  status: string;
  txHash?: string;
  revealTxHash?: string;
  explorerUrl?: string;
  network?: string;
  live?: boolean;
  payload?: unknown;
}

export interface PersistedZamaConfidentialPolicyInput {
  missionId: string;
  status: string;
  summary: string;
  policyHandle?: string;
  aclGrantId?: string;
  evaluatorAddress?: string;
  encryptedFields: string[];
  network?: string;
  live?: boolean;
  payload?: unknown;
}

export interface PersistedChainTransactionInput {
  id?: string;
  missionId: string;
  rail: ExecutionRail;
  chain: string;
  network: string;
  action: string;
  status: string;
  txHash: string;
  explorerUrl?: string;
  live?: boolean;
  metadata?: Record<string, unknown>;
  createdAt?: string;
}

export interface PersistedEncryptedPolicyHandleInput {
  id?: string;
  missionId: string;
  fieldName: string;
  handle: string;
  aclGrantId?: string;
  network?: string;
  live?: boolean;
  metadata?: Record<string, unknown>;
}

export interface PersistedJobRunInput {
  id?: string;
  missionId?: string;
  sessionId?: string;
  jobName: string;
  status: string;
  attempt?: number;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  detail?: Record<string, unknown>;
}

type StoredCredentialRow = {
  credential_id: string;
  key_hash: string;
  public_key_x: string;
  public_key_y: string;
  username: string | null;
  display_name: string | null;
  passkey_label: string | null;
  operator_wallet: string;
  vault_address: string;
  last_authenticated_at: string | null;
};

type StoredMissionSnapshotRow = {
  mission_id: string;
  state_json: FrontierState;
  active_stage: string;
  status: string;
};

function logRepositoryFallback(scope: string, error: unknown): void {
  const detail = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  console.warn(`[frontierguard] ${scope} skipped persistence. ${detail}`);
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`[${label}] timed out after ${ms}ms`));
    }, ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}

const DB_OPERATION_TIMEOUT_MS = 8_000;

async function withRepositorySql<T>(
  scope: string,
  fallback: T,
  operation: (sql: NonNullable<Awaited<ReturnType<typeof ensureDatabaseReady>>>) => Promise<T>,
): Promise<T> {
  if (!isDatabaseConfigured()) {
    return fallback;
  }

  try {
    const sql = await withTimeout(ensureDatabaseReady(), DB_OPERATION_TIMEOUT_MS, `${scope}/connect`);
    if (!sql) {
      return fallback;
    }

    return await withTimeout(operation(sql), DB_OPERATION_TIMEOUT_MS, `${scope}/query`);
  } catch (error) {
    logRepositoryFallback(scope, error);
    return fallback;
  }
}

function createId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

function splitPayload(payload: unknown): { contentJson: unknown | null; contentText: string | null } {
  if (payload == null) {
    return { contentJson: null, contentText: null };
  }

  if (typeof payload === "string") {
    return { contentJson: null, contentText: payload };
  }

  return { contentJson: payload, contentText: null };
}

function toJsonValue(value: unknown): never {
  return JSON.parse(JSON.stringify(value ?? null)) as never;
}

function serializeCredential(credential: PasskeyCredential): PersistedPasskeyCredential {
  const vaultAddress = deriveVaultAddressForCredential(credential);
  return {
    credentialId: credential.credentialId,
    keyHash: credential.keyHash,
    publicKeyX: credential.publicKeyX.toString(),
    publicKeyY: credential.publicKeyY.toString(),
    username: undefined,
    displayName: undefined,
    passkeyLabel: "Recovered Veridex Passkey",
    operatorWallet: vaultAddress,
    vaultAddress,
    lastAuthenticatedAt: new Date().toISOString(),
  };
}

function excerptStack(error: unknown): string | undefined {
  if (!(error instanceof Error) || !error.stack) {
    return undefined;
  }

  return error.stack.split("\n").slice(0, 5).join("\n");
}

function normalizeDate(value?: string): string {
  if (!value) {
    return new Date().toISOString();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function createStableId(prefix: string, ...parts: Array<string | number | boolean | null | undefined>): string {
  const suffix = parts
    .filter((part) => part !== undefined && part !== null && `${part}`.length > 0)
    .map((part) => `${part}`.replace(/[^a-zA-Z0-9:_-]/g, "_"))
    .join(":")
    .slice(0, 160);

  return suffix ? `${prefix}:${suffix}` : createId(prefix);
}

function buildStateChangeSummary(previousState: FrontierState | null, state: FrontierState) {
  return {
    previousStatus: previousState?.mission.status ?? null,
    nextStatus: state.mission.status,
    previousStage: previousState?.mission.activeStage ?? null,
    nextStage: state.mission.activeStage,
    previousRail: previousState?.mission.execution.rail ?? null,
    nextRail: state.mission.execution.rail,
    executionStatus: state.mission.execution.status,
    logCount: state.mission.logs.length,
    paymentCount: state.mission.payments.length,
    disputeCount: state.mission.disputes.length,
    notificationCount: buildNotifications(state).length,
    lastUpdatedAt: state.lastUpdatedAt,
  };
}

function newLogEvents(previousState: FrontierState | null, state: FrontierState): LogEvent[] {
  const previousIds = new Set(previousState?.mission.logs.map((event) => event.id) ?? []);
  return state.mission.logs.filter((event) => !previousIds.has(event.id));
}

function upsertNotificationSql(sql: RepositorySql, missionId: string, notification: NotificationItem) {
  return sql`
    insert into frontier_notifications (
      id,
      mission_id,
      kind,
      title,
      message,
      timestamp,
      action_label,
      href,
      metadata
    )
    values (
      ${notification.id},
      ${missionId},
      ${notification.kind},
      ${notification.title},
      ${notification.message},
      ${normalizeDate(notification.timestamp)},
      ${notification.actionLabel ?? null},
      ${notification.href ?? null},
      ${sql.json(toJsonValue({ source: "state-sync" }))}
    )
    on conflict (id) do update
      set kind = excluded.kind,
          title = excluded.title,
          message = excluded.message,
          timestamp = excluded.timestamp,
          action_label = excluded.action_label,
          href = excluded.href,
          metadata = excluded.metadata,
          updated_at = now()
  `;
}

function upsertLogEventSql(sql: RepositorySql, missionId: string, event: LogEvent) {
  return sql`
    insert into frontier_log_events (
      id,
      mission_id,
      timestamp,
      level,
      actor,
      stage,
      title,
      message,
      code,
      tags,
      detail
    )
    values (
      ${event.id},
      ${missionId},
      ${normalizeDate(event.timestamp)},
      ${event.level},
      ${event.actor},
      ${event.stage},
      ${event.title},
      ${event.message},
      ${event.code ?? null},
      ${sql.json(toJsonValue(event.tags ?? []))},
      ${sql.json(toJsonValue(event.detail ?? {}))}
    )
    on conflict (id) do nothing
  `;
}

function upsertExecutionRailSql(sql: RepositorySql, input: PersistedExecutionRailInput) {
  return sql`
    insert into frontier_execution_rails (
      mission_id,
      rail,
      status,
      selector_label,
      scheduled_for,
      next_run_at,
      live,
      metadata
    )
    values (
      ${input.missionId},
      ${input.rail},
      ${input.status},
      ${input.selectorLabel},
      ${input.scheduledFor ? normalizeDate(input.scheduledFor) : null},
      ${input.nextRunAt ? normalizeDate(input.nextRunAt) : null},
      ${input.live ?? false},
      ${sql.json(toJsonValue(input.metadata ?? {}))}
    )
    on conflict (mission_id) do update
      set rail = excluded.rail,
          status = excluded.status,
          selector_label = excluded.selector_label,
          scheduled_for = excluded.scheduled_for,
          next_run_at = excluded.next_run_at,
          live = excluded.live,
          metadata = excluded.metadata,
          updated_at = now()
  `;
}

function upsertFlowScheduleSql(sql: RepositorySql, input: PersistedFlowScheduleInput) {
  return sql`
    insert into frontier_flow_schedules (
      mission_id,
      schedule_id,
      cadence,
      scheduled_for,
      next_run_at,
      retry_policy,
      status,
      tx_hash,
      explorer_url,
      handler_address,
      network,
      live,
      payload
    )
    values (
      ${input.missionId},
      ${input.scheduleId ?? null},
      ${input.cadence},
      ${input.scheduledFor ? normalizeDate(input.scheduledFor) : null},
      ${input.nextRunAt ? normalizeDate(input.nextRunAt) : null},
      ${input.retryPolicy},
      ${input.status},
      ${input.txHash ?? null},
      ${input.explorerUrl ?? null},
      ${input.handlerAddress ?? null},
      ${input.network ?? null},
      ${input.live ?? false},
      ${sql.json(toJsonValue(input.payload ?? {}))}
    )
    on conflict (mission_id) do update
      set schedule_id = excluded.schedule_id,
          cadence = excluded.cadence,
          scheduled_for = excluded.scheduled_for,
          next_run_at = excluded.next_run_at,
          retry_policy = excluded.retry_policy,
          status = excluded.status,
          tx_hash = excluded.tx_hash,
          explorer_url = excluded.explorer_url,
          handler_address = excluded.handler_address,
          network = excluded.network,
          live = excluded.live,
          payload = excluded.payload,
          updated_at = now()
  `;
}

function upsertStarknetPrivateIntentSql(
  sql: RepositorySql,
  input: PersistedStarknetPrivateIntentInput,
) {
  return sql`
    insert into frontier_starknet_private_intents (
      mission_id,
      label,
      commitment_hash,
      nullifier,
      reveal_window_hours,
      status,
      tx_hash,
      reveal_tx_hash,
      explorer_url,
      network,
      live,
      payload
    )
    values (
      ${input.missionId},
      ${input.label},
      ${input.commitmentHash ?? null},
      ${input.nullifier ?? null},
      ${input.revealWindowHours},
      ${input.status},
      ${input.txHash ?? null},
      ${input.revealTxHash ?? null},
      ${input.explorerUrl ?? null},
      ${input.network ?? null},
      ${input.live ?? false},
      ${sql.json(toJsonValue(input.payload ?? {}))}
    )
    on conflict (mission_id) do update
      set label = excluded.label,
          commitment_hash = excluded.commitment_hash,
          nullifier = excluded.nullifier,
          reveal_window_hours = excluded.reveal_window_hours,
          status = excluded.status,
          tx_hash = excluded.tx_hash,
          reveal_tx_hash = excluded.reveal_tx_hash,
          explorer_url = excluded.explorer_url,
          network = excluded.network,
          live = excluded.live,
          payload = excluded.payload,
          updated_at = now()
  `;
}

function upsertZamaConfidentialPolicySql(
  sql: RepositorySql,
  input: PersistedZamaConfidentialPolicyInput,
) {
  return sql`
    insert into frontier_zama_confidential_policies (
      mission_id,
      status,
      summary,
      policy_handle,
      acl_grant_id,
      evaluator_address,
      encrypted_fields,
      network,
      live,
      payload
    )
    values (
      ${input.missionId},
      ${input.status},
      ${input.summary},
      ${input.policyHandle ?? null},
      ${input.aclGrantId ?? null},
      ${input.evaluatorAddress ?? null},
      ${sql.json(toJsonValue(input.encryptedFields))},
      ${input.network ?? null},
      ${input.live ?? false},
      ${sql.json(toJsonValue(input.payload ?? {}))}
    )
    on conflict (mission_id) do update
      set status = excluded.status,
          summary = excluded.summary,
          policy_handle = excluded.policy_handle,
          acl_grant_id = excluded.acl_grant_id,
          evaluator_address = excluded.evaluator_address,
          encrypted_fields = excluded.encrypted_fields,
          network = excluded.network,
          live = excluded.live,
          payload = excluded.payload,
          updated_at = now()
  `;
}

function upsertChainTransactionSql(sql: RepositorySql, input: PersistedChainTransactionInput) {
  return sql`
    insert into frontier_chain_transactions (
      id,
      mission_id,
      rail,
      chain,
      network,
      action,
      status,
      tx_hash,
      explorer_url,
      live,
      metadata,
      created_at
    )
    values (
      ${input.id ?? createStableId("chain-tx", input.missionId, input.rail, input.txHash)},
      ${input.missionId},
      ${input.rail},
      ${input.chain},
      ${input.network},
      ${input.action},
      ${input.status},
      ${input.txHash},
      ${input.explorerUrl ?? null},
      ${input.live ?? false},
      ${sql.json(toJsonValue(input.metadata ?? {}))},
      ${normalizeDate(input.createdAt)}
    )
    on conflict (id) do update
      set rail = excluded.rail,
          chain = excluded.chain,
          network = excluded.network,
          action = excluded.action,
          status = excluded.status,
          tx_hash = excluded.tx_hash,
          explorer_url = excluded.explorer_url,
          live = excluded.live,
          metadata = excluded.metadata
  `;
}

function upsertEncryptedPolicyHandleSql(
  sql: RepositorySql,
  input: PersistedEncryptedPolicyHandleInput,
) {
  return sql`
    insert into frontier_encrypted_policy_handles (
      id,
      mission_id,
      field_name,
      handle,
      acl_grant_id,
      network,
      live,
      metadata
    )
    values (
      ${input.id ?? createStableId("policy-handle", input.missionId, input.fieldName, input.handle)},
      ${input.missionId},
      ${input.fieldName},
      ${input.handle},
      ${input.aclGrantId ?? null},
      ${input.network ?? null},
      ${input.live ?? false},
      ${sql.json(toJsonValue(input.metadata ?? {}))}
    )
    on conflict (id) do update
      set handle = excluded.handle,
          acl_grant_id = excluded.acl_grant_id,
          network = excluded.network,
          live = excluded.live,
          metadata = excluded.metadata
  `;
}

export async function persistAuditEvent(input: PersistedAuditEventInput): Promise<boolean> {
  return withRepositorySql("persistAuditEvent", false, async (sql) => {
    await sql`
      insert into frontier_audit_events (
        id,
        event_type,
        action,
        source,
        status,
        request_id,
        correlation_id,
        mission_id,
        session_id,
        credential_id,
        operator_wallet,
        actor_type,
        actor_id,
        resource,
        duration_ms,
        error_code,
        error_message,
        metadata
      )
      values (
        ${input.id ?? createId("audit")},
        ${input.eventType},
        ${input.action},
        ${input.source},
        ${input.status},
        ${input.requestId ?? null},
        ${input.correlationId ?? null},
        ${input.missionId ?? null},
        ${input.sessionId ?? null},
        ${input.credentialId ?? null},
        ${input.operatorWallet ?? null},
        ${input.actorType ?? null},
        ${input.actorId ?? null},
        ${input.resource ?? null},
        ${input.durationMs ?? null},
        ${input.errorCode ?? null},
        ${input.errorMessage ?? null},
        ${sql.json(toJsonValue(input.metadata ?? {}))}
      )
    `;

    return true;
  });
}

export async function persistToolInvocation(input: PersistedToolInvocationInput): Promise<boolean> {
  return withRepositorySql("persistToolInvocation", false, async (sql) => {
    await sql`
      insert into frontier_tool_invocations (
        id,
        mission_id,
        session_id,
        credential_id,
        operator_wallet,
        tool_name,
        operation,
        endpoint,
        provider,
        attempt,
        status,
        request_payload,
        response_payload,
        live,
        duration_ms,
        error_code,
        error_message
      )
      values (
        ${input.id ?? createId("tool")},
        ${input.missionId ?? null},
        ${input.sessionId ?? null},
        ${input.credentialId ?? null},
        ${input.operatorWallet ?? null},
        ${input.toolName},
        ${input.operation},
        ${input.endpoint ?? null},
        ${input.provider ?? null},
        ${input.attempt ?? 1},
        ${input.status},
        ${input.requestPayload == null ? null : sql.json(toJsonValue(input.requestPayload))},
        ${input.responsePayload == null ? null : sql.json(toJsonValue(input.responsePayload))},
        ${input.live ?? false},
        ${input.durationMs ?? null},
        ${input.errorCode ?? null},
        ${input.errorMessage ?? null}
      )
    `;

    return true;
  });
}

export async function persistPolicyEvaluation(input: PersistedPolicyEvaluationInput): Promise<boolean> {
  return withRepositorySql("persistPolicyEvaluation", false, async (sql) => {
    await sql`
      insert into frontier_policy_evaluations (
        id,
        mission_id,
        session_id,
        credential_id,
        operator_wallet,
        stage,
        action,
        decision,
        rule_name,
        threshold,
        observed,
        rationale,
        blocked
      )
      values (
        ${input.id ?? createId("policy")},
        ${input.missionId ?? null},
        ${input.sessionId ?? null},
        ${input.credentialId ?? null},
        ${input.operatorWallet ?? null},
        ${input.stage ?? null},
        ${input.action},
        ${input.decision},
        ${input.ruleName ?? null},
        ${sql.json(toJsonValue(input.threshold ?? {}))},
        ${sql.json(toJsonValue(input.observed ?? {}))},
        ${input.rationale ?? null},
        ${input.blocked ?? false}
      )
    `;

    return true;
  });
}

export async function persistPaymentRecord(input: PersistedPaymentRecordInput): Promise<boolean> {
  return withRepositorySql("persistPaymentRecord", false, async (sql) => {
    await sql`
      insert into frontier_payment_events (
        id,
        mission_id,
        session_id,
        credential_id,
        operator_wallet,
        challenge_id,
        merchant,
        resource,
        protocol,
        amount_usd,
        network,
        recipient,
        tx_hash,
        counterparty_trust,
        status,
        live,
        detail
      )
      values (
        ${input.id ?? createId("payment")},
        ${input.missionId ?? null},
        ${input.sessionId ?? null},
        ${input.credentialId ?? null},
        ${input.operatorWallet ?? null},
        ${input.challengeId ?? null},
        ${input.merchant},
        ${input.resource},
        ${input.protocol},
        ${input.amountUsd},
        ${input.network ?? null},
        ${input.recipient ?? null},
        ${input.txHash ?? null},
        ${input.counterpartyTrust ?? null},
        ${input.status},
        ${input.live ?? false},
        ${sql.json(toJsonValue(input.detail ?? {}))}
      )
      on conflict (id) do update
        set session_id = excluded.session_id,
            credential_id = excluded.credential_id,
            operator_wallet = excluded.operator_wallet,
            challenge_id = excluded.challenge_id,
            merchant = excluded.merchant,
            resource = excluded.resource,
            protocol = excluded.protocol,
            amount_usd = excluded.amount_usd,
            network = excluded.network,
            recipient = excluded.recipient,
            tx_hash = excluded.tx_hash,
            counterparty_trust = excluded.counterparty_trust,
            status = excluded.status,
            live = excluded.live,
            detail = excluded.detail
    `;

    return true;
  });
}

export async function persistAuthCeremony(input: PersistedAuthCeremonyInput): Promise<boolean> {
  return withRepositorySql("persistAuthCeremony", false, async (sql) => {
    await sql`
      insert into frontier_auth_ceremonies (
        id,
        ceremony_type,
        status,
        credential_id,
        key_hash,
        username,
        display_name,
        passkey_label,
        operator_wallet,
        vault_address,
        known_credential,
        session_id,
        request_id,
        correlation_id,
        user_agent,
        ip_address,
        rp_id,
        origin,
        duration_ms,
        error_code,
        error_message,
        metadata
      )
      values (
        ${input.id ?? createId("auth")},
        ${input.ceremonyType},
        ${input.status},
        ${input.credentialId ?? null},
        ${input.keyHash ?? null},
        ${input.username ?? null},
        ${input.displayName ?? null},
        ${input.passkeyLabel ?? null},
        ${input.operatorWallet ?? null},
        ${input.vaultAddress ?? null},
        ${input.knownCredential ?? null},
        ${input.sessionId ?? null},
        ${input.requestId ?? null},
        ${input.correlationId ?? null},
        ${input.userAgent ?? null},
        ${input.ipAddress ?? null},
        ${input.rpId ?? null},
        ${input.origin ?? null},
        ${input.durationMs ?? null},
        ${input.errorCode ?? null},
        ${input.errorMessage ?? null},
        ${sql.json(toJsonValue(input.metadata ?? {}))}
      )
    `;

    return true;
  });
}

export async function persistExternalOperation(input: PersistedExternalOperationInput): Promise<boolean> {
  return withRepositorySql("persistExternalOperation", false, async (sql) => {
    await sql`
      insert into frontier_external_operations (
        id,
        mission_id,
        operation_type,
        provider,
        resource,
        network,
        cid,
        uri,
        tx_hash,
        explorer_url,
        live,
        status,
        request_payload,
        response_payload,
        error_message
      )
      values (
        ${input.id ?? createId("external")},
        ${input.missionId ?? null},
        ${input.operationType},
        ${input.provider},
        ${input.resource},
        ${input.network ?? null},
        ${input.cid ?? null},
        ${input.uri ?? null},
        ${input.txHash ?? null},
        ${input.explorerUrl ?? null},
        ${input.live ?? false},
        ${input.status},
        ${input.requestPayload == null ? null : sql.json(toJsonValue(input.requestPayload))},
        ${input.responsePayload == null ? null : sql.json(toJsonValue(input.responsePayload))},
        ${input.errorMessage ?? null}
      )
    `;

    return true;
  });
}

export async function persistRuntimeError(input: PersistedRuntimeErrorInput): Promise<boolean> {
  return withRepositorySql("persistRuntimeError", false, async (sql) => {
    await sql`
      insert into frontier_runtime_errors (
        id,
        mission_id,
        session_id,
        credential_id,
        operator_wallet,
        scope,
        error_name,
        error_message,
        error_code,
        stack_excerpt,
        recoverable,
        detail
      )
      values (
        ${input.id ?? createId("runtime")},
        ${input.missionId ?? null},
        ${input.sessionId ?? null},
        ${input.credentialId ?? null},
        ${input.operatorWallet ?? null},
        ${input.scope},
        ${input.errorName ?? null},
        ${input.errorMessage},
        ${input.errorCode ?? null},
        ${input.stackExcerpt ?? null},
        ${input.recoverable ?? true},
        ${sql.json(toJsonValue(input.detail ?? {}))}
      )
    `;

    return true;
  });
}

export async function persistJobRun(input: PersistedJobRunInput): Promise<boolean> {
  return withRepositorySql("persistJobRun", false, async (sql) => {
    await sql`
      insert into frontier_job_runs (
        id,
        mission_id,
        session_id,
        job_name,
        status,
        attempt,
        started_at,
        finished_at,
        duration_ms,
        detail
      )
      values (
        ${input.id ?? createId("job")},
        ${input.missionId ?? null},
        ${input.sessionId ?? null},
        ${input.jobName},
        ${input.status},
        ${input.attempt ?? 1},
        ${normalizeDate(input.startedAt)},
        ${input.finishedAt ? normalizeDate(input.finishedAt) : null},
        ${input.durationMs ?? null},
        ${sql.json(toJsonValue(input.detail ?? {}))}
      )
    `;

    return true;
  });
}

export async function upsertPasskeyCredential(
  input: PersistedPasskeyCredential | PasskeyCredential,
): Promise<StoredCredentialRow | null> {
  const normalized =
    "credentialId" in input && "operatorWallet" in input
      ? input
      : serializeCredential(input);

  return withRepositorySql("upsertPasskeyCredential", null, async (sql) => {
    const rows = await sql<StoredCredentialRow[]>`
      insert into frontier_passkey_credentials (
        credential_id,
        key_hash,
        public_key_x,
        public_key_y,
        username,
        display_name,
        passkey_label,
        operator_wallet,
        vault_address,
        last_authenticated_at,
        metadata
      )
      values (
        ${normalized.credentialId},
        ${normalized.keyHash},
        ${normalized.publicKeyX},
        ${normalized.publicKeyY},
        ${normalized.username ?? null},
        ${normalized.displayName ?? null},
        ${normalized.passkeyLabel},
        ${normalized.operatorWallet},
        ${normalized.vaultAddress},
        ${normalized.lastAuthenticatedAt},
        ${sql.json(toJsonValue(normalized.metadata ?? {}))}
      )
      on conflict (credential_id) do update
        set key_hash = excluded.key_hash,
            public_key_x = excluded.public_key_x,
            public_key_y = excluded.public_key_y,
            username = coalesce(excluded.username, frontier_passkey_credentials.username),
            display_name = coalesce(excluded.display_name, frontier_passkey_credentials.display_name),
            passkey_label = excluded.passkey_label,
            operator_wallet = excluded.operator_wallet,
            vault_address = excluded.vault_address,
            last_authenticated_at = excluded.last_authenticated_at,
            metadata = frontier_passkey_credentials.metadata || excluded.metadata,
            updated_at = now()
      returning
        credential_id,
        key_hash,
        public_key_x,
        public_key_y,
        username,
        display_name,
        passkey_label,
        operator_wallet,
        vault_address,
        last_authenticated_at
    `;

    return rows[0] ?? null;
  });
}

export async function createAuthSession(input: PersistedAuthSession): Promise<StoredAuthSession | null> {
  return withRepositorySql("createAuthSession", null, async (sql) => {
    const rows = await sql<StoredAuthSession[]>`
      insert into frontier_auth_sessions (
        id,
        credential_id,
        operator_wallet,
        operator_name,
        vault_address,
        session_origin,
        user_agent,
        ip_address,
        expires_at,
        metadata
      )
      values (
        ${input.id},
        ${input.credentialId},
        ${input.operatorWallet},
        ${input.operatorName},
        ${input.vaultAddress},
        ${input.sessionOrigin},
        ${input.userAgent ?? null},
        ${input.ipAddress ?? null},
        ${input.expiresAt},
        ${sql.json(toJsonValue(input.metadata ?? {}))}
      )
      returning
        id,
        credential_id as "credentialId",
        operator_wallet as "operatorWallet",
        operator_name as "operatorName",
        vault_address as "vaultAddress",
        session_origin as "sessionOrigin",
        expires_at as "expiresAt",
        created_at as "createdAt",
        last_seen_at as "lastSeenAt",
        status
    `;

    return rows[0] ?? null;
  });
}

export async function getStoredAuthSession(
  sessionId: string,
): Promise<StoredAuthSession | null> {
  return withRepositorySql("getStoredAuthSession", null, async (sql) => {
    const rows = await sql<StoredAuthSession[]>`
      select
        id,
        credential_id as "credentialId",
        operator_wallet as "operatorWallet",
        operator_name as "operatorName",
        vault_address as "vaultAddress",
        session_origin as "sessionOrigin",
        expires_at as "expiresAt",
        created_at as "createdAt",
        last_seen_at as "lastSeenAt",
        status
      from frontier_auth_sessions
      where id = ${sessionId}
      limit 1
    `;

    return rows[0] ?? null;
  });
}

export async function getStoredCredentialForSession(
  sessionId: string,
): Promise<StoredCredentialRow | null> {
  return withRepositorySql("getStoredCredentialForSession", null, async (sql) => {
    const rows = await sql<StoredCredentialRow[]>`
      select
        c.credential_id,
        c.key_hash,
        c.public_key_x,
        c.public_key_y,
        c.username,
        c.display_name,
        c.passkey_label,
        c.operator_wallet,
        c.vault_address,
        c.last_authenticated_at
      from frontier_auth_sessions s
      join frontier_passkey_credentials c on c.credential_id = s.credential_id
      where s.id = ${sessionId}
        and s.status = 'active'
        and s.expires_at > now()
      limit 1
    `;

    return rows[0] ?? null;
  });
}

export async function getStoredCredential(
  credentialId: string,
): Promise<StoredCredentialRow | null> {
  return withRepositorySql("getStoredCredential", null, async (sql) => {
    const rows = await sql<StoredCredentialRow[]>`
      select
        credential_id,
        key_hash,
        public_key_x,
        public_key_y,
        username,
        display_name,
        passkey_label,
        operator_wallet,
        vault_address,
        last_authenticated_at
      from frontier_passkey_credentials
      where credential_id = ${credentialId}
      limit 1
    `;

    return rows[0] ?? null;
  });
}

export async function getStoredCredentialByKeyHash(
  keyHash: string,
): Promise<StoredCredentialRow | null> {
  return withRepositorySql("getStoredCredentialByKeyHash", null, async (sql) => {
    const rows = await sql<StoredCredentialRow[]>`
      select
        credential_id,
        key_hash,
        public_key_x,
        public_key_y,
        username,
        display_name,
        passkey_label,
        operator_wallet,
        vault_address,
        last_authenticated_at
      from frontier_passkey_credentials
      where key_hash = ${keyHash}
      limit 1
    `;

    return rows[0] ?? null;
  });
}

export async function persistMissionState(state: FrontierState): Promise<boolean> {
  return withRepositorySql("persistMissionState", false, async (sql) => {
    const previousRows = await sql<StoredMissionSnapshotRow[]>`
        select
          mission_id,
          state_json,
          active_stage,
          status
        from frontier_mission_snapshots
        where mission_id = ${state.mission.id}
        limit 1
    `;
    const previousState = previousRows[0]?.state_json ?? null;

    await sql`
        insert into frontier_mission_snapshots (
          mission_id,
          operator_wallet,
          credential_id,
          status,
          active_stage,
          title,
          objective,
          template,
          state_json
        )
        values (
          ${state.mission.id},
          ${state.session.vaultAddress ?? state.session.operatorWallet},
          ${state.session.passkeyCredentialId || null},
          ${state.mission.status},
          ${state.mission.activeStage},
          ${state.mission.title},
          ${state.mission.objective},
          ${state.mission.template},
          ${sql.json(toJsonValue(state))}
        )
        on conflict (mission_id) do update
          set operator_wallet = excluded.operator_wallet,
              credential_id = excluded.credential_id,
              status = excluded.status,
              active_stage = excluded.active_stage,
              title = excluded.title,
              objective = excluded.objective,
              template = excluded.template,
              state_json = excluded.state_json,
              updated_at = now()
    `;

    await sql`
        insert into frontier_state_versions (
          id,
          mission_id,
          operator_wallet,
          credential_id,
          status,
          active_stage,
          title,
          state_json,
          change_summary
        )
        values (
          ${createId("state")},
          ${state.mission.id},
          ${state.session.vaultAddress ?? state.session.operatorWallet},
          ${state.session.passkeyCredentialId || null},
          ${state.mission.status},
          ${state.mission.activeStage},
          ${state.mission.title},
          ${sql.json(toJsonValue(state))},
          ${sql.json(toJsonValue(buildStateChangeSummary(previousState, state)))}
        )
    `;

    for (const event of state.mission.logs) {
      await upsertLogEventSql(sql, state.mission.id, event);
    }

    for (const notification of buildNotifications(state)) {
      await upsertNotificationSql(sql, state.mission.id, notification);
    }

    await upsertExecutionRailSql(sql, {
      missionId: state.mission.id,
      rail: state.mission.execution.rail,
      status: state.mission.execution.status,
      selectorLabel: state.mission.execution.selectorLabel,
      scheduledFor: state.mission.execution.scheduled.scheduledFor,
      nextRunAt:
        state.mission.execution.scheduled.nextRunAt ??
        state.mission.execution.confidentialPolicy.lastEvaluatedAt,
      live:
        state.mission.execution.scheduled.live ||
        state.mission.execution.privateIntent.live ||
        state.mission.execution.confidentialPolicy.live,
      metadata: {
        activeStage: state.mission.activeStage,
      },
    });

    if (state.mission.execution.scheduled.enabled) {
      await upsertFlowScheduleSql(sql, {
        missionId: state.mission.id,
        scheduleId: state.mission.execution.scheduled.scheduleId,
        cadence: state.mission.execution.scheduled.cadence,
        scheduledFor: state.mission.execution.scheduled.scheduledFor,
        nextRunAt: state.mission.execution.scheduled.nextRunAt,
        retryPolicy: state.mission.execution.scheduled.retryPolicy,
        status: state.mission.execution.scheduled.status,
        txHash: state.mission.execution.scheduled.txHash,
        explorerUrl: state.mission.execution.scheduled.explorerUrl,
        handlerAddress: state.mission.execution.scheduled.handlerAddress,
        network: state.mission.execution.scheduled.network,
        live: state.mission.execution.scheduled.live,
        payload: state.mission.execution.scheduled,
      });
    }

    if (state.mission.execution.privateIntent.enabled) {
      await upsertStarknetPrivateIntentSql(sql, {
        missionId: state.mission.id,
        label: state.mission.execution.privateIntent.label,
        commitmentHash: state.mission.execution.privateIntent.commitmentHash,
        nullifier: state.mission.execution.privateIntent.nullifier,
        revealWindowHours: state.mission.execution.privateIntent.revealWindowHours,
        status: state.mission.execution.privateIntent.status,
        txHash: state.mission.execution.privateIntent.txHash,
        revealTxHash: state.mission.execution.privateIntent.revealTxHash,
        explorerUrl: state.mission.execution.privateIntent.explorerUrl,
        network: state.mission.execution.privateIntent.network,
        live: state.mission.execution.privateIntent.live,
        payload: state.mission.execution.privateIntent,
      });
    }

    if (state.mission.execution.confidentialPolicy.enabled) {
      await upsertZamaConfidentialPolicySql(sql, {
        missionId: state.mission.id,
        status: state.mission.execution.confidentialPolicy.status,
        summary: state.mission.execution.confidentialPolicy.summary,
        policyHandle: state.mission.execution.confidentialPolicy.policyHandle,
        aclGrantId: state.mission.execution.confidentialPolicy.aclGrantId,
        evaluatorAddress: state.mission.execution.confidentialPolicy.evaluatorAddress,
        encryptedFields: state.mission.execution.confidentialPolicy.encryptedFields,
        network: state.mission.execution.confidentialPolicy.network,
        live: state.mission.execution.confidentialPolicy.live,
        payload: state.mission.execution.confidentialPolicy,
      });

      for (const [fieldName, handle] of Object.entries(
        state.mission.execution.confidentialPolicy.encryptedValues,
      )) {
        if (!handle) {
          continue;
        }

        await upsertEncryptedPolicyHandleSql(sql, {
          missionId: state.mission.id,
          fieldName,
          handle: Array.isArray(handle) ? handle.join(",") : String(handle),
          aclGrantId: state.mission.execution.confidentialPolicy.aclGrantId,
          network: state.mission.execution.confidentialPolicy.network,
          live: state.mission.execution.confidentialPolicy.live,
          metadata: {
            rail: state.mission.execution.rail,
          },
        });
      }
    }

    for (const transaction of state.mission.execution.chainTransactions) {
      await upsertChainTransactionSql(sql, {
        id: transaction.id,
        missionId: state.mission.id,
        rail: transaction.rail,
        chain: transaction.chain,
        network: transaction.network,
        action: transaction.action,
        status: transaction.status,
        txHash: transaction.txHash,
        explorerUrl: transaction.explorerUrl,
        live: transaction.live,
        metadata: transaction.metadata,
        createdAt: transaction.createdAt,
      });
    }

    for (const payment of state.mission.payments) {
      await sql`
          insert into frontier_payment_events (
            id,
            mission_id,
            session_id,
            credential_id,
            operator_wallet,
            challenge_id,
            merchant,
            resource,
            protocol,
            amount_usd,
            network,
            recipient,
            tx_hash,
            counterparty_trust,
            status,
            live,
            detail
          )
          values (
            ${payment.id},
            ${state.mission.id},
            ${state.session.sessionId ?? null},
            ${state.session.passkeyCredentialId || null},
            ${state.session.vaultAddress ?? state.session.operatorWallet},
            ${payment.challengeId ?? null},
            ${payment.merchant},
            ${payment.resource},
            ${payment.protocol},
            ${payment.amountUsd},
            ${payment.network},
            ${null},
            ${payment.txHash ?? null},
            ${payment.counterpartyTrust},
            ${payment.status},
            ${false},
            ${sql.json(
              toJsonValue({
                source: "mission-state",
                createdAt: payment.createdAt,
              }),
            )}
          )
          on conflict (id) do update
            set tx_hash = excluded.tx_hash,
                counterparty_trust = excluded.counterparty_trust,
                status = excluded.status,
                detail = excluded.detail
      `;
    }

    for (const dispute of state.mission.disputes) {
      await sql`
          insert into frontier_disputes (
            id,
            mission_id,
            title,
            severity,
            status,
            violated_policy,
            description,
            recommended_action,
            resolution,
            metadata,
            created_at
          )
          values (
            ${dispute.id},
            ${state.mission.id},
            ${dispute.title},
            ${dispute.severity},
            ${dispute.status},
            ${dispute.violatedPolicy},
            ${dispute.description},
            ${dispute.recommendedAction},
            ${dispute.resolution ?? null},
            ${sql.json(toJsonValue({ source: "mission-state" }))},
            ${normalizeDate(dispute.createdAt)}
          )
          on conflict (id) do update
            set title = excluded.title,
                severity = excluded.severity,
                status = excluded.status,
                violated_policy = excluded.violated_policy,
                description = excluded.description,
                recommended_action = excluded.recommended_action,
                resolution = excluded.resolution,
                metadata = excluded.metadata,
                updated_at = now()
      `;
    }

    const previousStageMap = new Map(
      previousState?.mission.stages.map((stage) => [stage.key, stage.status]) ?? [],
    );
    const previousDisputeMap = new Map(
      previousState?.mission.disputes.map((dispute) => [dispute.id, dispute]) ?? [],
    );

    if (previousState?.mission.activeStage !== state.mission.activeStage) {
      const stageEventId = createStableId(
        "stage",
        state.mission.id,
        previousState?.mission.activeStage ?? "none",
        state.mission.activeStage,
        state.lastUpdatedAt,
      );
      const stageLog = [...state.mission.logs]
        .reverse()
        .find((event) => event.stage === state.mission.activeStage);

      await sql`
          insert into frontier_mission_stage_events (
            id,
            mission_id,
            stage,
            previous_stage,
            previous_status,
            next_status,
            actor_type,
            reason,
            detail
          )
          values (
            ${stageEventId},
            ${state.mission.id},
            ${state.mission.activeStage},
            ${previousState?.mission.activeStage ?? null},
            ${previousStageMap.get(state.mission.activeStage) ?? null},
            ${state.mission.stages.find((stage) => stage.key === state.mission.activeStage)?.status ?? "active"},
            ${stageLog?.actor ?? "system"},
            ${stageLog?.message ?? "Mission stage advanced."},
            ${sql.json(toJsonValue({ title: stageLog?.title ?? null }))}
          )
          on conflict (id) do nothing
      `;
    }

    for (const stage of state.mission.stages) {
      const previousStatus = previousStageMap.get(stage.key);
      if (previousStatus && previousStatus !== stage.status) {
        const stageEventId = createStableId(
          "stage-status",
          state.mission.id,
          stage.key,
          previousStatus,
          stage.status,
          state.lastUpdatedAt,
        );
        await sql`
            insert into frontier_mission_stage_events (
              id,
              mission_id,
              stage,
              previous_stage,
              previous_status,
              next_status,
              actor_type,
              reason,
              detail
            )
            values (
              ${stageEventId},
              ${state.mission.id},
              ${stage.key},
              ${previousState?.mission.activeStage ?? null},
              ${previousStatus},
              ${stage.status},
              ${"system"},
              ${`Stage status changed from ${previousStatus} to ${stage.status}.`},
              ${sql.json(toJsonValue({ source: "snapshot-diff" }))}
            )
            on conflict (id) do nothing
        `;
      }
    }

    for (const dispute of state.mission.disputes) {
      const previousDispute = previousDisputeMap.get(dispute.id);
      if (
        !previousDispute ||
        previousDispute.status !== dispute.status ||
        previousDispute.resolution !== dispute.resolution
      ) {
        const eventId = createStableId(
          "dispute-event",
          dispute.id,
          dispute.status,
          dispute.resolution ?? "none",
        );
        await sql`
            insert into frontier_dispute_events (
              id,
              dispute_id,
              mission_id,
              action,
              status,
              resolution,
              actor_type,
              detail
            )
            values (
              ${eventId},
              ${dispute.id},
              ${state.mission.id},
              ${previousDispute ? "updated" : "created"},
              ${dispute.status},
              ${dispute.resolution ?? null},
              ${previousDispute ? "operator" : "policy"},
              ${sql.json(
                toJsonValue({
                  previousStatus: previousDispute?.status ?? null,
                  previousResolution: previousDispute?.resolution ?? null,
                }),
              )}
            )
            on conflict (id) do nothing
        `;
      }
    }

    for (const event of newLogEvents(previousState, state).filter((item) => item.actor === "operator")) {
      await sql`
          insert into frontier_operator_actions (
            id,
            mission_id,
            session_id,
            credential_id,
            operator_wallet,
            action,
            target_type,
            target_id,
            outcome,
            detail
          )
          values (
            ${createStableId("operator", event.id)},
            ${state.mission.id},
            ${state.session.sessionId ?? null},
            ${state.session.passkeyCredentialId || null},
            ${state.session.vaultAddress ?? state.session.operatorWallet},
            ${event.title},
            ${"stage"},
            ${event.stage},
            ${event.level},
            ${sql.json(toJsonValue({ message: event.message, tags: event.tags ?? [] }))}
          )
          on conflict (id) do nothing
      `;
    }

    if (state.error && state.error !== previousState?.error) {
      await sql`
          insert into frontier_runtime_errors (
            id,
            mission_id,
            session_id,
            credential_id,
            operator_wallet,
            scope,
            error_name,
            error_message,
            error_code,
            stack_excerpt,
            recoverable,
            detail
          )
          values (
            ${createStableId("runtime", state.mission.id, state.error, state.lastUpdatedAt)},
            ${state.mission.id},
            ${state.session.sessionId ?? null},
            ${state.session.passkeyCredentialId || null},
            ${state.session.vaultAddress ?? state.session.operatorWallet},
            ${"frontier-state"},
            ${"MissionStateError"},
            ${state.error},
            ${null},
            ${null},
            ${true},
            ${sql.json(toJsonValue({ loading: state.loading }))}
          )
          on conflict (id) do nothing
      `;
    }

    await sql`
        insert into frontier_audit_events (
          id,
          event_type,
          action,
          source,
          status,
          mission_id,
          session_id,
          credential_id,
          operator_wallet,
          actor_type,
          resource,
          metadata
        )
        values (
          ${createId("audit")},
          ${"state_sync"},
          ${"persist_mission_state"},
          ${"api/frontier/state"},
          ${"success"},
          ${state.mission.id},
          ${state.session.sessionId ?? null},
          ${state.session.passkeyCredentialId || null},
          ${state.session.vaultAddress ?? state.session.operatorWallet},
          ${"system"},
          ${"/api/frontier/state"},
          ${sql.json(toJsonValue(buildStateChangeSummary(previousState, state)))}
        )
    `;

    return true;
  });
}

export async function persistArtifact(input: PersistedArtifactInput): Promise<boolean> {
  const { contentJson, contentText } = splitPayload(input.payload);
  const artifactId = createId("artifact");

  return withRepositorySql("persistArtifact", false, async (sql) => {
    await sql`
      insert into frontier_evidence_files (
        id,
        mission_id,
        artifact_name,
        artifact_type,
        provider,
        network,
        status,
        cid,
        uri,
        tx_hash,
        content_json,
        content_text,
        metadata
      )
      values (
        ${artifactId},
        ${input.missionId ?? null},
        ${input.artifactName},
        ${input.artifactType},
        ${input.provider},
        ${input.network ?? null},
        ${input.status},
        ${input.cid ?? null},
        ${input.uri ?? null},
        ${input.txHash ?? null},
        ${contentJson == null ? null : sql.json(toJsonValue(contentJson))},
        ${contentText},
        ${sql.json(toJsonValue(input.metadata ?? {}))}
      )
    `;

    return true;
  });
}

export async function persistMemoryRecord(input: PersistedMemoryInput): Promise<boolean> {
  return withRepositorySql("persistMemoryRecord", false, async (sql) => {
    await sql`
      insert into frontier_memory_records (
        id,
        mission_id,
        record_type,
        cid,
        provider,
        network,
        ucan_delegation,
        payload
      )
      values (
        ${createId("memory")},
        ${input.missionId},
        ${input.recordType},
        ${input.cid ?? null},
        ${input.provider},
        ${input.network ?? null},
        ${input.ucanDelegation ?? null},
        ${sql.json(toJsonValue(input.payload))}
      )
    `;

    return true;
  });
}

export async function persistExecutionRail(
  input: PersistedExecutionRailInput,
): Promise<boolean> {
  return withRepositorySql("persistExecutionRail", false, async (sql) => {
    await upsertExecutionRailSql(sql, input);
    return true;
  });
}

export async function persistFlowSchedule(
  input: PersistedFlowScheduleInput,
): Promise<boolean> {
  return withRepositorySql("persistFlowSchedule", false, async (sql) => {
    await upsertFlowScheduleSql(sql, input);
    return true;
  });
}

export async function persistStarknetPrivateIntent(
  input: PersistedStarknetPrivateIntentInput,
): Promise<boolean> {
  return withRepositorySql("persistStarknetPrivateIntent", false, async (sql) => {
    await upsertStarknetPrivateIntentSql(sql, input);
    return true;
  });
}

export async function persistZamaConfidentialPolicy(
  input: PersistedZamaConfidentialPolicyInput,
): Promise<boolean> {
  return withRepositorySql("persistZamaConfidentialPolicy", false, async (sql) => {
    await upsertZamaConfidentialPolicySql(sql, input);
    return true;
  });
}

export async function persistChainTransaction(
  input: PersistedChainTransactionInput,
): Promise<boolean> {
  return withRepositorySql("persistChainTransaction", false, async (sql) => {
    await upsertChainTransactionSql(sql, input);
    return true;
  });
}

export async function persistEncryptedPolicyHandle(
  input: PersistedEncryptedPolicyHandleInput,
): Promise<boolean> {
  return withRepositorySql("persistEncryptedPolicyHandle", false, async (sql) => {
    await upsertEncryptedPolicyHandleSql(sql, input);
    return true;
  });
}

export async function persistAgentRegistration(
  input: PersistedAgentRegistrationInput,
): Promise<boolean> {
  return withRepositorySql("persistAgentRegistration", false, async (sql) => {
    await sql`
      insert into frontier_agent_registrations (
        mission_id,
        agent_id,
        onchain_agent_id,
        erc8004_identity,
        registry,
        network,
        registration_tx_hash,
        explorer_url,
        registration_file_uri,
        canonical_uai,
        live,
        payload
      )
      values (
        ${input.missionId},
        ${input.agentId},
        ${input.onchainAgentId ?? null},
        ${input.erc8004Identity},
        ${input.registry},
        ${input.network},
        ${input.registrationTxHash},
        ${input.explorerUrl},
        ${input.registrationFileUri},
        ${input.canonicalUAI},
        ${input.live},
        ${sql.json(toJsonValue(input.payload))}
      )
      on conflict (mission_id) do update
        set agent_id = excluded.agent_id,
            onchain_agent_id = excluded.onchain_agent_id,
            erc8004_identity = excluded.erc8004_identity,
            registry = excluded.registry,
            network = excluded.network,
            registration_tx_hash = excluded.registration_tx_hash,
            explorer_url = excluded.explorer_url,
            registration_file_uri = excluded.registration_file_uri,
            canonical_uai = excluded.canonical_uai,
            live = excluded.live,
            payload = excluded.payload,
            updated_at = now()
    `;

    return true;
  });
}

export async function persistFeedbackEvent(input: PersistedFeedbackInput): Promise<boolean> {
  return withRepositorySql("persistFeedbackEvent", false, async (sql) => {
    await sql`
      insert into frontier_feedback_events (
        id,
        mission_id,
        agent_id,
        rating,
        notes,
        tx_hash,
        explorer_url,
        updated_score,
        delta,
        live,
        payload
      )
      values (
        ${createId("feedback")},
        ${input.missionId},
        ${input.agentId ?? null},
        ${input.rating},
        ${input.notes},
        ${input.txHash},
        ${input.explorerUrl},
        ${input.updatedScore},
        ${input.delta},
        ${input.live},
        ${sql.json(toJsonValue(input.payload))}
      )
    `;

    return true;
  });
}
