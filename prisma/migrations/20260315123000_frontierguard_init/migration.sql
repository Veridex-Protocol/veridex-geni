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
