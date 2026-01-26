# Production Deployment - Beta Candidate to Production

## Overview

Deploy Villa ID Revamp to production with SDK package updates.

**Current State:**
- Branch: `fix/beta-candidate` (pushed)
- Beads closed: `villa-3nr`, `villa-v86`
- Git tag: `v0.9.0-beta.1`
- SDK version: `0.1.3` (needs bump to `0.2.0`)

**Domain Reference:**
| Purpose | Domain | Status |
|---------|--------|--------|
| Production | `villa.cash` | ✅ Live |
| Staging | `construction.villa.cash` | ✅ Live |
| Key (passkeys) | `key.villa.cash` | ✅ Live |
| Docs | `docs.villa.cash` | ✅ Live |
| Beta (WRONG) | `construction.villa.cash` | ❌ Does not exist |

**BUG TO FIX:** Code references `construction.villa.cash` but should use `construction.villa.cash`
- `apps/key/src/app/auth/page.tsx:28`
- `apps/key/src/app/settings/page.tsx:8,23`

---

## Beads Usage Guide (Context Sharing)

### What is Beads?
Persistent task memory that survives across sessions. Both Claude Code GUI and OpenCode share the same `.beads/` folder.

### Core Commands
```bash
# Finding Work
bd ready                    # Tasks with no blockers
bd list --status=open       # All open tasks
bd show <id>                # Task details + dependencies

# Working on Tasks
bd update <id> --status=in_progress --assignee=opencode
bd update <id> --note="Progress: did X, stuck on Y"
bd close <id> --reason="Done in commit abc123"

# Dependencies
bd dep add <task> <blocker>  # task depends on blocker
bd blocked                   # Show all blocked tasks

# Session Management
bd prime                     # Load context at session start
bd sync --flush-only         # Export state at session end
bd doctor                    # Check for issues
```

### Context Sharing Protocol
```
┌─────────────────────┐     ┌─────────────────────┐
│  Claude Code GUI    │     │    OpenCode         │
│  (planning)         │     │    (execution)      │
└─────────┬───────────┘     └──────────┬──────────┘
          │                            │
          │  bd create <task>          │
          │  bd update --note="..."    │
          │                            │
          └──────────┬─────────────────┘
                     │
                     ▼
              ┌──────────────┐
              │   .beads/    │
              │ issues.jsonl │
              └──────────────┘
                     │
                     ▼
              ┌──────────────┐
              │     Git      │
              │  (synced)    │
              └──────────────┘
```

### Handoff Pattern
```bash
# Claude Code GUI creates task with context
bd create --title="Fix X" --type=task --priority=2
bd update <id> --note="Context: file Y line Z needs change because..."

# OpenCode picks up
bd prime                                    # Load context
bd show <id>                                # Read context
bd update <id> --status=in_progress --assignee=opencode

# OpenCode completes
bd close <id> --reason="Fixed in commit abc"
bd sync --flush-only

# Claude Code GUI can see completion
bd show <id>                                # See completion reason
```

---

## Phase 1: Merge to Main

### 1.1 Create PR
```bash
gh pr create \
  --title "fix: Villa ID beta candidate UX improvements" \
  --body "## Summary
- Porto-identical popup size (380×520px)
- Passkey naming: 'Your Villa Key'
- Prevent double passkey creation
- Vietnam animal names for nicknames
- Settings popup with 2-column avatars
- Fixed docs links (/docs → /sdk)

## Beads
Closes: villa-3nr, villa-v86

## Testing
- [ ] Popup opens at correct size
- [ ] Passkey shows 'Villa' in managers
- [ ] Settings saves nickname
- [ ] Docs links work"
```

### 1.2 Merge
```bash
gh pr merge --squash
```

### 1.3 Wait for Staging Deploy
```bash
# Railway auto-deploys on main push
# Check: https://construction.villa.cash/api/health
curl -s https://construction.villa.cash/api/health | jq .
```

---

## Phase 2: SDK Package Update

### 2.1 Version Bump
```bash
# In packages/sdk/package.json
# Change: "version": "0.1.3" → "0.2.0"

# In packages/sdk-react/package.json
# Change: "version": "0.1.2" → "0.2.0"
```

### 2.2 SDK API Changes (for 0.2.0)

**Remove appId requirement:**
```typescript
// packages/sdk/src/client.ts
// Before
constructor(config: VillaConfig) {
  if (!config.appId) throw new Error('appId required');
}

// After
constructor(config?: VillaConfig) {
  // appId auto-detected from origin
  this.appId = config?.appId || this.deriveAppId();
}

private deriveAppId(): string {
  if (typeof window === 'undefined') return 'server';
  return btoa(window.location.origin).slice(0, 16);
}
```

**Add target config:**
```typescript
// packages/sdk/src/types.ts
export interface VillaConfig {
  target?: 'beta' | 'production';  // NEW: replaces network
  debug?: boolean;
  // DEPRECATED: appId, network, apiUrl
}
```

**Internal URL mapping:**
```typescript
// packages/sdk/src/config.ts
const TARGETS = {
  beta: {
    hub: 'https://construction.villa.cash',
    key: 'https://key.villa.cash',
    chain: 84532, // Base Sepolia
  },
  production: {
    hub: 'https://villa.cash',
    key: 'https://key.villa.cash',
    chain: 8453, // Base Mainnet
  }
} as const;
```

### 2.3 UX/UI Updates for New SDK API

**Playground page updates:**
```typescript
// apps/developers/src/app/playground/page.tsx

// Before
import { villa } from '@rockfridrich/villa-sdk';

// After - show new simple API
const codeExample = `
// Villa SDK v0.2.0 - Zero config!
import { villa } from '@rockfridrich/villa-sdk';

// Sign in with one line
const user = await villa.signIn();
console.log(user.nickname); // "SwiftBuffalo"
console.log(user.avatar);   // CDN URL
`;
```

**SDK docs page updates:**
```typescript
// apps/developers/src/app/sdk/page.tsx

// Update Quick Start section
const quickStart = `
## Quick Start

### Installation
\`\`\`bash
npm install @rockfridrich/villa-sdk
\`\`\`

### Basic Usage (v0.2.0+)
\`\`\`typescript
import { villa } from '@rockfridrich/villa-sdk';

// No configuration needed!
const user = await villa.signIn();

// Access profile
console.log(user.nickname);  // "SwiftBuffalo"
console.log(user.avatar);    // "https://cdn.villa.cash/..."

// Sign out
await villa.signOut();
\`\`\`

### Advanced Configuration
\`\`\`typescript
import { Villa } from '@rockfridrich/villa-sdk';

const villa = new Villa({
  target: 'production', // 'beta' for testing
  debug: true,          // Enable console logs
});
\`\`\`
`;
```

**Auth page UX updates:**
```typescript
// apps/key/src/app/auth/page.tsx

// Update welcome text based on new API
<h1 className="text-3xl font-serif text-ink">Villa</h1>
<p className="text-sm text-ink-muted">
  Sign in with passkey
</p>

// Add "Powered by" footer in popup
<div className="absolute bottom-4 left-0 right-0 text-center">
  <span className="text-xs text-ink-muted/60">
    Powered by Villa SDK v0.2.0
  </span>
</div>
```

**Settings popup UX:**
```typescript
// apps/key/src/app/settings/page.tsx

// Show domain preview
<div className="mt-2 text-sm text-ink-muted">
  Your domain: <span className="font-mono">{nickname.toLowerCase()}.villa.cash</span>
</div>

// Add "Claim Forever" button (disabled for beta)
<button
  disabled
  className="w-full py-2 text-sm text-ink-muted border border-dashed rounded-lg"
>
  Claim nickname on-chain (coming soon)
</button>
```

### 2.4 Publish SDK
```bash
# Option A: Manual trigger
gh workflow run sdk-publish.yml -f version_bump=minor

# Option B: Tag trigger
git tag sdk-v0.2.0 -m "SDK v0.2.0 - Zero config, target API"
git push --tags
```

---

## Phase 3: Production Deploy

### 3.1 Final Testing on Staging
```bash
# Test on construction.villa.cash
[ ] Popup size 380×520
[ ] Passkey creation works
[ ] Settings saves
[ ] SDK v0.2.0 API works
[ ] Docs links work
```

### 3.2 Create Production Tag
```bash
git tag v0.9.1 -m "Villa ID Revamp - Beta Candidate Fixes"
git push --tags
```

### 3.3 Verify Production Deploy
```bash
# Railway auto-deploys on tag
# Check health endpoints
curl -s https://villa.cash/api/health | jq .
curl -s https://key.villa.cash/api/health | jq .
curl -s https://docs.villa.cash/api/health | jq .
```

### 3.4 Verify SDK on npm
```bash
npm view @rockfridrich/villa-sdk version
# Should show: 0.2.0
```

---

## Phase 4: Beads Cleanup

```bash
# Close completed tasks
bd close villa-afc --reason="SDK API redesign in v0.2.0"
bd close villa-ioj --reason="Production deployed v0.9.1"

# Update epic
bd update villa-n5h --status=closed --reason="Villa ID Revamp complete"

# Sync
bd sync --flush-only
```

---

## Package Update Protocol (For Future)

### When to Bump Versions

| Change Type | Version Bump | Example |
|-------------|--------------|---------|
| Bug fix only | Patch (0.1.3 → 0.1.4) | Fix typo, fix edge case |
| New feature (backward compatible) | Minor (0.1.3 → 0.2.0) | Add new method |
| Breaking change | Major (0.1.3 → 1.0.0) | Remove/rename method |

### Release Checklist

```bash
# 1. Update version in package.json
# 2. Update CHANGELOG.md (if exists)
# 3. Commit: "chore(sdk): bump version to X.Y.Z"
# 4. Create bead for release
bd create --title="Release SDK vX.Y.Z" --type=task --priority=1

# 5. Tag and push
git tag sdk-vX.Y.Z -m "Release notes..."
git push --tags

# 6. Verify npm
npm view @rockfridrich/villa-sdk version

# 7. Close bead
bd close <id> --reason="Published to npm"
```

### Rollback Protocol

```bash
# If production is broken:

# 1. Revert to previous tag
git revert HEAD
git push

# 2. Or: Deploy specific commit via Railway dashboard
# Railway → Deployments → Select previous deployment → Redeploy

# 3. For npm (can't truly rollback, but deprecate)
npm deprecate @rockfridrich/villa-sdk@0.2.0 "Bug in this version, use 0.2.1"
```

---

## Files to Modify

| File | Change |
|------|--------|
| `packages/sdk/package.json` | version: 0.1.3 → 0.2.0 |
| `packages/sdk-react/package.json` | version: 0.1.2 → 0.2.0 |
| `packages/sdk/src/client.ts` | Remove appId requirement |
| `packages/sdk/src/types.ts` | Add target config |
| `packages/sdk/src/config.ts` | Add TARGETS mapping |
| `apps/developers/src/app/playground/page.tsx` | Update code examples |
| `apps/developers/src/app/sdk/page.tsx` | Update docs |
| `apps/key/src/app/auth/page.tsx` | Add version footer |
| `apps/key/src/app/settings/page.tsx` | Add domain preview |

---

## Verification Checklist

```bash
# Code
[ ] bun typecheck passes
[ ] bun lint passes
[ ] Build succeeds

# Staging (construction.villa.cash)
[ ] Auth flow works
[ ] Settings saves
[ ] SDK examples work

# Production (villa.cash)
[ ] Health endpoints return 200
[ ] Auth flow works end-to-end
[ ] npm package updated

# Beads
[ ] All tasks closed
[ ] bd sync --flush-only complete
```
