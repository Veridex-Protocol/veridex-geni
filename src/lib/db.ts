import dns from "node:dns";
import postgres from "postgres";

try {
  dns.setDefaultResultOrder("ipv4first");
} catch {
  // Older Node runtimes may not expose this API.
}

let sqlInstance: postgres.Sql | null = null;
let schemaPromise: Promise<void> | null = null;
let lastDatabaseWarningAt = 0;

const FRONTIER_SCHEMA_SQL = `
  create table if not exists frontier_passkey_credentials (
    credential_id text primary key,
    key_hash text not null unique,
    public_key_x text not null,
    public_key_y text not null,
    username text,
    display_name text,
    passkey_label text,
    operator_wallet text not null,
    vault_address text not null,
    last_authenticated_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    metadata jsonb not null default '{}'::jsonb
  );

  create index if not exists frontier_passkey_credentials_wallet_idx
    on frontier_passkey_credentials(operator_wallet);

  create table if not exists frontier_auth_sessions (
    id text primary key,
    credential_id text not null references frontier_passkey_credentials(credential_id) on delete cascade,
    operator_wallet text not null,
    operator_name text not null,
    vault_address text not null,
    session_origin text not null,
    user_agent text,
    ip_address text,
    status text not null default 'active',
    created_at timestamptz not null default now(),
    last_seen_at timestamptz not null default now(),
    expires_at timestamptz not null,
    metadata jsonb not null default '{}'::jsonb
  );

  create index if not exists frontier_auth_sessions_wallet_idx
    on frontier_auth_sessions(operator_wallet, created_at desc);

  create table if not exists frontier_mission_snapshots (
    mission_id text primary key,
    operator_wallet text not null,
    credential_id text,
    status text not null,
    active_stage text not null,
    title text not null,
    objective text not null,
    template text not null,
    state_json jsonb not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  create index if not exists frontier_mission_snapshots_wallet_idx
    on frontier_mission_snapshots(operator_wallet, updated_at desc);

  create table if not exists frontier_evidence_files (
    id text primary key,
    mission_id text,
    artifact_name text not null,
    artifact_type text not null,
    provider text not null,
    network text,
    status text not null default 'draft',
    cid text,
    uri text,
    tx_hash text,
    content_json jsonb,
    content_text text,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  create index if not exists frontier_evidence_files_mission_idx
    on frontier_evidence_files(mission_id, created_at desc);

  create table if not exists frontier_memory_records (
    id text primary key,
    mission_id text not null,
    record_type text not null,
    cid text,
    provider text not null,
    network text,
    ucan_delegation text,
    payload jsonb not null,
    created_at timestamptz not null default now()
  );

  create index if not exists frontier_memory_records_mission_idx
    on frontier_memory_records(mission_id, created_at desc);

  create table if not exists frontier_agent_registrations (
    mission_id text primary key,
    agent_id text not null,
    onchain_agent_id text,
    erc8004_identity text not null,
    registry text not null,
    network text not null,
    registration_tx_hash text not null,
    explorer_url text not null,
    registration_file_uri text not null,
    canonical_uai text not null,
    live boolean not null default false,
    payload jsonb not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  create table if not exists frontier_feedback_events (
    id text primary key,
    mission_id text not null,
    agent_id text,
    rating numeric(5,2) not null,
    notes text not null,
    tx_hash text not null,
    explorer_url text not null,
    updated_score numeric(8,2) not null,
    delta numeric(8,2) not null,
    live boolean not null default false,
    payload jsonb not null,
    created_at timestamptz not null default now()
  );

  create table if not exists frontier_audit_events (
    id text primary key,
    event_type text not null,
    action text not null,
    source text not null,
    status text not null,
    request_id text,
    correlation_id text,
    mission_id text,
    session_id text,
    credential_id text,
    operator_wallet text,
    actor_type text,
    actor_id text,
    resource text,
    duration_ms integer,
    error_code text,
    error_message text,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
  );

  create index if not exists frontier_audit_events_mission_idx
    on frontier_audit_events(mission_id, created_at desc);

  create index if not exists frontier_audit_events_request_idx
    on frontier_audit_events(request_id);

  create table if not exists frontier_log_events (
    id text primary key,
    mission_id text not null,
    timestamp timestamptz not null,
    level text not null,
    actor text not null,
    stage text not null,
    title text not null,
    message text not null,
    code text,
    tags jsonb not null default '[]'::jsonb,
    detail jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
  );

  create index if not exists frontier_log_events_mission_idx
    on frontier_log_events(mission_id, timestamp desc);

  create table if not exists frontier_mission_stage_events (
    id text primary key,
    mission_id text not null,
    stage text not null,
    previous_stage text,
    previous_status text,
    next_status text not null,
    actor_type text,
    reason text,
    detail jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
  );

  create index if not exists frontier_mission_stage_events_mission_idx
    on frontier_mission_stage_events(mission_id, created_at desc);

  create table if not exists frontier_tool_invocations (
    id text primary key,
    mission_id text,
    session_id text,
    credential_id text,
    operator_wallet text,
    tool_name text not null,
    operation text not null,
    endpoint text,
    provider text,
    attempt integer not null default 1,
    status text not null,
    request_payload jsonb,
    response_payload jsonb,
    live boolean not null default false,
    duration_ms integer,
    error_code text,
    error_message text,
    created_at timestamptz not null default now()
  );

  create index if not exists frontier_tool_invocations_mission_idx
    on frontier_tool_invocations(mission_id, created_at desc);

  create table if not exists frontier_policy_evaluations (
    id text primary key,
    mission_id text,
    session_id text,
    credential_id text,
    operator_wallet text,
    stage text,
    action text not null,
    decision text not null,
    rule_name text,
    threshold jsonb not null default '{}'::jsonb,
    observed jsonb not null default '{}'::jsonb,
    rationale text,
    blocked boolean not null default false,
    created_at timestamptz not null default now()
  );

  create index if not exists frontier_policy_evaluations_mission_idx
    on frontier_policy_evaluations(mission_id, created_at desc);

  create table if not exists frontier_payment_events (
    id text primary key,
    mission_id text,
    session_id text,
    credential_id text,
    operator_wallet text,
    challenge_id text,
    merchant text not null,
    resource text not null,
    protocol text not null,
    amount_usd numeric(12, 2) not null,
    network text,
    recipient text,
    tx_hash text,
    counterparty_trust numeric(8, 2),
    status text not null,
    live boolean not null default false,
    detail jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
  );

  create index if not exists frontier_payment_events_mission_idx
    on frontier_payment_events(mission_id, created_at desc);

  create table if not exists frontier_auth_ceremonies (
    id text primary key,
    ceremony_type text not null,
    status text not null,
    credential_id text,
    key_hash text,
    username text,
    display_name text,
    passkey_label text,
    operator_wallet text,
    vault_address text,
    known_credential boolean,
    session_id text,
    request_id text,
    correlation_id text,
    user_agent text,
    ip_address text,
    rp_id text,
    origin text,
    duration_ms integer,
    error_code text,
    error_message text,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
  );

  create index if not exists frontier_auth_ceremonies_credential_idx
    on frontier_auth_ceremonies(credential_id, created_at desc);

  create table if not exists frontier_external_operations (
    id text primary key,
    mission_id text,
    operation_type text not null,
    provider text not null,
    resource text not null,
    network text,
    cid text,
    uri text,
    tx_hash text,
    explorer_url text,
    live boolean not null default false,
    status text not null,
    request_payload jsonb,
    response_payload jsonb,
    error_message text,
    created_at timestamptz not null default now()
  );

  create index if not exists frontier_external_operations_mission_idx
    on frontier_external_operations(mission_id, created_at desc);

  create table if not exists frontier_notifications (
    id text primary key,
    mission_id text not null,
    kind text not null,
    title text not null,
    message text not null,
    timestamp timestamptz not null,
    action_label text,
    href text,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  create index if not exists frontier_notifications_mission_idx
    on frontier_notifications(mission_id, updated_at desc);

  create table if not exists frontier_disputes (
    id text primary key,
    mission_id text not null,
    title text not null,
    severity text not null,
    status text not null,
    violated_policy text not null,
    description text not null,
    recommended_action text not null,
    resolution text,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null,
    updated_at timestamptz not null default now()
  );

  create index if not exists frontier_disputes_mission_idx
    on frontier_disputes(mission_id, updated_at desc);

  create table if not exists frontier_dispute_events (
    id text primary key,
    dispute_id text not null,
    mission_id text not null,
    action text not null,
    status text not null,
    resolution text,
    actor_type text,
    detail jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
  );

  create index if not exists frontier_dispute_events_dispute_idx
    on frontier_dispute_events(dispute_id, created_at desc);

  create table if not exists frontier_runtime_errors (
    id text primary key,
    mission_id text,
    session_id text,
    credential_id text,
    operator_wallet text,
    scope text not null,
    error_name text,
    error_message text not null,
    error_code text,
    stack_excerpt text,
    recoverable boolean not null default true,
    detail jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
  );

  create index if not exists frontier_runtime_errors_mission_idx
    on frontier_runtime_errors(mission_id, created_at desc);

  create table if not exists frontier_job_runs (
    id text primary key,
    mission_id text,
    session_id text,
    job_name text not null,
    status text not null,
    attempt integer not null default 1,
    started_at timestamptz not null,
    finished_at timestamptz,
    duration_ms integer,
    detail jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
  );

  create index if not exists frontier_job_runs_mission_idx
    on frontier_job_runs(mission_id, created_at desc);

  create table if not exists frontier_state_versions (
    id text primary key,
    mission_id text not null,
    operator_wallet text not null,
    credential_id text,
    status text not null,
    active_stage text not null,
    title text not null,
    state_json jsonb not null,
    change_summary jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
  );

  create index if not exists frontier_state_versions_mission_idx
    on frontier_state_versions(mission_id, created_at desc);

  create table if not exists frontier_operator_actions (
    id text primary key,
    mission_id text,
    session_id text,
    credential_id text,
    operator_wallet text,
    action text not null,
    target_type text,
    target_id text,
    outcome text not null,
    detail jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
  );

  create index if not exists frontier_operator_actions_mission_idx
    on frontier_operator_actions(mission_id, created_at desc);

  create table if not exists frontier_execution_rails (
    mission_id text primary key,
    rail text not null,
    status text not null,
    selector_label text not null,
    scheduled_for timestamptz,
    next_run_at timestamptz,
    live boolean not null default false,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  create table if not exists frontier_flow_schedules (
    mission_id text primary key,
    schedule_id text,
    cadence text not null,
    scheduled_for timestamptz,
    next_run_at timestamptz,
    retry_policy text not null,
    status text not null,
    tx_hash text,
    explorer_url text,
    handler_address text,
    network text,
    live boolean not null default false,
    payload jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  create table if not exists frontier_starknet_private_intents (
    mission_id text primary key,
    label text not null,
    commitment_hash text,
    nullifier text,
    reveal_window_hours integer not null,
    status text not null,
    tx_hash text,
    reveal_tx_hash text,
    explorer_url text,
    network text,
    live boolean not null default false,
    payload jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  create table if not exists frontier_zama_confidential_policies (
    mission_id text primary key,
    status text not null,
    summary text not null,
    policy_handle text,
    acl_grant_id text,
    evaluator_address text,
    encrypted_fields jsonb not null default '[]'::jsonb,
    network text,
    live boolean not null default false,
    payload jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  create table if not exists frontier_chain_transactions (
    id text primary key,
    mission_id text not null,
    rail text not null,
    chain text not null,
    network text not null,
    action text not null,
    status text not null,
    tx_hash text not null,
    explorer_url text,
    live boolean not null default false,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
  );

  create index if not exists frontier_chain_transactions_mission_idx
    on frontier_chain_transactions(mission_id, created_at desc);

  create table if not exists frontier_encrypted_policy_handles (
    id text primary key,
    mission_id text not null,
    field_name text not null,
    handle text not null,
    acl_grant_id text,
    network text,
    live boolean not null default false,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
  );

  create index if not exists frontier_encrypted_policy_handles_mission_idx
    on frontier_encrypted_policy_handles(mission_id, created_at desc);
`;

function shouldUseSsl(connectionString: string): boolean {
  const lower = connectionString.toLowerCase();
  return !(
    lower.includes("localhost") ||
    lower.includes("127.0.0.1") ||
    lower.includes("postgresql://localhost") ||
    lower.includes("postgres://localhost")
  );
}

function shouldBootstrapSchema(): boolean {
  return process.env.FRONTIER_DB_BOOTSTRAP_SCHEMA === "true";
}

export function getDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL ?? process.env.FRONTIER_DATABASE_URL;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(getDatabaseUrl());
}

export function getSql(): postgres.Sql | null {
  const connectionString = getDatabaseUrl();

  if (!connectionString) {
    return null;
  }

  if (!sqlInstance) {
    sqlInstance = postgres(connectionString, {
      ssl: shouldUseSsl(connectionString) ? "require" : undefined,
      max: 5,
      idle_timeout: 20,
      connect_timeout: 20,
      prepare: false,
    });
  }

  return sqlInstance;
}

function warnDatabaseUnavailable(error: unknown): void {
  const now = Date.now();
  if (now - lastDatabaseWarningAt < 10_000) {
    return;
  }

  lastDatabaseWarningAt = now;

  const detail = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  console.warn(`[frontierguard] Database unavailable, continuing without persistence. ${detail}`);
}

export async function ensureDatabaseReady(): Promise<postgres.Sql | null> {
  try {
    const sql = getSql();

    if (!sql) {
      return null;
    }

    if (!schemaPromise) {
      schemaPromise = (async () => {
        if (shouldBootstrapSchema()) {
          await sql.unsafe(FRONTIER_SCHEMA_SQL);
          return;
        }

        await sql`select 1`;
      })().catch((error) => {
        schemaPromise = null;
        throw error;
      });
    }

    await schemaPromise;
    return sql;
  } catch (error) {
    warnDatabaseUnavailable(error);

    const current = sqlInstance;
    schemaPromise = null;
    sqlInstance = null;

    if (current) {
      void current.end({ timeout: 1 }).catch(() => undefined);
    }

    return null;
  }
}
