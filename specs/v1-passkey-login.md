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

### New User (Create Account)

1. User opens Villa, sees welcome screen: "Your identity. No passwords."
2. User taps "Create New Identity"
3. Brief explainer: "Use Face ID to create your secure identity"
4. User taps "Create Identity"
5. Porto handles passkey creation (dialog or iframe, depending on context)
6. Native biometric prompt (Face ID / Touch ID / fingerprint)
7. Success animation
8. User enters display name (required)
9. Done - redirect to home screen

### Returning User (Sign In)

1. User opens Villa, sees welcome screen
2. If user has existing Porto account detected, "Sign In" is primary button
3. User taps "Sign In with Passkey"
4. Porto handles passkey authentication
5. Native biometric prompt
6. If display name exists in local storage, redirect directly to home
7. If no display name stored, prompt for profile setup first

## Screens

- **Welcome:** Value prop, two CTAs (Create / Sign In), passkey detection determines primary button
- **Explainer:** One visual, one sentence explaining passkey security, CTA to proceed
- **Connecting:** Loading state while Porto processes (skeleton or spinner)
- **Success:** Brief celebration moment before profile setup
- **Profile:** Display name input (required), continue button
- **Error:** What went wrong, retry button, help text

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

- [ ] Create `src/lib/porto.ts` with Porto SDK wrapper
- [ ] Update `src/app/onboarding/page.tsx` to use Porto
- [ ] Remove or deprecate `src/lib/webauthn.ts`
- [ ] Add connection detection on welcome screen (eth_accounts check)
- [ ] Test create account flow on iOS Safari
- [ ] Test create account flow on Android Chrome
- [ ] Test sign-in flow with existing passkey
- [ ] Test error states (cancel, network, timeout)
- [ ] Write E2E tests for full onboarding flow
- [ ] Write security tests (XSS prevention, no sensitive data leaks)

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
