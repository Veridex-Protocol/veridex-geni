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
