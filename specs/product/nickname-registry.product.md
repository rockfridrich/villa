# Product Spec: Nickname Registry

**Source:** `/specs/villa-identity-sdk-and-storage.md` (Section 3)
**Created:** 2026-01-04
**Product Lead:** @product

---

## Executive Summary

The Nickname Registry lets users claim a unique, memorable name that becomes their identity across the Village ecosystem. When a user claims "alice", they get `alice.proofofretreat.eth` — a name that resolves across all ENS-compatible apps and wallets. The experience is a simple text input with real-time validation; the complexity of ENS, CCIP-Read, and future blockchain migration is completely hidden.

**Who it's for:** New Villa users completing their identity setup.

**Why it matters:** Wallet addresses are unusable for humans. Nicknames give users a shareable identity — "I'm alice.proofofretreat.eth" — that works everywhere in web3.

---

## Jobs to Be Done

### Primary Job: Get a Memorable Name

**When I...** create my Villa identity
**I want to...** claim a unique nickname that's easy to remember and share
**So I can...** be found by friends and recognized across Village apps

**Success Criteria:**
- [ ] Claim a nickname in <10 seconds
- [ ] Name resolves in any ENS-compatible app
- [ ] One attempt success rate >80%
- [ ] No confusing validation errors

### Secondary Jobs

| Job | Context | Desired Outcome | Priority |
|-----|---------|-----------------|----------|
| Check availability | Before committing to a name | Instant feedback on availability | P1 |
| Understand rules | When my first choice is invalid | Clear guidance on what's allowed | P1 |
| Feel creative | When picking my identity | Fun, low-pressure experience | P2 |
| Future-proof choice | Worried about permanence | Know I can change later (future) | P3 |

---

## User Value Matrix

| Feature | User Sees | User Gets | User Never Knows |
|---------|-----------|-----------|------------------|
| Availability check | Green check or red X | Instant feedback | API call, database query |
| Claim button | "Claim [nickname]" | Ownership confirmed | PostgreSQL write, hash computation |
| ENS resolution | "alice.proofofretreat.eth" | Universal identity | CCIP-Read, offchain resolver |
| Validation | "Only letters and numbers" | Clear rules | Normalization, diacritic stripping |

---

## User Flows

### Flow 1: Happy Path (Available Nickname)

**Entry Point:** User completed passkey creation in SDK auth flow
**Happy Path:**
1. User sees "Choose your nickname" screen
2. User types desired nickname (e.g., "alice")
3. Real-time check shows green checkmark (available)
4. User taps "Claim alice"
5. Brief loading state
6. Success! Proceeds to avatar selection

**Flow Duration Target:** < 10 seconds

```
┌─────────────────────────────────────┐
│        Choose your nickname         │
│                                     │
│   ┌─────────────────────────────┐   │
│   │  [                        ] │   │ ← Focus here on load
│   └─────────────────────────────┘   │
│                                     │
│   This is how others will see you   │
│                                     │
│   ┌─────────────────────────────┐   │
│   │       [Continue]            │   │ ← Disabled until valid
│   └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘

            │ (user types "alice")
            ▼

┌─────────────────────────────────────┐
│        Choose your nickname         │
│                                     │
│   ┌─────────────────────────────┐   │
│   │  alice                    ✓ │   │ ← Green check
│   └─────────────────────────────┘   │
│   alice.proofofretreat.eth          │ ← Shows full ENS name
│                                     │
│   ┌─────────────────────────────┐   │
│   │       [Claim alice]         │   │ ← Enabled, yellow
│   └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘

            │ (user taps Claim)
            ▼

┌─────────────────────────────────────┐
│                                     │
│         [Spinner]                   │
│                                     │
│       Claiming alice...             │
│                                     │
│                                     │
└─────────────────────────────────────┘

            │ (claim succeeds)
            ▼

[Proceeds to Avatar Selection]
```

### Flow 2: Nickname Already Taken

**Entry Point:** User types a taken nickname
**Path:**
1. User types "alice"
2. Real-time check shows red X with "Taken"
3. User tries another name
4. Eventually finds available name

```
┌─────────────────────────────────────┐
│        Choose your nickname         │
│                                     │
│   ┌─────────────────────────────┐   │
│   │  alice                    ✗ │   │ ← Red X
│   └─────────────────────────────┘   │
│   This nickname is already taken    │ ← Error message
│                                     │
│   ┌─────────────────────────────┐   │
│   │       [Continue]            │   │ ← Disabled
│   └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

### Flow 3: Invalid Nickname

**Entry Point:** User types invalid characters
**Path:**
1. User types "alice@#$"
2. Real-time validation shows error
3. User corrects to valid format

```
┌─────────────────────────────────────┐
│        Choose your nickname         │
│                                     │
│   ┌─────────────────────────────┐   │
│   │  alice@#$                   │   │
│   └─────────────────────────────┘   │
│   Only letters and numbers allowed  │ ← Validation hint
│                                     │
│   ┌─────────────────────────────┐   │
│   │       [Continue]            │   │ ← Disabled
│   └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

### Flow 4: Reserved Nickname

**Entry Point:** User types a reserved name (admin, villa, etc.)
**Path:**
1. User types "admin"
2. Shows reserved message
3. User picks different name

```
┌─────────────────────────────────────┐
│        Choose your nickname         │
│                                     │
│   ┌─────────────────────────────┐   │
│   │  admin                    ✗ │   │ ← Red X
│   └─────────────────────────────┘   │
│   This nickname is reserved         │
│                                     │
│   ┌─────────────────────────────┐   │
│   │       [Continue]            │   │ ← Disabled
│   └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

---

## Screen Specifications

### Screen: Nickname Selection

**Purpose:** Claim a unique nickname
**Entry conditions:** Passkey created, auth complete
**Exit conditions:** Nickname claimed OR user closes SDK (aborts)

**Layout:**
```
┌─────────────────────────────────────┐
│                                     │
│        Choose your nickname         │ ← text-2xl font-semibold
│                                     │
│   ┌─────────────────────────────┐   │
│   │  [Input field]          [?] │   │ ← 44px height, icon area
│   └─────────────────────────────┘   │
│   [Helper text / error]             │ ← text-sm, contextual color
│                                     │
│   ┌─────────────────────────────┐   │
│   │   [Claim {nickname}]        │   │ ← 44px height, full width
│   └─────────────────────────────┘   │
│                                     │
│                                     │
│   [Skip for now] (optional future)  │
│                                     │
└─────────────────────────────────────┘
```

**Copy Standards:**

| Element | Text | Notes |
|---------|------|-------|
| Headline | "Choose your nickname" | Clear instruction |
| Placeholder | "yourname" | Hint, not instruction |
| Helper (default) | "This is how others will see you" | Purpose |
| Helper (checking) | "Checking..." | Loading state |
| Helper (available) | "alice.proofofretreat.eth" | Shows full ENS name |
| Helper (taken) | "This nickname is already taken" | Error |
| Helper (invalid) | "Only letters and numbers, 3-30 characters" | Validation rules |
| Helper (reserved) | "This nickname is reserved" | Reserved names |
| Helper (too short) | "Nickname must be at least 3 characters" | Length |
| Helper (too long) | "Nickname must be 30 characters or less" | Length |
| CTA (disabled) | "Continue" | Before valid input |
| CTA (enabled) | "Claim {nickname}" | Dynamic with nickname |
| CTA (loading) | "Claiming..." | During save |

**States:**

| State | Input Icon | Helper | CTA |
|-------|------------|--------|-----|
| Empty | None | "This is how others will see you" | "Continue" (disabled) |
| Typing | Spinner | "Checking..." | "Continue" (disabled) |
| Available | Green check | "{nick}.proofofretreat.eth" | "Claim {nick}" (enabled) |
| Taken | Red X | "This nickname is already taken" | "Continue" (disabled) |
| Invalid | Red X | Validation message | "Continue" (disabled) |
| Reserved | Red X | "This nickname is reserved" | "Continue" (disabled) |
| Claiming | None | "Claiming..." | Spinner + "Claiming..." |
| Error | Red X | "Something went wrong. Try again." | "Claim {nick}" (enabled) |

**Validation Rules:**

| Rule | Check | Error Message |
|------|-------|---------------|
| Length min | >= 3 chars | "Nickname must be at least 3 characters" |
| Length max | <= 30 chars | "Nickname must be 30 characters or less" |
| Characters | a-z, 0-9 only | "Only letters and numbers allowed" |
| Reserved | Not in reserved list | "This nickname is reserved" |
| Available | API check | "This nickname is already taken" |
| Profanity | Profanity filter | "This nickname is not allowed" |

**Input Behavior:**

- Auto-lowercase as user types
- Strip diacritics automatically (e.g., "alice" from "alice")
- Strip non-alphanumeric characters silently
- Debounce availability check (300ms after typing stops)
- Focus input on screen load

---

## Analytics Requirements

### Key Metrics

| Metric | Definition | Target | Tracking Method |
|--------|------------|--------|-----------------|
| Claim success rate | Successful / Attempted | >95% | Events |
| First attempt success | Claimed on first try | >80% | First `nickname_claimed` per user |
| Average attempts | Claims / Users | <1.5 | Count events per user |
| Time to claim | Screen shown to claimed | <10s | Event timestamps |

### Events to Track

| Event | Trigger | Properties | Purpose |
|-------|---------|------------|---------|
| `nickname_screen_shown` | Screen displayed | `is_first_time` | Funnel start |
| `nickname_typed` | User types (debounced) | `length`, `attempt_number` | Engagement |
| `nickname_checked` | Availability check fired | `nickname_length` | API usage |
| `nickname_available` | Check returned available | `nickname` | Success rate |
| `nickname_unavailable` | Check returned taken | `nickname` | Demand tracking |
| `nickname_invalid` | Validation failed | `reason`, `input` | UX issues |
| `nickname_claimed` | Successfully claimed | `nickname`, `attempts`, `duration_ms` | Funnel end |
| `nickname_claim_failed` | Claim failed | `error_type` | Error tracking |
| `nickname_skipped` | User skipped (if allowed) | — | Drop-off |

---

## Test Scenarios (User Perspective)

### Scenario 1: Claim available nickname

**Given** I am on the nickname selection screen
**When** I type "alice" and it's available
**Then** I see a green checkmark and "alice.proofofretreat.eth"
**And** the "Claim alice" button is enabled

### Scenario 2: Nickname already taken

**Given** I am on the nickname selection screen
**When** I type "alice" and it's already taken
**Then** I see a red X and "This nickname is already taken"
**And** the button remains disabled

### Scenario 3: Invalid characters

**Given** I am on the nickname selection screen
**When** I type "alice@123"
**Then** I see "Only letters and numbers allowed"
**And** the input automatically strips to "alice123"

### Scenario 4: Too short

**Given** I am on the nickname selection screen
**When** I type "al"
**Then** I see "Nickname must be at least 3 characters"
**And** the button remains disabled

### Scenario 5: Reserved name

**Given** I am on the nickname selection screen
**When** I type "admin"
**Then** I see "This nickname is reserved"
**And** the button remains disabled

### Scenario 6: Successful claim

**Given** I have entered an available nickname "alice"
**When** I tap "Claim alice"
**Then** I see a loading state "Claiming..."
**And** upon success, I proceed to avatar selection

### Scenario 7: Claim fails due to network

**Given** I have entered an available nickname "alice"
**When** I tap "Claim alice" and my network drops
**Then** I see "Something went wrong. Try again."
**And** I can tap the button again to retry

### Scenario 8: Case insensitivity

**Given** I am on the nickname selection screen
**When** I type "ALICE"
**Then** the input shows "alice" (lowercased)
**And** availability is checked for "alice"

---

## UX Components (21st.dev / Shadcn)

| Component | Use Case | Customization |
|-----------|----------|---------------|
| Input | Nickname field | 44px height, trailing icon area |
| Input icon (check) | Available indicator | Green, Lucide `Check` |
| Input icon (x) | Unavailable/invalid | Red, Lucide `X` |
| Input icon (spinner) | Checking state | Villa primary color |
| Button (primary) | "Claim {nick}" | Yellow, disabled until valid |
| Text (helper) | Below input | text-sm, contextual color |
| Text (ens preview) | Show full ENS name | text-sm, text-slate-500 |

---

## Scope Boundaries

### In Scope (v1)

- Nickname claim (one per wallet)
- Real-time availability checking
- Input validation (length, characters)
- Reserved word blocking
- Basic profanity filter
- ENS resolution via CCIP-Read

### Out of Scope (v1)

- Nickname changes (future — requires new claim)
- Multiple nicknames per wallet (future)
- Nickname transfers (requires on-chain migration)
- Suggested nicknames (if taken, suggest alternatives)
- Unicode/emoji nicknames (ASCII only for v1)
- Skip option (nickname required in v1)

### Dependencies

- Nickname Registry API (`/api/nicknames/check`, `/api/nicknames/claim`)
- PostgreSQL (nickname storage)
- CCIP-Read resolver (ENS resolution)
- Profanity filter library

---

## Success Definition

**This feature is successful when:**
1. >95% of claim attempts succeed (no server errors)
2. >80% of users claim on first attempt
3. Average time to claim <10 seconds
4. Zero complaints about "confusing validation"

**We will validate by:**
- Funnel analysis (screen shown → claimed)
- Error event monitoring
- User feedback on nickname selection experience
- ENS resolution verification in external apps

---

## Implementation Notes

### Normalization (User-Facing)

As user types, we normalize:
```
Input: "Alice_123!"
Display: "alice123"
```

The user sees the cleaned version in the input field.

### API Contract

**Check availability:**
```
GET /api/nicknames/check?nickname=alice
→ { available: true, normalized: "alice" }
→ { available: false, normalized: "alice", reason: "taken" | "reserved" | "profanity" }
```

**Claim nickname:**
```
POST /api/nicknames/claim
Body: { nickname: "alice" }
Headers: { Authorization: "Bearer {session_token}" }
→ { success: true, nickname: "alice", ens: "alice.proofofretreat.eth" }
→ { success: false, error: "taken" | "reserved" | "profanity" | "server_error" }
```

### Reserved Nicknames

Blocked from claiming:
- `villa`, `admin`, `system`, `api`, `test`
- `proof`, `retreat`, `village`
- Common offensive terms (via profanity filter)

### Migration Signatures

When a user claims a nickname, we also collect an EIP-712 signature that authorizes future on-chain registration. This happens silently — user sees nothing different.

```typescript
// Collected at claim time, stored in DB
{
  nickname: "alice",
  owner: "0x1234...",
  signature: "0x...",  // Authorizes on-chain migration
  signedAt: "2026-01-04T..."
}
```
