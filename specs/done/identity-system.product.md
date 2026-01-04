# Product Spec: Villa Identity System

**Source:** `/specs/villa-identity-sdk-and-storage.md`
**Created:** 2026-01-04
**Product Lead:** @product

---

## Executive Summary

The Villa Identity System is a complete identity layer for the Proof of Retreat Village ecosystem. It enables users to create a passkey-secured identity, claim a unique nickname that resolves across ENS, select a personalized avatar, and maintain granular control over what data third-party apps can access. The system prioritizes privacy, simplicity, and user sovereignty while hiding all blockchain complexity behind a "just works" experience.

**Who it's for:** Village members who want a memorable, portable identity without managing wallets, seeds, or passwords.

**Why it matters:** Identity is the foundation of community. Villa gives users a single identity they own, control, and can use across all Village apps — while ensuring they never see technical jargon like "wallet addresses" or "signatures."

---

## Jobs to Be Done Hierarchy

### Primary Job: Portable Identity

**When I...** join the Village ecosystem and want to participate in apps and events
**I want to...** create a single identity that works everywhere
**So I can...** be recognized by friends and communities without creating new accounts per app

**Success Criteria:**
- [ ] Identity created in under 60 seconds
- [ ] Same identity recognized across all Village apps
- [ ] No passwords, emails, or phone numbers required

### Secondary Jobs

| Job | Context | Desired Outcome | Priority |
|-----|---------|-----------------|----------|
| Memorable name | When I want people to find me | Easy-to-share nickname that works in ENS | P1 |
| Visual identity | When I want to be visually recognized | Unique avatar that represents me | P2 |
| Privacy control | When apps ask for my data | See exactly what's shared, revoke anytime | P2 |
| Quick sign-in | When I return to an app | Seamless biometric authentication | P1 |
| External identity | When I have existing web3 presence | Link my ENS/Farcaster identity | P3 |

---

## User Value Matrix

| Feature | User Sees | User Gets | User Never Knows |
|---------|-----------|-----------|------------------|
| **1. SDK Auth** | "Sign In" button | One-tap access to any Village app | Fullscreen iframe, Porto SDK, wallet creation |
| **2. App Registration** | Nothing (developer-facing) | Apps verified, can't impersonate | Wallet signatures, PostgreSQL storage |
| **3. Nickname Registry** | "Choose your nickname" input | alice.proofofretreat.eth | CCIP-Read, offchain resolvers, ENS contracts |
| **4. Avatar System** | Gender selector + randomize | Fun, unique visual identity | DiceBear generation, deterministic seeds |
| **5. User Permissions** | "Connected Apps" list | Full control over data access | TinyCloud vault, consent records |
| **6. Private Data** | Nothing (automatic) | Personalized experience | Device fingerprinting, fraud detection |
| **7. Wallet Linking** | "Connect Wallet" button | Import ENS name, Farcaster profile | web3.bio API, signature verification |
| **8. Documentation** | (Developer-facing) | Easy integration | OpenAPI, JSDoc |

---

## Priority Order for Shipping

### Tier 1: Core Identity (Ship First)

| # | Feature | Why First | Dependencies |
|---|---------|-----------|--------------|
| 1 | **SDK Auth Flow** | Nothing works without auth | None |
| 2 | **Nickname Registry** | Core identity value prop | Auth complete |
| 3 | **Avatar System** | Completes visual identity | Auth complete |

### Tier 2: User Control (Ship Second)

| # | Feature | Why Second | Dependencies |
|---|---------|------------|--------------|
| 4 | **User Permissions** | Users need control before apps integrate | Auth, Nickname |
| 5 | **Private Data Collection** | Improves experience, enables fraud detection | Auth |

### Tier 3: Enrichment (Ship Third)

| # | Feature | Why Third | Dependencies |
|---|---------|-----------|--------------|
| 6 | **Wallet Linking** | Nice-to-have for power users | All Tier 1 & 2 |
| 7 | **App Registration** | Enables third-party ecosystem | All Tier 1 |
| 8 | **API Documentation** | Supports developer ecosystem | All features |

---

## Cross-Feature User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER JOURNEY                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  App calls villa.signIn()                                       │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────────┐    ┌─────────────────┐                    │
│  │  Returning User │    │    New User      │                    │
│  │   "Sign In"     │    │ "Create Villa ID"│                    │
│  └────────┬────────┘    └────────┬─────────┘                    │
│           │                      │                              │
│           │                      ▼                              │
│           │         ┌────────────────────────┐                  │
│           │         │  Nickname Selection    │                  │
│           │         │  "Choose your nickname"│                  │
│           │         └───────────┬────────────┘                  │
│           │                     │                               │
│           │                     ▼                               │
│           │         ┌────────────────────────┐                  │
│           │         │   Avatar Selection     │                  │
│           │         │   [30-second timer]    │                  │
│           │         └───────────┬────────────┘                  │
│           │                     │                               │
│           ▼                     ▼                               │
│  ┌─────────────────────────────────────────────┐               │
│  │              Identity Complete              │               │
│  │   nickname + avatar + wallet returned       │               │
│  └─────────────────────────────────────────────┘               │
│                        │                                        │
│                        ▼                                        │
│  ┌─────────────────────────────────────────────┐               │
│  │           App Data Consent                  │               │
│  │  (if app requests specific scopes)          │               │
│  └─────────────────────────────────────────────┘               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Language Guidelines

| Technical Term | User-Facing Term | Context |
|----------------|------------------|---------|
| Porto SDK | (hidden) | Infrastructure |
| Wallet address | Villa ID | When must reference identity |
| 0x... address | (hidden) | Never show raw addresses |
| Passkey / WebAuthn | Face ID / Touch ID | In prompts |
| TinyCloud | (hidden) | Storage layer |
| CCIP-Read | (hidden) | ENS resolution |
| Consent record | "Connected Apps" | Permission management |
| ENS resolution | "Your nickname works everywhere" | Value statement |
| DiceBear | (hidden) | Avatar generation |

---

## Copy Standards (System-wide)

| Element | Copy | Notes |
|---------|------|-------|
| Welcome headline | "Your identity. No passwords." | Value prop |
| Security badge | "Secured by passkeys" | Trust signal |
| Primary CTA | "Sign In" | Returning users |
| Secondary CTA | "Create Villa ID" | New users |
| Nickname prompt | "Choose your nickname" | Clear instruction |
| Nickname helper | "This is how others will see you" | Purpose |
| Avatar prompt | "Pick your look" | Casual, fun |
| Consent prompt | "[App] wants access to:" | Clear requester |
| Revoke action | "Remove Access" | Direct action |
| Switch account | "Switch Account" | Not "Sign Out" |

---

## Analytics Strategy

### Key Funnels

| Funnel | Steps | Success Metric |
|--------|-------|----------------|
| **Onboarding** | Open SDK -> Auth -> Nickname -> Avatar -> Done | % completing all steps |
| **Return Auth** | Open SDK -> Sign In -> Done | Time to auth (<3s) |
| **App Consent** | Consent shown -> Granted/Denied | Grant rate per scope |
| **Permission Review** | View apps -> Revoke any | Revoke rate (low = healthy) |

### Core Events

| Event | Trigger | Properties |
|-------|---------|------------|
| `identity_started` | SDK opened | `app_id`, `is_returning` |
| `identity_created` | New account complete | `has_nickname`, `has_avatar` |
| `identity_signed_in` | Existing account auth | `auth_duration_ms` |
| `nickname_claimed` | Nickname saved | `nickname_length`, `attempts` |
| `avatar_selected` | Avatar confirmed | `style`, `timer_remaining` |
| `consent_granted` | User approved scopes | `app_id`, `scopes[]` |
| `consent_denied` | User rejected | `app_id` |
| `access_revoked` | User removed app | `app_id` |

---

## Success Definition

### Quantitative Goals

| Metric | Target | Measurement |
|--------|--------|-------------|
| Onboarding completion | >85% | Start to finish |
| Auth time (returning) | <3s | SDK open to identity returned |
| Nickname claim success | >95% | First attempt |
| App consent grant rate | >70% | Granted / shown |
| Weekly active users | Growing | DAU/WAU ratio |

### Qualitative Goals

- Users describe Villa ID as "my name everywhere"
- Users never encounter technical jargon
- Users feel in control of their data
- Developers integrate in under 30 minutes

---

## Dependencies

### External Services

| Service | Purpose | Criticality |
|---------|---------|-------------|
| Porto SDK | Passkey auth, wallet creation | Critical |
| TinyCloud | User data storage | Critical |
| DiceBear | Avatar generation | Medium |
| web3.bio | Wallet enrichment | Low |

### Internal Systems

| System | Purpose | Required By |
|--------|---------|-------------|
| PostgreSQL | Nickname registry, app registration | Tier 1 |
| Gateway API | SDK backend, ENS resolver | Tier 1 |
| CCIP-Read resolver | ENS resolution | Tier 1 (nickname) |

---

## Scope Boundaries

### In Scope (v1)

- SDK auth via fullscreen iframe
- Nickname claim (one per wallet)
- Avatar selection (3 styles)
- Consent management (view, revoke)
- Private data collection (locale, device)
- Wallet linking with signature verification

### Out of Scope (v1)

- Custom SDK theming (v1.1)
- Native mobile SDKs (v1.1)
- Multiple nicknames per wallet (future)
- Avatar customization beyond style/variant (future)
- ENS subdomain transfers (requires on-chain migration)
- Social recovery via Villa (uses Porto's built-in)

---

## Related Product Specs

| Spec | Focus | Status |
|------|-------|--------|
| `/specs/product/sdk-auth-flow.product.md` | SDK sign-in experience | In Progress |
| `/specs/product/nickname-registry.product.md` | Nickname claiming | In Progress |
| `/specs/product/avatar-selection.product.md` | Avatar picker flow | In Progress |

---

## Next Steps

1. **@architect** — Decompose SDK Auth Flow for implementation
2. **@architect** — Decompose Nickname Registry for implementation
3. **@architect** — Decompose Avatar System for implementation
4. **@build** — Implement in priority order (Tier 1 first)
