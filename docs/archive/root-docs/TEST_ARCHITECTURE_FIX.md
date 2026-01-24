# E2E Test Architecture Fix

## Problem
20+ E2E tests failing because they test wrong routes for wrong UI components.

## Root Cause
Tests expect VillaAuthScreen (Sign In + Create Villa ID buttons) on `/onboarding`, but:
- `/onboarding` shows WelcomeStep with "Get Started" button
- "Get Started" opens VillaBridge iframe to `/auth`
- VillaAuthScreen only renders in `/auth` route (iframe target)

## Solution
1. **Onboarding tests** → Test WelcomeStep UI (Get Started button)
2. **VillaAuthScreen tests** → Test `/auth` route (where it actually renders)
3. **Remove duplicate/wrong tests** → Tests checking for Sign In/Create buttons on `/onboarding`

## Changes

### File: auth-flows.spec.ts
- ✅ Keep: Welcome screen tests (lines 34-51)
- ❌ Remove: Lines 287-298 (VillaAuthScreen tests on /onboarding - wrong route)
- ✅ Keep: Lines 250-315 in "Auth Iframe/Popup Flow" (correct - tests /auth)
- ❌ Fix: Lines 400-412 (tests /onboarding for Sign In button - wrong expectation)
- ❌ Fix: Lines 596-611, 763-859 (VillaAuthScreen tests on /onboarding - wrong route)

### File: passkey-crossplatform.spec.ts
- ✅ Keep: Tests for `/auth` route (lines 14-452 - correct)
- ❌ Remove: Lines 454-623 (VillaAuthScreen tests on /onboarding - wrong route)

## Test Coverage After Fix
1. `/onboarding` → WelcomeStep with "Get Started" button
2. `/auth` → VillaAuthScreen with Sign In + Create Villa ID
3. Iframe flow → Covered by integration tests
4. Error states → Both routes
5. Mobile responsiveness → Both routes

## Resilient Selector Strategy
- Use data-testid for critical interactive elements
- Use semantic roles (button, heading) for structure
- Avoid text-based selectors for UI that changes frequently
- Test behavior, not implementation details
