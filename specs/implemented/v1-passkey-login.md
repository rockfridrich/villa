# V1: Passkey Login

**Status:** IN PROGRESS
**Design:** Pending (Villa screens wrap Porto prompts)

## Goal

Let users create or sign in to a Villa identity using Porto SDK with Face ID or fingerprint. Porto handles passkey management, wallet creation, and cross-device sync. The Porto wallet address becomes the canonical user ID.

## Why Porto SDK (Not Native WebAuthn)

The current implementation uses native WebAuthn with fake derived addresses. Porto SDK provides:

1. **Real wallet addresses** - Porto creates actual Ethereum accounts, not hash-derived pseudo-addresses
2. **Passkey management** - Porto handles storage, cross-device sync, and recovery
3. **Single canonical ID** - The wallet address is the user's identity across all Villa services
4. **Recovery built-in** - Porto supports multi-path recovery (social, email, OAuth)

## User Experience

### Welcome Screen Logic

**Sign In is ALWAYS the primary button.** Most users are returning.

Detection flow on app load:
1. Check local storage for existing Villa identity
2. If found → redirect to home (skip welcome)
3. If not found → show welcome screen

### Returning User (Sign In) — Primary Flow

1. User opens Villa, sees welcome screen: "Your identity. No passwords."
2. User taps **"Sign In"** (primary button, always prominent)
3. Porto passkey selector appears (styled with Villa theme)
4. User selects their passkey, biometric prompt (Face ID / Touch ID)
5. If display name exists locally → redirect to home
6. If no display name (new device) → prompt for profile setup

### New User (Create Villa ID) — Secondary Flow

1. User opens Villa, sees welcome screen
2. User taps **"Create Villa ID"** (secondary button)
3. Porto passkey creation flow (styled with Villa theme)
4. Native biometric prompt to create passkey
5. User enters display name (required)
6. Done → redirect to home

### Language Guidelines

| Internal/Tech | User-Facing |
|---------------|-------------|
| Porto account | Villa ID |
| Porto SDK | "Secured by passkeys" |
| Wallet address | Villa ID (or just not shown) |
| eth_requestAccounts | "Sign In" |
| wallet_connect | "Create Villa ID" |

**Never say "Porto" to users.** It's infrastructure, like saying "PostgreSQL" to users.

## Screens

- **Welcome:** Value prop "Your identity. No passwords.", two CTAs:
  - **Primary:** "Sign In" (always prominent, yellow)
  - **Secondary:** "Create Villa ID" (outline/ghost style)
  - Footer: "Secured by passkeys" (subtle, no Porto mention)
- **Connecting:** Loading state while Porto processes (spinner with "Connecting...")
- **Profile Setup:** Display name input (required), "Continue" button
- **Error:** What went wrong, "Try Again" button, contextual help text
- **Home:** Profile display, "Switch Account" button

## States

| State | Trigger | Behavior |
|-------|---------|----------|
| Loading | Porto init, biometric processing | Show spinner, "Creating Identity..." or "Signing In..." |
| Error | User cancelled, biometric failed, network error | Show error message with retry |
| Offline | No network | Welcome/explainer work offline, Porto connection requires network |
| Success | Identity created/authenticated | Show success, auto-advance to profile or home |

## Technical Approach

### Porto SDK Integration

Replace the custom `src/lib/webauthn.ts` with Porto SDK calls:

**Initialization:**
- Create Porto instance with `Porto.create()`
- The provider instance handles all passkey operations

**Check Existing Connection:**
- Use `eth_accounts` to check if user already has a connected account
- If accounts array is non-empty, user has an existing session

**Create or Sign In:**
- Use `wallet_connect` RPC method for both create and sign-in
- Porto automatically handles whether to create new or authenticate existing
- Returns accounts array with wallet addresses

**Get Wallet Address:**
- After successful `wallet_connect`, extract address from response
- Format: `{ accounts: [{ address: '0x...', capabilities: {...} }] }`

### Data Stored Locally (Zustand + persist)

```
identity: {
  address: string        // Porto wallet address (0x...)
  displayName: string    // User-entered name (1-50 chars, sanitized)
  avatar?: string        // Optional, local file reference
  createdAt: number      // Unix timestamp
}
```

### Key Files to Modify

| File | Change |
|------|--------|
| `src/lib/webauthn.ts` | Replace with Porto SDK wrapper or delete |
| `src/lib/porto.ts` | New file: Porto initialization and helper functions |
| `src/app/onboarding/page.tsx` | Update to use Porto instead of native WebAuthn |
| `src/lib/store.ts` | Keep as-is, already stores address correctly |
| `src/lib/validation.ts` | Keep as-is, address validation works for Porto addresses |

### Porto SDK Methods Used

| Method | Purpose |
|--------|---------|
| `Porto.create()` | Initialize Porto instance |
| `eth_accounts` | Check if already connected (returns [] if not) |
| `wallet_connect` | Create or sign in to account |
| `eth_requestAccounts` | Alternative to wallet_connect for simpler flow |

### Error Handling

Map Porto errors to user-friendly messages:

| Error Type | User Message |
|------------|--------------|
| User cancelled | "You cancelled the request. Try again when ready." |
| Biometric failed | "Biometric authentication failed. Please try again." |
| Network error | "Network error. Check your connection and try again." |
| Timeout | "Request timed out. Please try again." |
| WebAuthn not supported | "Your browser doesn't support passkeys. Use Safari, Chrome, or Edge." |

### Security

- Passkeys remain in device secure enclave (Porto handles this)
- Display name sanitized for XSS (existing validation.ts)
- No sensitive data transmitted to backend (local-only for v1)
- HTTPS required for WebAuthn (Porto falls back to popup on HTTP)

### Performance

- Porto init: ~500ms-2s (show loading state)
- Biometric prompt: ~1-3s (show feedback)
- Welcome/explainer screens: work offline
- Total flow: <10 seconds typical

## Tasks

### Completed ✓
- [x] Create `src/lib/porto.ts` with Porto SDK wrapper
- [x] Update `src/app/onboarding/page.tsx` to use Porto
- [x] Remove or deprecate `src/lib/webauthn.ts`
- [x] Write E2E tests for full onboarding flow
- [x] Write security tests (XSS prevention, no sensitive data leaks)
- [x] Add session storage clearing on logout
- [x] Document session behavior

### Remaining
- [ ] **Update button copy**: "Create New Identity" → "Create Villa ID"
- [ ] **Update button copy**: "Sign In with Passkey" → "Sign In"
- [ ] **Make Sign In primary**: Yellow/filled style, Create as secondary/outline
- [ ] **Add security badge**: "Secured by passkeys" footer on welcome
- [ ] **Update E2E tests** to match new copy
- [ ] Test create account flow on iOS Safari
- [ ] Test create account flow on Android Chrome
- [ ] Test sign-in flow with existing passkey
- [ ] Test error states (cancel, network, timeout)

## Acceptance Criteria

- [ ] User can create new Porto account with biometric
- [ ] User can sign in to existing Porto account with biometric
- [ ] Porto wallet address (0x...) is stored as user ID
- [ ] Display name required before completion
- [ ] Works on iOS Safari (Face ID / Touch ID)
- [ ] Works on Android Chrome (fingerprint)
- [ ] Graceful error handling for all failure modes
- [ ] No passwords, emails, or phone numbers in flow
- [ ] E2E tests pass
- [ ] Security tests pass

## UI Boundaries

**Villa controls:**
- Welcome screen (value prop, two CTAs)
- Profile setup (display name input)
- Home screen (profile display, logout)
- Error messages and retry flows
- Loading/connecting states

**Porto controls (security-critical):**
- Passkey creation dialog
- Passkey authentication prompts
- Biometric verification (Face ID / Touch ID / fingerprint)
- Key management and secure storage
- Cross-device sync

**Villa customizes Porto via ThemeFragment:**
- Colors (accent, primary, secondary, backgrounds)
- Border radius
- Button labels

We CANNOT replace Porto's security-critical UI—only style it.

## Session Behavior

Porto manages session state server-side. Key behaviors to communicate in UX:

### Session Persistence

| Component | TTL | User Expectation |
|-----------|-----|------------------|
| Passkey credential | Indefinite | Stored in device secure enclave |
| Porto session token | ~24h+ (not documented) | Managed by id.porto.sh |
| Villa local state | Until "Switch Account" | Cleared on explicit user action |

### UX Implications

**"Switch Account" not "Sign Out"**
- Passkeys provide "remembered device" UX (like biometric unlock on mobile apps)
- After switching, re-authentication is seamless (passkey auto-selects)
- True session termination requires removing passkey from device settings

**Helper text pattern:**
```
[Switch Account]
Your passkey stays active for quick sign-in
```

### Copy Standards

| Action | Button Text | Helper Text |
|--------|-------------|-------------|
| Leave session | "Switch Account" | "Your passkey stays active for quick sign-in" |
| Create identity | "Create Villa ID" | — |
| Return user | "Sign In" | — |
| Error retry | "Try Again" | Context-specific error message |
| Welcome tagline | — | "Your identity. No passwords." |
| Security badge | — | "Secured by passkeys" |

### What We Cannot Control

- Porto session TTL (server-side)
- Passkey credential lifetime (device OS)
- Biometric prompt UI (system-level)
- Porto dialog labels (not yet in SDK types)

## Out of Scope (v1)

- Session permissions (`grantPermissions` capability)
- Sign-In with Ethereum (`signInWithEthereum` capability)
- Email capture during account creation
- Recovery setup UI (Porto handles internally)
- Backend integration (local-only for v1)
- Multi-device sync UI (Porto handles automatically)
- Embedded Porto UI (`Dialog.experimental_inline`)

## Recovery (Porto Built-in)

Porto supports multi-path recovery out of the box:
- Social recovery
- Email recovery
- OAuth provider recovery

For v1, we rely on Porto's built-in recovery. Villa-specific recovery (face + guardians) is Phase 2.

## References

- Porto SDK: https://porto.sh/sdk
- Porto RPC Reference: https://porto.sh/sdk/rpc/wallet_connect
- Porto Introduction: https://ithaca.xyz/updates/porto
- Wagmi Integration: https://wagmi.sh/react/guides/connect-wallet
