# Execution Plan: SDK Delivery for External Apps

**Date:** 2026-01-06
**Goal:** Ship working SDK that external developers can use to add "Sign in with Villa" to their apps

---

## Success Criteria

An external developer can:
1. `npm install @villa/sdk`
2. Initialize with app credentials
3. Call `villa.signIn()` and get back user identity
4. Display user's nickname and avatar

---

## Morning Block (Focus: Iframe Integration)

### Task 1: Auth Page Route
**File:** `apps/web/src/app/auth/page.tsx`

Create the `/auth` endpoint that the SDK iframe loads:
- Receives `appId` and `scopes` from query params
- Renders Porto auth flow
- Posts messages back to parent window

```
@build "Create /auth page for SDK iframe. Accept appId and scopes query params.
        Render Porto passkey auth. Post AUTH_SUCCESS/AUTH_ERROR/AUTH_CLOSE to parent."
```

### Task 2: Wire SDK Screens
**Files:** `apps/web/src/components/sdk/`

Connect existing screens to Porto:
- SignInWelcome → triggers Porto.connect()
- NicknameSelection → calls API to claim nickname
- ConsentRequest → grants/denies data access

```
@build "Wire SignInWelcome to Porto.connect(). On success, show NicknameSelection
        if new user, or post AUTH_SUCCESS if returning user."
```

---

## Afternoon Block (Focus: Developer Portal)

### Task 3: App Registration API
**File:** `apps/api/src/routes/developers.ts`

Complete the registration flow:
- Wallet signature verification ✅ (done)
- Store app in database
- Return appId + apiKey

```
@build "Complete POST /developers/apps to store in PostgreSQL.
        Return full credentials to developer."
```

### Task 4: Developer Portal UI
**Files:** `apps/web/src/app/developers/`

Make registration work end-to-end:
- Connect wallet
- Fill form
- Sign message
- Display credentials

```
@build "Wire AppRegistration to call API with wallet signature.
        Show credentials after successful registration."
```

---

## Evening Block (Focus: Testing & Deploy)

### Task 5: Integration Test
Create a simple test app that uses the SDK:

```html
<!-- test-app.html -->
<script type="module">
import { Villa } from 'https://beta.villa.cash/sdk.js'

const villa = new Villa({ appId: 'test-app' })
document.getElementById('signin').onclick = async () => {
  const result = await villa.signIn()
  if (result.success) {
    document.getElementById('user').textContent = result.identity.nickname
  }
}
</script>
<button id="signin">Sign in with Villa</button>
<div id="user"></div>
```

### Task 6: Deploy & Verify
- Push to main
- Verify beta.villa.cash works
- Test SDK from external origin

---

## Parallel Work

| Agent | Task |
|-------|------|
| @build | Auth page + SDK wiring |
| @design | Developer portal polish |
| @test | E2E tests for SDK flow |
| @ops | Deploy monitoring |

---

## Blockers to Resolve

1. **Porto iframe mode** - Needs domain registration
2. **CORS** - API must allow external origins
3. **npm publish** - Need npm account for @villa scope

---

## Files to Touch

```
apps/web/src/app/auth/page.tsx          # NEW - Auth endpoint
apps/web/src/components/sdk/*.tsx       # Wire to Porto
apps/api/src/routes/developers.ts       # Complete registration
apps/web/src/app/developers/*.tsx       # Wire to API
packages/sdk/src/client.ts              # Point to correct auth URL
```

---

## Definition of Done

- [ ] `/auth` page loads in iframe
- [ ] Porto passkey prompt appears
- [ ] Identity returned to SDK
- [ ] Developer can register app
- [ ] Test app works from external origin
- [ ] beta.villa.cash deployed with changes

---

## Commands

```bash
# Start fresh
pnpm dev

# Run specific tests
pnpm --filter @villa/web test:e2e:chromium -- --grep "SDK"

# Type check before commit
pnpm typecheck

# Full verify before push
pnpm verify
```
