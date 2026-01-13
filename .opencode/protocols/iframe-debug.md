# Iframe & key.villa.cash Debug Protocol

## Current Architecture

```
External App                    Villa SDK                  key.villa.cash
===========                     =========                  ==============
villa.signIn()           -->    VillaBridge.open()   -->   /auth page
                                 |                          |
                                 | iframe                   | Porto dialog mode
                                 | postMessage              | keystoreHost: key.villa.cash
                                 |                          |
                         <--    AUTH_SUCCESS         <--   Passkey created
```

---

## Known Issues

### Issue 1: Porto Dialog vs Relay Mode

| Mode   | 1Password | Custom UI    | Domain         |
| ------ | --------- | ------------ | -------------- |
| Dialog | Works     | Limited      | id.porto.sh    |
| Relay  | Broken    | Full control | key.villa.cash |

**Current state:**

- Main app (`villa.cash/onboarding`) uses dialog mode - works
- SDK iframe uses relay mode - 1Password doesn't intercept

**Files:**

- `apps/web/src/lib/porto.ts` - Mode configuration
- `packages/sdk/src/iframe/bridge.ts` - SDK iframe logic
- `apps/web/src/app/auth/page.tsx` - Auth page loaded in iframe

### Issue 2: CSP/CORS for key.villa.cash

SDK iframe loads `/auth` from `key.villa.cash`. Check headers:

```bash
curl -I https://key.villa.cash/auth 2>&1 | grep -iE "content-security|access-control"
```

Required CSP frame-ancestors must allow parent app domains.

---

## Debug Steps

### 1. Verify Local HTTPS Works

```bash
pnpm dev:local
# Open https://local.villa.cash/auth
# Should see VillaAuthScreen
```

### 2. Check Iframe Loading

In browser DevTools:

1. Network tab - watch for `/auth` request
2. Console - look for postMessage errors
3. Elements - find `<iframe id="villa-auth-iframe">`

### 3. Test postMessage Flow

```javascript
// In parent app console
window.addEventListener("message", (e) => {
  console.log("Message from iframe:", e.origin, e.data);
});
```

### 4. Verify Porto Dialog

```javascript
// In /auth page console
import { Porto } from "porto";
const porto = Porto.create({ mode: Porto.Mode.dialog() });
console.log("Porto mode:", porto.mode);
```

---

## Fix Approaches

### A) Use Dialog Mode Everywhere

Configure SDK to use Porto dialog mode instead of relay:

```typescript
// packages/sdk/src/iframe/bridge.ts
// Change from relay to dialog mode
```

Pros: 1Password works
Cons: Less UI customization

### B) Self-Host Porto Dialog on key.villa.cash

Deploy Porto dialog page on key.villa.cash with custom keystoreHost:

```typescript
Porto.create({
  mode: Porto.Mode.dialog({
    host: "https://key.villa.cash/auth",
  }),
});
```

Requires: DNS setup, Porto configuration

### C) Accept Porto Branding

Keep dialog mode, users see "Porto" in passkey picker.

---

## Test Matrix

| Scenario        | Page        | Mode                     | Expected        |
| --------------- | ----------- | ------------------------ | --------------- |
| Main onboarding | /onboarding | VillaAuth (dialog)       | 1Password works |
| SDK iframe      | /auth       | VillaAuthScreen (relay)  | Need fix        |
| SDK popup       | /auth       | VillaAuthDialog (dialog) | Should work     |

---

## Related Files

```
apps/web/src/
├── app/auth/page.tsx           # Auth page (iframe target)
├── components/sdk/
│   ├── VillaAuthScreen.tsx     # Relay mode UI
│   └── VillaAuthDialog.tsx     # Dialog mode UI
└── lib/porto.ts                # Porto configuration

packages/sdk/src/
├── iframe/
│   ├── bridge.ts               # VillaBridge class
│   └── validation.ts           # Origin allowlist
├── iframe.ts                   # Legacy iframe utils
└── client.ts                   # Villa client
```
