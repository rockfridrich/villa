# Development Learnings Archive

Historical patterns from completed sessions. For active patterns, see [LEARNINGS.md](LEARNINGS.md).

---

## SDK Development Patterns (2026-01-05)

### 18. Pre-Commit Typecheck for SDK

Before committing SDK changes, verify imports resolve:

```bash
pnpm --filter @villa/sdk typecheck
```

**Why:** index.ts exports can reference files that aren't staged.

### 19. Contract Address Constants Pattern

Store deployed contract addresses in SDK for easy access:

```typescript
// packages/sdk/src/contracts.ts
export const CONTRACTS: Record<number, ChainContracts> = {
  [baseSepolia.id]: {
    nicknameResolver: { proxy: '0x...', implementation: '0x...' },
    recoverySigner: { proxy: '0x...', implementation: '0x...' },
  },
}
```

### 20. SDK Auth Screen Pattern

```typescript
// Framer Motion + accessibility
const prefersReducedMotion = useReducedMotion()
const variants = prefersReducedMotion ? {} : fadeInVariants

// Touch targets
<button className="min-h-[44px] min-w-[44px]">

// Debounced availability check
const [debouncedValue] = useDebounce(value, 300)
```

### 21. Secret Handling in Documentation (CRITICAL)

**Incident:** Real API token committed to public docs (2026-01-05)

```bash
# ❌ NEVER: Copy commands from shell history to docs
CLOUDFLARE_API_TOKEN="kpFQ..." npx cmd  # Real token leaked!

# ✅ ALWAYS: Use env var references in docs
CLOUDFLARE_API_TOKEN="$CLOUDFLARE_API_TOKEN" npx cmd
```

---

## npm Publishing Patterns (2026-01-05)

### 22. npm Package Publishing Pattern

**Pre-publish checklist:**
1. Verify package.json `name` matches intended npm scope
2. Check npm scope exists: `npm search @scope`
3. Build locally: `pnpm build`
4. Dry run: `npm pack --dry-run`

### 23. Peer Dependencies vs Regular Dependencies

```json
// ❌ Bad: forces specific versions on consumers
"dependencies": { "viem": "^2.0.0" }

// ✅ Good: consumers control versions
"peerDependencies": { "viem": "^2.0.0" }
```

### 24. Package Naming Verification (CRITICAL)

Before publishing ANY npm package:

```bash
# 1. Check if scope exists
npm view @scope/any-package 2>&1 | grep -q "404" && echo "Scope unavailable"

# 2. Your username is always available as scope
npm whoami  # Returns: rockfridrich
# @rockfridrich/* is always valid
```

### 25. Session Continuity Pattern

When resuming from summarized context:

```bash
# ALWAYS run first (before ANY file operations)
git status
git branch
ls -la key/directories/
```

### 26. Syntax Highlighting for Developer Docs

Use react-syntax-highlighter with One Dark Pro theme for code blocks:

```tsx
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism'
```

---

## Next.js & API Patterns (2026-01-05)

### 27. Next.js API Route Caching (CRITICAL)

API routes are cached by default in Next.js production builds:

```typescript
// ❌ Bad: Returns stale data in production
export async function GET() {
  return NextResponse.json({ timestamp: new Date() })
}

// ✅ Good: Fresh data every request
export const dynamic = 'force-dynamic'
export const revalidate = 0
```

### 28. CSP Frame-Ancestors for SDK Iframe

OAuth-like model for external app embedding:

```javascript
// next.config.js - Allow any HTTPS site to embed /auth
const authFrameAncestors = "'self' https: http://localhost:* http://127.0.0.1:*"
```

### 29. Jest-DOM Matchers in CI

`@testing-library/jest-dom/vitest` matchers may not load in CI:

```
Error: Invalid Chai property: toBeInTheDocument
```

**Workaround:** Skip unit tests in CI until proper fix.

---

## Database Patterns (2026-01-06)

### 30. DATABASE_URL in DigitalOcean Specs (CRITICAL)

**Root cause:** DO App Platform overwrites env vars with platform-managed values on every deploy.

```yaml
# ❌ WRONG: Manual env var (gets overwritten every deploy)
envs:
  - key: DATABASE_URL
    value: "postgresql://user:pass@host:5432/db"

# ✅ CORRECT: Database component binding (survives redeploys)
databases:
  - name: villa-db
    engine: PG
    cluster_name: villa-db

envs:
  - key: DATABASE_URL
    value: "${villa-db.DATABASE_URL}"
```

### 31. Production Deployment Checklist

```bash
# 1. Verify local tests pass
pnpm verify

# 2. Push to main (triggers beta deploy)
git push origin main

# 3. E2E tests on beta
BASE_URL=https://beta.villa.cash pnpm test:e2e:chromium

# 4. Create release tag (triggers production)
git tag -a v0.X.0 -m "vX.X.X - Release Notes"
git push origin v0.X.0
```

### 32. DevOps Debugging Time-Box (CRITICAL)

**Pattern:** When infrastructure issue persists after 15 minutes:

```
STOP → ESCALATE → DOCUMENT
```

1. **15 min mark:** If same error after 2 attempts → different approach
2. **30 min mark:** If platform-specific → check official docs
3. **45 min mark:** If still stuck → create minimal repro OR delegate

### 33. postgres.js Connection Options

```typescript
const sql = postgres(dbUrl, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  ssl: dbUrl.includes('sslmode=require') ? 'require' : false,
})
```

---

## Contribution System Patterns (2026-01-06)

### 34. GitHub Actions for Achievement Tracking

Achievement system triggered on:
- `pull_request.opened` → first-pr detection
- `pull_request.closed` → first-merge, bug-squasher
- `pull_request_review.submitted` → reviewer achievements

### 35. Command Injection Prevention: execFileSync Pattern (CRITICAL)

```typescript
// ❌ DANGEROUS
const cmd = `git log ${sinceTag}..HEAD`
execSync(cmd)  // If sinceTag = "main; rm -rf /", bash executes it!

// ✅ CORRECT
execFileSync("git", ["log", `${sinceTag}..HEAD`], {
  encoding: "utf-8",
  stdio: ["pipe", "pipe", "pipe"]
})
```

### 36. Path Traversal Prevention in Shell Scripts

```bash
validate_repository() {
  local project_root="$1"

  for file in ".env.example" ".claude/preferences.json"; do
    if [ -e "$project_root/$file" ]; then
      local real_path
      real_path=$(cd "$project_root" && realpath "$file" 2>/dev/null || echo "")

      if [[ "$real_path" != "$project_root"* ]]; then
        echo "Security: $file points outside repository" >&2
        exit 1
      fi
    fi
  done
}
```

### 37. XSS Prevention: Username Sanitization Pattern

```typescript
function sanitizeUsername(username: string): string {
  if (!username) return 'unknown'
  return username.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 39)
}
```

### 38. In-Memory Rate Limiting for Next.js APIs

```typescript
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 60
const RATE_WINDOW = 60 * 1000

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW })
    return true
  }
  if (record.count >= RATE_LIMIT) return false
  record.count++
  return true
}
```

### 39. GitHub Source of Truth for Contribution Data

| Data | Source | Read Method |
|------|--------|-------------|
| Contributions | git history | `git log --format` |
| PR metadata | GitHub API | `github.rest.pulls.list()` |
| Achievements | PR labels | Track via workflows |

### 40. Security Review Checklist

- [ ] Command Injection: All exec calls use `execFileSync`?
- [ ] Path Traversal: User paths checked with `realpath`?
- [ ] XSS: All user data sanitized before DOM?
- [ ] Rate Limiting: Public APIs have 429 enforcement?

### 41-46. Additional Patterns

See git history for full details on:
- GitHub Workflow Permissions (#41)
- Testing Achievement System (#42)
- Documentation Structure (#43)
- Gamification Leaderboard (#44)
- Autonomous Implementation Flow (#45)
- Shell Script Best Practices (#46)

---

## Token Efficiency Patterns (2026-01-06)

### Epic Task Decomposition

Break features into atomic subtasks using hierarchical IDs:

```bash
bd create "Sprint 4: Developer Portal" -p 1
# Returns: villa-6ts

bd create "Sidebar navigation" -p 1 --parent villa-6ts
# Returns: villa-6ts.1
```

### Infrastructure-First ROI

```
// ❌ Bad: Build feature, then realize need infrastructure
1. Build 10 features manually
2. Retrofit infrastructure

// ✅ Good: Infrastructure first
1. Setup Beads (70min investment)
2. Features 1-10 use Beads naturally
3. ROI: 114%
```

### File Churn Detection

**Target:** <2 files changed 3+ times per session

```bash
git log --name-only --format= --since="4 hours ago" | sort | uniq -c | awk '$1 >= 3'
```

### 47. Lock File Sync Prevention (CRITICAL)

Pre-commit hook + CI fast-fail for pnpm-lock.yaml sync.

### 48. Autonomous Session Verification Strategy

**Anti-Patterns:**
1. Sequential verification (~15 min wasted)
2. No agent delegation (~20 min wasted)
3. Task status drift

**Prevention:** Delegate verification to @explore at session start.

---

## Velocity Metrics (Phase 1)

| Metric | Target | Phase 1 | Phase 2 Goal |
|--------|--------|---------|--------------|
| Pivots per feature | 0-1 | 2 | 0 |
| CI failures | 0 | 4 | 0 |
| Avg CI time | <5m | 3.1m | <3m |
| Tests | >100 | 145 | 200+ |
| Context lines loaded | <500 | ~2300 | ~650 |

---

## Session References

Historical session notes in `.claude/archive/` and `.claude/reflections/`:
- `archive/REFLECTION-PHASE1.md` - Phase 1 retrospective
- `archive/REFLECTION-SESSION-2026-01-04.md` - CI/CD optimization session
- `reflections/2026-01-04-avatar-session.md` - Agent delegation failure analysis
- `reflections/2026-01-04-biometric-session.md` - Context recovery patterns
- `reflections/2026-01-05-celebration-animation.md` - CI timing race
- `reflections/2026-01-05-mlp-sprint-1.md` - MLP Sprint 1
- `reflections/2026-01-05-env-config-session.md` - Env config patterns
- `reflections/2026-01-06-production-deploy.md` - SDK iframe CSP
- `reflections/2026-01-06-profile-persistence.md` - Database binding fix

---

*Archived patterns. See [LEARNINGS.md](LEARNINGS.md) for active patterns.*
