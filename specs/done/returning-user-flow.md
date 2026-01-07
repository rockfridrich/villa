# Returning User Flow Spec

**Status:** ACTIVE
**Created:** 2026-01-05
**Owner:** @product

---

## Problem Statement

When a user who has **already set up their nickname and avatar** signs in:
- They should go **directly to home page** (skip onboarding)
- On a **new device**, they shouldn't have to re-enter everything

Currently, identity is stored only in localStorage. Multi-device users lose their profile.

---

## Observer Perspective: What Should Happen

```
User taps "Sign In"
    │
    ▼
Passkey authenticates → Get wallet address
    │
    ▼
PARALLEL: Check nickname (contract) + Check avatar (storage)
    │
    ├── BOTH exist → Go to HOME
    │
    ├── Nickname exists, no avatar → Go to AVATAR step only
    │
    └── Neither exists → Go to NICKNAME → AVATAR → HOME
```

---

## Data Persistence

### Where Things Live

| Data | Primary Storage | Backup Storage | Query Time |
|------|-----------------|----------------|------------|
| **Nickname** | VillaNicknameResolver contract | PostgreSQL (CCIP-Read) | <500ms |
| **Avatar** | localStorage | TinyCloud (Phase 2) | <50ms local |
| **Passkey** | Device keychain | Porto SDK syncs | N/A |

### Why This Split

- **Nickname on-chain**: Globally unique, ENS-compatible, survives device changes
- **Avatar local-first**: Fast renders, deterministic (wallet+variant = same image), sync later
- **Passkey synced**: iCloud/Google handles this automatically

---

## Detection Logic

### Step 1: After Passkey Auth

```typescript
// User authenticates, we get their address
const { address } = await porto.connect()
```

### Step 2: Check Nickname (On-Chain)

```typescript
// Query VillaNicknameResolver
const nickname = await getNicknameByAddress(address)
// Returns: "alice" | null
```

**Implementation:**
- Call `VillaNicknameResolver.nicknameFor(address)`
- If returns non-empty string → user has nickname
- If returns empty → user needs to claim nickname

### Step 3: Check Avatar (Local)

```typescript
// Check localStorage for avatar config
const storedIdentity = useIdentityStore.getState().identity
const hasLocalAvatar = storedIdentity?.avatar && storedIdentity.address === address
```

### Step 4: Route Based on State

| Nickname | Avatar | Route To | Why |
|----------|--------|----------|-----|
| ✅ Yes | ✅ Yes | `/home` | Returning user, has everything |
| ✅ Yes | ❌ No | `/onboarding?step=avatar` | New device, nickname persisted |
| ❌ No | ❌ No | `/onboarding?step=profile` | New user |
| ❌ No | ✅ Yes | `/onboarding?step=profile` | Edge case (reset avatar if needed) |

---

## User Flows

### Flow 1: Returning User (Same Device)

```
User taps "Sign In"
    │
    ▼
Face ID / Touch ID prompt
    │
    ▼
"Welcome back!" (brief celebration)
    │
    ▼
Redirect to /home
```

**Duration:** < 3 seconds

### Flow 2: Returning User (New Device)

```
User taps "Sign In"
    │
    ▼
Face ID / Touch ID prompt
    │
    ▼
Check: Nickname on-chain? → Yes, found "alice"
Check: Avatar in localStorage? → No
    │
    ▼
"Welcome back, alice!"
"Let's set up your look on this device"
    │
    ▼
Avatar selection screen (skip nickname)
    │
    ▼
Redirect to /home
```

**Duration:** < 30 seconds (avatar has 30s timer)

### Flow 3: New User

```
User taps "Create Villa ID"
    │
    ▼
Face ID / Touch ID (passkey creation)
    │
    ▼
Nickname selection screen
    │
    ▼
Avatar selection screen
    │
    ▼
Redirect to /home
```

**Duration:** < 60 seconds

---

## Implementation Tasks

### Phase 1: Contract Query (Required)

- [x] Add `getNicknameByAddress(address)` helper function
- [x] Call VillaNicknameResolver on Base Sepolia (testnet)
- [x] Cache result in memory for session
- [x] Handle contract call failures gracefully (fallback to localStorage)

### Phase 2: Routing Logic Update

- [x] Update `onboarding/page.tsx` to check nickname on sign-in
- [x] Add URL param `?step=avatar` for direct avatar entry
- [x] Skip nickname step if already claimed
- [x] Show "Welcome back, {nickname}!" when nickname found

### Phase 3: Avatar Sync (Future)

- [ ] Store avatar config in TinyCloud after selection
- [ ] On new device: query TinyCloud if local avatar missing
- [ ] Fallback: let user pick avatar again (it's quick)

---

## State Machine

```
                    ┌─────────────────────────────────────────────┐
                    │              ENTRY                          │
                    │         villa.signIn()                      │
                    └─────────────────┬───────────────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────────────────┐
                    │           AUTHENTICATING                    │
                    │      Porto passkey prompt                   │
                    └─────────────────┬───────────────────────────┘
                                      │
                              ┌───────┴───────┐
                              │   Success?    │
                              └───────┬───────┘
                         No ◄─────────┴─────────► Yes
                          │                        │
                          ▼                        ▼
                    ┌─────────────┐    ┌─────────────────────────┐
                    │   ERROR     │    │   CHECK PROFILE STATE   │
                    │  Show retry │    │  Query nickname + avatar │
                    └─────────────┘    └─────────────┬───────────┘
                                                     │
                              ┌───────────────┬──────┴──────┬────────────────┐
                              │               │             │                │
                              ▼               ▼             ▼                ▼
                    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
                    │  COMPLETE   │  │   AVATAR    │  │  NICKNAME   │  │   EDGE      │
                    │  (both set) │  │  (nick set) │  │  (nothing)  │  │  (avatar    │
                    │             │  │             │  │             │  │   only)     │
                    └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
                           │                │                │                │
                           ▼                ▼                ▼                ▼
                    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
                    │   /home     │  │  Pick avatar│  │Pick nickname│  │Pick nickname│
                    │             │  │  → /home    │  │→Pick avatar │  │(keep avatar)│
                    └─────────────┘  └─────────────┘  │  → /home    │  │  → /home    │
                                                      └─────────────┘  └─────────────┘
```

---

## UX Copy

| Scenario | Heading | Subtext |
|----------|---------|---------|
| Returning (complete) | "Welcome back!" | — |
| Returning (need avatar) | "Welcome back, {nickname}!" | "Let's set up your look on this device" |
| New user (need both) | "Choose your @handle" | "This is how others will find you" |

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Returning user to home | N/A (localStorage only) | < 3s |
| New device setup | Re-enter everything | Skip nickname, < 30s |
| New user complete | < 60s | < 60s (no change) |

---

## Dependencies

- **VillaNicknameResolver contract** — Already deployed (Base Sepolia)
- **Porto SDK** — Handles passkey auth
- **localStorage** — Avatar storage (Phase 1)
- **TinyCloud** — Avatar sync (Phase 2, future)

---

## Security Considerations

- Nickname query is read-only (no signing required)
- Avatar stored locally, regenerated if missing (deterministic)
- No sensitive data exposed in routing params
- Contract query failures should not block auth flow

---

## Out of Scope (v1)

- Multi-device avatar sync via TinyCloud
- Nickname changes (requires new claim)
- Avatar upload (only DiceBear generation)
- Offline mode

---

## Acceptance Criteria

- [x] User with nickname + avatar on localStorage → goes to /home immediately
- [x] User with nickname on-chain but no local avatar → goes to avatar step only
- [x] User with nothing → goes through full onboarding
- [x] Contract query failure → falls back to localStorage check
- [x] "Welcome back, {nickname}!" shown when nickname found
- [x] Avatar selection timer still works (30s auto-select)

---

*This spec focuses on the decision logic. UI changes are minimal — just routing.*
