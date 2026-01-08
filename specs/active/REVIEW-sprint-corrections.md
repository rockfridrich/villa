# Sprint Corrections: Quick Review Guide

**For User:** Please review these 4 decisions to unblock the sprint.

---

## TL;DR

Today we discovered that Porto's relay mode bypasses 1Password/passkey managers (bad UX). Onboarding already reverted to dialog mode (works great). Now we need to decide what to do with:

1. Relay mode code that exists but isn't used
2. VillaAuthScreen component built for relay mode
3. SDK demo's dialog/relay toggle
4. Custom passkey domain (key.villa.cash) roadmap

---

## Decision 1: Relay Mode Code

**What:** Functions in `porto.ts` for relay mode (lines 195-225, 524-588)

**Problem:** Bypasses 1Password, not used in production

**Options:**
- **A) Delete** - Clean slate, rebuild if needed for key.villa.cash
- **B) Isolate** - Move to `porto-relay-experimental.ts` (preserve research)
- **C) Comment** - Keep as-is with "FUTURE WORK ONLY" comments

**My recommendation:** B or C (don't throw away working code)

**Your choice:** _____

---

## Decision 2: VillaAuthScreen Component

**What:** `components/sdk/VillaAuthScreen.tsx` + `PasskeyPrompt.tsx`

**Problem:** Built for relay mode, not used in production flows

**Options:**
- **A) Delete** - YAGNI (you aren't gonna need it)
- **B) Archive** - Move to `specs/reference/prototypes/villa-auth-screen/`
- **C) Keep** - Leave for Phase 2 custom RP ID work

**My recommendation:** B (preserve design work, mark as prototype)

**Your choice:** _____

---

## Decision 3: SDK Demo Relay Toggle

**What:** `/sdk-demo` page has dialog/relay mode toggle

**Problem:** Developers might copy relay mode (bad practice)

**Options:**
- **A) Remove** - Dialog-only (matches production best practice)
- **B) Keep with warning** - "Experimental - bypasses 1Password"
- **C) Keep with docs** - Explain trade-offs in detail

**My recommendation:** A (prevent confusion)

**Your choice:** _____

---

## Decision 4: Custom Passkey Domain

**What:** key.villa.cash as Villa-owned passkey RP ID (instead of id.porto.sh)

**Questions:**
1. **Timeline:** Phase 2 (post-mainnet) or blocking beta?
2. **Branding:** Is "Porto" in system dialogs acceptable for v1?
3. **Outreach:** Should we contact Porto about custom RP ID support?

**My recommendation:** Phase 2 (major architectural change)

**Your answers:**
1. Timeline: _____
2. Porto branding acceptable? _____
3. Contact Porto now? _____

---

## What Happens Next

**After your decisions:**

1. I'll execute P0 tasks (E2E test audit, code comments)
2. Clean up codebase based on your choices
3. Update production roadmap with Phase 2 plan
4. Update LEARNINGS.md with "dialog mode for v1" pattern

**Time estimate:** 2-4 hours of work

---

## Context Links

- Full spec: `specs/active/sprint-corrections.md`
- Production roadmap: `specs/active/production-roadmap.md`
- Passkey domain research: `specs/reference/passkey-domain-ownership.md`

---

## Why This Matters

**User impact:**
- Auth must work with 1Password/iCloud Keychain (dialog mode ✓)
- First-run experience must be perfect
- Custom passkey domain is major branding decision

**Developer impact:**
- Codebase clarity (why dialog mode? why keep relay code?)
- SDK demo should show best practices
- Next developer can continue work

**Mainnet readiness:**
- Clean foundation before security audit
- Clear roadmap for Phase 2 features
- No confusing mixed implementations
