# Villa V2 Work Breakdown Structure

**Status:** Ready for Implementation
**Created:** January 4, 2026
**Parent Spec:** [v2-architecture.md](./v2-architecture.md)

---

## Overview

This WBS decomposes the V2 architecture into **parallel work units** (WUs) that can be implemented by multiple agents/terminals simultaneously.

**Critical Path:** WU-0 → WU-1 → WU-3 → WU-5 → WU-7

---

## Dependency Graph

```
WU-0: Monorepo Setup (blocking)
  │
  ├──► WU-1: Packages Foundation (blocking)
  │      │
  │      ├──► WU-2: SDK Core (parallel)
  │      │      └──► WU-6: SDK Auth Flow
  │      │
  │      ├──► WU-3: API Service (parallel)
  │      │      └──► WU-5: Nickname + ENS Gateway
  │      │
  │      └──► WU-4: Contracts (parallel)
  │             └──► WU-8: Recovery Contracts
  │
  └──► WU-7: Relay Service (can start after WU-0)
```

---

## Work Units

### WU-0: Monorepo Foundation (BLOCKING)

**Owner:** Single agent (required before parallel work)
**Duration:** ~30 min
**Blocks:** All other WUs

**Scope:**
- Initialize Turborepo
- Create pnpm workspace config
- Setup base tsconfig, eslint, prettier
- Create empty package shells
- Move current Next.js app to apps/web

**File Ownership:**
```
CREATE:
├── turbo.json
├── pnpm-workspace.yaml
├── package.json (root)
├── packages/config/tsconfig/base.json
├── packages/config/eslint/base.js
├── apps/web/package.json

MOVE:
├── src/ → apps/web/src/
├── public/ → apps/web/public/
├── next.config.js → apps/web/next.config.js
├── tailwind.config.ts → apps/web/tailwind.config.ts
```

**Acceptance:**
- [ ] `pnpm install` succeeds from root
- [ ] `pnpm --filter web dev` starts Next.js
- [ ] Existing E2E tests pass

**Commit Message:**
```
feat(WU-0): Initialize Turborepo monorepo structure
```

---

### WU-1: Packages Foundation (BLOCKING)

**Owner:** Single agent
**Duration:** ~20 min
**Depends:** WU-0
**Blocks:** WU-2, WU-3, WU-4

**Scope:**
- Create packages/ui with extracted components
- Create packages/sdk shell with types
- Create packages/contracts shell
- Setup package exports

**File Ownership:**
```
CREATE:
├── packages/ui/
│   ├── package.json
│   ├── src/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Spinner.tsx
│   │   └── index.ts
│   └── tsconfig.json
├── packages/sdk/
│   ├── package.json
│   ├── src/
│   │   ├── types.ts       # Shared types
│   │   └── index.ts
│   └── tsconfig.json
├── packages/contracts/
│   ├── package.json
│   ├── foundry.toml
│   └── src/.gitkeep

UPDATE:
├── apps/web/package.json  # Add @villa/ui dependency
```

**Acceptance:**
- [ ] `pnpm build` builds packages/ui
- [ ] apps/web imports from @villa/ui
- [ ] Types compile correctly

**Commit Message:**
```
feat(WU-1): Create packages/ui, packages/sdk, packages/contracts
```

---

### WU-2: SDK Core (PARALLEL)

**Owner:** Agent A
**Duration:** ~45 min
**Depends:** WU-1
**Blocks:** WU-6

**Scope:**
- Implement SDK client class
- ENS resolution (direct, no backend)
- Avatar URL generation
- Profile types

**File Ownership (EXCLUSIVE):**
```
packages/sdk/src/
├── client.ts        # Main Villa class
├── ens.ts           # ENS resolution via viem
├── avatar.ts        # Avatar URL generation
├── types.ts         # All SDK types
└── index.ts         # Exports
```

**Read-Only (can import, cannot edit):**
```
packages/ui/*
packages/config/*
```

**Acceptance:**
- [ ] `villa.resolveEns('vitalik.eth')` returns address
- [ ] `villa.getAvatarUrl('alice')` returns deterministic URL
- [ ] SDK builds and exports correctly
- [ ] Unit tests pass

**Commit Message:**
```
feat(WU-2): Implement SDK core with ENS resolution and avatars
```

---

### WU-3: API Service (PARALLEL)

**Owner:** Agent B
**Duration:** ~60 min
**Depends:** WU-1
**Blocks:** WU-5

**Scope:**
- Create Hono API app
- Database schema (Drizzle ORM)
- Health check endpoint
- CORS and rate limiting middleware

**File Ownership (EXCLUSIVE):**
```
apps/api/
├── package.json
├── src/
│   ├── index.ts            # Hono app entry
│   ├── db/
│   │   ├── schema.ts       # Drizzle schema
│   │   ├── client.ts       # DB connection
│   │   └── migrations/
│   ├── middleware/
│   │   ├── cors.ts
│   │   ├── rateLimit.ts
│   │   └── auth.ts
│   └── routes/
│       └── health.ts
├── wrangler.toml           # Cloudflare Workers config
└── tsconfig.json
```

**Acceptance:**
- [ ] `pnpm --filter api dev` starts local server
- [ ] `/health` returns 200
- [ ] Database migrations run
- [ ] CORS configured for villa.cash

**Commit Message:**
```
feat(WU-3): Create API service with Hono and Drizzle ORM
```

---

### WU-4: Contracts Package (PARALLEL)

**Owner:** Agent C
**Duration:** ~45 min
**Depends:** WU-1
**Blocks:** WU-8

**Scope:**
- Setup Foundry project in packages/contracts
- Create deployment scripts
- Mock contracts for testing
- Contract types generation

**File Ownership (EXCLUSIVE):**
```
packages/contracts/
├── foundry.toml
├── src/
│   ├── mocks/
│   │   └── MockGroth16Verifier.sol
│   └── interfaces/
│       └── IExternalSigner.sol
├── script/
│   ├── Deploy.s.sol
│   └── DeployLocal.s.sol
├── test/
│   └── BiometricRecoverySigner.t.sol
└── package.json
```

**Acceptance:**
- [ ] `forge build` succeeds
- [ ] `forge test` passes (with mocks)
- [ ] ABI types generated for SDK

**Commit Message:**
```
feat(WU-4): Setup contracts package with Foundry and mocks
```

---

### WU-5: Nickname Endpoints + ENS Gateway (SEQUENTIAL)

**Owner:** Agent B (continues from WU-3)
**Duration:** ~60 min
**Depends:** WU-3

**Scope:**
- Nickname CRUD endpoints
- Signature verification for claims
- CCIP-Read gateway for ENS
- Avatar endpoint

**File Ownership (EXCLUSIVE):**
```
apps/api/src/routes/
├── nicknames.ts     # Check, claim, resolve, reverse
├── avatars.ts       # Avatar rendering
└── ens.ts           # CCIP-Read gateway
```

**Acceptance:**
- [ ] `GET /nicknames/check/alice` returns availability
- [ ] `POST /nicknames/claim` verifies signature
- [ ] `GET /ens/resolve` returns CCIP-Read format
- [ ] Integration tests pass

**Commit Message:**
```
feat(WU-5): Add nickname endpoints and ENS CCIP-Read gateway
```

---

### WU-6: SDK Auth Flow (SEQUENTIAL)

**Owner:** Agent A (continues from WU-2)
**Duration:** ~60 min
**Depends:** WU-2, WU-5

**Scope:**
- Iframe-based auth flow
- Porto integration
- signIn/signOut methods
- Session management

**File Ownership (EXCLUSIVE):**
```
packages/sdk/src/
├── auth.ts          # signIn, signOut
├── iframe.ts        # Iframe management
└── session.ts       # Session storage
```

**Acceptance:**
- [ ] `villa.signIn()` opens auth iframe
- [ ] Returns identity after completion
- [ ] Session persists across page reloads
- [ ] `villa.signOut()` clears session

**Commit Message:**
```
feat(WU-6): Implement SDK auth flow with Porto iframe
```

---

### WU-7: Relay Service (PARALLEL)

**Owner:** Agent D
**Duration:** ~45 min
**Depends:** WU-0 only

**Scope:**
- Docker-based Porto relay
- Merchant sponsoring configuration
- Health check endpoint
- Docker Compose for local dev

**File Ownership (EXCLUSIVE):**
```
apps/relay/
├── Dockerfile
├── docker-compose.yml
├── src/
│   ├── index.ts
│   ├── merchant.ts    # Sponsoring logic
│   └── health.ts
└── package.json
```

**Acceptance:**
- [ ] `docker compose up` starts relay
- [ ] `/health` returns 200
- [ ] Merchant sponsoring configured
- [ ] Connects to Base Sepolia

**Commit Message:**
```
feat(WU-7): Create Porto relay service with Docker
```

---

### WU-8: Recovery Contracts (SEQUENTIAL)

**Owner:** Agent C (continues from WU-4)
**Duration:** ~90 min
**Depends:** WU-4

**Scope:**
- BiometricRecoverySigner contract
- Groth16 verifier integration
- Deployment to Base Sepolia
- Contract verification

**File Ownership (EXCLUSIVE):**
```
packages/contracts/src/
├── BiometricRecoverySigner.sol
├── VillaNicknameResolver.sol  # ENS resolver (mainnet)
└── VillaRegistry.sol          # Future on-chain registry
```

**Acceptance:**
- [ ] All tests pass
- [ ] Deployed to Base Sepolia
- [ ] Verified on Basescan
- [ ] Addresses saved to deployments/

**Commit Message:**
```
feat(WU-8): Deploy BiometricRecoverySigner to Base Sepolia
```

---

## Parallel Execution Plan

```
Terminal 1          Terminal 2          Terminal 3          Terminal 4
────────────────────────────────────────────────────────────────────────
WU-0 (blocking)
    │
    ▼
WU-1 (blocking)
    │
    ├───────────────────┬───────────────────┬───────────────────┐
    ▼                   ▼                   ▼                   ▼
WU-2 (SDK)         WU-3 (API)         WU-4 (Contracts)    WU-7 (Relay)
    │                   │                   │
    ▼                   ▼                   ▼
WU-6 (SDK Auth)    WU-5 (Nicknames)    WU-8 (Recovery)
    │                   │                   │
    └───────────────────┴───────────────────┘
                        │
                        ▼
                   Integration Testing
```

**Time Estimate (with 4 terminals):**
- WU-0 + WU-1: ~50 min (sequential, blocking)
- WU-2/3/4/7: ~60 min (parallel)
- WU-5/6/8: ~90 min (parallel, after deps)
- Integration: ~30 min

**Total: ~4 hours** (vs ~8 hours sequential)

---

## Handoff Protocol

### Commit Convention
```bash
git commit -m "feat(WU-X): Complete {task description}"
```

### Before Starting a WU
1. Check that blocking WUs are committed:
   ```bash
   git log --oneline | grep "feat(WU-"
   ```
2. Pull latest main
3. Verify no one else is working on your files

### After Completing a WU
1. Run lint and typecheck
2. Commit with WU prefix
3. Push to origin
4. Post in coordination channel: "WU-X complete, WU-Y unblocked"

---

## Shared Interfaces (Created in WU-1, Read-Only After)

```typescript
// packages/sdk/src/types.ts

export interface Identity {
  address: `0x${string}`
  nickname: string
  avatar: AvatarConfig
}

export interface AvatarConfig {
  style: 'adventurer' | 'avataaars' | 'bottts' | 'thumbs'
  seed: string
  gender?: 'male' | 'female' | 'other'
}

export interface Profile extends Identity {
  ens?: string
  createdAt?: number
}

export interface NicknameCheckResult {
  available: boolean
  normalized: string
  suggestion?: string
}

export interface VillaConfig {
  appId: string
  network?: 'base' | 'base-sepolia'
  apiUrl?: string
}
```

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| WU-0 takes longer | Assign most experienced agent |
| Type conflicts | Types defined in WU-1, immutable after |
| Merge conflicts | File ownership is exclusive |
| API schema changes | Database migrations are additive only |
| Contract bugs | Testnet-only until WU-8 complete |

---

## Next Steps

1. **Start WU-0** immediately (single terminal)
2. After WU-0 commits, **start WU-1** (same terminal)
3. After WU-1 commits, **spawn 4 terminals** for parallel WUs
4. Track progress via commit messages
5. Regroup for integration testing

---

Ready for execution.
