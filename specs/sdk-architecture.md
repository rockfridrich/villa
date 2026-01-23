# Villa SDK Architecture

## Domain Map

```
PRODUCTION DOMAINS (Cloudflare DNS → Railway)
=============================================

┌─────────────────────────────────────────────────────────────┐
│  villa.cash                 Main hub, user profiles         │
│  key.villa.cash             Passkey auth UI (SDK popups)    │
│  docs.villa.cash            Developer documentation         │
├─────────────────────────────────────────────────────────────┤
│  construction.villa.cash    Staging/preview                 │
│  fake-key.villa.cash        Test passkeys for community     │
└─────────────────────────────────────────────────────────────┘
```

## SDK ↔ Key App Communication

```
┌─────────────────────────────────┐
│     DEVELOPER'S APP             │
│  (npm: @rockfridrich/villa-sdk) │
│                                 │
│  villa.signIn()  ─────┐         │
│  villa.settings() ────┼───────► Opens popup to key.villa.cash
│  villa.logout()  ─────┘         │
│                                 │
│  SDK = THIN CLIENT              │
│  • Opens popup/iframe           │
│  • Validates postMessage        │
│  • Returns identity             │
│  • NO UI, NO auth logic         │
└─────────────────────────────────┘
          │
          │ postMessage (origin-validated)
          ▼
┌─────────────────────────────────┐
│     key.villa.cash              │
│  (apps/key - Next.js)           │
│                                 │
│  ALL UI LIVES HERE:             │
│  /auth     Sign in/up flows     │
│  /settings Avatar, nickname     │
│                                 │
│  ALL LOGIC LIVES HERE:          │
│  • Porto passkey SDK            │
│  • Web3 avatar generation       │
│  • Profile API calls            │
│                                 │
│  BENEFITS:                      │
│  • Deploy = instant update      │
│  • No SDK republish needed      │
│  • A/B test UI freely           │
└─────────────────────────────────┘
          │
          │ REST API
          ▼
┌─────────────────────────────────┐
│     villa.cash (Hub)            │
│  (apps/hub - Next.js)           │
│                                 │
│  /api/profile      CRUD         │
│  /api/profile/:id  GET          │
│                                 │
│  PostgreSQL (Railway)           │
└─────────────────────────────────┘
```

## Update Flow: What Changes Where

```
CHANGE TYPE              LOCATION        RELEASE PROCESS
─────────────────────────────────────────────────────────
UI/UX (colors, layout)   apps/key        git push → Railway deploy
                                         ✓ Instant for all users

Auth logic bugs          apps/key        git push → Railway deploy
                                         ✓ Instant for all users

New SDK method           packages/sdk    npm publish
                                         ⚠ Devs must update

SDK type changes         packages/sdk    npm publish (major)
                                         ⚠ Breaking change

Avatar style change      apps/key        git push → Railway deploy
                                         ✓ Instant for all users
```

## Quality Gates

```
SDK RELEASE CHECKLIST
=====================

PATCH (0.0.x) - Bug fixes
├── [x] Typecheck passes
├── [x] Lint passes
├── [x] Unit tests pass
├── [ ] E2E smoke test
└── [ ] Auto-publish on merge

MINOR (0.x.0) - New features, backwards compatible
├── [x] Typecheck passes
├── [x] Lint passes
├── [x] Unit tests pass
├── [x] E2E full suite
├── [ ] CHANGELOG entry
└── [ ] Manual publish

MAJOR (x.0.0) - Breaking changes
├── [x] Typecheck passes
├── [x] Lint passes
├── [x] Unit tests pass
├── [x] E2E full suite
├── [x] CHANGELOG entry
├── [x] Migration guide
├── [x] Deprecation warnings in prior minor
└── [ ] Manual publish with review
```

## Message Protocol

```
SDK → key.villa.cash (popup opens)
══════════════════════════════════
URL params: ?appId=xxx&scopes=profile&origin=https://app.com

key.villa.cash → SDK (postMessage)
══════════════════════════════════
VILLA_READY              Popup loaded, ready for auth
VILLA_AUTH_SUCCESS       { identity: { address, nickname, avatar } }
VILLA_AUTH_CANCEL        User closed popup
VILLA_AUTH_ERROR         { error: string, code: string }
VILLA_SETTINGS_UPDATED   { changes: { avatar?, nickname? } }
VILLA_LOGOUT             User logged out from settings
```

## Avatar System

```
DEFAULT: Web3 Gradient (computed from wallet address)
─────────────────────────────────────────────────────
• Generated in key.villa.cash (live updates)
• Deterministic: same address = same colors
• Zero API calls, pure CSS gradients
• Based on github.com/JackHamer09/web3-avatar

ALTERNATIVE: DiceBear Styles
────────────────────────────
• lorelei, adventurer, avataaars, bottts, thumbs
• User can change in settings popup
• Stored in profile database

Identity.avatar format:
{
  style: "web3" | "lorelei" | "adventurer" | ...
  seed: "0x..." (wallet address)
}
```

## File Ownership

```
packages/sdk/           SDK npm package (thin client)
├── src/client.ts       Villa class, signIn/signOut
├── src/iframe/         Popup/iframe bridge
├── src/types.ts        Shared types (Identity, etc)
└── src/avatar.ts       Avatar URL generation (fallback)

apps/key/               Auth UI (key.villa.cash)
├── src/app/auth/       Sign in/up pages
├── src/app/settings/   Settings popup (TODO)
├── src/lib/porto.ts    Passkey integration
├── src/lib/nickname.ts Nickname generation
└── src/lib/web3-avatar.ts  Web3 gradient avatars

apps/hub/               Main hub (villa.cash)
├── src/app/api/profile Profile CRUD endpoints
└── src/lib/db/         PostgreSQL connection
```
