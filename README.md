# Veridex FrontierGuard

FrontierGuard is a production-shaped control plane for autonomous missions.

It gives an operator one workspace to:

- authenticate with a passkey
- launch a bounded mission with policy and budget controls
- execute paid actions over x402
- attach ERC-8004 identity and reputation receipts
- retain logs, manifests, and evidence bundles
- expose machine-readable endpoints that other agents can discover and pay for

This app is the PL_Genesis hackathon implementation of the **best-bet sponsor stack first**:

- `Existing Code`
- `Agent Only`
- `Agents With Receipts — 8004`
- `AI & Robotics`
- `Infrastructure & Digital Rights`
- `Crypto`

Secondary rails such as Starknet, Filecoin, and Storacha are included as supporting capabilities, but the core product story stays focused on:

**portable trust + bounded autonomy + verifiable execution**

## What The App Does

The authenticated workspace is organized around one operator flow:

1. `Login`
   Passkey-backed operator authentication with stored credential recovery and session cookies.
2. `Launch`
   Create a mission with execution scope, budget limits, allowed tools, and trust thresholds.
3. `Execution`
   Run the mission, request premium paid data, enforce policy, and track mission state.
4. `Receipts`
   Inspect x402 settlement receipts, ERC-8004 identity/reputation proofs, and evidence artifacts.
5. `Settings`
   Check readiness, machine-access endpoints, runtime state, and storage posture.

## Current Product Scope

### Core path

- Passkey registration and login using `@veridex/sdk`
- Session persistence in Postgres
- Enterprise runtime wallet resolution from stored passkey credentials
- x402 paid service execution using `@veridex/agentic-payments`
- ERC-8004 registration and feedback submission
- Structured mission logs, artifacts, receipts, and audit records
- Production-style dark operator workspace

### Secondary modules

- Starknet private-intent rail
- Filecoin-backed artifact pinning
- Storacha-backed shared memory
- Flow scheduled rail
- Zama confidential policy rail

These remain secondary in the UI until the core sponsor proof path is fully live.

## Tech Stack

- `Next.js 16`
- `React 19`
- `TypeScript`
- `Bun`
- `Prisma`
- `Postgres`
- `ethers`
- `starknet`
- `@veridex/sdk`
- `@veridex/agentic-payments`

## Project Structure

- [`src/app`](/Users/mannyuncharted/Documents/gigs/veridex/hackathon/plgenesis/src/app)
  App routes, authenticated workspace screens, and API routes.
- [`src/components/frontierguard`](/Users/mannyuncharted/Documents/gigs/veridex/hackathon/plgenesis/src/components/frontierguard)
  Shared shell, navigation, status hooks, auth context, and mission runtime provider.
- [`src/lib/frontierguard`](/Users/mannyuncharted/Documents/gigs/veridex/hackathon/plgenesis/src/lib/frontierguard)
  Mission models, mock/default state, browser helpers, integrations, session resolution, and repository access.
- [`prisma`](/Users/mannyuncharted/Documents/gigs/veridex/hackathon/plgenesis/prisma)
  Prisma schema and migrations.
- [`contracts`](/Users/mannyuncharted/Documents/gigs/veridex/hackathon/plgenesis/contracts)
  Hackathon-side contract artifacts and related deployment assets.
- [`scripts/base-sepolia-wallet.mjs`](/Users/mannyuncharted/Documents/gigs/veridex/hackathon/plgenesis/scripts/base-sepolia-wallet.mjs)
  Helper to generate or derive the Base Sepolia signer used for the live sponsor path.

## Running The App

### Prerequisites

- `bun`
- `node`
- a Postgres database

### Install

```bash
cd /Users/mannyuncharted/Documents/gigs/veridex/hackathon/plgenesis
bun install
```

### Environment

Copy [`.env.example`](/Users/mannyuncharted/Documents/gigs/veridex/hackathon/plgenesis/.env.example) to `.env.local` and fill the values you need.

```bash
cp /Users/mannyuncharted/Documents/gigs/veridex/hackathon/plgenesis/.env.example /Users/mannyuncharted/Documents/gigs/veridex/hackathon/plgenesis/.env.local
```

### Prisma

```bash
bunx prisma generate
bunx prisma migrate deploy
```

### Dev

```bash
bun run dev
```

### Production build

```bash
bun run build
```

## Environment Modes

### Demo

Use this when you want a deterministic fallback path and do not want to claim live onchain proofs.

```env
FRONTIER_MODE=demo
```

### Hybrid

Use this when you want the app to run with partial live infra but still tolerate non-live paths.

```env
FRONTIER_MODE=hybrid
```

### Live

Use this when you want the app to fail honestly unless it can produce real sponsor-grade receipts.

```env
FRONTIER_MODE=live
```

In `live` mode, the app now rejects demo payment signatures and blocks the core mission path when x402 or ERC-8004 requirements are not truly configured.

## Minimal Live Sponsor Path

The fastest serious live path is:

- passkey auth
- Base Sepolia x402 payment verification
- Base Sepolia ERC-8004 registration + feedback
- Postgres persistence

Minimum envs:

```env
FRONTIER_MODE=live
NEXT_PUBLIC_APP_URL=http://localhost:3000

DATABASE_URL=postgresql://...

FRONTIER_RELAYER_URL=...
FRONTIER_RELAYER_API_KEY=...

FRONTIER_FACILITATOR_URL=https://x402.org/facilitator

FRONTIER_PAYWALL_NETWORK=base-sepolia
FRONTIER_PAYWALL_RECIPIENT=0x...
FRONTIER_PAYWALL_RPC_URL=https://your-base-sepolia-rpc
FRONTIER_PAYWALL_EXPLORER_BASE_URL=https://sepolia.basescan.org

FRONTIER_ERC8004_ENABLED=true
FRONTIER_ERC8004_TESTNET=true
FRONTIER_ERC8004_PRIVATE_KEY=0x...
FRONTIER_ERC8004_RPC_URL=https://your-base-sepolia-rpc
FRONTIER_ERC8004_EXPLORER_BASE_URL=https://sepolia.basescan.org
```

## Generate The Base Sepolia Signer

To generate a burner wallet for the live hackathon path:

```bash
bun run wallet:base-sepolia
```

This prints:

- a fresh private key for `FRONTIER_ERC8004_PRIVATE_KEY`
- the matching wallet address for `FRONTIER_PAYWALL_RECIPIENT`

To derive the address from an existing key:

```bash
bun run wallet:base-sepolia -- --private-key 0xYOUR_PRIVATE_KEY
```

## Scripts

- `bun run dev`
  Start the Next dev server with webpack.
- `bun run build`
  Production build.
- `bun run start`
  Start the production server.
- `bun run lint`
  Run ESLint.
- `bun run wallet:base-sepolia`
  Generate or derive the Base Sepolia signer/paywall recipient.
- `bun run prisma:generate`
  Generate Prisma client.
- `bun run prisma:migrate:deploy`
  Apply database migrations.
- `bun run prisma:migrate:status`
  Inspect migration state.

## Machine Access

The workspace exposes discovery and payment-related endpoints for agent clients:

- `/.well-known/agent-registration.json`
- `/.well-known/ucp`
- `/.well-known/acp-checkout`
- `/.well-known/ap2-mandate`
- `/api/frontier/agent/premium-yield`
- `/api/frontier/status`

These are surfaced inside the Settings page so agent operators can inspect what is actually routable and what still needs infra.

## Database And Audit Model

The app persists:

- passkey credentials
- auth sessions
- mission snapshots
- evidence files
- memory records
- agent registrations
- feedback events
- audit events
- payment events
- policy evaluations
- tool invocations
- runtime errors
- operator actions
- state versions

This gives the app a durable audit trail instead of only in-memory demo state.

## Related Docs

- [`MULTI_BOUNTY_MATRIX.md`](/Users/mannyuncharted/Documents/gigs/veridex/hackathon/plgenesis/MULTI_BOUNTY_MATRIX.md)
- [`USER_FLOW.md`](/Users/mannyuncharted/Documents/gigs/veridex/hackathon/plgenesis/USER_FLOW.md)
- [`EXECUTION_BOARD_SPONSOR_EXPANSION.md`](/Users/mannyuncharted/Documents/gigs/veridex/hackathon/plgenesis/EXECUTION_BOARD_SPONSOR_EXPANSION.md)
- [`TODO.md`](/Users/mannyuncharted/Documents/gigs/veridex/hackathon/plgenesis/TODO.md)

## Honest Status

This is no longer a static mockup. It is a working product shell with real auth, persistence, and sponsor-path integration code.

What still decides whether it is judge-ready is not the README or the UI polish. It is whether the live sponsor path is actually configured and demonstrated end to end with:

- a successful passkey-authenticated mission launch
- a real x402 settlement receipt
- a real ERC-8004 registration transaction
- a real ERC-8004 feedback transaction
- clean explorer links and receipts in the vault

That is the path this project is optimized for.
