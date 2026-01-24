# Passkey Creation UX Issue - Design Analysis

**Date:** 2026-01-08
**Agent:** @design
**Status:** CRITICAL - Affects primary user flow

---

## Problem Statement

Users clicking "Create Villa ID" do not see passkey manager prompts (1Password, iCloud Keychain, Google Password Manager). This breaks the expected passkey creation flow.

### Root Cause

**VillaAuthScreen uses Porto relay mode** which bypasses passkey manager ecosystem:

```typescript
// apps/web/src/lib/porto.ts:221-253
Mode.relay({
  webAuthn: {
    createFn: async (options) => navigator.credentials.create(options),
    // ^ This direct call doesn't trigger 1Password
  }
})
```

**Why this matters:**
- 1Password hooks into Porto's dialog iframe context
- Direct `navigator.credentials.*` calls bypass this interception
- Native biometric (Face ID, Touch ID) still works
- But passkey manager apps don't see the request

### Evidence from Codebase

From `LEARNINGS.md` Pattern 50 (lines 490-571):

> **Relay Mode** (for headless/iframe scenarios only):
> - Villa calls WebAuthn APIs directly
> - Passkey managers don't intercept (1Password won't trigger)
> - Loses entire ecosystem support

> **Incident:** 2026-01-08
> - Implemented VillaAuthScreen (relay mode) for onboarding
> - E2E tests passed ✓ but 1Password integration broke ✗
> - User reported: "flow doesn't trigger 1password"

---

## Design Solutions (3 Options)

### Option 1: Add Dialog Mode Component (RECOMMENDED)

**Create `VillaAuth.tsx`** using Porto dialog mode:

```typescript
// apps/web/src/components/sdk/VillaAuth.tsx
export function VillaAuth({ onSuccess, onCancel }) {
  const porto = Porto.create({
    mode: Mode.dialog({
      renderer: Dialog.popup({
        type: 'popup',
        size: { width: 380, height: 520 },
      }),
      theme: villaTheme,
    }),
  })

  // Porto dialog handles passkey creation
  // 1Password + all managers work ✓
}
```

**Usage:**
- Main onboarding → VillaAuth (dialog mode) ✓
- SDK iframe → VillaAuthScreen (relay mode) ✓

**Pros:**
- Fixes 1Password integration
- Maintains ecosystem support
- Clear separation of concerns

**Cons:**
- Less UI customization (Porto controls dialog)
- Can only theme, not redesign

### Option 2: Enhance Relay Mode UI (PARTIAL FIX)

Add provider logos + clearer messaging to VillaAuthScreen:

```typescript
<motion.div className="space-y-3">
  <p className="text-xs text-center text-ink-muted">
    Works with your passkey provider
  </p>
  <div className="grid grid-cols-3 gap-3">
    {/* 1Password, iCloud, Google, Windows, Browser, FIDO2 logos */}
  </div>
  <Alert variant="warning">
    <Info className="w-4 h-4" />
    <p className="text-xs">
      If your passkey manager doesn't appear, use device biometric (Face ID, Touch ID, or Windows Hello)
    </p>
  </Alert>
</motion.div>
```

**Pros:**
- Educates users about options
- Better than current blank state

**Cons:**
- Doesn't fix 1Password issue
- Misleading (shows logos for managers that won't work)

### Option 3: Hybrid Approach (BEST UX)

Detect passkey manager availability → route to appropriate mode:

```typescript
const hasPasskeyManager = await detectPasskeyManager()

if (hasPasskeyManager) {
  // Use dialog mode for 1Password support
  return <VillaAuth onSuccess={onSuccess} />
} else {
  // Use relay mode for custom UI
  return <VillaAuthScreen onSuccess={onSuccess} />
}
```

**Pros:**
- Best of both worlds
- Adapts to user environment

**Cons:**
- Complex detection logic
- Might guess wrong

---

## Recommended Implementation Plan

### Phase 1: Immediate Fix (Unblock Users)

1. **Create `VillaAuth.tsx`** using Porto dialog mode
2. **Update `apps/web/src/app/onboarding/page.tsx`** to use VillaAuth
3. **Keep VillaAuthScreen** for SDK iframe scenarios
4. **Document usage** in component comments

**Files to change:**
- `apps/web/src/components/sdk/VillaAuth.tsx` (new)
- `apps/web/src/app/onboarding/page.tsx` (update import)
- `apps/web/src/components/sdk/index.ts` (export VillaAuth)

### Phase 2: Design Enhancement (Visual Polish)

Add provider indication to VillaAuthScreen (for SDK iframe use):

1. **Create passkey provider logos** (SVG components)
2. **Add "Supported Providers" section** to VillaAuthScreen
3. **Add educational tooltip** about device biometric
4. **Update PasskeyPrompt** to show active provider

**Files to change:**
- `apps/web/src/components/sdk/VillaAuthScreen.tsx` (enhance)
- `apps/web/src/components/sdk/PasskeyPrompt.tsx` (add provider indication)
- `apps/web/src/components/icons/` (new provider logos)

### Phase 3: Testing (Validation)

Manual testing checklist:
```bash
□ Test with 1Password installed (should trigger)
□ Test with iCloud Keychain (should trigger)
□ Test with Google Password Manager (should trigger)
□ Test without passkey manager (Face ID/Touch ID)
□ Test on Windows (Windows Hello)
□ Test in-app browser (fallback to relay mode)
□ E2E tests still pass
```

---

## Design Specifications

### Passkey Provider Logos

**Style:** Rounded icon + label below
**Size:** 32x32px icons, 8px gap
**Layout:** 3 columns, responsive grid

**Providers to show:**
1. **1Password** - Blue gradient circle, "1P" text
2. **iCloud Keychain** - Gray gradient circle, key icon
3. **Google Password Manager** - Google colors, "G" text
4. **Windows Hello** - Blue gradient, "W" text
5. **Browser** (Chrome/Safari/Edge) - Orange gradient, browser icon
6. **FIDO2** (hardware keys) - Green gradient, shield icon

### Provider Indication States

**Idle state:**
```
"Works with your passkey provider"
[Grid of 6 provider icons]
```

**Active state (during WebAuthn):**
```
"Creating passkey with [Active Provider]"
[Highlighted provider icon with pulse animation]
```

**Error state:**
```
"Passkey manager not responding"
"Try device biometric (Face ID, Touch ID, Windows Hello)"
```

---

## Color Tokens (From Design System)

Using Villa's 8pt grid and color tokens:

```typescript
// Spacing
gap-3        // 12px between icons
p-3          // 12px padding
rounded-lg   // 8px border radius

// Colors
bg-white                  // Card backgrounds
border-neutral-100        // Subtle borders
text-ink-muted           // Secondary text
text-accent-brown        // Active state

// Gradients (Provider Icons)
from-blue-500 to-blue-600           // 1Password
from-gray-700 to-gray-900           // iCloud
from-blue-600 to-green-600          // Google
from-blue-500 to-cyan-400           // Windows
from-orange-500 to-red-500          // Browser
from-green-600 to-blue-600          // FIDO2
```

---

## Implementation Sequence

**Priority 1 (Critical):**
1. Create VillaAuth component (dialog mode)
2. Switch onboarding to use VillaAuth
3. Document Porto mode selection in ADR

**Priority 2 (UX Enhancement):**
1. Add provider logos to VillaAuthScreen
2. Update PasskeyPrompt with provider indication
3. Add educational messaging

**Priority 3 (Future):**
1. Detect passkey manager availability
2. Route to optimal mode automatically
3. A/B test custom UI vs ecosystem support

---

## Open Questions

1. **Do we need custom UI badly enough to sacrifice 1Password support?**
   → No. Pattern 50 says ecosystem > customization

2. **Can Porto dialog mode be themed enough?**
   → Yes. Check villaTheme in porto.ts - covers colors, spacing, radius

3. **What about in-app browsers?**
   → Keep VillaAuthScreen (relay mode) for that scenario, detect with detectInAppBrowser()

---

## References

- `LEARNINGS.md` Pattern 50 (Porto Mode Selection)
- `apps/web/src/lib/porto.ts` (villaTheme + relay mode)
- `apps/web/src/components/sdk/VillaAuthScreen.tsx` (existing relay implementation)
- `specs/reference/design-principles.md` (Villa design system)

---

## Next Steps

**Immediate action required:**

```bash
# 1. Create dialog mode component
@build "Create VillaAuth component using Porto dialog mode"

# 2. Switch onboarding flow
@build "Update onboarding page to use VillaAuth"

# 3. Add provider logos to relay mode screen
@design "Add passkey provider logos to VillaAuthScreen"

# 4. Test manually
"Manual test with 1Password before shipping"
```

---

**Agent:** @design
**Reviewed:** Human review required
**Status:** Ready for implementation
