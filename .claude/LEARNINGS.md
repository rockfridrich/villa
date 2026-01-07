# Development Learnings

Active patterns for Villa development. Historical patterns in [LEARNINGS-archive.md](LEARNINGS-archive.md).

**Quick Index:**
- [Core Patterns](#core-patterns) - Parallel execution, testing, React
- [Platform Quirks](#platform-quirks) - DigitalOcean, CI/CD, Porto
- [Shell Security](#shell-script-security-patterns) - Input validation, safe exec
- [Anti-Patterns](#anti-patterns) - What NOT to do
- [Agent Orchestration](#agent-orchestration) - Delegation model

---

## Core Patterns

### 1. Parallel Execution (DEFAULT)

```
✅ read files → edit → test + review (parallel)
❌ read → wait → edit → wait → test → wait
```

**When to parallelize:**
- Multiple file reads → single message
- Test + Review → always together after build
- Independent searches → multiple Grep/Glob calls

### 2. Environment-Agnostic Testing

```typescript
// ✅ Correct: relative URLs
await page.goto('/')

// ❌ Wrong: hardcoded URLs
const URL = 'https://prod.example.com'
```

Run against any environment:
```bash
BASE_URL=https://x.com npm run test:e2e:chromium
```

### 3. Return Types Over Logging

```typescript
// ❌ Bad: logs PII, returns void
setIdentity: (identity) => void {
  if (error) console.error('Error:', sensitiveData)
}

// ✅ Good: returns boolean, caller handles
setIdentity: (identity) => boolean {
  if (error) return false
}
```

### 4. Atomic SDK Operations

```typescript
// ❌ Bad: race condition
resetInstance()
await useInstance()

// ✅ Good: atomic with options
await useInstance({ forceRecreate: true })
```

### 5. React Cleanup Pattern

```typescript
const timeoutRef = useRef<NodeJS.Timeout>()

useEffect(() => () => {
  if (timeoutRef.current) clearTimeout(timeoutRef.current)
}, [])
```

### 6. Foundry Script Naming Convention

```solidity
// ❌ Bad: Multiple run() overloads (ABI conflict)
function run() external { ... }
function run(string url, address owner) external { ... }

// ✅ Good: Distinct function names
function run() external { ... }  // Default entry point
function deployWithParams(string url, address owner) external { ... }
```

### 7. btoa() Unicode Encoding

```typescript
// ❌ Bad: btoa() fails on Unicode
const encoded = btoa(unicodeString) // DOMException

// ✅ Good: UTF-8 encode first
const encoded = btoa(unescape(encodeURIComponent(unicodeString)))
```

### 8. Knowledge Base Pattern

```
.claude/knowledge/{domain}.md  → Domain-specific learnings
.claude/LEARNINGS.md           → Cross-cutting patterns
docs/reflections/{date}.md     → Session reflections
```

### 9. Orchestrator Delegation Pattern

```
❌ Bad: Main agent does everything

✅ Good: Orchestrator delegates
Main agent:
  ├── @build "Implement avatar system" (sonnet)
  ├── @test "Run E2E tests" (haiku, parallel)
  ├── @review "Review PR" (sonnet, parallel)
  └── Synthesize results
```

**When to delegate:**
- Implementation → @build
- Tests → @test
- Git operations → @ops
- Codebase search → @explore

### 10. CI/CD Monitoring Anti-Pattern (CRITICAL)

```
❌ TERRIBLE: Manual polling
sleep 60 && gh run view ...  # Burns tokens

✅ CORRECT: Background agent
@ops "Monitor deploy" --run_in_background
```

### 11. Test Execution Delegation

```
❌ Bad: Manual test run + parse output
npx playwright test ... 2>&1  # Wall of text

✅ Good: Delegate to @test
@test "Run avatar E2E, summarize failures"
```

### 12. Debug Parallelism Pattern

When tests fail with unclear cause:
```
✅ Launch in parallel:
1. @explore "Why does selector X find 6 elements?" &
2. @test "Run single test with verbose output" &
3. Continue analyzing locally
```

### 13. Context Recovery on Resume

```bash
# ALWAYS run before editing anything
git status
git stash list
ls -la src/lib/biometric/
```

### 14. Security Scanner Allowlists

```toml
# .gitleaks.toml
[allowlist]
description = "Anvil/Foundry default test private keys"
regexes = [
    '''0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80''',
]
```

### 15. Flexible Test Assertions

```typescript
// ❌ Brittle: Fails if redirect goes elsewhere
expect(url).toMatch(/\/(onboarding|home)/)

// ✅ Flexible: Assert on behavior, not URL
await expect(page.locator('[data-testid="auth-content"]')).toBeVisible()
```

### 16. Kill Dev Server Before Verify

```bash
pkill -f "next dev" 2>/dev/null
sleep 2
npm run verify
```

### 17. Animation Timing for CI

```typescript
// ❌ Bad: 800ms - too brief for CI
setTimeout(() => onSelect(config), 800)

// ✅ Good: 1200ms+ for reliable CI
setTimeout(() => onSelect(config), 1200)
```

---

## Platform Quirks

### DigitalOcean App Platform

**STRICT RULE: No Manual Deployments**

```
✅ Push to main → triggers beta.villa.cash deploy
✅ Tag v* → triggers villa.cash production deploy
✅ PR → triggers dev-1/dev-2 preview deploy

❌ doctl apps create-deployment (manual) — FORBIDDEN
```

**Environment Variable Scopes:**

| Scope | Use For |
|-------|---------|
| `RUN_TIME` | Secrets (not in build logs) |
| `BUILD_TIME` | Build-only vars |
| `RUN_AND_BUILD_TIME` | Most env vars (default) |

**Common Issues:**

| Issue | Fix |
|-------|-----|
| `doctl --format Name` returns `<nil>` | Use `--output json` + jq |
| Buildpacks prune devDeps | Use Dockerfile for Next.js |
| `doctl apps update` doesn't rebuild | Use `--force-rebuild` |

**Database Binding (CRITICAL):**

```yaml
# ✅ Survives redeploys
databases:
  - name: villa-db
    engine: PG
    cluster_name: villa-db

envs:
  - key: DATABASE_URL
    value: "${villa-db.DATABASE_URL}"
```

### CI/CD Workflow

| Pattern | Benefit |
|---------|---------|
| Draft PRs skip E2E | Fast iteration (~30s) |
| E2E sharding (2 shards) | 50% faster tests |
| Playwright browser cache | 90% faster setup |

### Porto SDK

| Issue | Fix |
|-------|-----|
| Iframe needs domain registration | Contact @porto_devs |
| ngrok always uses popup mode | Expected behavior |
| Session TTL ~24h | Server-controlled |

---

## Shell Script Security Patterns

### 1. Input Validation

```bash
validate_feature_name() {
  local name="$1"
  if [[ ! "$name" =~ ^[a-zA-Z0-9_.-]+$ ]]; then
    echo "Error: Invalid characters" >&2
    return 1
  fi
}
```

### 2. Safe Process Management

```bash
# ❌ Bad: kills ALL matching processes
pkill -f "next dev"

# ✅ Good: track specific PIDs
echo "$DEV_PID" > "$PROJECT_ROOT/.session.pid"
```

### 3. Safe JSON Parsing

```bash
# ❌ Bad: Python injection risk
echo "$API_RESPONSE" | python3 -c "import json..."

# ✅ Good: jq is safer
TUNNEL_URL=$(echo "$API_RESPONSE" | jq -r '.tunnels[0].public_url // empty')
```

### 4. Output Sanitization

```bash
sanitize_output() {
  printf '%s' "$1" | tr -d '\000-\010\013-\037\177' | head -c 500
}
```

### 5. Strict Mode

```bash
#!/bin/bash
set -euo pipefail  # Always use
```

### 6. Dynamic Path Detection

```bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
```

### 7. Safe Command Execution

```bash
# ❌ Bad: string interpolation (injection risk)
NGROK_CMD="ngrok http $PORT --domain=$DOMAIN"
$NGROK_CMD

# ✅ Good: array expansion (safe)
NGROK_ARGS=("http" "$PORT" "--domain=$DOMAIN")
ngrok "${NGROK_ARGS[@]}"
```

---

## Anti-Patterns

**Token Burners:**
- ❌ Sequential when parallel possible
- ❌ Hardcoded URLs in tests
- ❌ console.error with user data
- ❌ setTimeout without cleanup ref
- ❌ Implementing before spec is clear
- ❌ `git add .` without reviewing changes
- ❌ Manual `sleep && gh run view` polling
- ❌ Running tests manually when @test exists
- ❌ Committing without `pnpm typecheck`

---

## Agent Orchestration

**Claude Code as conductor:** Main Claude directs specialized agents.

```
Human request → Claude Code (orchestrator)
    ├── @spec → defines what
    ├── @build → writes code
    ├── @ops → commits + PR + deploy
    ├── @test + @review (parallel)
    └── Report to human
```

**Key separation:**
- @build writes code, never commits
- @ops commits atomically, never writes app code

---

## Session Archive

Historical session notes in `.claude/archive/` and `.claude/reflections/`:
- `archive/REFLECTION-PHASE1.md` - Phase 1 retrospective
- `reflections/2026-01-04-avatar-session.md` - Agent delegation analysis
- `reflections/2026-01-05-mlp-sprint-1.md` - MLP Sprint 1
- `reflections/2026-01-06-profile-persistence.md` - Database binding fix

For detailed patterns from past sessions, see [LEARNINGS-archive.md](LEARNINGS-archive.md).

---

*Keep this file under 500 lines. Move historical patterns to archive.*

### CI Failure - 2026-01-07 19:13
- Workflow: Deploy
- Run: https://github.com/rockfridrich/villa/actions/runs/20780819395
- Action: Check `gh run view 20780819395 --log-failed`

### CI Failure - 2026-01-07 19:37
- Workflow: Deploy
- Run: https://github.com/rockfridrich/villa/actions/runs/20781442443
- Action: Check `gh run view 20781442443 --log-failed`

### CI Failure - 2026-01-07 20:01
- Workflow: Deploy
- Run: https://github.com/rockfridrich/villa/actions/runs/20782080960
- Action: Check `gh run view 20782080960 --log-failed`

### CI Failure - 2026-01-07 20:18
- Workflow: .github/workflows/contracts.yml
- Run: https://github.com/rockfridrich/villa/actions/runs/20782802526
- Action: Check `gh run view 20782802526 --log-failed`

### 49. Orchestrator Purity Pattern (CRITICAL)

**Cost Impact:** 10-15x token waste if violated

```
❌ WRONG: Orchestrator (Opus) does implementation
1. Main Claude reads all files
2. Main Claude implements features
3. Main Claude tests + deploys
Cost: $40-60/session

✅ RIGHT: Orchestrator delegates, supervises
1. Main Claude: "@router classify Sprint 4 tasks"
2. @router: "Design tokens → @design, ENS display → @build"
3. @design + @build work in parallel (sonnet)
4. Main Claude: synthesizes results, guides next step
Cost: $4-6/session (90% savings)
```

**When Opus should code:**
- NEVER for features/components
- NEVER for file searches
- NEVER for testing
- ONLY for meta-work (writing agent prompts, reflection, architecture)

**Delegation matrix:**
| Task Type | Agent | Model | Why |
|-----------|-------|-------|-----|
| Find files/code | @explore | haiku | Cheap, fast search |
| Implement feature | @build | sonnet | Coding quality |
| Design system | @design | sonnet | UI expertise |
| Run tests | @test | haiku | Cheap, parallel |
| Monitor CI/deploy | @ops | haiku | Background task |
| Review code | @review | sonnet | Quality check |
| Architecture | @architect | opus | Complex decisions |

**Red flags (stop immediately):**
- Opus reading implementation files directly
- Opus writing component code
- Opus running git/CI commands
- No agent @ mentions in conversation

**Recovery:**
```
STOP. Delegate this to @{appropriate-agent}.
I should only orchestrate, not implement.
```

**Enforcement:**
- Session reflections MUST check delegation rate
- Target: 80%+ of work delegated
- Grade: F if orchestrator did implementation
