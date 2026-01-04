# Villa External SDK - Consolidated Roadmap

**Status:** ACTIVE
**Version:** 1.0.0
**Last Updated:** 2026-01-05
**Agents:** @product, @design, @architect

---

## Executive Summary

This document consolidates analysis from product, design, and architecture agents into a unified roadmap for the Villa External SDK. The SDK enables popup city developers to add passkey authentication, persistent identity, and credential aggregation to their apps in under 10 lines of code.

**Current State:** 60% infrastructure complete, 40% user-facing features complete
**Target:** npm-publishable `@villa/sdk` and `@villa/react` packages
**Timeline:** 3 sprints (~6 weeks to MLP)

---

## Current Implementation Status

### What's Built

| Component | Location | Status | Notes |
|-----------|----------|--------|-------|
| **SDK Core** | `packages/sdk/` | 90% | Types, auth, ENS, avatar, session, iframe |
| **Contracts** | `contracts/` | 100% | VillaNicknameResolverV2, BiometricRecoverySignerV2 deployed to Base Sepolia |
| **API Service** | `apps/api/` | 70% | Hono routes exist, in-memory storage (needs PostgreSQL) |
| **Web App** | `apps/web/` | 80% | Onboarding flow works, needs SDK iframe endpoint |
| **SDK Components** | `apps/web/src/components/sdk/` | 40% | AvatarSelection (excellent), FaceRecoverySetup (needs polish) |

### What's Missing

| Component | Priority | Effort | Blocker |
|-----------|----------|--------|---------|
| React hooks package (`@villa/react`) | P0 | Medium | None |
| Welcome/Sign-In screen | P0 | Small | None |
| Nickname selection screen | P0 | Medium | API endpoint |
| Consent request screen | P0 | Small | None |
| Storage abstraction (TinyCloud) | P1 | Medium | Porto TinyCloud docs |
| CCIP-Read gateway completion | P1 | Medium | PostgreSQL connection |
| Developer Portal | P2 | Large | Phase 1 complete |
| Credential aggregation | P2 | Large | Storage complete |
| MCP server | P3 | Medium | SDK complete |

---

## Jobs to Be Done (Developer Perspective)

### Primary Jobs

| Job | Current State | Target State | Priority |
|-----|---------------|--------------|----------|
| **Add authentication** | 80% - iframe exists, endpoint not deployed | `villa.signIn()` returns identity in <3s | P0 |
| **Display user identity** | 60% - avatar works, nickname partial | `identity.nickname` + `identity.avatar` always populated | P0 |
| **Use React components** | 0% - no React package | `<VillaProvider>` + `useVilla()` hook | P1 |
| **Store app data** | 0% - no storage abstraction | `villa.storage.set()` persists to TinyCloud | P1 |
| **Check credentials** | 0% - no aggregation | `villa.credentials.has('zuzalu-2023')` | P2 |

### User Value Matrix

| Feature | User Sees | User Gets | User Never Knows |
|---------|-----------|-----------|------------------|
| Sign in | "Sign in with Villa" button | Instant auth via Face ID | Porto SDK, WebAuthn, EIP-7702 |
| Nickname | Their name "alice" | Memorable identity | ENS, namehash, PostgreSQL |
| Avatar | Unique visual | Visual recognition | DiceBear, seed hashing |
| Consent | "Allow access?" prompt | Control over data | TinyCloud, permissions storage |

---

## Architecture Status (Work Units)

### Phase 1: Core SDK (MLP)

| WU | Name | Status | Files | Notes |
|----|------|--------|-------|-------|
| WU-0 | Types & Interfaces | **DONE** | `packages/sdk/src/types.ts` | Complete, locked |
| WU-1 | Porto Abstraction | **DONE** | `auth.ts`, `iframe.ts`, `session.ts` | Needs origin validation |
| WU-2 | Identity Management | **DONE** | `client.ts` | TinyCloud pending |
| WU-3 | React Package | **NOT STARTED** | `packages/react/` (new) | Critical for adoption |
| WU-4 | Storage Abstraction | **PARTIAL** | `wallet.ts` has localStorage | TinyCloud needed |

### Phase 2: API & Nicknames

| WU | Name | Status | Files | Notes |
|----|------|--------|-------|-------|
| WU-5 | Nickname API | **PARTIAL** | `apps/api/src/routes/nicknames.ts` | In-memory, needs DB |
| WU-6 | CCIP-Read Gateway | **PARTIAL** | `apps/api/src/routes/ens.ts` | Placeholder response |
| WU-7 | Relay Service | **DONE** | `apps/relay/` | Docker complete |

### Phase 3-5: Future

| Phase | Work Units | Status |
|-------|------------|--------|
| Phase 3: Developer Portal | WU-10 to WU-13 | Not started |
| Phase 4: AI-Native | WU-14, WU-15 | Not started |
| Phase 5: Polish | WU-16 to WU-18 | Partial |

---

## Design Gap Analysis

### SDK Screens Status

| Screen | Spec Source | Status | Priority |
|--------|-------------|--------|----------|
| Welcome/Sign-In | `auth-flow.md:314-351` | Missing | P0 |
| Connecting (Loading) | `auth-flow.md:362-378` | Missing | P0 |
| Nickname Selection | `auth-flow.md:145-158` | Missing | P0 |
| Avatar Selection | `avatar-selection.md` | Complete | Done |
| Consent Request | `auth-flow.md:292-308` | Missing | P0 |
| Success Celebration | Implemented | Partial | P1 |

### Design System Compliance

| Area | Score | Notes |
|------|-------|-------|
| Color tokens | 95% | Minor: purple gradient in randomize button non-standard |
| Spacing (8pt grid) | 100% | All spacing valid |
| Touch targets (44px) | 100% | All buttons compliant |
| Motion accessibility | 60% | AvatarSelection good, others need audit |
| Error states | 40% | Missing in Avatar, Face Recovery incomplete |

### UX Recommendations

1. **Add screen transitions** - Use `AnimatePresence` for slide animations
2. **Add Lottie animations** - Success, loading, empty states
3. **Fix button variants** - FaceRecovery uses undefined variants
4. **Add aria-live regions** - Timer countdown, face detection status

---

## Dependency Graph

```
DONE (Foundation)
════════════════════════════════════════════════════════════════════

Monorepo ✅ ─► Packages ✅ ─► SDK Core ✅ ─► API Service 70%
                                 │
                          Contracts ✅ (Base Sepolia deployed)

PHASE 1: MLP (Can Start Now) ═══════════════════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│  Agent 1               Agent 2               Agent 3            │
│  WU-3: React Package   WU-4: Storage         SDK Screens        │
│  ├── VillaProvider     ├── TinyCloud         ├── SignInWelcome  │
│  ├── useVilla hook     ├── App isolation     ├── NicknamePicker │
│  └── SignInButton      └── Permissions       └── ConsentRequest │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    Integration Testing
                              │
                              ▼
                    npm publish @villa/sdk @villa/react

PHASE 2: Credentials ═══════════════════════════════════════════════

WU-5: Credential Types (sequential)
         │
    ┌────┴─────┬─────────┬───────────┐
    ▼          ▼         ▼           ▼
  Zupass     Sola      EAS        Cache
 (parallel) (parallel) (parallel) (parallel)

PHASE 3-5: Portal, AI, Polish ═══════════════════════════════════════
```

---

## Blockers

### Critical (Blocking MLP)

| Blocker | Impact | Owner | Resolution |
|---------|--------|-------|------------|
| **villa.cash/auth endpoint** | Auth flow broken | @build | Deploy iframe auth page |
| **PostgreSQL not connected** | Nicknames lost on restart | @build | Connect Neon/Supabase |
| **Origin validation missing** | Security vulnerability | @build | Add allowlist in iframe.ts |

### Non-Critical (Can Ship Without)

| Blocker | Impact | Resolution |
|---------|--------|------------|
| CCIP-Read incomplete | ENS resolution offline | Implement EIP-3668 encoding |
| TinyCloud integration | Data doesn't sync cross-device | Wait for Porto docs |
| Credential aggregation | No Zupass/Sola import | Phase 2 |

---

## Prioritized Backlog

### Sprint 1: Core SDK Completion (Week 1-2)

| ID | Task | Owner | Effort | Dependencies |
|----|------|-------|--------|--------------|
| SDK-1 | Deploy villa.cash/auth iframe endpoint | @build | M | apps/web routing |
| SDK-2 | Create SignInWelcome screen | @design/@build | S | None |
| SDK-3 | Create NicknameSelection screen | @design/@build | M | SDK-2 |
| SDK-4 | Create ConsentRequest screen | @design/@build | S | SDK-2 |
| SDK-5 | Add error states to AvatarSelection | @build | S | None |
| SDK-6 | Connect PostgreSQL to API | @build | M | Neon account |
| SDK-7 | Fix origin validation in iframe.ts | @build | S | None |

**Sprint 1 Acceptance:**
- User can complete full auth flow (welcome → nickname → avatar → home)
- Nicknames persist in database
- All SDK screens have proper error handling

### Sprint 2: React Package & Polish (Week 2-3)

| ID | Task | Owner | Effort | Dependencies |
|----|------|-------|--------|--------------|
| SDK-8 | Create `@villa/react` package structure | @build | S | None |
| SDK-9 | Implement VillaProvider context | @build | M | SDK-8 |
| SDK-10 | Implement useVilla hook | @build | S | SDK-9 |
| SDK-11 | Implement useIdentity hook | @build | S | SDK-9 |
| SDK-12 | Create SignInButton component | @design/@build | S | SDK-9 |
| SDK-13 | Add screen transition animations | @design | M | Sprint 1 |
| SDK-14 | Add Lottie animations (success, loading) | @design | M | None |
| SDK-15 | Accessibility audit (aria-live, motion) | @design | S | Sprint 1 |

**Sprint 2 Acceptance:**
- `npm install @villa/react` works
- `<VillaProvider>` + `useVilla()` returns identity
- All screens have smooth transitions
- Accessibility score 100%

### Sprint 3: Storage & Publishing (Week 3-4)

| ID | Task | Owner | Effort | Dependencies |
|----|------|-------|--------|--------------|
| SDK-16 | Implement TinyCloud storage abstraction | @build | M | Porto docs |
| SDK-17 | Add app-isolated storage | @build | S | SDK-16 |
| SDK-18 | Add shared storage with consent | @build | M | SDK-17 |
| SDK-19 | Complete CCIP-Read gateway | @build | M | SDK-6 |
| SDK-20 | Write SDK README and docs | @build | S | None |
| SDK-21 | npm publish @villa/sdk | @ops | S | All tests pass |
| SDK-22 | npm publish @villa/react | @ops | S | All tests pass |

**Sprint 3 Acceptance:**
- `villa.storage.set()` / `get()` works
- alice.villa.eth resolves via ENS
- @villa/sdk and @villa/react on npm
- README has 10-line quick start

### Future Sprints

| Sprint | Focus | Key Deliverables |
|--------|-------|------------------|
| Sprint 4 | Developer Portal | App registration, API keys, usage dashboard |
| Sprint 5 | Credential Aggregation | Zupass, Sola, EAS readers |
| Sprint 6 | AI-Native | MCP server, llms.txt, .ai/ context |

---

## Success Metrics

| Metric | Target | How Measured |
|--------|--------|--------------|
| Time to integrate | <10 minutes | npm install → working auth |
| Auth success rate | >95% | SDK telemetry |
| Bundle size | <100KB | Bundlephobia |
| React hook adoption | >80% of integrations | npm download ratio |
| Developer NPS | >50 | Survey at 1 week |
| Cross-app identity | 100% | Same user = same identity |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| TinyCloud API changes | Medium | High | Wrap in abstraction layer |
| npm name conflict | Low | High | Check @villa/sdk availability now |
| Porto breaking changes | Low | High | Pin SDK version |
| ENS CCIP-Read complexity | High | Medium | Use existing ens-offchain-resolver library |
| Zupass API instability | Medium | Medium | Cache aggressively, graceful fallback |

---

## Parallelization Plan

### Immediate (3 Parallel Streams)

```bash
# Terminal 1: React Package
@build "Create @villa/react package with VillaProvider, useVilla, SignInButton"

# Terminal 2: SDK Screens
@build "Create SignInWelcome, NicknameSelection, ConsentRequest components"

# Terminal 3: Infrastructure
@build "Connect PostgreSQL to API, fix origin validation, deploy auth endpoint"
```

### File Ownership

| Stream | Owned Files | Read-Only |
|--------|-------------|-----------|
| React Package | `packages/react/*` | `packages/sdk/src/types.ts` |
| SDK Screens | `apps/web/src/components/sdk/*` | `packages/sdk/src/*` |
| Infrastructure | `apps/api/*`, `packages/sdk/src/iframe.ts` | `packages/sdk/src/types.ts` |

---

## Handoff Commands

```bash
# Check current state
./scripts/coordinate.sh status

# Initialize SDK external work
./scripts/coordinate.sh init sdk-external

# Claim work units
Terminal 1: ./scripts/coordinate.sh claim WU-3-react
Terminal 2: ./scripts/coordinate.sh claim WU-screens
Terminal 3: ./scripts/coordinate.sh claim WU-infra

# Execute
Terminal 1: @build "Create @villa/react package..."
Terminal 2: @build "Create SDK screens..."
Terminal 3: @build "Fix infrastructure blockers..."

# Mark complete
./scripts/coordinate.sh complete WU-3-react
```

---

## Consolidated from Agent Analysis

- **@product**: JTBD analysis, prioritized backlog, success metrics
- **@design**: UX gap analysis, screen specifications, accessibility audit
- **@architect**: Work unit status, dependency graph, parallelization plan

---

## Next Steps

1. **Immediate**: Review and approve this roadmap
2. **This week**: Start Sprint 1 (SDK-1 through SDK-7)
3. **Before merge**: Run `pnpm verify` on all changes
4. **After Sprint 1**: Test with first design partner (residents.proofofretreat.me)

---

*This spec consolidates `specs/sdk-for-external.md`, `specs/villa-identity-sdk-and-storage.md`, `specs/active/identity-sdk.md`, and `specs/active/v2-architecture.md` into an actionable roadmap.*
