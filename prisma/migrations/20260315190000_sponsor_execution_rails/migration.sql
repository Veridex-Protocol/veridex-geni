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
