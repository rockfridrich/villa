# Villa SDK Consumer Analysis

**Date:** 2026-01-06
**Strategic Goal:** villa.cash should be "just another app" built on the Villa SDK
**Status:** PARTIAL - Core gaps identified

---

## Executive Summary

The home page (`apps/web/src/app/home/page.tsx`) **does not** currently function as an SDK consumer. It uses Villa-internal patterns (direct Porto access, Zustand store) rather than the public SDK APIs.

**Key Finding:** The strategic vision requires significant refactoring to achieve true SDK consumption. The home page should be demonstrable proof that third-party apps can build the same experience using only `@villa/sdk`.

---

## Current Architecture

### What the Home Page Uses

| Component | Implementation | SDK Alternative? |
|-----------|----------------|------------------|
| **Authentication** | `disconnectPorto()` from `/lib/porto` | Should use `villa.signOut()` |
| **State Management** | `useIdentityStore()` (Zustand) | Should use `villa.getIdentity()` |
| **Profile Display** | Custom UI components | SDK provides types, needs React hooks |
| **Profile Updates** | `updateProfile()` (Zustand method) | No SDK equivalent yet |
| **Validation** | Local `/lib/validation` | SDK exports types but no validation |

### What the SDK Provides

From `packages/sdk/src/index.ts`:

```typescript
// Main SDK client
export { Villa } from './client'
export type { SignInOptions, SignInResult } from './client'

// Auth utilities
export { signIn, signOut, isAuthenticated, getIdentity } from './auth'

// Types
export type { Identity, AvatarConfig, Profile } from './types'

// Utilities
export { resolveEns, getAvatarUrl } from './ens'
```

**SDK Identity Type:**
```typescript
interface Identity {
  address: `0x${string}`
  nickname: string
  avatar: AvatarConfig
}
```

**Web App Identity Type (Zustand):**
```typescript
interface Identity {
  address: string
  displayName: string
  avatar?: string | AvatarConfig
  createdAt: number
}
```

**MISMATCH:** Different field names (`nickname` vs `displayName`) and shape.

---

## SDK Gaps for Villa.cash as Consumer

### 1. Profile Management (CRITICAL)

**Current:** Home page uses `updateProfile(displayName, avatar)` from Zustand store
**SDK:** No profile update API exists

**Required:**
```typescript
// In Villa class or standalone function
async updateProfile(updates: {
  nickname?: string
  avatar?: AvatarConfig
}): Promise<Result<Profile>>
```

**Blocker:** Without this, villa.cash cannot demonstrate editable profiles via SDK.

---

### 2. React Integration (HIGH PRIORITY)

**Current:** Direct store access with `useIdentityStore()`
**SDK:** No React hooks provided

**Required:**
```typescript
// @villa/sdk-react package
export function useVilla(): {
  identity: Identity | null
  isAuthenticated: boolean
  signIn: (options?: SignInOptions) => Promise<SignInResult>
  signOut: () => Promise<void>
  updateProfile: (updates: ProfileUpdate) => Promise<Result<Profile>>
  isLoading: boolean
}

export function VillaProvider({
  config,
  children
}: {
  config: VillaConfig
  children: React.ReactNode
}): JSX.Element
```

**Blocker:** SDK-first apps would need to build their own state management layer.

---

### 3. Type Alignment (MEDIUM)

**Current:** Web app uses `displayName`, SDK uses `nickname`
**Impact:** Cognitive overhead for developers, migration complexity

**Recommendation:**
- SDK should match user-facing terminology: `displayName` not `nickname`
- Or clearly document that `nickname` is immutable username, `displayName` is editable label
- Current SDK types suggest nickname is the primary identifier

**Decision needed:** Are these the same field or different concepts?

---

### 4. Session Persistence (MEDIUM)

**Current:** Zustand persist middleware handles localStorage
**SDK:** Has `saveSession/loadSession` but Villa class manages it internally

**Gap:** No exposed hook for session state changes

**Required:**
```typescript
// Optional: listen to session changes
villa.onSessionChange((session: VillaSession | null) => {
  // React to auth state changes
})
```

---

### 5. Avatar Management (LOW)

**Current:** Web uses `AvatarPreview` component with local generation
**SDK:** Exports `getAvatarUrl()` utility

**Status:** SDK provides what's needed, web app needs to use it consistently

---

### 6. Profile Settings Component (READY)

**Good News:** `ProfileSettings.tsx` is already SDK-ready!

```typescript
export interface ProfileSettingsProps {
  profile: ProfileData  // Maps to SDK types
  onUpdate: (updates: ProfileUpdate) => Promise<void>  // SDK can implement
  allowAvatarUpload?: boolean
  asModal?: boolean
}
```

This component demonstrates the **target architecture**: generic UI that works with any auth backend through a clean interface.

---

## Refactoring Roadmap

### Phase 1: SDK Profile API (Essential)

**Goal:** Add profile management to SDK

**Tasks:**
1. Add `updateProfile()` method to Villa class
2. Implement backend API at `/api/profiles` (if not exists)
3. Return `Result<Profile>` type
4. Add tests for profile updates

**Estimate:** 4-6 hours

---

### Phase 2: React Bindings (High Value)

**Goal:** Create `@villa/sdk-react` package

**Tasks:**
1. Create new package with:
   - `VillaProvider` context
   - `useVilla()` hook
   - `useIdentity()` hook
   - `useAuth()` hook
2. Internal state management (React Context or Zustand)
3. Session persistence logic
4. Update workspace config

**Estimate:** 8-12 hours

---

### Phase 3: Refactor Home Page (Proof of Concept)

**Goal:** Home page uses SDK exclusively

**Changes:**
```typescript
// Before
import { useIdentityStore } from '@/lib/store'
import { disconnectPorto } from '@/lib/porto'

// After
import { useVilla } from '@villa/sdk-react'

function HomePage() {
  const { identity, signOut, updateProfile } = useVilla()

  // Rest of component stays mostly the same
}
```

**Tasks:**
1. Replace Zustand store with `useVilla()`
2. Replace Porto imports with SDK methods
3. Update validation to use SDK types
4. Remove internal `/lib/store.ts` and `/lib/porto.ts` (or mark deprecated)
5. Verify feature parity

**Estimate:** 4-6 hours

---

### Phase 4: Documentation (Critical for External)

**Goal:** Show that villa.cash is built on SDK

**Tasks:**
1. Add "Built with Villa SDK" badge to footer
2. Create `/examples/villa-cash` showing how home page uses SDK
3. Update developer docs with villa.cash as reference implementation
4. Add source code links to SDK methods

**Estimate:** 2-4 hours

---

## Risk Assessment

### High Risk: Breaking Changes

If we refactor too aggressively, we could break production villa.cash while SDK is still unstable.

**Mitigation:**
- Keep internal implementations as adapters initially
- Add SDK layer without removing old code
- Feature flag the SDK-based flow
- Gradual migration per page/feature

---

### Medium Risk: Type Mismatches

SDK `Identity` uses `nickname`, web uses `displayName`. Aligning these requires careful migration.

**Mitigation:**
- Decide on canonical terminology first
- Use TypeScript type aliases during transition
- Add deprecation warnings for old types

---

### Low Risk: Performance

Using React Context vs Zustand might impact re-render performance.

**Mitigation:**
- Use selector pattern in `useVilla()` hook
- Memoize expensive computations
- Benchmark before/after

---

## Comparison: Current vs Target

### Current State

```typescript
// Home page (apps/web/src/app/home/page.tsx)
const { identity, updateProfile, clearIdentity } = useIdentityStore()

const handleSave = async (newName: string) => {
  updateProfile(newName)
}

const handleLogout = async () => {
  await disconnectPorto()
  clearIdentity()
  router.replace('/onboarding')
}
```

**Dependencies:**
- Internal Zustand store
- Direct Porto SDK access
- Villa-specific validation rules
- Custom routing logic

---

### Target State (SDK Consumer)

```typescript
// Home page (refactored)
const { identity, updateProfile, signOut } = useVilla()
const router = useRouter()

const handleSave = async (newName: string) => {
  const result = await updateProfile({ displayName: newName })
  if (!result.success) {
    setError(result.error)
  }
}

const handleLogout = async () => {
  await signOut()
  router.replace('/onboarding')
}
```

**Dependencies:**
- `@villa/sdk-react` (public package)
- No Porto imports
- No internal store
- Same validation (SDK exports schemas)

**Benefits:**
1. **Demonstrable:** Third-party devs see real code using SDK
2. **Dogfooding:** We find SDK pain points immediately
3. **Maintainable:** Single source of truth for auth logic
4. **Portable:** Easier to extract examples for docs

---

## Recommended Components for SDK

Based on `ProfileSettings.tsx` success, these components should be SDK-ready:

### Already Good (SDK-Compatible)

- `ProfileSettings` - Generic, takes callbacks
- `AvatarPreview` - Uses deterministic generation
- `EditableField` - Pure UI component
- `ProfileSection` - Layout component

### Need Refactoring (Villa-Specific)

- `AvatarSelection` - Tightly coupled to onboarding flow
- `AvatarUpload` - Uses internal storage API

**Recommendation:** Extract generic versions to `@villa/sdk-react-components` for rapid prototyping.

---

## External Developer Experience

**Current:** Third-party developer building an app has to:
1. Import `@villa/sdk`
2. Call `villa.signIn()` to get identity
3. Build their own profile UI from scratch
4. Implement their own state management
5. Handle session persistence manually

**With Refactored villa.cash:**
1. Import `@villa/sdk-react`
2. Wrap app in `<VillaProvider>`
3. Use `useVilla()` hook (see villa.cash source code)
4. Optionally import `ProfileSettings` from `@villa/sdk-react-components`
5. Session persistence handled automatically

**Time to "Hello Villa ID":** 5 minutes vs 2 hours

---

## Action Items

### Immediate (Before External Launch)

1. **Decide on terminology:** `nickname` vs `displayName` - which is canonical?
2. **Add profile update API** to SDK (Villa class)
3. **Create `@villa/sdk-react` package** with basic hooks
4. **Refactor one page** (home) as proof of concept

### Short-term (External MLP)

5. **Document the refactor** in developer portal
6. **Extract shared components** to `@villa/sdk-react-components`
7. **Add "Powered by Villa SDK" to footer**
8. **Create example app** mirroring villa.cash structure

### Long-term (Post-Launch)

9. **Migrate all pages** to SDK consumption
10. **Remove internal `/lib/porto.ts` and `/lib/store.ts`**
11. **Performance benchmarks** for SDK vs direct implementation
12. **Advanced hooks** (`useProfile`, `useAvatar`, `useSession`)

---

## Conclusion

**Current Status:** villa.cash is NOT yet an SDK consumer. It uses internal patterns that third-party apps cannot access.

**Gap Size:** Medium (2-3 weeks of focused work)

**Critical Path:**
1. SDK Profile API (1 week)
2. React bindings (1 week)
3. Home page refactor (3 days)
4. Documentation (2 days)

**Strategic Value:** HIGH - This proves the SDK works and provides a reference implementation for external developers.

**Recommendation:** Prioritize this work before external SDK launch. The ability to point to villa.cash source code and say "this is how you use Villa SDK" is invaluable for developer adoption.

---

## Files Referenced

- `/apps/web/src/app/home/page.tsx` - Current home page (NOT SDK consumer)
- `/apps/web/src/components/sdk/ProfileSettings.tsx` - SDK-ready component
- `/apps/web/src/lib/store.ts` - Internal state (should be SDK)
- `/apps/web/src/lib/porto.ts` - Direct Porto access (should be SDK)
- `/packages/sdk/src/index.ts` - SDK exports
- `/packages/sdk/src/client.ts` - Villa class
- `/packages/sdk/src/types.ts` - SDK types

---

**Next Steps:** Recommend discussing Phase 1 (SDK Profile API) implementation approach with team before proceeding.
