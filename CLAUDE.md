# Villa - AI Assistant Context

> Passkey authentication for AI-native apps on Base blockchain.

## Quick Reference

```bash
bun install          # Install dependencies
bun dev              # Start hub (villa.cash) on :3000
bun verify           # Typecheck + lint + test
```

## Architecture

```
villa/
├── apps/
│   ├── hub/         # Main app (villa.cash) - profiles, API, auth UI
│   ├── key/         # Passkey service (key.villa.cash) - WebAuthn isolation
│   ├── developers/  # Docs site (docs.villa.cash) - SDK docs, playground
│   ├── telemetry/   # Local monitoring dashboard (not deployed)
│   ├── api/         # Standalone API service (unused - APIs in hub)
│   └── relay/       # Transaction relay (unused)
├── packages/
│   ├── sdk/         # @rockfridrich/villa-sdk - core auth library
│   ├── sdk-react/   # @rockfridrich/villa-sdk-react - React bindings
│   ├── ui/          # Shared Tailwind config
│   └── config/      # Shared TypeScript/ESLint config
└── contracts/       # Solidity - nickname resolver, recovery signer
```

## Apps

### Hub (`apps/hub`) - villa.cash
Main application and API gateway.

```bash
bun dev                    # http://localhost:3000
```

**Routes:**
- `/` - Landing page
- `/auth` - SDK iframe target for authentication
- `/home` - Authenticated dashboard
- `/settings` - Profile settings
- `/onboarding` - New user flow

**APIs:**
- `POST /api/profile` - Create/update profile
- `GET /api/profile/[address]` - Get profile
- `GET /api/ens/resolve?name=...` - Resolve nickname to address
- `GET /api/health` - Health check

### Key (`apps/key`) - key.villa.cash
Isolated passkey authentication domain.

```bash
cd apps/key && bun dev     # http://localhost:3001
```

**Purpose:** WebAuthn operations require stable origin. Key app isolates passkey logic so hardware-bound keys are tied to `key.villa.cash`.

**Routes:**
- `/auth` - Passkey authentication UI (Porto SDK)
- `/settings` - Passkey management

### Developers (`apps/developers`) - docs.villa.cash
Documentation and SDK playground.

```bash
bun dev:developers         # http://localhost:3002
```

**Routes:**
- `/` - Landing with quick start
- `/sdk` - Full SDK documentation
- `/playground` - Interactive SDK demo
- `/examples` - Code examples
- `/CLAUDE.txt` - AI assistant context file

### Telemetry (`apps/telemetry`) - Local Only
Internal monitoring dashboard for deployments and CI.

```bash
cd apps/telemetry && bun dev    # http://localhost:3003
bun test                        # Playwright E2E tests
```

**Requires:** `gh` CLI authenticated (`gh auth login`)

**Features:**
- Service health monitoring (villa.cash, key.villa.cash, docs.villa.cash)
- GitHub Actions status
- Deployment pipeline visualization
- Database status

## Packages

### SDK (`packages/sdk`)
Core authentication library published to npm as `@rockfridrich/villa-sdk`.

```typescript
import { villa } from '@rockfridrich/villa-sdk';

const user = await villa.signIn();
// { address: "0x...", nickname: "CosmicFox", avatar: "..." }
```

**Key files:**
- `src/simple.ts` - Zero-config `villa` singleton
- `src/client.ts` - `Villa` class with full options
- `src/iframe/bridge.ts` - `VillaBridge` for iframe communication
- `src/iframe/validation.ts` - Origin validation (trusts Villa domains)

### SDK React (`packages/sdk-react`)
React bindings published as `@rockfridrich/villa-sdk-react`.

```tsx
import { useVilla, VillaButton } from '@rockfridrich/villa-sdk-react';

function App() {
  const { user } = useVilla();
  return user ? <p>@{user.nickname}</p> : <VillaButton />;
}
```

## Auth Flow

1. App calls `villa.signIn()` via SDK
2. SDK creates fullscreen iframe to `villa.cash/auth`
3. Auth page triggers passkey via Porto SDK (WebAuthn)
4. On success, deterministic ETH address derived from passkey
5. New users get auto-generated PascalCase nickname (e.g., `SwiftRaven`)
6. Identity sent back via `postMessage` to parent
7. SDK stores session in localStorage (7-day TTL)

**Security:**
- SDK only trusts messages from Villa domains
- Auth pages accept any HTTPS origin (SDK works on any domain)
- postMessage always targeted to specific origin (never `*`)

## Infrastructure

**Railway:** https://railway.com/project/7c344004-cd63-4b10-8479-9991c3923115

| Service | Domain | Source |
|---------|--------|--------|
| Hub | villa.cash, construction.villa.cash | Dockerfile (root) |
| Key | key.villa.cash | apps/key/Dockerfile |
| Developers | docs.villa.cash | apps/developers/Dockerfile |

**Auto-deploy:** Push to `main` triggers Railway deployment.

## Commands

```bash
# Development
bun dev                    # Hub on :3000
bun dev:developers         # Docs on :3002
bun dev:telemetry          # Telemetry on :3003

# Verification
bun verify                 # Full check (typecheck + lint + test)
bun typecheck              # TypeScript only
bun lint                   # ESLint only

# Testing
bun test                   # All tests
cd apps/telemetry && bun test  # Telemetry E2E

# Build
bun build                  # Build all packages
```

## Current Issues

### SDK Auth Flow (Fixed Today)
**Problem:** SDK iframe auth wasn't working on external domains (e.g., Lovable apps).

**Root Cause:** Auth pages only allowed hardcoded origins in allowlist.

**Fix:** Changed origin validation to accept any valid HTTPS origin. The SDK is meant to work on ANY domain - security is maintained because:
1. postMessage is targeted to specific origin (not wildcard)
2. Parent initiated the auth flow
3. Data returned is user's own identity

**Files changed:**
- `apps/hub/src/app/auth/page.tsx`
- `apps/key/src/app/auth/page.tsx`
- `apps/key/src/app/settings/page.tsx`

## Contract Addresses (Base Sepolia)

| Contract | Address |
|----------|---------|
| VillaNicknameResolverV3 | `0x180ddE044F1627156Cac6b2d068706508902AE9C` |
| BiometricRecoverySignerV2 | `0xdFb55a363bdF549EE5C2e77D0aAaC39068ED5836` |

## Related Docs

- `ARCHITECTURE.md` - System design and data flow
- `DEVELOPMENT.md` - Detailed dev setup
- `ROADMAP.md` - Feature roadmap
- `AGENTS.md` - AI agent configuration (OpenCode)
