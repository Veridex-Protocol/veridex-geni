# Implementation Checklist: Veridex FrontierGuard Network

This document tracks the conversion of all HTML/Tailwind designs from the `@designs` directory into our Next.js architecture. The tasks are grouped according to the core screens defined in our `USER_FLOW.md`.

## Core Pages & User Flow Integration

### 1. Landing Page
- [x] **Product Landing Page** (`product_landing_page`)
  - Converted to `src/app/page.tsx`
  - Integrated `globals.css` with Tailwind v4 `@theme`
  - Styled with custom fonts (Inter, JetBrains Mono)

### 2. Authentication & Login
*Flow: Operator passkey authorization to establish bounded agent session.*
- [x] **Login Primary Auth** (`login_primary_auth`)
  - Converted to `src/app/login/page.tsx`
- [x] **Login Awaiting Signature** (`login_awaiting_signature`)
  - Route: `/login/awaiting-signature`
- [x] **Login Session Initialized** (`login_session_initialized`)
  - Route: `/login/session-initialized`
- [x] *Mobile refinements (`_mobile_theme_refinement` variants)*
  - `login_primary_auth_mobile_theme_refinement`
  - `login_awaiting_signature_mobile_theme_refinement`
  - `login_session_initialized_mobile_theme_refinement`

### 3. Mission Control (Flow A: Mission Launch)
*Flow: Operator sets budget, constraints, tools, and signs execution.*
- [x] **Mission Launch Configuration** (`mission_launch_configuration`)
  - Route: `/mission/launch`
- [x] **Overview Command Center** (`overview_command_center`)
  - Route: `/mission/overview`

### 4. Active Mission & Telemetry (Flow B, C, D)
*Flow: Agent decomposes task, discovers endpoints, checks trust policies, and executes.*
- [x] **Active Mission View** (`active_mission_view`)
  - Route: `/mission/active`
- [x] **Agent Manifest (`agent.json`)** (`agent_manifest_agent.json`)
- [x] **Agent Trust Profile** (`agent_trust_profile`)
  - Route: `/mission/trust-profile`
- [x] **Policy & Risk States** (`interaction_policy_risk_states`)
  - Route: `/mission/policies`
- [x] **Passkey Auth States** (`interaction_passkey_auth_states`)
  - Route: `/mission/launch/passkey`
- [x] **Global Status Alerts** (`interaction_global_status_alerts`)

### 5. Shared Memory (Flow B, D)
*Flow: Agents collaborate via shared Storacha state.*
- [x] **Shared Memory Task Board** (`shared_memory_task_board`)
  - Route: `/mission/memory`
- [x] **Memory Handoff & Sync** (`interaction_memory_handoff_sync`)
- [x] **Memory Version History** (`interaction_memory_version_history`)

### 6. Execution & Logs (Flow E)
*Flow: Appends structured logs to `agent_log.json` on execution.*
- [x] **Execution Log Viewer** (`execution_log_viewer`)
  - Route: `/logs`
- [x] **Execution Stream Detail** (`interaction_execution_stream_detail`)
- [x] **Log Filter & Search** (`interaction_log_filter_search`)

### 7. Verification, Receipts & Evidence (Flow E, F)
*Flow: Evidence bundle pinned to Filecoin, Auditor verifies outcome.*
- [x] **Receipts & Evidence View** (`receipts_evidence_view`)
  - Route: `/receipts`
- [x] **Receipt Forensic Detail** (`interaction_receipt_forensic_detail`)
- [x] **Evidence Assembly** (`interaction_evidence_assembly`)
- [x] **Filecoin Pinning Flow** (`interaction_filecoin_pinning_flow`)
- [x] **Reputation Feedback Flow** (`interaction_reputation_feedback_flow`)

### 8. Dispute & Error Escalation (Error Flow)
*Flow: Action blocked, failure logged, operator alerted.*
- [x] **Dispute Incident Review** (`dispute_incident_review`)
  - Route: `/dispute`
- [x] **Incident Resolution Flow** (`interaction_incident_resolution_flow`)

---

## Instructions for Next.js Developers
- Review HTML in `@designs/<folder_name>/code.html`.
- Convert UI to React components in `src/components/` and routes in `src/app/`.
- Wire views matching Next.js App Router conventions.
- Use `globals.css` base variables and layout font imports to ensure visual consistency.
