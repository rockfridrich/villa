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

### 0. Local Development Requires HTTPS (CRITICAL)

**Passkeys/WebAuthn require secure context (HTTPS).** HTTP will silently fail.

```bash
# ✅ PREFERRED: Docker with HTTPS proxy (matches deploy)
pnpm dev:docker   # Uses docker-compose.dev.yml + Caddy HTTPS

# ✅ ALTERNATIVE: Direct HTTPS
pnpm dev:https    # Opens https://localhost:3000 with mkcert
```

```bash
# ❌ WRONG: HTTP mode breaks passkeys
pnpm dev  # http://localhost:3000 - passkeys won't work
```

**Symptoms of HTTP mode:**
- Passkey creation fails silently
- "NotAllowedError" in console
- Porto dialog appears but biometric never triggers
- 1Password doesn't intercept

**When HTTP is acceptable:**
- API-only testing (no auth flows)
- Static page development (no passkeys)
- Never for onboarding/login testing

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

### CI Failure - 2026-01-07 21:02
- Workflow: .github/workflows/contracts.yml
- Run: https://github.com/rockfridrich/villa/actions/runs/20784006701
- Action: Check `gh run view 20784006701 --log-failed`

### CI Failure - 2026-01-07 21:19
- Workflow: .github/workflows/contracts.yml
- Run: https://github.com/rockfridrich/villa/actions/runs/20784416438
- Action: Check `gh run view 20784416438 --log-failed`

### CI Failure - 2026-01-07 21:45
- Workflow: Deploy
- Run: https://github.com/rockfridrich/villa/actions/runs/20784983050
- Action: Check `gh run view 20784983050 --log-failed`

### CI Failure - 2026-01-07 22:37
- Workflow: Deploy
- Run: https://github.com/rockfridrich/villa/actions/runs/20786441145
- Action: Check `gh run view 20786441145 --log-failed`

### CI Failure - 2026-01-08 01:52
- Workflow: Deploy
- Run: https://github.com/rockfridrich/villa/actions/runs/20792317290
- Action: Check `gh run view 20792317290 --log-failed`

### CI Failure - 2026-01-08 02:11
- Workflow: .github/workflows/contracts.yml
- Run: https://github.com/rockfridrich/villa/actions/runs/20793433750
- Action: Check `gh run view 20793433750 --log-failed`

### 50. Porto Mode Selection Pattern (CRITICAL - 2026-01-08)

**Cost Impact:** 2 hours token waste, user-found regression

Porto has two fundamentally different modes with different ecosystem support:

**Dialog Mode** (recommended for primary flows):
```typescript
// 1Password + ecosystem integrations work
Mode.dialog({
  renderer: Dialog.popup(...),
  theme: customTheme,
})
```
- Porto shows iframe dialog
- 1Password and passkey managers hook into dialog context
- Limited to Porto's customization options (theming only)
- Native passkey manager experience maintained

**Relay Mode** (for headless/iframe scenarios only):
```typescript
// 1Password + ecosystem integrations DO NOT work
Mode.relay({
  webAuthn: {
    createFn: async (opts) => navigator.credentials.create(opts),
    getFn: async (opts) => navigator.credentials.get(opts),
  }
})
```
- Villa calls WebAuthn APIs directly
- Passkey managers don't intercept (1Password won't trigger)
- Full custom UI control (PasskeyPrompt + animations)
- Loses entire ecosystem support

**Usage Matrix:**

| Scenario | Mode | Reason |
|----------|------|--------|
| Main onboarding | Dialog | 1Password support essential |
| Main login page | Dialog | 1Password support essential |
| SDK iframe (Porto dialog won't render) | Relay | Only viable option |
| Mobile in-app browser | Relay | Limited dialog support |
| Custom headless integration | Relay | Developer controls flow |

**Critical Anti-Pattern:**
```
❌ WRONG: Use relay mode for main flows to get custom UI
❌ WRONG: Assume relay mode is just "UI wrapper" around dialog
❌ WRONG: Assume E2E tests passing = passkey ecosystem works

✅ RIGHT: Use dialog mode for main flows, customize via theme
✅ RIGHT: Use relay mode ONLY when dialog won't render
✅ RIGHT: Manual test with real 1Password before shipping
```

**Incident:** 2026-01-08
- Implemented VillaAuthScreen (relay mode) for onboarding
- E2E tests passed ✓ but 1Password integration broke ✗
- User reported: "flow doesn't trigger 1password"
- Root cause: Relay mode calls `navigator.credentials.*` directly
- 1Password only hooks into Porto's dialog iframe
- Fix: Reverted onboarding to VillaAuth (dialog mode), kept relay mode only for SDK iframe

**Testing Limitation:**
E2E tests miss ecosystem behavior because:
- Headless Chromium doesn't support real biometric
- Tests call WebAuthn APIs directly
- Real flow: 1Password intercepts → shows biometric → returns credential

**Validation Checklist for Auth Changes:**
```bash
# Before shipping ANY passkey changes:
□ Understand Porto mode choice (dialog vs relay)
□ Write ADR if switching modes
□ Manual test on device with 1Password installed
□ Verify biometric prompt appears
□ Check passkey manager can intercept
□ Not just: "E2E tests passed"
```

**Key Learning:** Architecture (ecosystem support) > UI customization when passkeys are involved.


### CI Failure - 2026-01-08 02:52
- Workflow: Deploy
- Run: https://github.com/rockfridrich/villa/actions/runs/20794071579
- Action: Check `gh run view 20794071579 --log-failed`

### CI Failure - 2026-01-08 04:01
- Workflow: Deploy
- Run: https://github.com/rockfridrich/villa/actions/runs/20796063077
- Action: Check `gh run view 20796063077 --log-failed`

### CI Failure - 2026-01-08 04:35
- Workflow: Deploy
- Run: https://github.com/rockfridrich/villa/actions/runs/20796063077
- Action: Check `gh run view 20796063077 --log-failed`

### CI Failure - 2026-01-08 14:17
- Workflow: Deploy
- Run: https://github.com/rockfridrich/villa/actions/runs/20808548594
- Action: Check `gh run view 20808548594 --log-failed`

### CI Failure - 2026-01-08 14:56
- Workflow: Deploy
- Run: https://github.com/rockfridrich/villa/actions/runs/20809304558
- Action: Check `gh run view 20809304558 --log-failed`

### CI Failure - 2026-01-08 15:27
- Workflow: .github/workflows/contracts.yml
- Run: https://github.com/rockfridrich/villa/actions/runs/20810445419
- Action: Check `gh run view 20810445419 --log-failed`

### 54. Background CI Monitoring (CRITICAL - 2026-01-08)

**Token Impact:** Saves 5-10 minutes per iteration cycle (~600-1200 tokens)

```
❌ WRONG: Manual CI polling loop
push commit
sleep 120 && gh run view --json conclusion  # Wait 2 min
→ Still in progress
sleep 120 && gh run view --json conclusion  # Wait again
→ Still in progress
[Repeat 8+ times = 16+ minutes wasted]

✅ CORRECT: Background agent monitoring
@ops "Monitor CI for commit ABC123, report when complete or fails" --background
[Continue other work while @ops watches]
```

**Why it burns tokens:**
- Orchestrator context stuck waiting for status
- Cognitive overhead switching between code and polling
- No productive work during waits
- Each iteration adds mental overhead

**When to delegate to @ops:**
- Any CI/deploy operation that takes >1 minute
- Waiting for test results
- Monitoring long-running builds
- Staging/production deploy verification

**Pattern saves 5-10 min per iteration** because @ops runs in background terminal while orchestrator continues productive work.

---

### 55. Two-Strike Rule: Deployment Health Check (CRITICAL - 2026-01-08)

**Token Impact:** Prevents 2-3 hours of debugging waste

**The Rule:**
After 2 CI failures on same branch → STOP code iteration

**Root Cause Investigation (MANDATORY):**
```bash
# 1. Check deployment health
curl -s https://beta.villa.cash/api/health | jq .timestamp

# 2. Verify main branch tests still pass
git checkout main && pnpm test:e2e

# 3. Check if issue is environment-specific
gh run list --branch main --limit 5 --json conclusion
```

**Symptoms of Deployment Issue (not code issue):**
- ✗ Tests pass locally but fail in CI
- ✗ Unrelated tests starting to fail
- ✗ Same error across multiple commits
- ✗ Staging deploy is old/unhealthy

**What to do:**
1. Do NOT push more code
2. Run deployment health checks above
3. If staging is unhealthy → delegate to @ops: "Check deployment health"
4. If main branch tests failing → rollback or ask user
5. Only continue coding after deployment is verified healthy

**Incident (2026-01-08):**
- Commit 37322db: Added GLIDE_PROJECT_ID → E2E tests fail
- Commit 981b911: Added DATABASE_URL → E2E tests still fail
- Should have STOPPED here and checked deployment health
- Instead: Continued debugging → 3 more failed attempts
- **Wasted: ~60 minutes and ~1500 tokens**

**Recovery if rule already violated:**
```
1. Stop current iteration immediately
2. Check deployment health (see above)
3. Ask user: "Should I continue debugging or delegate to @ops?"
4. NEVER do iteration #4+ without intervention
```

---

### 56. Pre-Push Validation for Production Changes (CRITICAL - 2026-01-08)

**Token Impact:** Prevents user-found regressions (2000+ tokens after-the-fact)

**Mandatory Pre-Push Checklist:**

```
BEFORE ANY PUSH TO MAIN:
  [ ] pnpm verify passes (includes typecheck + E2E)
  [ ] Full E2E locally: pnpm test:e2e --headed (watch actual UI)
  [ ] If auth changes:
      [ ] Manual test on device with 1Password installed
      [ ] Verify passkey creation prompt appears
      [ ] Check 1Password can intercept credentials
  [ ] If API changes:
      [ ] DATABASE_URL set locally
      [ ] API calls don't fail in E2E
  [ ] If UI changes:
      [ ] Run E2E tests 2x locally (check for timing issues)
      [ ] Manual visual inspection in browser
```

**Special Rules for Auth Changes:**
- NEVER rely on E2E tests alone for passkey changes
- Headless Chromium doesn't support real biometric
- E2E tests bypass 1Password/ecosystem interception
- **Manual test on real device is MANDATORY**

**Why this matters:**
- Commit 471d4e9: Switched Porto mode for custom UI
- E2E tests passed ✓
- 1Password integration broke ✗
- User-reported regression in production

**If you skip this checklist:**
- 50% chance of user-found regression
- 30-60 min to investigate after-the-fact
- 2000+ tokens wasted

---

### 57. Environment Variable Defensive Coding (CRITICAL - 2026-01-08)

**Token Impact:** Prevents cascading test failures

**Pattern:** E2E tests that hit API routes must skip gracefully if env vars missing

```typescript
// ❌ Bad: Test fails if DATABASE_URL missing
test('updates profile nickname', async ({ page }) => {
  await page.goto('/profile')
  await page.fill('[name="nickname"]', 'Alice')
  await page.click('button:has-text("Save")')
  // Hits /api/profile → fails if DATABASE_URL not set
})

// ✅ Good: Test skips gracefully
test.skip(
  () => !process.env.DATABASE_URL || process.env.CI === 'true',
  'Requires DATABASE_URL and non-CI environment'
)('updates profile nickname', async ({ page }) => {
  await page.goto('/profile')
  await page.fill('[name="nickname"]', 'Alice')
  await page.click('button:has-text("Save")')
})
```

**Where to apply:**
- Any E2E test calling `/api/*` routes
- Any test needing database connectivity
- Any test with external dependencies (Glide, Porto, etc.)

**Benefits:**
- CI/CD doesn't fail on missing secrets
- Local development can skip expensive tests
- Clearer feedback (skipped vs failed)

**Applied to:**
- SDK iframe tests (DATABASE_URL check)
- Profile API tests (DATABASE_URL check)
- Glide integration tests (GLIDE_PROJECT_ID check)


---

## Session Efficiency Patterns

### 58. Session Start Protocol (CRITICAL - 2026-01-08)

**Token Impact:** Prevents 2000+ tokens/session from inefficiency

**Protocol:**
1. Load context (2 min): `bd ready`, `git status`, `git log -5`
2. Delegate to agents (80%+ target)
3. Enforce anti-patterns: No manual CI polling, spec-first, Two-Strike Rule

**Red Flags (stop immediately):**
- Opus reading implementation files directly
- Opus writing component code
- No @ agent mentions in conversation

**See:** `.claude/session-start-checklist.md`

### 59. Opus Delegation Enforcement (CRITICAL - 2026-01-08)

**Cost Impact:** 10-15x token waste if Opus implements directly

**Opus MUST NOT:**
- Read implementation files directly
- Write component code
- Run git/CI commands
- Manual poll CI status

**Opus MUST:**
- Delegate 80%+ of work to agents
- Orchestrate parallel agent work
- Synthesize agent results
- Make architecture decisions only

**Agent Routing:**
| Task | Agent | Model |
|------|-------|-------|
| File search | @explore | haiku |
| Implementation | @build | sonnet |
| Test runs | @test | haiku |
| CI/deploy | @ops | haiku |
| Design review | @design | sonnet |

**Recovery:**
```
STOP. This should be delegated to @{agent}.
I am an orchestrator, not an implementer.
```

### 60. Spec-Bead Sync (2026-01-08)

**Problem:** Sprint specs written but not decomposed into beads.

**Solution:**
1. Every spec task → create bead with `bd create`
2. Work from `bd ready`, not spec markdown
3. Commit messages reference bead IDs: `feat: X [villa-abc]`
4. Daily: `bd status` to verify sync

**Example:**
```bash
# Sprint spec has 21 tasks
# Create 21 beads, one per task
bd create "W1: SDK quickstart video" --priority=1
# ...repeat for all tasks
```

### CI Failure - 2026-01-08 18:26
- Workflow: Deploy
- Run: https://github.com/rockfridrich/villa/actions/runs/20814810963
- Action: Check `gh run view 20814810963 --log-failed`

### CI Failure - 2026-01-08 18:59
- Workflow: Deploy
- Run: https://github.com/rockfridrich/villa/actions/runs/20815760593
- Action: Check `gh run view 20815760593 --log-failed`

### CI Failure - 2026-01-08 19:11
- Workflow: .github/workflows/contracts.yml
- Run: https://github.com/rockfridrich/villa/actions/runs/20816272406
- Action: Check `gh run view 20816272406 --log-failed`

### CI Failure - 2026-01-08 19:29
- Workflow: .github/workflows/contracts.yml
- Run: https://github.com/rockfridrich/villa/actions/runs/20816844009
- Action: Check `gh run view 20816844009 --log-failed`

### CI Failure - 2026-01-08 19:39
- Workflow: .github/workflows/contracts.yml
- Run: https://github.com/rockfridrich/villa/actions/runs/20816844009
- Action: Check `gh run view 20816844009 --log-failed`

### CI Failure - 2026-01-08 20:14
- Workflow: .github/workflows/contracts.yml
- Run: https://github.com/rockfridrich/villa/actions/runs/20818045926
- Action: Check `gh run view 20818045926 --log-failed`

### CI Failure - 2026-01-09 00:46
- Workflow: .github/workflows/contracts.yml
- Run: https://github.com/rockfridrich/villa/actions/runs/20826237331
- Action: Check `gh run view 20826237331 --log-failed`

### CI Failure - 2026-01-09 01:26
- Workflow: .github/workflows/contracts.yml
- Run: https://github.com/rockfridrich/villa/actions/runs/20827389446
- Action: Check `gh run view 20827389446 --log-failed`

### CI Failure - 2026-01-09 01:46
- Workflow: Deploy
- Run: https://github.com/rockfridrich/villa/actions/runs/20827594740
- Action: Check `gh run view 20827594740 --log-failed`

### CI Failure - 2026-01-09 02:36
- Workflow: Deploy
- Run: https://github.com/rockfridrich/villa/actions/runs/20828940690
- Action: Check `gh run view 20828940690 --log-failed`

---

### 61. keystoreHost Only Works in Relay Mode (2026-01-09)

**Token Impact:** Prevents 3+ hours of wasted implementation

**The Issue:**
Porto SDK's `keystoreHost` option (for custom passkey domain) only works in **relay mode**, not **dialog mode**.

**What Happened:**
- Implemented `getPortoIframe()` with `keystoreHost: 'key.villa.cash'`
- TypeScript error: "keystoreHost does not exist in type 'Parameters'"
- Had to remove keystoreHost - passkeys remain on Porto's domain

**The Trade-off:**
| Mode | 1Password Works | Custom Domain | Use Case |
|------|-----------------|---------------|----------|
| Dialog | Yes | No (porto.sh) | Production - ecosystem support |
| Relay | No | Yes (keystoreHost) | Future - custom branding |

**Before Porto Auth Changes:**
1. Check Porto SDK types for supported options per mode
2. Understand trade-offs: dialog = ecosystem, relay = customization
3. Test with 1Password BEFORE committing
4. E2E tests don't catch ecosystem integration issues

**Path to Custom Domain + 1Password:**
- Self-host Porto dialog on key.villa.cash
- OR fork Porto contracts and implement own WebAuthn

---

### 62. Cost Analysis Protocol (2026-01-09)

**Weekly Cost Target:** <$350/week (<$50/day)
**Jan 1-8 Actual:** $970.63 ($138.66/day) - 3x over target

**Model Distribution (Problem):**
- Opus: $882.06 (91%) - Should be <30%
- Sonnet: $66.38 (7%)
- Haiku: $21.43 (2%)

**Root Cause:** Opus implementing instead of orchestrating.

**Cost Reduction Protocol:**
1. Opus: Orchestration + architecture only
2. @build (sonnet): All implementation
3. @explore, @test, @ops (haiku): Search, test, deploy

**Enforcement:** Check @ agent mentions in session. Target: 80%+ delegation.

### CI Failure - 2026-01-09 04:05
- Workflow: CI Pipeline
- Run: https://github.com/rockfridrich/villa/actions/runs/20830375530
- Action: Check `gh run view 20830375530 --log-failed`

### CI Failure - 2026-01-09 13:08
- Workflow: .github/workflows/contracts.yml
- Run: https://github.com/rockfridrich/villa/actions/runs/20842964233
- Action: Check `gh run view 20842964233 --log-failed`

### 63. Docker Environment Pre-Check (2026-01-09)

**Token Impact:** Prevents 30-60 min of iterative debugging

**The Pattern:** Before writing ANY Dockerfile or docker-compose.yml, check user's Docker environment.

```bash
# MANDATORY pre-flight checks:
docker version                          # Engine version
docker-compose version                  # Standalone or V2 plugin?
docker buildx version 2>/dev/null       # BuildKit support?
docker info | grep "Total Memory"       # Available memory

# Based on results, adapt Dockerfile:
# - Standalone compose → No BuildKit features
# - Limited memory → Optimize build stages
# - Old Docker version → Avoid new syntax
```

**Anti-Patterns:**
```
❌ Assume modern Docker Compose V2
❌ Use BuildKit cache mounts without checking support
❌ Guess memory limits without testing
❌ Use "docker compose" syntax (fails on standalone)
```

**Correct Approach:**
```
✅ Check environment first
✅ Use compatible syntax (COPY not --mount=type=cache)
✅ Research memory requirements for monorepo builds
✅ Test end-to-end flow before declaring "done"
```

**Incident (2026-01-09):**
- Used `--mount=type=cache` → failed on standalone docker-compose
- Set 4GB memory → OOM kills during Next.js compile
- Used `turbo run dev` → exits after initial compile
- **Wasted:** 90 minutes, 3 commits, high user frustration

**Solution Applied:**
1. Removed BuildKit dependencies
2. Increased memory to 6GB for monorepo
3. Ran `pnpm dev` directly instead of turbo wrapper
4. Created `.claude/knowledge/docker-local-dev.md` for future sessions

**Validation Checklist:**
```bash
# Before pushing Docker changes:
[ ] Checked docker-compose version (standalone vs V2)
[ ] Researched memory requirements for stack
[ ] Tested full startup → hot reload → auth flow
[ ] Documented user's environment in knowledge base
[ ] NOT just: "docker-compose up worked once"
```

**Key Learning:** User-specific environment details belong in `.claude/knowledge/`, not assumed.

---

### 64. Turbo Behavior in Docker Containers (2026-01-09)

**Token Impact:** 20 min debugging + 1 commit

**The Issue:** `turbo run dev` exits after initial compilation in Docker, doesn't watch for changes.

**Root Cause:**
- Turbo optimized for CI/CD: compile once, exit
- In local container: needs persistent watch mode
- `pnpm dev` (which runs `next dev`) stays running

**Solution:**
```dockerfile
# ❌ Wrong: Turbo exits after compile
CMD ["pnpm", "turbo", "run", "dev"]

# ✅ Correct: Run Next.js directly
WORKDIR /app/apps/web
CMD ["pnpm", "dev"]
```

**When to use Turbo:**
- CI/CD: `turbo run build` (one-shot compilation)
- Local: Direct package commands for watch mode

**Applied to:** `Dockerfile.dev` line 35


### CI Failure - 2026-01-09 14:47
- Workflow: CI Pipeline
- Run: https://github.com/rockfridrich/villa/actions/runs/20844136668
- Action: Check `gh run view 20844136668 --log-failed`

### CI Failure - 2026-01-09 15:59
- Workflow: Deploy
- Run: https://github.com/rockfridrich/villa/actions/runs/20845710806
- Action: Check `gh run view 20845710806 --log-failed`
