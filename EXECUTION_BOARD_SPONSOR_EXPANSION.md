# Frontier Execution Board Expansion

## Goal

Keep one flagship product: **Veridex FrontierGuard as a single execution board for autonomous missions**.

Do **not** create separate sponsor microsites or disconnected workflows.
Instead, extend the same mission board with three new execution rails:

- **Flow rail** for scheduled and recurring execution
- **Starknet rail** for private intent and sealed execution commitments
- **Zama rail** for confidential policy values and encrypted operator controls

This keeps the core thesis intact:

**portable trust + bounded autonomy + verifiable execution**

## Product Thesis

The board remains one mission control surface with five stable zones:

1. **Mission Composer**
2. **Policy Vault**
3. **Execution Rail Selector**
4. **Trust + Counterparty Intelligence**
5. **Receipts + Proofs**

Each sponsor becomes a capability inside an existing zone:

- **Veridex / ERC-8004**: identity, passkeys, agent trust
- **Storacha**: shared agent memory
- **Filecoin**: durable evidence
- **Flow**: scheduled execution rail
- **Starknet**: privacy-preserving commitment rail
- **Zama**: confidential policy and hidden thresholds

## Why This Does Not Drift

The board is still about one thing:

**Should this agentic mission execute, when should it execute, on which rail should it execute, and what proof should we keep?**

That means:

- Flow answers **when**
- Starknet answers **how privately**
- Zama answers **under what confidential constraints**
- Veridex answers **who is allowed**
- Filecoin/Storacha answer **what evidence survives**

## Judge-Friendly Sponsor Mapping

### Core stack already aligned

- Existing Code
- Agent Only
- Agents With Receipts / ERC-8004
- AI & Robotics
- Crypto
- Infrastructure & Digital Rights
- Filecoin
- Storacha
- Community Vote

### Additional rails to add carefully

- **Flow**
  - Use for scheduled transactions and recurring mission execution.
  - Fit: consumer DeFi automation, treasury autopilot, recurring payouts, DCA, timed safeguards.

- **Starknet**
  - Use for **private intent commitments**, **sealed route quotes**, and **privacy-preserving execution receipts**.
  - Do **not** try to build a full Bitcoin wallet or full BTC settlement layer in the hackathon window.
  - Best framing: “private mission intent lane for sensitive treasury strategies.”

- **Zama**
  - Use for **confidential policy fields**:
    - private budget ceilings
    - private counterparty allowlists
    - confidential risk scores
    - hidden escalation triggers
  - Best framing: “public workflow, confidential constraints.”

## Single Execution Board Feature Set

### 1. Rail Selector

Add one rail selector to the execution board with four choices:

- `Immediate`
- `Scheduled`
- `Private`
- `Confidential`

### 2. Immediate Rail

This is the current Veridex flow:

- passkey login
- ERC-8004 identity
- x402 payment
- Storacha memory
- Filecoin receipts

### 3. Scheduled Rail (Flow)

Use this when the mission needs:

- delayed execution
- recurring execution
- periodic treasury checks
- subscription payouts
- time-based rebalancing

Board behavior:

- operator creates mission now
- board schedules execution window
- Flow handler executes later
- result is pulled back into FrontierGuard receipts

### 4. Private Rail (Starknet)

Use this when the mission needs:

- hidden route preferences
- sealed bid or sealed quote selection
- privacy-preserving strategy commitments
- delayed reveal receipts

Board behavior:

- operator creates a private execution intent
- board stores public commitment hash
- Starknet contract records a sealed commitment or bid
- final route reveal is linked back to receipts

### 5. Confidential Rail (Zama)

Use this when the mission needs:

- hidden policy thresholds
- encrypted wallet/risk data
- private approval constraints
- encrypted balance checks

Board behavior:

- operator inputs encrypted policy values
- board stores ciphertext handles and ACL grants
- execution engine evaluates whether the mission is allowed
- outcome becomes public without leaking private thresholds

## Best Way To Add Starknet Without Looking Clunky

Do **not** add “Starknet support” as a generic extra chain tab.

Add it as:

**Private Intent Receipt**

This becomes a small module inside the board:

- `Create Private Intent`
- `Commit Hash on Starknet`
- `Reveal / Settle`
- `Attach Privacy Receipt`

This looks intentional because it solves one concrete user problem:

**protecting strategy information before execution**

It also fits the Starknet challenge better than pretending the whole app suddenly becomes a Bitcoin wallet.

## Best Way To Add Flow Without Looking Clunky

Do not make a separate “Flow app.”

Add:

**Scheduled Mission**

Inside mission launch:

- `Execute now`
- `Schedule on Flow`

Then show:

- next run time
- cadence handler / schedule id
- retry policy
- execution status

This makes Flow feel like a native execution mode, not a bolted-on sponsorship badge.

## Best Way To Add Zama Without Looking Clunky

Do not make a separate privacy dashboard.

Add:

**Confidential Policy Vault**

Inside policy setup:

- `Public policy fields`
- `Encrypted policy fields`

Examples:

- max spend is encrypted
- minimum trust threshold is encrypted
- blocked counterparties are encrypted
- emergency shutdown bit is encrypted

The board still looks like one policy system, just with public and private fields.

## Frontend Changes

### Modify existing files

- `src/components/frontierguard/provider.tsx`
  - Add rail selection to mission launch state
  - Add Flow/Starknet/Zama execution branches
  - Add new logs and receipts for rail-specific actions

- `src/lib/frontierguard/types.ts`
  - Add `executionRail`
  - Add `scheduledExecution`
  - Add `privateIntent`
  - Add `confidentialPolicy`
  - Add rail-specific receipt objects

- `src/lib/frontierguard/mock.ts`
  - Add seeded demo data for Flow/Starknet/Zama
  - Add board notifications for scheduled, private, and confidential rails

- `src/app/mission/launch/page.tsx`
  - Add rail selector
  - Add schedule inputs
  - Add private/confidential toggle cards

- `src/app/mission/overview/page.tsx`
  - Add unified execution board widget
  - Add rail status chips

- `src/app/mission/active/page.tsx`
  - Add rail-aware progress timeline
  - Add Starknet reveal and Flow schedule state

- `src/app/mission/policies/page.tsx`
  - Add Zama-backed confidential fields section

- `src/app/receipts/page.tsx`
  - Add grouped receipts:
    - trust
    - storage
    - scheduled
    - private
    - confidential

- `src/app/receipts/verify/page.tsx`
  - Add Starknet commitment receipt verification
  - Add Flow schedule execution receipt verification
  - Add Zama policy proof metadata

- `src/app/logs/page.tsx`
  - Add rail filter

### Add UI files

- `src/components/frontierguard/execution-board.tsx`
- `src/components/frontierguard/execution-rail-selector.tsx`
- `src/components/frontierguard/flow-schedule-card.tsx`
- `src/components/frontierguard/starknet-private-intent-card.tsx`
- `src/components/frontierguard/zama-confidential-policy-card.tsx`
- `src/components/frontierguard/rail-badge.tsx`
- `src/components/frontierguard/receipt-group.tsx`

## Backend Changes

### Add integration files

- `src/lib/frontierguard/integrations/flow.ts`
  - Flow access node setup
  - scheduled transaction helpers
  - status polling
  - receipt normalization

- `src/lib/frontierguard/integrations/starknet.ts`
  - Starknet provider setup
  - account wiring
  - commitment contract calls
  - receipt normalization

- `src/lib/frontierguard/integrations/zama.ts`
  - relayer SDK setup
  - encrypted input preparation
  - ACL grant helpers
  - ciphertext metadata storage

### Add API routes

- `src/app/api/frontier/flow/schedule/route.ts`
- `src/app/api/frontier/flow/status/route.ts`
- `src/app/api/frontier/starknet/intent/route.ts`
- `src/app/api/frontier/starknet/reveal/route.ts`
- `src/app/api/frontier/zama/policy/encrypt/route.ts`
- `src/app/api/frontier/zama/policy/evaluate/route.ts`

### Modify backend files

- `src/lib/frontierguard/repository.ts`
  - add flow, starknet, and zama state persistence
  - add chain transaction journal rows
  - add confidential policy record persistence

- `src/lib/frontierguard/integrations/config.ts`
  - add env parsing for Flow, Starknet, Zama

## Smart Contract / Onchain Files To Add

### Flow

- `contracts/flow/FrontierMissionScheduler.cdc`
- `contracts/flow/FrontierMissionHandler.cdc`
- `contracts/flow/transactions/InitScheduler.cdc`
- `contracts/flow/transactions/ScheduleMission.cdc`
- `contracts/flow/scripts/GetScheduledMission.cdc`

### Starknet

- `contracts/starknet/src/frontier_private_intent.cairo`
- `contracts/starknet/Scarb.toml`
- `contracts/starknet/scripts/declare.ts`
- `contracts/starknet/scripts/deploy.ts`

### Zama

- `contracts/zama/src/ConfidentialPolicyVault.sol`
- `contracts/zama/src/ConfidentialRailExecutor.sol`
- `contracts/zama/script/Deploy.s.sol`
- `contracts/zama/test/ConfidentialPolicyVault.t.sol`

## Database Tables To Add

Add these on top of the audit work already implemented:

- `frontier_execution_rails`
- `frontier_flow_schedules`
- `frontier_starknet_private_intents`
- `frontier_zama_confidential_policies`
- `frontier_chain_transactions`
- `frontier_encrypted_policy_handles`

## Exact Board Features To Add

### Launch Form

- rail selector
- schedule date/time
- recurrence options
- private intent toggle
- encrypted policy toggle

### Mission Overview

- current rail
- scheduled next run
- private commitment status
- confidential policy enabled state

### Execution Timeline

- created
- authorized
- rail prepared
- executed / scheduled / committed
- verified
- finalized

### Receipts

- ERC-8004 registration
- Filecoin CID
- Storacha CID
- Flow schedule id / tx id
- Starknet commitment hash / tx hash
- Zama ciphertext handle / ACL grant id

## Recommended Build Order

### Phase 1

- Flow scheduled rail
- database schema for rails
- execution board UI

### Phase 2

- Starknet private intent commitment
- receipts and verification screen

### Phase 3

- Zama confidential policy vault
- encrypted threshold UI

### Phase 4

- polish demo script
- judge mode and sponsor-specific badges

## Keys And APIs Needed

### Existing stack

- `DATABASE_URL`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_FRONTIER_VERIDEX_NETWORK`
- `NEXT_PUBLIC_FRONTIER_RELAYER_URL`
- `FRONTIER_RELAYER_API_KEY`
- `FRONTIER_ERC8004_RPC_URL`
- `FRONTIER_ERC8004_PRIVATE_KEY`
- `FRONTIER_ERC8004_EXPLORER_BASE_URL`
- `FRONTIER_PINATA_GATEWAY`
- `FRONTIER_PINATA_API_KEY`
- `STORACHA_AGENT_KEY`
- `STORACHA_PROOF`
- `STORACHA_SPACE_DID`

### Flow

- `NEXT_PUBLIC_FLOW_NETWORK`
- `NEXT_PUBLIC_FLOW_FCL_ACCESS_NODE`
- `NEXT_PUBLIC_FLOW_WALLET_DISCOVERY`
- `NEXT_PUBLIC_FLOW_EVM_RPC_URL`
- `NEXT_PUBLIC_FLOW_EVM_CHAIN_ID`
- `FRONTIER_FLOW_ENABLED`
- `FRONTIER_FLOW_SERVICE_ACCOUNT_ADDRESS`
- `FRONTIER_FLOW_SERVICE_ACCOUNT_PRIVATE_KEY`
- `FRONTIER_FLOW_SERVICE_ACCOUNT_KEY_INDEX`
- `FRONTIER_FLOW_SCHEDULER_CONTRACT_ADDRESS`
- `FRONTIER_FLOW_TRANSACTION_HANDLER_ADDRESS`

### Starknet

- `NEXT_PUBLIC_STARKNET_NETWORK`
- `NEXT_PUBLIC_STARKNET_RPC_URL`
- `NEXT_PUBLIC_STARKNET_CHAIN_ID`
- `FRONTIER_STARKNET_ENABLED`
- `FRONTIER_STARKNET_ACCOUNT_ADDRESS`
- `FRONTIER_STARKNET_PRIVATE_KEY`
- `FRONTIER_STARKNET_PRIVATE_INTENT_CONTRACT`
- `FRONTIER_STARKNET_EXPLORER_BASE_URL`

### Zama

- `NEXT_PUBLIC_ZAMA_NETWORK`
- `NEXT_PUBLIC_ZAMA_HOST_CHAIN_RPC_URL`
- `FRONTIER_ZAMA_ENABLED`
- `FRONTIER_ZAMA_RELAYER_URL`
- `FRONTIER_ZAMA_GATEWAY_URL`
- `FRONTIER_ZAMA_ACL_CONTRACT_ADDRESS`
- `FRONTIER_ZAMA_POLICY_VAULT_CONTRACT`
- `FRONTIER_ZAMA_EXECUTOR_CONTRACT`
- `FRONTIER_ZAMA_SIGNER_PRIVATE_KEY`

## APIs / SDKs To Use

### Flow

- `@onflow/react-sdk`
- Flow Access Node / FCL configuration
- Flow scheduled transaction scaffold and `FlowTransactionScheduler`
- Flow EVM RPC for unified treasury views

### Starknet

- `starknet`
- Starknet RPC provider
- Starknet account contract
- Cairo contract for private intent commitments

### Zama

- `@zama-fhe/relayer-sdk`
- Zama relayer HTTP endpoint
- FHEVM Solidity library
- ACL and encrypted input workflow

## Official Docs

- Flow Scheduled Transactions: https://developers.flow.com/blockchain-development-tutorials/forte/scheduled-transactions/scheduled-transactions-introduction
- Flow React SDK: https://developers.flow.com/build/tools/react-sdk
- Flow EVM Networks: https://developers.flow.com/build/evm/networks
- Starknet Accounts: https://docs.starknet.io/learn/protocol/accounts
- Starknet.js API: https://starknetjs.com/docs/API/
- Zama Protocol Overview: https://docs.zama.org/protocol
- Zama Relayer SDK: https://docs.zama.org/protocol/relayer-sdk-guides
- Zama Encrypted Inputs: https://docs.zama.org/protocol/solidity-guides/smart-contract/inputs
- Zama ACL: https://docs.zama.org/protocol/solidity-guides/smart-contract/acl

## Final Recommendation

If you want the strongest non-clunky version:

- **Flow = scheduled rail**
- **Starknet = private intent commitment rail**
- **Zama = confidential policy vault**

Do not present them as “three extra chains.”
Present them as **three execution modes on one board**.
