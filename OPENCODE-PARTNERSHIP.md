# OpenCode + Claude Code Partnership

**Status:** ✅ Active Partnership (not a migration)
**Updated:** 2026-01-23

---

## Partnership Model

**Claude Code** and **OpenCode** work together:

| Tool | Role | When to Use |
|------|------|-------------|
| **Claude Code** | Initialization & Repair | Session start, broken environments, agent debugging, protocol updates |
| **OpenCode** | Implementation & Operations | Once environment healthy: @build, @design, @test, @ops agents |

**Not a migration** — both tools complement each other. Claude Code bootstraps and repairs; OpenCode implements.

---

## Current State Summary

### What's Working
- **SDK Auth Flow:** Relay mode with Villa passkeys (no Porto branding)
- **Modal UX:** Desktop 480x640 centered, mobile fullscreen
- **Nickname Flow:** Optional in auth modal, random name fallback (AdjectiveCreature)
- **Loading UX:** Instant Villa loading UI (no white flash)
- **Hot Reload:** transpilePackages configured for SDK

### Deployed
- **Beta:** https://beta.villa.cash (Sepolia, chain 84532)
- **Production:** https://villa.cash (Base mainnet, chain 8453)

---

## Critical Context to Preserve

### 1. Porto Mode Architecture
```
RELAY MODE (VillaAuthScreen):
- Passkeys bound to villa.cash domain
- User sees "Villa" in passkey managers
- Used in SDK iframe (/auth page)
- Functions: createAccountHeadless(), signInHeadless()

DIALOG MODE (VillaAuthDialog):
- Opens Porto popup at id.porto.sh
- 1Password can intercept
- NOT USED in current flow (disabled)
- Functions: createAccountDialog(), signInDialog()
```

**Rule:** Always use relay mode for SDK. Never show Porto UI to users.

### 2. SDK Bridge Communication
```typescript
// Parent (onboarding) → SDK iframe (/auth)
VillaBridge.open() → creates iframe to /auth
  ↓
// Iframe posts messages back
VILLA_READY → iframe loaded, hide loading overlay
VILLA_AUTH_SUCCESS → { identity: { address, nickname? } }
VILLA_AUTH_CANCEL → user cancelled
VILLA_AUTH_ERROR → auth failed
```

### 3. Identity Type (SDK)
```typescript
interface Identity {
  address: `0x${string}`
  nickname?: string        // Optional - set in auth modal or later
  avatar?: AvatarConfig    // Optional - generated later
}
```

### 4. Random Name Generation
```typescript
// apps/web/src/lib/random-name.ts
generateRandomName(address) → "AdjectiveCreature"
// e.g., "SwiftPanda", "BraveFox", "CosmicOwl"
// Deterministic from last 8 chars of address
```

---

## File Map (Key Files)

### SDK Package (`packages/sdk/`)
| File | Purpose |
|------|---------|
| `src/iframe/bridge.ts` | VillaBridge class, modal container, loading UI |
| `src/iframe/validation.ts` | Zod schemas for postMessage validation |
| `src/types.ts` | Identity, AvatarConfig interfaces |

### Web App (`apps/web/`)
| File | Purpose |
|------|---------|
| `src/app/auth/page.tsx` | Auth iframe page (loaded by SDK) |
| `src/app/onboarding/page.tsx` | Main onboarding flow |
| `src/components/sdk/VillaAuthScreen.tsx` | Auth UI with nickname step |
| `src/lib/porto.ts` | Porto relay/dialog mode config |
| `src/lib/random-name.ts` | Random name generator |

---

## Known Issues

### 1. Database Timeout (P2)
- **Symptom:** 10s delay on profile API calls locally
- **Cause:** DigitalOcean DB not accessible from local
- **Workaround:** Skip profile check when nickname provided from auth
- **Status:** Documented, not blocking

### 2. Lint Warnings (P3)
- **Count:** 12 warnings in web app
- **Type:** Unused variables, missing deps
- **Status:** Non-blocking, cleanup later

---

## Environment Setup

### Local Development
```bash
# Start with HTTPS (required for passkeys)
pnpm dev:local

# Opens https://localhost with Caddy proxy
# Hot reload enabled for SDK via transpilePackages
```

### Environment Variables
```bash
# .env.local (web app)
NEXT_PUBLIC_CHAIN_ID=84532  # Base Sepolia for beta
NEXT_PUBLIC_CHAIN_ID=8453   # Base mainnet for prod
```

---

## Beads (Task Tracking)

### Commands
```bash
bd ready              # Find available work
bd show <id>          # Task details
bd update <id> --status=in_progress
bd close <id>
bd sync --flush-only  # Export to JSONL
```

### Current State
- Sprint epic: villa-97v
- Closed: villa-476 (auth), villa-4bq (face enrollment Porto fix)

---

## Agent Delegation

### Tool Selection
| Task | Tool | Why |
|------|------|-----|
| Session start | Claude Code | Bootstrap, verify environment |
| Environment broken | Claude Code | Diagnose and repair |
| File search | OpenCode @explore | Cost-optimized (haiku) |
| Implementation | OpenCode @build | Specialized agent (sonnet) |
| Test runs | OpenCode @test | Cost-optimized (haiku) |
| Design review | OpenCode @design | UI expertise (sonnet) |
| Architecture | OpenCode @architect | Deep reasoning (opus) |
| Agent debugging | Claude Code | Full context, repair capability |
| Protocol updates | Claude Code | Edit .opencode/ directly |

### Handoff Pattern
```
Claude Code: "./scripts/doctor.sh" → passes → "Environment ready, switching to OpenCode"
OpenCode: "@build implement feature X" → completes → continue with OpenCode
OpenCode: Agent fails → "Returning to Claude Code for repair"
Claude Code: Debug → fix → "Ready, switching back to OpenCode"
```

---

## Pending Work

1. **Test beta deployment** - verify auth flow works
2. **Add E2E tests** - welcome → auth → nickname flow
3. **Manual 1Password test** - ensure no regression
4. **Face recovery** - enrollment works, need recovery trigger flow
5. **Production deploy** - when beta verified

---

## Commit History (This Session)

```
604e52b chore: sync beads state
b159940 feat(auth): redesign SDK auth modal with inline nickname flow
2b40d7e fix(recovery): use relay mode for face enrollment transactions
3be92f3 fix(recovery): use Porto signing for face enrollment
```

---

## Quick Reference

### Auth Flow
```
User clicks "Get Started"
  → SDK shows instant loading (Villa logo + spinner)
  → Iframe loads /auth
  → VillaAuthScreen renders
  → User clicks "Create Villa ID"
  → Passkey prompt (named "Villa")
  → Nickname input (optional, skip = random name)
  → Welcome message (1.5s)
  → postMessage to parent
  → Modal closes
  → Parent continues to avatar/home
```

### Modal Dimensions
- Desktop (>768px): 480×640px, centered, backdrop blur
- Mobile (≤768px): fullscreen

### Colors (Villa Brand)
- Cream: #FFFDF8
- Yellow: #FFE047
- Brown: #5C4813
- Ink: #0D0D17

---

*Partnership model established 2026-01-23. Claude Code = init/repair, OpenCode = implement.*
