# Product Spec: SDK Auth Flow

**Source:** `/specs/villa-identity-sdk-and-storage.md` (Section 1)
**Created:** 2026-01-04
**Product Lead:** @product

---

## Executive Summary

The SDK Auth Flow is the entry point to the Villa Identity System. When a third-party app calls `villa.signIn()`, a fullscreen iframe opens with the complete authentication experience. Users either sign in with their existing passkey or create a new Villa ID — all within the iframe we control. The app receives a verified identity without ever touching security-critical operations.

**Who it's for:** End users authenticating via any Village-ecosystem app.

**Why it matters:** Every interaction starts with auth. This flow must be fast, trustworthy, and seamlessly branded — the first impression of Villa's quality.

---

## Jobs to Be Done

### Primary Job: Authenticate Quickly

**When I...** open a Village app and need to prove who I am
**I want to...** sign in with my face or fingerprint in one tap
**So I can...** start using the app immediately without friction

**Success Criteria:**
- [ ] Returning user signs in < 3 seconds
- [ ] New user creates account < 60 seconds
- [ ] No typing required for returning users
- [ ] Works on all major browsers (Safari, Chrome, Firefox, Edge)

### Secondary Jobs

| Job | Context | Desired Outcome | Priority |
|-----|---------|-----------------|----------|
| Trust the experience | Unknown app using Villa | See clear Villa branding, understand consent | P1 |
| Seamless cross-device | Signed up on phone, using laptop | Passkey syncs automatically | P2 |
| Recover from errors | Biometric fails, network drops | Clear guidance to retry | P1 |
| New account setup | First time in ecosystem | Create identity + nickname + avatar | P1 |

---

## User Value Matrix

| Feature | User Sees | User Gets | User Never Knows |
|---------|-----------|-----------|------------------|
| Sign in | "Sign In" button + biometric | Instant access | Porto SDK, wallet_connect RPC |
| Create account | "Create Villa ID" button | New identity created | Passkey creation, wallet generation |
| Biometric prompt | Face ID / Touch ID dialog | Secure passwordless auth | WebAuthn protocol |
| Loading state | "Connecting..." spinner | Feedback that it's working | postMessage bridge |
| Profile setup | Name input + avatar picker | Complete identity | TinyCloud storage |

---

## User Flows

### Flow 1: Returning User (Sign In)

**Entry Point:** App calls `villa.signIn()`
**Happy Path:**
1. User sees fullscreen iframe with Villa branding
2. User taps "Sign In" (primary button)
3. System shows passkey selector with their account
4. User authenticates with Face ID / Touch ID
5. Iframe closes, app receives identity object

**Flow Duration Target:** < 3 seconds

```
┌─────────────────────────────────────┐
│          Villa Identity             │
│                                     │
│   Your identity. No passwords.      │
│                                     │
│   ┌─────────────────────────────┐   │
│   │        [Sign In]            │   │ ← Primary (yellow)
│   └─────────────────────────────┘   │
│                                     │
│   ┌─────────────────────────────┐   │
│   │     Create Villa ID         │   │ ← Secondary (outline)
│   └─────────────────────────────┘   │
│                                     │
│       Secured by passkeys           │
│                                     │
└─────────────────────────────────────┘
            │
            ▼ (after biometric)
┌─────────────────────────────────────┐
│          Welcome back!              │
│                                     │
│      [Redirecting to app...]        │
│                                     │
└─────────────────────────────────────┘
```

**Error Paths:**

| Trigger | User Sees | Recovery Action |
|---------|-----------|-----------------|
| User cancelled biometric | "You cancelled. Try again when ready." | "Try Again" button |
| Biometric failed | "Authentication failed. Please try again." | "Try Again" button |
| No passkey found | "No account found. Create a Villa ID?" | Show create flow |
| Network error | "Connection lost. Check your network." | "Try Again" button |

### Flow 2: New User (Create Villa ID)

**Entry Point:** App calls `villa.signIn()`, user has no passkey
**Happy Path:**
1. User sees fullscreen iframe with Villa branding
2. User taps "Create Villa ID" (secondary button)
3. System creates passkey (biometric prompt)
4. User enters nickname (see Nickname spec)
5. User selects avatar (see Avatar spec)
6. Iframe closes, app receives complete identity

**Flow Duration Target:** < 60 seconds

```
Step 1: Welcome
┌─────────────────────────────────────┐
│          Villa Identity             │
│                                     │
│   Your identity. No passwords.      │
│                                     │
│   ┌─────────────────────────────┐   │
│   │        [Sign In]            │   │
│   └─────────────────────────────┘   │
│                                     │
│   ┌─────────────────────────────┐   │
│   │     Create Villa ID         │   │ ← User taps
│   └─────────────────────────────┘   │
│                                     │
│       Secured by passkeys           │
│                                     │
└─────────────────────────────────────┘
            │
            ▼ (after passkey creation)

Step 2: Nickname (see nickname-registry.product.md)
┌─────────────────────────────────────┐
│        Choose your nickname         │
│                                     │
│   ┌─────────────────────────────┐   │
│   │  alice                    ✓ │   │
│   └─────────────────────────────┘   │
│   This is how others will see you   │
│                                     │
│   ┌─────────────────────────────┐   │
│   │       [Claim alice]         │   │
│   └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
            │
            ▼

Step 3: Avatar (see avatar-selection.product.md)
┌─────────────────────────────────────┐
│          Pick your look             │
│                                     │
│      [Male] [Female] [Other]        │
│                                     │
│         ┌───────────┐               │
│         │  (avatar) │               │
│         └───────────┘               │
│                                     │
│        [Randomize]     0:25         │
│                                     │
│   ┌─────────────────────────────┐   │
│   │        [Select]             │   │
│   └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
            │
            ▼

Step 4: Complete
┌─────────────────────────────────────┐
│       Welcome, alice!               │
│                                     │
│         ┌───────────┐               │
│         │  (avatar) │               │
│         └───────────┘               │
│                                     │
│   alice.proofofretreat.eth          │
│                                     │
│      [Redirecting to app...]        │
│                                     │
└─────────────────────────────────────┘
```

**Error Paths:**

| Trigger | User Sees | Recovery Action |
|---------|-----------|-----------------|
| Passkey creation failed | "Could not create passkey. Check browser settings." | "Try Again" + help link |
| Nickname taken | (handled in nickname flow) | Pick different name |
| Network error | "Connection lost. Your progress is saved." | "Try Again" button |
| Browser unsupported | "Your browser doesn't support passkeys." | Browser suggestions |

### Flow 3: Consent Request

**Entry Point:** App calls `villa.getData(['nickname', 'avatar'])`
**Happy Path:**
1. If consent not yet granted, iframe opens
2. User sees what app is requesting
3. User approves or denies
4. Iframe closes, app receives data (or error)

```
┌─────────────────────────────────────┐
│      [App Name] wants access to:    │
│                                     │
│   ☑ Your nickname (alice)           │
│   ☑ Your avatar                     │
│                                     │
│   ┌─────────────────────────────┐   │
│   │        [Allow]              │   │
│   └─────────────────────────────┘   │
│                                     │
│   ┌─────────────────────────────┐   │
│   │        Deny                 │   │
│   └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

---

## Screen Specifications

### Screen: Welcome (SDK Entry)

**Purpose:** Entry point for all auth flows
**Entry conditions:** `villa.signIn()` called
**Exit conditions:** User taps Sign In or Create Villa ID

**Layout:**
```
┌─────────────────────────────────────┐
│                                     │
│         [Villa Logo/Mark]           │
│                                     │
│    Your identity. No passwords.     │
│                                     │
│                                     │
│   ┌─────────────────────────────┐   │
│   │        [Sign In]            │   │ ← 44px height
│   └─────────────────────────────┘   │
│            16px gap                 │
│   ┌─────────────────────────────┐   │
│   │     Create Villa ID         │   │ ← 44px height
│   └─────────────────────────────┘   │
│                                     │
│                                     │
│       Secured by passkeys           │
│                                     │
└─────────────────────────────────────┘
```

**Copy Standards:**

| Element | Text | Notes |
|---------|------|-------|
| Headline | "Your identity. No passwords." | Value proposition |
| Primary CTA | "Sign In" | For returning users |
| Secondary CTA | "Create Villa ID" | For new users |
| Footer | "Secured by passkeys" | Trust signal, subtle |

**States:**

| State | Visual | Behavior |
|-------|--------|----------|
| Default | Both buttons enabled | User can tap either |
| Loading (Sign In) | Primary button shows spinner | "Signing in..." text |
| Loading (Create) | Secondary button shows spinner | "Creating..." text |
| Error | Error banner above buttons | Message + retry |

### Screen: Connecting

**Purpose:** Feedback while Porto processes
**Entry conditions:** User tapped a CTA
**Exit conditions:** Success or error

**Layout:**
```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│         [Spinner animation]         │
│                                     │
│         Connecting...               │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

**Copy Standards:**

| Element | Text | Notes |
|---------|------|-------|
| Sign in loading | "Signing in..." | During biometric |
| Create loading | "Creating your Villa ID..." | During passkey creation |

### Screen: Success (Transition)

**Purpose:** Confirm completion before returning to app
**Entry conditions:** Auth complete
**Exit conditions:** Auto-close after 1.5s

**Layout:**
```
┌─────────────────────────────────────┐
│                                     │
│          [Success Check]            │
│                                     │
│      Welcome back, alice!           │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

---

## Analytics Requirements

### Key Metrics

| Metric | Definition | Target | Tracking Method |
|--------|------------|--------|-----------------|
| Auth success rate | Completed / Started | >95% | Events |
| Auth duration (return) | SDK open to identity returned | <3s | `sdk_opened` to `identity_returned` |
| Auth duration (new) | SDK open to identity returned | <60s | `sdk_opened` to `identity_returned` |
| Error rate | Errors / Attempts | <5% | Error events |

### Events to Track

| Event | Trigger | Properties | Purpose |
|-------|---------|------------|---------|
| `sdk_opened` | Iframe displayed | `app_id`, `referrer` | Funnel start |
| `auth_started` | User tapped CTA | `flow_type: 'sign_in' \| 'create'` | Flow selection |
| `biometric_prompted` | OS prompt shown | `prompt_type` | Identify drop-off |
| `biometric_completed` | User authenticated | `duration_ms` | Performance |
| `biometric_failed` | Auth failed | `error_type` | Error tracking |
| `identity_created` | New account complete | `has_nickname`, `has_avatar` | Completion |
| `identity_returned` | SDK closed, data sent | `duration_ms`, `flow_type` | Funnel end |
| `sdk_closed` | Iframe closed (any reason) | `completion_state` | Track abandonment |
| `error_shown` | Error displayed | `error_type`, `error_message` | Debug |

---

## Test Scenarios (User Perspective)

### Scenario 1: Returning user signs in successfully

**Given** I have a Villa ID created on this device
**When** I tap "Sign In" and authenticate with Face ID
**Then** I see "Welcome back, [name]!" briefly
**And** the app receives my identity and the iframe closes

### Scenario 2: New user creates account

**Given** I have never used Villa before
**When** I tap "Create Villa ID" and authenticate with Face ID
**Then** I am guided through nickname and avatar selection
**And** upon completion, the app receives my new identity

### Scenario 3: User cancels biometric

**Given** I am on the welcome screen
**When** I tap "Sign In" and cancel the Face ID prompt
**Then** I see "You cancelled. Try again when ready."
**And** I can tap "Try Again" to restart

### Scenario 4: Network error during auth

**Given** I am on the welcome screen
**When** I tap "Sign In" and my network drops
**Then** I see "Connection lost. Check your network."
**And** I can tap "Try Again" when connected

### Scenario 5: Browser doesn't support passkeys

**Given** I am using an outdated browser
**When** the SDK opens
**Then** I see "Your browser doesn't support passkeys"
**And** I see suggestions for supported browsers

### Scenario 6: Consent request for app data

**Given** I am authenticated
**When** an app requests my nickname and avatar
**Then** I see a consent screen listing what they want
**And** I can approve or deny access

---

## UX Components (21st.dev / Shadcn)

| Component | Use Case | Customization |
|-----------|----------|---------------|
| Button (primary) | "Sign In" | Yellow/amber, full-width, 44px height |
| Button (secondary) | "Create Villa ID" | Outline/ghost, full-width, 44px height |
| Button (text) | "Cancel" | Text only, no background |
| Spinner | Loading states | Villa primary color |
| Alert | Error messages | Red border, icon + text |
| Dialog | Fullscreen iframe container | No close button (controlled flow) |
| Checkbox | Consent scopes | Read-only (informational) |

---

## Scope Boundaries

### In Scope (v1)

- Fullscreen iframe auth flow
- Sign In for returning users
- Create Villa ID for new users
- Biometric authentication (Face ID, Touch ID, fingerprint)
- Error handling for all failure modes
- Basic consent prompts
- Cross-browser support (Safari, Chrome, Firefox, Edge)

### Out of Scope (v1)

- Custom theming (apps cannot change colors yet) — v1.1
- Headless mode (iframe required) — v1.1
- Native mobile SDKs — v1.1
- Embedded inline flow (always fullscreen) — future
- Password fallback (passkeys only) — by design

### Dependencies

- Porto SDK (passkey operations)
- TinyCloud (profile storage)
- Nickname Registry API (nickname validation)
- Avatar System (avatar generation)

---

## Success Definition

**This feature is successful when:**
1. 95%+ of auth attempts complete successfully
2. Returning users authenticate in <3 seconds
3. New users complete onboarding in <60 seconds
4. Zero user-facing mentions of "wallet", "Porto", or "0x"

**We will validate by:**
- Analytics funnel analysis (drop-off per step)
- User session recordings (where allowed)
- Error rate monitoring
- User feedback ("How easy was signing in?" 1-5)

---

## Implementation Notes

### Iframe Communication

```
App Window                Villa Iframe
    │                          │
    │ ── postMessage: open ─→  │
    │                          │ (user authenticates)
    │ ←─ postMessage: result ─ │
    │                          │
```

### Identity Object Returned

```typescript
{
  walletAddress: '0x1234...',
  nickname: 'alice' | null,
  avatar: { style: 'anime-female', variant: 42 } | null,
  isNewUser: boolean
}
```

### Security Considerations

- Iframe must be on `id.proofofretreat.me` (same origin for storage)
- Wallet address salted for any external logging
- Passkey operations happen in Porto's security context
- No sensitive data in postMessage payloads
