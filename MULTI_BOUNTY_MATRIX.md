# Multi-Bounty Matrix

## Flagship Submission

**Project Name:** `Veridex FrontierGuard Network`  
**Submission Type:** `Existing Code`

## Core Story

FrontierGuard turns Veridex into a multi-agent trust and execution network:

- operators authorize an agent with a passkey and strict policy limits
- the agent discovers and plans work autonomously
- specialist agents coordinate using shared Storacha-backed state
- all paid actions use Veridex machine-payment rails
- every run emits structured logs, receipts, and evidence
- agents build portable trust through ERC-8004 identity and reputation

## Theoretical Prize Stack

If multi-bounty qualification and stacking are allowed, this concept can plausibly target:

| Bounty | Top Prize | Priority | Why It Fits |
|---|---:|---|---|
| Existing Code | $5,000 | P0 | Direct extension of the existing Veridex stack |
| Agents With Receipts — 8004 | $4,000 | P0 | ERC-8004 identity, reputation, manifests, receipts |
| Agent Only : Let the agent cook | $4,000 | P0 | Discover → plan → execute → verify → submit loop |
| AI & Robotics | $3,000 | P1 | Safe, accountable multi-agent execution |
| Infrastructure & Digital Rights | $3,000 | P1 | User-owned identity, durable evidence, portable trust |
| Crypto | $3,000 | P1 | Agent payments, economic coordination, treasury controls |
| Filecoin | $1,250 | P0 | Filecoin Pin-backed manifests and evidence bundles |
| Hypercerts | $1,500 | P3 | Optional impact/mission attestations |
| Community Vote | $1,000 | P1 | Strong public demo + clear X thread narrative |
| Storacha | $200 | P0 | Shared state, UCAN-based delegation, multi-agent memory |

**Total theoretical upside:** `$25,950`  
This is not a forecast. It is the maximum visible upside if one project qualifies and wins top slots across the compatible stack.

## Qualification Matrix

### 1. Existing Code

**Fit:** excellent

**Why:**

- Uses and extends current Veridex protocol, demo, and agent surfaces
- Adds meaningful new work instead of a cosmetic wrapper

**Must Show:**

- clear before/after delta from existing repo capabilities
- new modules or integrations with obvious product impact
- working demo, not just docs

**Best Proof Points:**

- ERC-8004 integration
- Filecoin evidence layer
- Storacha shared memory
- `agent.json` and `agent_log.json`

### 2. Agents With Receipts — 8004

**Fit:** excellent

**Why:**

- FrontierGuard can center the whole agent network around ERC-8004
- receipts, identity, and reputation are first-class to the product

**Must Show:**

- real ERC-8004 identity registration
- real onchain interactions with identity and reputation registries
- `agent.json`
- `agent_log.json`
- verifiable transaction links

**Demo Hook:**

- operator launches an agent
- agent identity is minted / registered
- agent completes a paid task
- system posts reputation feedback and shows receipt trail

### 3. Agent Only : Let the agent cook

**Fit:** excellent

**Why:**

- the repo already supports agentic execution framing
- FrontierGuard can demonstrate a full autonomous loop with minimal human intervention after launch

**Must Show:**

- autonomous discovery
- planning
- execution
- retries / self-correction
- verification
- safety checks
- compute budget awareness

**Demo Hook:**

- user gives one mission
- planner agent decomposes it
- specialist agents execute
- auditor agent validates and finalizes

### 4. Filecoin

**Fit:** strong

**Why:**

- Filecoin Pin can store agent registration files, execution logs, and dispute bundles
- this is already aligned with Veridex's liability and audit thesis

**Must Show:**

- meaningful use of **Filecoin Pin** or Synapse SDK
- deployment or meaningful interaction on **Filecoin Calibration**
- working demo

**Recommended Implementation:**

- pin `agent.json`
- pin evidence bundles and mission trace artifacts
- write a Calibration-linked proof pointer or registry entry for the latest bundle

### 5. Storacha

**Fit:** strong

**Why:**

- Storacha is a natural home for shared multi-agent state
- UCAN delegation fits agent handoffs well

**Must Show:**

- agent memory or shared coordination state on Storacha
- useful UCAN-based sharing / delegation
- at least one visible multi-agent collaboration flow

**Recommended Implementation:**

- task queue
- shared research cache
- execution summaries
- handoff state between planner, executor, and auditor agents

### 6. AI & Robotics

**Fit:** strong

**Why:**

- the strongest interpretation is “safe, accountable, collaborative AI systems”
- you do not need physical robots to fit the track if the agent system is serious and safety-forward

**Must Show:**

- real autonomy
- visible oversight / controls
- trustworthy tool use
- auditability

**Recommended Framing:**

- “frontier operations control plane” for high-stakes autonomous systems

### 7. Infrastructure & Digital Rights

**Fit:** strong

**Why:**

- user-owned identity
- censorship-resistant evidence
- non-custodial control
- portable agent trust

**Must Show:**

- privacy-respecting architecture
- user control over data / delegation
- resilience and ownership

**Recommended Framing:**

- “digital rights for autonomous agents and their operators”

### 8. Crypto

**Fit:** strong

**Why:**

- programmable agent payments
- governance and trust signaling
- cross-chain economic coordination

**Must Show:**

- real cryptoeconomic actions
- compelling use of agent payments or reputation

**Recommended Framing:**

- “portable reputation plus bounded capital access for machine actors”

### 9. Community Vote

**Fit:** strong

**Why:**

- the story is easy to explain visually
- blocked malicious agent vs approved safe agent is a clean social demo

**Must Show In Public Post:**

- what the project is
- what problem it solves
- how it works
- which sponsor bounties it integrates
- which PL focus areas it touches

**Suggested Thread Angle:**

1. agents can spend money now
2. the hard part is trust, not payments
3. Veridex gives agents passkey budgets, identity, memory, and receipts
4. here is a live mission run with evidence

### 10. Hypercerts

**Fit:** optional stretch

**Why:**

- only worthwhile if you have spare time
- could issue impact records for mission outcomes or validation artifacts

**Must Show:**

- real hypercert issuance or meaningful integration with impact data

**Recommendation:**

- only pursue after the P0 stack is complete

## P0 / P1 / P2 Scope

### P0 Must Ship

- `Existing Code`
- `8004`
- `Agent Only`
- `Filecoin`
- `Storacha`

### P1 Strong Add-On

- `AI & Robotics`
- `Infrastructure & Digital Rights`
- `Crypto`
- `Community Vote`

### P2 Stretch

- `Hypercerts`

## Required Demo Artifacts

To maximize multi-bounty acceptance, the submission should visibly include:

1. A passkey-authorized agent launch
2. `agent.json`
3. `agent_log.json`
4. ERC-8004 registration transaction
5. reputation / feedback transaction
6. Filecoin Pin proof or Calibration-linked evidence pointer
7. Storacha-backed shared task state
8. one autonomous mission run with logs and receipts
9. operator-facing audit / dispute screen
10. public video + X thread

## Recommended Submission Summary

> Veridex FrontierGuard Network is a trust and execution control plane for autonomous agents. Operators launch passkey-scoped agents with bounded budgets and policies. Agents then discover work, coordinate through Storacha-backed shared memory, pay for services through Veridex machine-payment rails, and produce structured execution logs, ERC-8004 receipts, and Filecoin-backed evidence bundles. The result is an autonomous system that is not only capable, but attributable, auditable, and safe enough for high-stakes environments.
