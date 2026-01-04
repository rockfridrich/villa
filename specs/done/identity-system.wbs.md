# Work Breakdown: Villa Identity SDK & Storage

Spec: [villa-identity-sdk-and-storage.md](villa-identity-sdk-and-storage.md)
Created: 2026-01-04
Architect: @architect

## Overview

This WBS decomposes the Villa Identity SDK into 10 work units for parallel multi-terminal implementation. The system has three major layers:

1. **Shared Foundation (WU-0)** — Types, interfaces, error definitions
2. **Backend Layer (WU-2, WU-3, WU-7)** — PostgreSQL, API endpoints, external integrations
3. **Frontend/SDK Layer (WU-1, WU-4, WU-5, WU-6)** — Iframe, components, TinyCloud integration
4. **Documentation & Testing (WU-8, WU-9)** — OpenAPI, E2E tests

**Key architectural decision:** The SDK (WU-1) and backend features (WU-2, WU-3, WU-7) have no code-level dependencies on each other — they communicate via HTTP APIs defined in shared types. This enables maximum parallelism.

---

## Work Units Summary

| WU | Name | Depends On | Key Files |
|----|------|------------|-----------|
| **WU-0** | Shared Types | None | `src/types/*.ts` |
| **WU-1** | SDK Core | WU-0 | `src/sdk/*`, `src/app/sdk/*` |
| **WU-2** | App Registration | WU-0 | `src/lib/db/*`, `src/app/api/apps/*` |
| **WU-3** | Nickname Registry | WU-0 | `src/lib/nickname/*`, `src/app/api/nicknames/*` |
| **WU-4** | Avatar System | WU-0 | `src/lib/avatar/*`, `src/components/sdk/Avatar*` |
| **WU-5** | User Permissions | WU-0, WU-2 | `src/lib/tinycloud/*`, `src/app/settings/apps/*` |
| **WU-6** | Private Data | WU-0, WU-5 | `src/lib/private-data/*` |
| **WU-7** | Wallet Linking | WU-0, WU-5 | `src/lib/wallet-linking/*`, `src/app/api/wallets/*` |
| **WU-8** | API Docs | WU-0 | `docs/*` |
| **WU-9** | Integration Tests | All | `tests/e2e/*`, `tests/integration/*` |

---

## Shared Interfaces (WU-0)

These types MUST be created first. All other WUs depend on them.

### Files to Create

```
src/types/
├── identity.ts       # VillaIdentity, AvatarConfig, UserProfile
├── sdk.ts            # VillaSDKConfig, VillaSDKPublicAPI
├── app-registration.ts # RegisteredApp, AppAuthHeaders
├── nickname.ts       # Nickname, NicknameCheckResult
├── consent.ts        # Consent, AppDataEntry
├── wallet-linking.ts # LinkedWallet, Web3BioProfile
├── api.ts            # ApiResult, ApiError, ErrorCodes
├── bridge.ts         # BridgeMessage, BridgeMessageType
└── index.ts          # Re-exports all
```

---

## Dependency Graph

```
WU-0 (Shared Types)
  │
  ├──────────────┬──────────────┬──────────────┬──────────────┐
  │              │              │              │              │
  ▼              ▼              ▼              ▼              ▼
WU-1           WU-2           WU-3           WU-7*         WU-8
(SDK Core)     (App Reg)      (Nicknames)    (Wallet Link) (API Docs)
  │              │              │              │
  ▼              ▼              ▼              │
WU-4           WU-5 ◀──────────┼──────────────┘
(Avatars)      (Permissions)   │
  │              │              │
  │              ▼              │
  │            WU-6 ◀──────────┘
  └──────────────┴──────────────────────────────▶ WU-9
```

---

## Parallel Execution Plan

### Phase 1: Foundation (1 terminal, blocking)

```bash
./scripts/coordinate.sh init identity-system
./scripts/coordinate.sh claim WU-0
@build "Implement WU-0: Shared types and interfaces"
./scripts/coordinate.sh complete WU-0
./scripts/coordinate.sh readonly src/types/
```

### Phase 2: Core Backend + SDK (4 terminals, parallel)

After WU-0 commits:

**Terminal 1:**
```bash
./scripts/coordinate.sh claim WU-1
@build "Implement WU-1: SDK Core with iframe bridge and postMessage"
```

**Terminal 2:**
```bash
./scripts/coordinate.sh claim WU-2
@build "Implement WU-2: App registration with PostgreSQL and auth middleware"
```

**Terminal 3:**
```bash
./scripts/coordinate.sh claim WU-3
@build "Implement WU-3: Nickname registry with CCIP-Read resolver"
```

**Terminal 4:**
```bash
./scripts/coordinate.sh claim WU-8
@build "Implement WU-8: API documentation - OpenAPI spec and SDK guides"
```

### Phase 3: Frontend Features (2 terminals, parallel)

After WU-2 commits:

**Terminal 1:**
```bash
./scripts/coordinate.sh claim WU-4
@build "Implement WU-4: Avatar system with DiceBear"
```

**Terminal 2:**
```bash
./scripts/coordinate.sh claim WU-5
@build "Implement WU-5: User permissions with TinyCloud"
```

### Phase 4: Dependent Features (2 terminals, parallel)

After WU-5 commits:

**Terminal 3:**
```bash
./scripts/coordinate.sh claim WU-6
@build "Implement WU-6: Private data collection"
```

**Terminal 4:**
```bash
./scripts/coordinate.sh claim WU-7
@build "Implement WU-7: Wallet linking with web3.bio"
```

### Phase 5: Integration (1 terminal, final)

After all others complete:

```bash
./scripts/coordinate.sh claim WU-9
@build "Implement WU-9: E2E and integration tests for identity system"
```

---

## File Ownership Matrix

| Path Pattern | Owner | Notes |
|--------------|-------|-------|
| `src/types/*` | WU-0 | Read-only after commit |
| `src/sdk/*` | WU-1 | SDK package |
| `src/app/sdk/*` | WU-1 | Iframe host pages |
| `src/lib/db/*` | WU-2 | PostgreSQL setup |
| `src/lib/middleware/*` | WU-2 | Auth middleware |
| `src/app/api/apps/*` | WU-2 | App registration API |
| `src/app/developers/*` | WU-2 | Developer portal |
| `src/lib/nickname/*` | WU-3 | Nickname logic |
| `src/lib/ens/*` | WU-3 | CCIP-Read resolver |
| `src/app/api/nicknames/*` | WU-3 | Nickname API |
| `contracts/*` | WU-3 | ENS resolver contract |
| `src/lib/avatar/*` | WU-4 | DiceBear integration |
| `src/components/sdk/Avatar*` | WU-4 | Avatar UI |
| `src/lib/tinycloud/*` | WU-5 | TinyCloud wrapper |
| `src/app/settings/apps/*` | WU-5 | Permissions UI |
| `src/lib/private-data/*` | WU-6 | Data collection |
| `src/lib/wallet-linking/*` | WU-7 | web3.bio integration |
| `src/app/api/wallets/*` | WU-7 | Wallet linking API |
| `docs/*` | WU-8 | Documentation |
| `tests/e2e/*-new.spec.ts` | WU-9 | Integration tests |

---

## Work Unit Details

### WU-0: Shared Types & Interfaces

**Files (exclusive):**
- `src/types/identity.ts` — VillaIdentity, AvatarConfig, UserProfile, PrivateProfile
- `src/types/sdk.ts` — VillaSDKConfig, VillaSDKPublicAPI, DataScope
- `src/types/app-registration.ts` — RegisteredApp, AppAuthHeaders, RESERVED_APP_IDS
- `src/types/nickname.ts` — Nickname, NicknameCheckResult, NicknameClaimRequest
- `src/types/consent.ts` — Consent, AppDataEntry, RevokeOptions
- `src/types/wallet-linking.ts` — LinkedWallet, Web3BioProfile, WalletLinkRequest
- `src/types/api.ts` — ApiResult, ApiError, ErrorCodes
- `src/types/bridge.ts` — BridgeMessage, BridgeMessageType, BridgeConfig
- `src/types/index.ts` — Re-exports all types

**Acceptance Criteria:**
- All interfaces compile with strict TypeScript
- Zod schemas for runtime validation where needed
- No circular dependencies

---

### WU-1: SDK Core (Iframe Bridge)

**Files (exclusive):**
- `src/sdk/VillaIdentity.ts` — Main SDK class
- `src/sdk/bridge.ts` — PostMessage communication
- `src/sdk/iframe.ts` — Iframe lifecycle
- `src/sdk/cache.ts` — Session cache for avatars
- `src/sdk/index.ts` — SDK entry point
- `src/app/sdk/page.tsx` — Iframe host page
- `src/app/sdk/layout.tsx` — SDK layout

**Acceptance Criteria:**
- `villa.signIn()` opens fullscreen iframe
- PostMessage bridge handles all communication
- < 100KB bundle size

---

### WU-2: App Registration (PostgreSQL)

**Files (exclusive):**
- `src/lib/db/client.ts` — PostgreSQL client
- `src/lib/db/migrations/001_registered_apps.sql`
- `src/lib/db/queries/apps.ts` — App CRUD
- `src/lib/middleware/app-auth.ts` — Request auth
- `src/lib/middleware/rate-limit.ts` — Rate limiting
- `src/app/api/apps/register/route.ts`
- `src/app/api/apps/[appId]/route.ts`
- `src/app/developers/page.tsx` — Portal UI

**Acceptance Criteria:**
- Registration < 2 minutes
- Invalid signatures rejected
- Rate limits: 5 apps/wallet/day, 100 req/min/app

---

### WU-3: Nickname Registry (CCIP-Read)

**Files (exclusive):**
- `src/lib/db/migrations/002_nicknames.sql`
- `src/lib/nickname/normalize.ts`
- `src/lib/nickname/validate.ts`
- `src/lib/nickname/hash.ts` — ENS namehash
- `src/lib/ens/ccip-resolver.ts`
- `src/app/api/nicknames/check/route.ts`
- `src/app/api/nicknames/claim/route.ts`
- `contracts/VillaResolver.sol`

**Acceptance Criteria:**
- Claim < 3 seconds
- `alice.proofofretreat.eth` resolves via ENS
- One nickname per wallet

---

### WU-4: Avatar System (DiceBear)

**Files (exclusive):**
- `src/lib/avatar/generator.ts`
- `src/lib/avatar/styles.ts`
- `src/lib/avatar/png-converter.ts`
- `src/components/sdk/AvatarSelection.tsx`
- `src/components/sdk/AvatarPreview.tsx`
- `src/components/sdk/AvatarTimer.tsx`

**Acceptance Criteria:**
- Same wallet + variant = identical avatar
- SVG < 20ms, PNG < 100ms
- Timer auto-selects at 0

---

### WU-5: User Permissions (TinyCloud)

**Files (exclusive):**
- `src/lib/tinycloud/client.ts`
- `src/lib/tinycloud/consent.ts`
- `src/lib/tinycloud/app-data.ts`
- `src/components/permissions/ConnectedAppsList.tsx`
- `src/components/permissions/AppDetailView.tsx`
- `src/app/settings/apps/page.tsx`

**Acceptance Criteria:**
- User sees all connected apps
- Revoke immediately blocks access
- Can delete app data on revoke

---

### WU-6: Private Data Collection

**Files (exclusive):**
- `src/lib/private-data/collector.ts`
- `src/lib/private-data/device.ts`
- `src/lib/private-data/fingerprint.ts`
- `src/hooks/usePrivateData.ts`

**Acceptance Criteria:**
- Locale captured from browser
- Device metadata collected
- Never exposed to apps

---

### WU-7: Wallet Linking (web3.bio)

**Files (exclusive):**
- `src/lib/wallet-linking/web3bio.ts`
- `src/lib/wallet-linking/signature.ts`
- `src/lib/wallet-linking/storage.ts`
- `src/app/api/wallets/link/route.ts`
- `src/app/settings/wallets/page.tsx`
- `src/hooks/useWalletLink.ts`

**Acceptance Criteria:**
- Signature required for linking
- web3.bio data fetched
- Data stays private

---

### WU-8: API Documentation

**Files (exclusive):**
- `docs/openapi.yaml`
- `docs/sdk/quickstart.md`
- `docs/sdk/authentication.md`
- `docs/api/nicknames.md`
- `docs/examples/react/`

**Acceptance Criteria:**
- Every endpoint documented
- Quick start < 5 minutes
- Code examples work

---

### WU-9: Integration Tests

**Files (exclusive):**
- `tests/e2e/sdk-flow.spec.ts`
- `tests/e2e/nickname-claim.spec.ts`
- `tests/e2e/avatar-selection.spec.ts`
- `tests/integration/full-system.test.ts`
- `tests/security/sdk-security.test.ts`

**Acceptance Criteria:**
- Full SDK flow E2E passes
- All features work together
- Security tests pass

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Type changes after WU-0 | Human approval required, broadcast to all |
| DB client not ready for WU-3 | Use mock, swap after WU-2 commits |
| TinyCloud client not ready | Wait for WU-5 to commit |
| Merge conflicts | Explicit file ownership |

---

## Summary

**Total Work Units:** 10
**Maximum Parallelism:** 4 terminals in Phase 2
**Critical Path:** WU-0 → WU-2 → WU-5 → WU-6/WU-7 → WU-9

Ready for parallel implementation.
