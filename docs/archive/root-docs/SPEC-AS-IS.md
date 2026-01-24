# Villa Authentication Spec - AS IS (January 2025)

## Executive Summary

**Current State:** Villa's authentication flow shows Porto's raw SDK dialog instead of Villa's branded fullscreen experience. Nicknames are generated but not persisted across devices. Avatar selection happens post-auth but is device-local only.

**Root Cause:** The `VillaBridge` SDK opens an iframe to `key.villa.cash/auth`, which then uses Porto's `Dialog.iframe()` mode. This shows Porto's own UI ("Sign up", "Signing up...", "Learn about passkeys") instead of Villa's custom screens.

---

## Architecture Overview

### Current Flow (Broken)

```
User visits villa.cash
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│  apps/hub (villa.cash)                                          │
│  /onboarding/page.tsx                                           │
│                                                                 │
│  1. User clicks "Get Started"                                   │
│  2. Creates VillaBridge({ appId, network })                     │
│  3. bridge.open() creates fullscreen iframe                     │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  IFRAME: key.villa.cash/auth (or beta-key.villa.cash)     │  │
│  │                                                           │  │
│  │  apps/key/src/app/auth/page.tsx                           │  │
│  │                                                           │  │
│  │  - Renders Villa-branded buttons                          │  │
│  │  - Calls Porto SDK createAccount() / signIn()             │  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  NESTED IFRAME: id.porto.sh/dialog                  │  │  │
│  │  │                                                     │  │  │
│  │  │  Porto's own UI:                                    │  │  │
│  │  │  - "Sign up" heading                                │  │  │
│  │  │  - "Create a new passkey wallet"                    │  │  │
│  │  │  - "Sign in" / "Signing up..." buttons              │  │  │
│  │  │  - "Learn about passkeys" link                      │  │  │
│  │  │                                                     │  │  │
│  │  │  THIS IS WHAT USERS SEE - NOT VILLA UI              │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Problem 1: Porto Dialog Overtakes Villa UI

**Location:** `apps/key/src/lib/porto.ts` lines 64-79

```typescript
export function getPorto(): ReturnType<typeof Porto.create> {
  if (!portoInstance) {
    portoInstance = Porto.create({
      chains: getPortoChains(),
      mode: Mode.dialog({
        renderer: Dialog.iframe(), // <-- Creates NESTED Porto iframe
        host: "https://id.porto.sh/dialog", // <-- Porto's UI, not Villa's
        theme: villaTheme,
      }),
    });
  }
  return portoInstance;
}
```

When `apps/key/src/app/auth/page.tsx` calls `createAccount()` or `signIn()`:

1. It uses Porto's `Dialog.iframe()` mode
2. Porto creates its own iframe inside key.villa.cash iframe
3. Porto's iframe shows Porto's UI at `id.porto.sh/dialog`
4. Villa's themed buttons in auth/page.tsx are ignored

**Visual Evidence:** Screenshot shows:

- URL bar: `villa.cash/onboarding`
- Content: Porto's "Sign up" / "Create a new passkey wallet" UI
- NOT Villa's "Welcome to Villa" / "Get Started" UI

### Problem 2: Nickname Not Persistent Across Devices

**Current Flow:**

1. **New account creation** (`apps/key/src/app/auth/page.tsx` line 220-226):

   ```typescript
   if (isNewAccount) {
     const generatedNickname = generateNickname(address);
     const { nickname: persistedNickname } = await persistProfile(
       address,
       generatedNickname,
     );
     nickname = persistedNickname;
   }
   ```

   - Nickname IS saved to Hub API via `persistProfile()`
   - BUT only on first account creation, not on sign-in

2. **Sign-in on existing account** (`apps/key/src/app/auth/page.tsx` line 227-229):

   ```typescript
   } else {
     const profile = await fetchProfile(address);
     nickname = profile?.nickname || "";
   }
   ```

   - Fetches nickname from Hub API
   - BUT if API fails or returns empty, nickname is ""

3. **Client-side state** (`apps/hub/src/app/onboarding/page.tsx`):
   - Identity stored in `useIdentityStore` (Zustand)
   - Persisted to localStorage via Zustand persist
   - **NOT synced across devices**

**Data Flow:**

```
Device A (first login):
  Porto → address → generateNickname() → POST /api/profile → localStorage

Device B (returning user):
  Porto → address → GET /api/profile → nickname (if exists)
                                     → "" (if API fails)
```

**Problem:**

- Nickname is generated client-side with `generateNickname(address)`
- Saved to Hub API once during account creation
- On new device, fetched from API but can fail silently
- No on-chain persistence (VillaNicknameResolverV3 not used during auth)

### Problem 3: Avatar Selection is Device-Local

**Current Flow:**

1. After auth succeeds, user goes to avatar selection (`/onboarding` step="avatar")
2. Avatar config saved to:
   - `useIdentityStore` → localStorage (device-local)
   - `avatarStore.save()` → TinyCloud (if authenticated)
   - `POST /api/profile` → Hub API (database)

3. On new device sign-in:
   - Avatar NOT fetched from Hub API
   - User sees avatar selection again
   - Previous avatar lost

**Code:**

```typescript
// apps/hub/src/app/onboarding/page.tsx line 306-344
const handleAvatarSelected = (config: AvatarConfig) => {
  setIdentity({
    address,
    displayName: finalName,
    avatar: config,  // <-- Only saved locally
    createdAt: Date.now(),
  });

  avatarStore.save({...}).catch(console.warn);  // <-- TinyCloud (optional)
  saveProfile(address, finalName, config);       // <-- Hub API
  // BUT: No fetch on sign-in to restore avatar
};
```

---

## Component Inventory

### SDK Package (`packages/sdk`)

| File               | Purpose                                     | Status  |
| ------------------ | ------------------------------------------- | ------- |
| `src/iframe.ts`    | Creates fullscreen iframe to key.villa.cash | Working |
| `src/bridge.ts`    | VillaBridge class - event emitter for auth  | Working |
| `src/index.ts`     | Main exports, Villa class                   | Working |
| `src/contracts.ts` | VillaNicknameResolverV3 address             | Correct |

**VillaBridge creates iframe → key.villa.cash/auth**

### Key App (`apps/key`)

| File                    | Purpose                       | Status                                            |
| ----------------------- | ----------------------------- | ------------------------------------------------- |
| `src/app/auth/page.tsx` | Auth page shown in SDK iframe | Shows Villa buttons, BUT Porto dialog overtakes   |
| `src/lib/porto.ts`      | Porto SDK wrapper             | **Uses Dialog.iframe() - causes nested Porto UI** |
| `src/lib/nickname.ts`   | PascalCase nickname generator | Working                                           |

**Problem:** `getPorto()` uses `Dialog.iframe()` which creates Porto's nested iframe

### Hub App (`apps/hub`)

| File                           | Purpose                            | Status                             |
| ------------------------------ | ---------------------------------- | ---------------------------------- |
| `src/app/onboarding/page.tsx`  | Main onboarding flow               | Orchestrates VillaBridge           |
| `src/lib/porto.ts`             | Porto SDK wrapper (fuller version) | Has multiple modes including relay |
| `src/lib/store.ts`             | Zustand identity store             | Device-local only                  |
| `src/app/api/profile/route.ts` | Profile API (nickname, avatar)     | Working but not used on sign-in    |

---

## API Endpoints

### `POST /api/profile`

- Saves nickname + avatar to database
- Called on account creation
- **NOT called on sign-in restore**

### `GET /api/profile/{address}`

- Fetches profile by address
- Used by key.villa.cash to check existing profile
- Returns `{ nickname, avatar }` or 404

### `GET /api/nicknames/reverse/{address}`

- Reverse lookup address → nickname
- Used by onboarding to check if user has existing nickname

---

## Contract State

### VillaNicknameResolverV3 (`0x180ddE044F1627156Cac6b2d068706508902AE9C`)

- On-chain nickname ↔ address mapping
- **NOT used during auth flow currently**
- SDK has correct address but doesn't call it during sign-in

---

## What Users See Today

### First Visit (New User)

1. villa.cash → "Welcome to Villa" → "Get Started"
2. Fullscreen iframe appears
3. **Porto's UI shows** (not Villa): "Sign up", "Create a new passkey wallet"
4. User creates passkey
5. Redirected to nickname selection (works)
6. Avatar selection (works)
7. Home page (works)

### Return Visit (Same Device)

1. villa.cash → auto-redirects to /home if identity in localStorage
2. Works, but relies on localStorage

### Return Visit (New Device)

1. villa.cash → "Welcome to Villa" → "Get Started"
2. **Porto's UI shows** (same problem)
3. User signs in with existing passkey
4. **Sees avatar selection again** (not remembered)
5. Nickname might be missing or empty

---

## Required Fixes

### Fix 1: Remove Nested Porto Dialog

**Goal:** Villa controls the entire UI, Porto only provides passkey infrastructure

**Option A: Use Porto Relay Mode**

```typescript
// apps/key/src/lib/porto.ts
export function getPorto(): ReturnType<typeof Porto.create> {
  return Porto.create({
    chains: getPortoChains(),
    mode: Mode.relay({
      keystoreHost: "villa.cash", // Passkeys bound to villa.cash
      webAuthn: {
        createFn: async (options) => {
          // Villa UI shows "Creating passkey..."
          return navigator.credentials.create(options);
        },
        getFn: async (options) => {
          // Villa UI shows "Sign in with passkey..."
          return navigator.credentials.get(options);
        },
      },
    }),
  });
}
```

**Option B: Use Porto's RpcServer Mode**

```typescript
// Host Porto dialog at key.villa.cash instead of id.porto.sh
mode: Mode.dialog({
  renderer: Dialog.iframe(),
  host: "https://key.villa.cash/auth", // Our server, not Porto's
  theme: villaTheme,
});
```

### Fix 2: Persist Identity Across Devices

**On account creation:**

1. Generate nickname (already done)
2. Save to Hub API (already done)
3. **Add: Write to VillaNicknameResolverV3 on-chain** (optional, costs gas)

**On sign-in:**

1. Get address from Porto
2. **Add: Fetch profile from Hub API**
3. **Add: Restore avatar + nickname to identity store**
4. Skip avatar selection if profile exists

### Fix 3: Fetch Profile on Sign-In

```typescript
// apps/key/src/app/auth/page.tsx
const handleSuccess = async (address: string, isNewAccount: boolean) => {
  let profile = await fetchProfile(address);

  if (!profile && isNewAccount) {
    // New user - generate and persist
    const nickname = generateNickname(address);
    await persistProfile(address, nickname);
    profile = { nickname, avatar: defaultAvatar };
  }

  // Always return full identity
  postToParent({
    type: "AUTH_SUCCESS",
    identity: {
      address,
      nickname: profile?.nickname || "",
      avatar: profile?.avatar || defaultAvatar,
    },
  });
};
```

---

## Files to Modify

| Priority | File                                    | Change                                       |
| -------- | --------------------------------------- | -------------------------------------------- |
| P0       | `apps/key/src/lib/porto.ts`             | Switch from Dialog.iframe() to relay mode    |
| P0       | `apps/key/src/app/auth/page.tsx`        | Add Villa-branded passkey UI states          |
| P1       | `apps/hub/src/app/onboarding/page.tsx`  | Fetch + restore profile on sign-in           |
| P1       | `packages/sdk/src/iframe.ts`            | Ensure identity includes avatar from profile |
| P2       | `apps/hub/src/app/api/profile/route.ts` | Add GET endpoint for full profile            |

---

## Success Criteria

- [ ] User NEVER sees Porto's "Sign up" / "Learn about passkeys" UI
- [ ] User sees Villa-branded passkey prompts
- [ ] Nickname persists across devices (same nickname on Device A and B)
- [ ] Avatar persists across devices (no re-selection on new device)
- [ ] Returning user with existing passkey: single-click sign-in

---

## Related Documentation

- Porto SDK: https://porto.sh/sdk
- Porto Relay Mode: https://porto.sh/sdk/guides/relay
- VillaNicknameResolverV3: `packages/sdk/src/contracts.ts`
- WebAuthn Spec: https://www.w3.org/TR/webauthn/
