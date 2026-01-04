# Development Learnings

Patterns discovered during development. Session notes archived in `sessions/`.

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

### 6. btoa() Unicode Encoding

```typescript
// ❌ Bad: btoa() fails on Unicode (emojis, non-ASCII)
const encoded = btoa(unicodeString) // DOMException

// ✅ Good: UTF-8 encode first
const encoded = btoa(unescape(encodeURIComponent(unicodeString)))

// ✅ Better: Use Buffer in Node.js
const encoded = Buffer.from(unicodeString, 'utf-8').toString('base64')
```

**Why:** `btoa()` only handles Latin1 (0-255). Multi-byte UTF-8 characters (emoji, accented chars) throw exceptions. Always UTF-8 encode before base64.

### 7. Knowledge Base Pattern

```
.claude/knowledge/{domain}.md  → Domain-specific learnings
.claude/LEARNINGS.md           → Cross-cutting patterns
docs/reflections/{date}-{topic}.md → Session reflections
```

**When to use:**
- CloudFlare, DigitalOcean, Porto SDK → `knowledge/{domain}.md`
- React patterns, TypeScript patterns → `LEARNINGS.md`
- Multi-session insights → `docs/reflections/`

### 8. Orchestrator Delegation Pattern

```
❌ Bad: Main agent does everything
- Read 50 files
- Implement all changes
- Run tests
- Write reflection

✅ Good: Orchestrator delegates
Main agent:
  ├── @build "Implement avatar system" (sonnet)
  ├── @test "Run E2E tests" (haiku, parallel)
  ├── @review "Review PR" (sonnet, parallel)
  └── Synthesize results
```

**When main agent should delegate:**
- Implementation → @build (sonnet)
- Tests → @test (haiku)
- Code review → @review (sonnet)
- Git operations → @ops (haiku)
- CI/CD monitoring → @ops (haiku, background)
- Codebase investigation → @explore (haiku)

**When main agent works directly:**
- Orchestration decisions
- Synthesizing results from agents
- Quick clarifications with human
- Reading specs/docs to plan

### 9. CI/CD Monitoring Anti-Pattern (CRITICAL)

```
❌ TERRIBLE: Manual polling
sleep 60 && gh run view ...  # Repeat 6x = burns 6 tool calls + 6 min

✅ CORRECT: Background agent
@ops "Monitor deploy (run ID: X), report when staging live"
     --run_in_background
# Continue working, check TaskOutput when needed
```

**Session 2026-01-04 wasted ~5x tokens doing manual CI polling.**

### 10. Test Execution Delegation

```
❌ Bad: Manual test run + parse output
npx playwright test ... 2>&1  # 30 failing tests = wall of text

✅ Good: Delegate to @test
@test "Run avatar E2E against beta.villa.cash, summarize failures"
# Gets analyzed summary, not raw output
```

### 11. Debug Parallelism Pattern

When tests fail with unclear cause:
```
✅ Launch in parallel:
1. @explore "Why does selector X find 6 elements?" (background)
2. @test "Run single test with verbose output" (background)
3. Continue analyzing locally
# Merge insights from all three
```

---

## Platform Quirks

### DigitalOcean App Platform

| Issue | Fix |
|-------|-----|
| `doctl --format Name` returns `<nil>` | Use `--format Spec.Name` |
| `doctl --format *.Phase` returns `<nil>` | Use `--output json` + jq |
| Buildpacks prune devDeps before build | Use Dockerfile for Next.js |
| PR comments fail | Add `permissions: pull-requests: write` |

**doctl JSON pattern (reliable):**
```bash
# ❌ Unreliable for nested fields
STATUS=$(doctl apps get $ID --format ActiveDeployment.Phase)

# ✅ Always works (note: doctl apps get returns an array, use .[0])
APP_JSON=$(doctl apps get $ID --output json)
STATUS=$(echo "$APP_JSON" | jq -r '.[0].active_deployment.phase // empty')
```

### CI/CD Workflow

| Pattern | Benefit |
|---------|---------|
| Draft PRs skip E2E | Fast iteration (~30s vs ~3min) |
| `[wip]` in PR title | Skip E2E explicitly |
| GIFs in bot comments | Delightful contributor experience |
| Clickable preview URLs | Easy manual testing |
| E2E sharding (2 shards) | 50% faster E2E tests |
| Playwright browser cache | 90% faster browser setup |
| Next.js build cache | Faster incremental builds |

### Porto SDK

| Issue | Fix |
|-------|-----|
| Iframe mode needs domain registration | Contact @porto_devs on Telegram |
| ngrok always uses popup mode | Expected (not in trusted hosts) |
| Session TTL ~24h | Server-controlled, not configurable |

---

## Shell Script Security Patterns

### 1. Input Validation Functions

```bash
# Always validate before using in commands
validate_feature_name() {
  local name="$1"
  # Only allow safe characters
  if [[ ! "$name" =~ ^[a-zA-Z0-9_.-]+$ ]]; then
    echo "Error: Invalid characters" >&2
    return 1
  fi
  return 0
}

# Call validation early
validate_feature_name "$input" || exit 1
```

**Standard validators:**
| Function | Pattern | Use For |
|----------|---------|---------|
| `validate_port` | `^[0-9]+$` + 1-65535 | PORT env vars |
| `validate_domain` | RFC domain chars | NGROK_DOMAIN, URLs |
| `validate_url` | `^https?://...` | API responses |
| `validate_path` | No `; \| & $ \`` or `..` | File paths |
| `validate_app_id` | UUID format | doctl IDs |

### 2. Safe Process Management

```bash
# ❌ Bad: kills ALL matching processes (dangerous!)
pkill -f "next dev"

# ✅ Good: track specific PIDs, verify before kill
safe_kill_pid() {
  local pid="$1"
  local expected="$2"

  if [[ ! "$pid" =~ ^[0-9]+$ ]]; then return 0; fi

  # Verify process matches expected pattern
  local cmd=$(ps -p "$pid" -o command= 2>/dev/null)
  if [[ "$cmd" == *"$expected"* ]]; then
    kill "$pid" 2>/dev/null || true
  fi
}

# Save PIDs to project-specific file
echo "$DEV_PID" > "$PROJECT_ROOT/.session.pid"
```

### 3. Safe JSON Parsing

```bash
# ❌ Bad: Python injection risk
echo "$API_RESPONSE" | python3 -c "import json,sys; ..."

# ✅ Good: jq is safer and faster
TUNNEL_URL=$(echo "$API_RESPONSE" | jq -r '.tunnels[0].public_url // empty')
```

### 4. Output Sanitization

```bash
# Sanitize before display (remove control chars)
sanitize_output() {
  printf '%s' "$1" | tr -d '\000-\010\013-\037\177' | head -c 500
}

# Redact secrets in log output
sanitize_log_line() {
  printf '%s' "$1" | sed -E 's/(token|key|secret|password|auth)[=:][^ ]+/\1=[REDACTED]/gi'
}
```

### 5. Strict Mode

```bash
#!/bin/bash
set -euo pipefail  # Always use for scripts

# -e: exit on error
# -u: error on undefined vars
# -o pipefail: catch pipe failures
```

### 6. Path Handling

```bash
# ❌ Bad: hardcoded absolute path
CONFIG="/Users/me/project/.config"

# ✅ Good: dynamic path detection
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CONFIG="$PROJECT_ROOT/.config"
```

### 7. Command Execution

```bash
# ❌ Bad: string interpolation (injection risk)
NGROK_CMD="ngrok http $PORT --domain=$DOMAIN"
$NGROK_CMD

# ✅ Good: array expansion (safe)
NGROK_ARGS=("http" "$PORT" "--domain=$DOMAIN")
ngrok "${NGROK_ARGS[@]}"
```

### 8. Credential Protection

```bash
# ❌ Bad: shows authtoken
cat "$CONFIG" | grep -E "authtoken"

# ✅ Good: only check existence, never display
if grep -q "authtoken" "$CONFIG" 2>/dev/null; then
  echo "Auth token configured"
fi
```

---

## Anti-Patterns

- ❌ Sequential when parallel possible
- ❌ Hardcoded URLs in tests
- ❌ console.error with user data
- ❌ setTimeout without cleanup ref
- ❌ Multiple builds without @architect
- ❌ Implementing before spec is clear
- ❌ `git add .` without reviewing changes
- ❌ Batching unrelated changes in one commit
- ❌ `pkill -f` without PID tracking
- ❌ Python for JSON parsing in shell scripts
- ❌ Displaying log contents without sanitization
- ❌ Using `/tmp/` for project-specific files
- ❌ Manual `sleep && gh run view` polling (use @ops background)
- ❌ Running tests manually when @test exists
- ❌ Sequential debugging instead of parallel @explore + @test

---

## Agent Orchestration

**Claude Code as conductor:** Main Claude directs specialized agents, each doing ONE thing well.

```
Human request → Claude Code (orchestrator)
    ├── @spec → defines what
    ├── @build → writes code
    ├── @ops → commits + PR + deploy verify
    ├── @test + @review (parallel)
    └── Report to human
```

**Key separation:**
- @build writes code, never commits
- @ops commits atomically, never writes app code
- Each agent has clear responsibility boundary

---

## Velocity Metrics

| Metric | Target | Phase 1 | Phase 2 Goal |
|--------|--------|---------|--------------|
| Pivots per feature | 0-1 | 2 | 0 |
| CI failures | 0 | 4 | 0 |
| Avg CI time | <5m | 3.1m | <3m |
| Tests | >100 | 145 | 200+ |
| Context lines loaded | <500 | ~2300 | ~650 |

### Phase 1 Root Causes (Resolved)

| Issue | Time Lost | Resolution |
|-------|-----------|------------|
| Missing "Why This Approach" in spec | ~40min | Added to spec template |
| Platform quirks undocumented | ~30min | Added to LEARNINGS + spec template |
| Context duplication | ~20min/session | Consolidated (92% reduction) |
| Sequential execution | ~15min/feature | PARALLEL BY DEFAULT in CLAUDE.md |

**Projected Phase 2 improvement: 47% faster implementation**

---

## Session Archive

Historical session notes in `.claude/archive/` and `.claude/reflections/`:
- `archive/REFLECTION-PHASE1.md` - Phase 1 retrospective
- `archive/REFLECTION-SESSION-2026-01-04.md` - CI/CD optimization session
- `reflections/2026-01-04-avatar-session.md` - Agent delegation failure analysis

Full session logs preserved in git history for reference.

---

*Auto-update: Extract patterns here, archive sessions after 2 weeks*
