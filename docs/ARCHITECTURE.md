# Villa Architecture Overview

High-level guide to understanding the Villa codebase.

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         VILLA ECOSYSTEM                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐ │
│  │  villa.cash │    │ beta.villa  │    │ developers.villa    │ │
│  │  Production │    │   Staging   │    │     Docs Portal     │ │
│  └──────┬──────┘    └──────┬──────┘    └──────────┬──────────┘ │
│         │                  │                       │            │
│         └──────────────────┼───────────────────────┘            │
│                            │                                    │
│                    ┌───────▼───────┐                           │
│                    │   Villa Hub   │                           │
│                    │   (Next.js)   │                           │
│                    └───────┬───────┘                           │
│                            │                                    │
│         ┌──────────────────┼──────────────────┐                │
│         │                  │                  │                │
│  ┌──────▼──────┐   ┌───────▼───────┐  ┌──────▼──────┐        │
│  │  Villa SDK  │   │   Porto SDK   │  │  PostgreSQL │        │
│  │   (Auth)    │   │  (Passkeys)   │  │  (Profiles) │        │
│  └──────┬──────┘   └───────────────┘  └─────────────┘        │
│         │                                                      │
│  ┌──────▼──────┐                                              │
│  │    Base     │                                              │
│  │ (Blockchain)│                                              │
│  └─────────────┘                                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Villa Hub (`apps/hub/`)

The main web application at villa.cash.

```
apps/hub/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── home/         # Main authenticated view
│   │   ├── onboarding/   # New user flow
│   │   ├── settings/     # User preferences
│   │   └── sdk-demo/     # SDK testing page
│   ├── components/       # React components
│   │   ├── ui/           # Base UI primitives
│   │   ├── sdk/          # SDK-related components
│   │   └── settings/     # Settings components
│   └── lib/              # Utilities & services
│       ├── porto.ts      # Passkey integration
│       ├── nickname.ts   # ENS resolution
│       └── db/           # Database access
```

**Key Technologies:**

- Next.js 14 (App Router)
- Tailwind CSS
- Framer Motion (animations)
- Porto SDK (passkeys)

### 2. Villa SDK (`packages/sdk/`)

npm package for integrating Villa auth into any app.

```
packages/sdk/
├── src/
│   ├── index.ts          # Main exports
│   ├── client.ts         # Villa class (high-level API)
│   ├── simple.ts         # Simple API (villa.signIn())
│   ├── bridge.ts         # VillaBridge (iframe communication)
│   ├── types.ts          # TypeScript types
│   └── contracts.ts      # Smart contract addresses
```

**Key Exports:**

- `villa` - Simple singleton API
- `Villa` - Full-featured class
- `VillaBridge` - Low-level iframe control

### 3. Villa SDK React (`packages/sdk-react/`)

React bindings for the SDK.

```
packages/sdk-react/
├── src/
│   ├── index.ts          # Exports
│   ├── useVilla.ts       # Simple hook (no provider needed)
│   ├── hooks.ts          # useIdentity, useAuth, useVillaConfig
│   ├── VillaProvider.tsx # Context provider
│   └── components/       # VillaAuth, VillaButton, etc.
```

### 4. Developers Portal (`apps/developers/`)

Documentation site at developers.villa.cash.

```
apps/developers/
├── src/
│   ├── app/
│   │   └── page.tsx      # Main docs page (single-page)
│   ├── components/
│   │   ├── Header.tsx    # Nav with search
│   │   └── Search.tsx    # Doc search modal
│   └── lib/
│       └── analytics.ts  # Plausible integration
├── public/
│   ├── CLAUDE.txt        # AI context file
│   └── llms.txt          # LLM integration guide
```

## Data Flow

### Authentication Flow

```
User → Villa Hub → Porto SDK → WebAuthn → Passkey
                                            │
                                            ▼
                                    Signature + Address
                                            │
                                            ▼
                         Villa Hub → Profile API → PostgreSQL
                                            │
                                            ▼
                                    Session (localStorage)
```

### SDK Integration Flow

```
3rd Party App → Villa SDK → iframe (villa.cash/auth)
                               │
                               ▼
                        Porto (passkey auth)
                               │
                               ▼
                        postMessage → Identity
                               │
                               ▼
                        3rd Party App (authenticated)
```

## Key Concepts

### Identity

A Villa identity consists of:

```typescript
interface Identity {
  address: `0x${string}`; // Ethereum address (from passkey)
  nickname: string; // Unique username (ENS-compatible)
  avatar: AvatarConfig; // Deterministic avatar
}
```

### Passkey Authentication

Villa uses Porto SDK for WebAuthn-based authentication:

- Passkeys never leave the device
- Address derived from signature
- No passwords, no seed phrases

### ENS Resolution

Nicknames resolve like ENS names:

- `alice.villa.cash` → `0x1234...`
- Uses CCIP-Read for off-chain resolution
- Contract: `VillaNicknameResolver`

## Environment Architecture

| Environment | URL              | Branch          | Purpose        |
| ----------- | ---------------- | --------------- | -------------- |
| Production  | villa.cash       | `main` (tagged) | Stable release |
| Staging     | beta.villa.cash  | `main`          | Latest changes |
| Dev 1/2     | dev-1.villa.cash | PR branches     | PR previews    |
| Local       | localhost:3000   | any             | Development    |

## Database Schema

```
profiles
├── id (uuid)
├── address (text, unique)     # Wallet address
├── nickname (text, unique)    # Username
├── avatar_config (jsonb)      # Avatar settings
├── created_at (timestamp)
└── updated_at (timestamp)
```

## Smart Contracts

| Contract                  | Network      | Purpose         |
| ------------------------- | ------------ | --------------- |
| VillaNicknameResolverV3   | Base Sepolia | ENS resolution  |
| BiometricRecoverySignerV2 | Base Sepolia | Wallet recovery |

## Security Model

1. **Passkeys** - Hardware-bound, never exposed
2. **Origin Validation** - Strict postMessage checking
3. **Input Validation** - Zod schemas for all external data
4. **Session Management** - 7-day expiry, localStorage

## Cost Model

See [AGENTS.md](../AGENTS.md) for AI agent costs.

| Service      | Cost     | Notes        |
| ------------ | -------- | ------------ |
| DigitalOcean | ~$25/mo  | App Platform |
| PostgreSQL   | ~$15/mo  | Managed DB   |
| Plausible    | $9/mo    | Analytics    |
| Base Network | Gas fees | Minimal (L2) |
