# Sprint: Auth Stabilization & Corrections

**Status:** Active
**Created:** 2026-01-08
**Sprint Duration:** 1 day
**Type:** Corrections (not new features)

---

## Goal

Stabilize authentication flows after reverting VillaAuthScreen relay mode implementation. Fix UX inconsistencies and clarify path to custom passkey domain ownership.

---

## Why This Sprint

### Problem Statement

Today's session revealed several issues after implementing Porto relay mode:

1. **Relay mode bypasses 1Password/passkey managers** - Users on macOS/iOS expect to see native passkey picker, not browser's direct WebAuthn prompts
2. **Mixed implementation** - Onboarding reverted to VillaAuth (dialog mode, works), but SDK iframe demo still uses relay mode
3. **Unused code** - VillaAuthScreen components exist but aren't integrated into production flows
4. **Unclear roadmap** - Path to `key.villa.cash` custom passkey domain needs definition

### Why Now (Not Later)

- Beta is production-ready except for auth UX polish
- Auth is first-run experience - must be perfect
- Mixed modes create confusion in codebase and E2E tests
- Clean foundation needed before mainnet launch

---

## UI Boundaries

### What Changes

**Onboarding Flow (`/onboarding`):**
- Already uses VillaAuth (Porto dialog mode) - CORRECT
- No changes needed (reverted in cb97fb7)

**SDK Demo (`/sdk-demo`):**
- Currently offers dialog/relay toggle
- Decision needed: Keep toggle as demo feature OR remove relay entirely

**Auth Debug Page (`/auth`):**
- Currently accepts `?mode=relay` query param
- Decision needed: Keep for testing OR standardize on dialog-only

**VillaAuthScreen Component:**
- Exists in codebase but not used in production flows
- Decision needed: Delete OR repurpose for future custom RP ID

### What Doesn't Change

**Porto Dialog Mode:**
- Continues to use `id.porto.sh` as RP ID (Porto owns passkeys)
- Shows Porto-branded dialog with Villa theming
- Works with 1Password, iCloud Keychain, and all passkey managers
- This is CORRECT behavior for v1

**External Systems:**
- Porto SDK controls passkey creation/authentication
- Browser/OS controls passkey manager UI
- Villa only controls: welcome screens, profile setup, post-auth UI

---

## Language Guidelines

| Internal/Tech | User-Facing | Notes |
|---------------|-------------|-------|
| Porto dialog mode | (hidden) | Users just see "Sign in with passkey" |
| Porto relay mode | (hidden) | Implementation detail, not user-facing |
| id.porto.sh | (hidden) | Passkeys show "Porto" in system UI (acceptable for v1) |
| key.villa.cash | Future: "Villa passkey" | Phase 2 feature (requires custom RP ID) |

---

## Technical Approach

### Current State Analysis

**Working (Keep):**
- `/onboarding` → VillaAuth → Porto dialog → 1Password works
- Porto dialog mode integrates with all passkey managers
- E2E tests passing with dialog mode

**Questionable (Review):**
- Relay mode code in `porto.ts` (lines 195-225, 524-588)
- VillaAuthScreen component (unused in production)
- SDK demo relay mode toggle (testing feature vs. production API)

### Decision Points

1. **Relay mode in codebase:**
   - OPTION A: Delete entirely (simplify, one true path)
   - OPTION B: Keep for future custom RP ID work (when key.villa.cash launches)
   - OPTION C: Keep but mark as experimental, not production-ready

2. **VillaAuthScreen component:**
   - OPTION A: Delete (YAGNI - build when needed)
   - OPTION B: Move to reference/prototypes
   - OPTION C: Keep for Phase 2 custom RP ID implementation

3. **SDK demo relay toggle:**
   - OPTION A: Remove toggle, dialog-only (matches production)
   - OPTION B: Keep as "experimental" demo feature (educational)

---

## Tasks (Prioritized)

### P0: Critical (Must Fix Today)

1. **Audit E2E test stability**
   ```bash
   # Run full E2E suite, document failures
   pnpm test:e2e
   ```
   - Document which tests use dialog mode vs. relay mode
   - Ensure all production flows use dialog mode
   - Acceptance: All non-skipped E2E tests pass

2. **Document relay mode status**
   - Add clear comments in `porto.ts` explaining:
     - Why relay mode exists (custom RP ID future work)
     - Why it's NOT used in production (bypasses passkey managers)
     - When it would be appropriate to use (key.villa.cash phase)
   - Acceptance: Next developer can understand design decisions

### P1: Important (Should Fix Today)

3. **SDK demo mode toggle decision**
   - Review with user: Keep relay toggle as demo feature?
   - If REMOVE: Update SDK demo to dialog-only
   - If KEEP: Add warning label "Experimental - not recommended"
   - Acceptance: SDK demo matches intended production API

4. **VillaAuthScreen component decision**
   - Review with user: Delete or move to reference?
   - If DELETE: Remove component + PasskeyPrompt
   - If MOVE: Create `specs/reference/prototypes/` folder
   - Acceptance: Codebase reflects actual usage

5. **Update production roadmap**
   - Clarify Phase 2 custom RP ID requirements
   - Add `key.villa.cash` passkey domain to roadmap
   - Link to `specs/reference/passkey-domain-ownership.md`
   - Acceptance: Roadmap shows clear path to custom domain

### P2: Nice-to-Have (If Time)

6. **Consolidate auth documentation**
   - Create `specs/reference/auth-modes-comparison.md`
   - Document dialog vs. relay modes with pros/cons
   - Include decision matrix for when to use each
   - Acceptance: Reference doc exists for future work

7. **E2E test organization**
   - Group tests by: onboarding, SDK, returning user
   - Add test tags: `@production`, `@experimental`
   - Acceptance: Clear test categories

---

## Acceptance Criteria

### Must Pass

- [ ] All E2E tests pass (except DB-dependent skipped tests)
- [ ] No relay mode code used in production flows (`/onboarding`, `/home`, `/sdk`)
- [ ] Code comments explain why relay mode exists (future work)
- [ ] Production roadmap updated with Phase 2 custom RP ID milestone

### Should Pass

- [ ] SDK demo matches production API recommendations
- [ ] VillaAuthScreen component status resolved (deleted OR moved to reference)
- [ ] LEARNINGS.md updated with "Dialog mode for v1, relay for custom RP only"

### Nice-to-Have

- [ ] Auth modes comparison reference doc created
- [ ] E2E tests tagged for production vs. experimental

---

## Open Questions for User Review

### Decision 1: Relay Mode Code
**Context:** Relay mode code exists but bypasses passkey managers (bad UX).

**Options:**
- A) Delete entirely (clean slate, rebuild when needed for key.villa.cash)
- B) Keep but isolate in separate file (e.g., `porto-relay-experimental.ts`)
- C) Keep as-is with clear "FUTURE WORK" comments

**Recommendation:** B or C (preserve research, prevent accidental use)

---

### Decision 2: VillaAuthScreen Component
**Context:** Built for relay mode, not used in production.

**Options:**
- A) Delete now (YAGNI principle)
- B) Move to `specs/reference/prototypes/villa-auth-screen/`
- C) Keep for Phase 2 custom RP ID work

**Recommendation:** B (preserve design work, clear it's not production)

---

### Decision 3: SDK Demo Relay Toggle
**Context:** Developers might try relay mode and hit passkey manager issues.

**Options:**
- A) Remove toggle, dialog-only (matches production best practice)
- B) Keep toggle with warning: "Experimental - bypasses 1Password"
- C) Keep toggle, add docs explaining trade-offs

**Recommendation:** A (prevent developer confusion)

---

### Decision 4: Custom Passkey Domain (key.villa.cash)
**Context:** User wants Villa-owned passkeys instead of Porto-owned.

**Questions:**
1. Is this Phase 2 (post-mainnet) or blocking beta?
2. What's acceptable interim: "Porto" in system passkey dialogs?
3. Should we contact Porto about custom RP ID support?

**Dependencies:**
- Porto SDK investigation (does it support custom RP IDs?)
- Security audit (custom WebAuthn implementation)
- User migration plan (move from id.porto.sh to key.villa.cash)

**Recommendation:** Phase 2, post-mainnet (major architectural change)

---

## Out of Scope (This Sprint)

- ❌ Implementing custom passkey domain (Phase 2)
- ❌ New auth UI designs (current dialog mode works)
- ❌ Porto SDK modifications (external dependency)
- ❌ E2E test rewrites (only fixes for failures)
- ❌ Performance optimizations (auth is fast enough)

---

## Session Behavior (Current State)

### Dialog Mode (Production)

| Component | TTL | Controlled By |
|-----------|-----|---------------|
| Passkey credential | Indefinite | OS secure enclave |
| Porto session token | ~24h (server-controlled) | id.porto.sh |
| Villa profile data | Indefinite | PostgreSQL |

### User Experience

**First Sign-In:**
1. Click "Sign In" → Porto dialog opens
2. Choose "Sign in with passkey"
3. **OS shows passkey picker (1Password, iCloud Keychain, etc.)**
4. Select passkey → authenticate with biometric
5. Porto dialog closes → Villa profile screen

**Returning User:**
1. Click "Sign In" → Porto dialog opens
2. Porto auto-selects existing session
3. **Still shows passkey picker (correct behavior)**
4. One-tap authenticate → back to Villa

### What We Cannot Control

- Porto dialog UI (can only customize colors/theme)
- Browser's passkey manager selection UI
- OS biometric prompts (Face ID, Touch ID, Windows Hello)
- Porto session TTL (server-side controlled)

---

## Definition of Done

**This sprint is DONE when:**

1. User reviews and answers Open Questions (Decisions 1-4)
2. All P0 tasks completed
3. All E2E tests pass
4. Production roadmap updated with clear Phase 2 plan
5. Code comments explain design decisions for next developer
6. No relay mode in production code paths

**Success metric:** Next developer can understand why dialog mode is used and when relay mode would be appropriate.

---

## Links

- [Porto SDK Docs](https://porto.sh/sdk)
- [WebAuthn Spec](https://www.w3.org/TR/webauthn-2/)
- [specs/reference/passkey-domain-ownership.md](/Users/me/Documents/Coding/villa/specs/reference/passkey-domain-ownership.md)
- [specs/active/production-roadmap.md](/Users/me/Documents/Coding/villa/specs/active/production-roadmap.md)
- Recent commits:
  - `cb97fb7` - Revert onboarding to VillaAuth (dialog mode)
  - `8b76831` - Original VillaAuthScreen (relay mode) implementation

---

## Next Steps After This Sprint

1. **If custom RP ID approved for Phase 2:**
   - Create spec: `specs/active/custom-passkey-domain.md`
   - Contact Porto SDK team about custom RP ID support
   - Plan security audit for custom WebAuthn implementation

2. **If staying with Porto RP ID:**
   - Delete relay mode code (won't be needed)
   - Update branding to embrace "Powered by Porto"
   - Focus on other Phase 2 features (TinyCloud, CCIP-Read)

3. **Mainnet preparation:**
   - Security audit coordination
   - Multisig setup
   - Beta stability monitoring (current: 2+ weeks stable)
