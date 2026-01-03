# Development Learnings

Accumulated knowledge from development sessions. Used to improve specs, agents, and workflows.

---

## Session: 2026-01-03 — Porto SDK Integration

### What Happened

1. **Initial spec** said "use Porto SDK" but didn't explain why
2. **First implementation** used Porto via Wagmi → showed web3 wallet dialog
3. **User feedback**: wanted simple passkey, not web3 wallet
4. **Pivot #1**: Switched to native WebAuthn (deleted Porto)
5. **User feedback**: wanted real wallet addresses, Porto recovery
6. **Pivot #2**: Back to Porto SDK with correct understanding
7. **Final implementation**: Porto SDK with Villa theming, separate create/sign-in flows

### Time Cost

| Phase | Time |
|-------|------|
| Initial Porto implementation | 15 min |
| Native WebAuthn detour | 20 min |
| Porto re-implementation | 15 min |
| Theming + UX improvements | 20 min |
| **Total** | **70 min** |
| **Optimal (no pivots)** | **~35 min** |

### Root Causes of Pivots

1. **Spec didn't explain "Why Porto"** — alternatives not considered
2. **UI boundaries unclear** — what Porto controls vs Villa
3. **Assumed user intent** — implemented before clarifying

### Learnings Applied

#### 1. Specs Must Include "Why This Approach"

**Before:**
```markdown
## Technical Approach
Use Porto SDK for passkey authentication.
```

**After:**
```markdown
## Why Porto SDK (Not Native WebAuthn)

1. **Real wallet addresses** — Porto creates actual Ethereum accounts
2. **Passkey management** — Porto handles storage, sync, recovery
3. **Single canonical ID** — Wallet address is user ID across services
4. **Recovery built-in** — Social, email, OAuth recovery paths
```

#### 2. Specs Must Define UI Boundaries

Added to spec:
```markdown
### UI Boundaries

**Villa controls:**
- Welcome screen, profile setup, home screen
- Error messages and retry flows

**Porto controls (security-critical):**
- Passkey creation/authentication prompts
- Transaction signing UI
- Key management
```

#### 3. Ask Before Pivoting

When user says "I want X instead of Y":
- Ask: "You want X because...?"
- Update spec first
- Get approval
- Then implement

#### 4. Minimal Implementation First

Instead of building full flow:
1. Implement core connection only
2. Test: Does it meet expectations?
3. Then add UI, error handling, etc.

### Porto SDK Discoveries

**Theming:**
- `ThemeFragment` with 60+ color tokens
- Supports `light`, `dark`, `light dark` schemes
- `Dialog.createThemeController()` for runtime updates

**Flows:**
- `wallet_connect` — Porto decides create vs sign-in
- `eth_requestAccounts` — Prompts passkey selection
- No explicit "create account" RPC, but Porto shows create UI for new users

**Dialog modes:**
- `Dialog.popup()` — Separate window
- `Dialog.iframe()` — Embedded iframe
- `Dialog.experimental_inline()` — Inline in page element

**Security boundaries:**
- Passkey operations must go through Porto
- Can customize colors/labels, not security-critical UI
- Never intercept private key operations

---

## Patterns to Apply

### For Future Specs

```markdown
## Why [Approach]

Explain why this approach over alternatives:
- Alternative A: [why not]
- Alternative B: [why not]
- Chosen approach: [why yes]

## UI Boundaries

What we control:
- [list]

What external system controls:
- [list]

## Out of Scope

Explicitly list what this spec does NOT cover.
```

### For Implementation

1. Read spec completely before writing code
2. If spec is unclear, ask questions or update spec first
3. Implement minimal version, validate, then expand
4. When pivoting, update spec before changing code

### For Agents

- **spec agent**: Must include "Why" and "UI Boundaries" sections
- **build agent**: Must check spec clarity before implementing
- **review agent**: Must verify implementation matches spec intent, not just letter

---

## Metrics to Track

| Metric | Target | This Session |
|--------|--------|--------------|
| Pivots per feature | 0-1 | 2 |
| Time to first working version | <30 min | 50 min |
| Spec clarity score (1-5) | 5 | 3 (missing Why) |
| Rework percentage | <20% | 40% |

---

## Open Questions

1. Should we use `Dialog.experimental_inline()` for more integrated UX?
2. How to handle Porto being unavailable (network issues)?
3. Should we capture email during account creation for recovery?

---

---

## Session: 2026-01-03 — Docker Setup & Security Hardening

### What Happened

1. **Docker testing blocked** — Colima VM download (~500MB) repeatedly failed due to network
2. **Pivoted to productive work** — Used blocked time for Caddy security review
3. **Applied security headers** — Enhanced Caddyfile with HSTS, CSP, etc.
4. **Generated debugging guide** — Created comprehensive Docker/Colima guide in-chat
5. **Token inefficiency identified** — Background task output consumed 500KB+ of context

### Time & Token Cost

| Task | Time | Token Impact |
|------|------|--------------|
| Colima download attempts | 30+ min | **High** (verbose progress output) |
| Caddy security research | 10 min | Medium (web fetches) |
| Security headers | 5 min | Low |
| Docker guide generation | 15 min | **High** (regenerated in-chat) |

### Root Causes of Inefficiency

1. **No quiet mode for Colima** — Progress output flooded context
2. **Guides generated per-session** — Same content repeated across sessions
3. **No pre-flight checks** — Discovered Docker issues mid-task
4. **Context switching** — Jumped between Docker/Security/Docs

### Learnings Applied

#### 1. Use Quiet Commands for Background Tasks

**Before:**
```bash
colima start  # Outputs 500KB of progress
```

**After:**
```bash
colima start 2>&1 | tail -5  # Only final status
# Or check status separately
colima status
```

#### 2. Persist Guides in Repo, Not Chat

**Before:** Generate Docker debugging guide in conversation (high token cost, lost after session)

**After:** Create `.claude/workflows/docker-debug.md` once, reference thereafter

#### 3. Pre-flight Checks Before Docker Work

```bash
# Add to scripts/preflight.sh
colima status > /dev/null 2>&1 || { echo "Start Colima first: colima start"; exit 1; }
docker info > /dev/null 2>&1 || { echo "Docker not connected"; exit 1; }
```

#### 4. Batch Related Tasks

**Before:** Docker → Security → Docker → Commit (context switches)

**After:**
- All Docker tasks together
- All security tasks together
- Single commit per logical change

### Security Discoveries

**Caddy Artifact Signing:**
- Uses Sigstore (since v2.6.0)
- Verify with: `cosign verify-blob`
- Check transparency log with: `rekor-cli`

**Security Headers Added:**
- HSTS with preload
- X-Content-Type-Options
- X-Frame-Options DENY
- Permissions-Policy (disable unused APIs)
- Remove Server header

### Workflow Optimizations

| Optimization | Benefit |
|--------------|---------|
| `.claude/workflows/` directory | Persistent guides, lower token cost |
| `scripts/preflight.sh` | Catch issues before work starts |
| Quiet background commands | Reduce context pollution |
| Batch similar tasks | Fewer context switches |

---

## Patterns to Apply

### For Docker/Infra Work

1. Run pre-flight checks first
2. Use quiet/minimal output modes
3. Document solutions in repo, not chat
4. Test incrementally, not all-at-once

### For Token Efficiency

1. Reference existing docs instead of regenerating
2. Use `tail -n` for long outputs
3. Kill background tasks that produce verbose output
4. Prefer haiku for research, opus for implementation

---

---

## Session: 2026-01-03 — Session Behavior & UX Patterns

### What Happened

1. **Sign-out didn't force re-auth** — Porto caches session, passkey auto-selects
2. **User expected passkey prompt** — but got seamless re-authentication
3. **Researched Porto TTLs** — not documented, server-side controlled
4. **Reframed as feature** — "Switch Account" with helper text explaining persistence

### Key Insight

Passkey sessions behave like biometric unlock on mobile apps—the device "remembers" you. This is good UX, but needs clear communication.

### Learnings Applied

#### 1. Specs Must Document Session Behavior

Added to spec template:
- Session Persistence table (what, TTL, who controls)
- Copy Standards table (button text + helper text)
- "What We Cannot Control" section

#### 2. Copy Should Match Mental Model

| Wrong | Right | Why |
|-------|-------|-----|
| "Sign Out" | "Switch Account" | Passkey stays active |
| (no helper) | "Your passkey stays active for quick sign-in" | Set expectations |

#### 3. When External System Controls Behavior, Document Limits

Porto controls:
- Session TTL (~24h+, not configurable)
- Passkey credential lifetime (device OS)
- Dialog labels (not yet in SDK types)

### Files Updated

- `specs/v1-passkey-login.md` — Added Session Behavior section
- `.claude/agents/spec.md` — Added Section 8: Session & UX Patterns
- `src/lib/porto.ts` — Documented session behavior in code
- `src/app/home/page.tsx` — "Sign Out" → "Switch Account" + helper text

---

## Session: 2026-01-03 — Successful Agent Workflow (Reference)

### What Went Well

This session demonstrated the ideal agent workflow with minimal pivots:

```
1. User clarified UX intent → "Villa ID", Sign In primary
2. @spec updated with Language Guidelines, Copy Standards
3. @build implemented changes (4 tasks in one pass)
4. @review approved with 1 non-blocking item
5. Cleanup applied immediately
6. All 14 tests pass
```

**Time: ~15 min from spec to shipped code**

### Workflow That Worked

| Step | Action | Result |
|------|--------|--------|
| 1. Clarify intent first | User said "Sign In primary, Villa ID branding" | Clear direction |
| 2. Update spec before code | Added Language Guidelines table | Build agent had exact copy |
| 3. Build agent does implementation | Single pass, 4 tasks | No back-and-forth |
| 4. Review agent catches cleanup | Unused prop flagged | Immediate fix |
| 5. Commit after each phase | spec → build → cleanup | Clear git history |

### Patterns to Repeat

1. **Language Guidelines table in spec** — Maps internal terms to user-facing copy
2. **Copy Standards table** — Exact button text + helper text
3. **Sign In always primary** — Don't over-engineer detection logic
4. **Review agent catches dead code** — Use it after every build

### Spec Template Addition

```markdown
### Language Guidelines

| Internal/Tech | User-Facing |
|---------------|-------------|
| [Technical term] | [User term] |
```

This prevents "Porto" leaking into UI, or other internal jargon.

---

## Remaining Work: Deployment

### Blocked
- Docker testing (Colima download issues)
- DigitalOcean App Platform setup

### Next Session Priorities
1. Get Colima/Docker working
2. Set up DigitalOcean App Platform
3. Configure GitHub → DO deployment hooks
4. Feature branch → preview deployments
5. Main branch → production deployment

### DigitalOcean Setup Needed
- App Platform app creation
- GitHub integration
- Environment variables (none for v1, but structure needed)
- Domain configuration (proofofretreat.me?)
- Auto-deploy on push

---

---

## Session: 2026-01-04 — Parallel Agents, Code Review & Security Fixes

### What Happened

1. **Launched 4 parallel agents** — review, unit tests, security tests, integration tests
2. **Code review found 4 critical issues** — memory leaks, PII logging, race condition, sanitization bugs
3. **Built comprehensive test suite** — 140+ tests (76 unit, 64 E2E)
4. **Fixed all critical issues** — 3 commits addressing review findings
5. **Improved validation security** — Enhanced sanitization (quotes, null bytes, backslashes)

### Time & Efficiency

| Task | Approach | Time |
|------|----------|------|
| Code review | review agent (sonnet) | ~3 min |
| Unit tests (76) | build agent (sonnet) | ~5 min |
| Integration tests (26) | build agent (sonnet) | ~5 min |
| Security tests (24) | build agent (sonnet) | ~5 min |
| **All parallel** | 4 agents simultaneously | **~5 min total** |
| Fix memory leaks | Manual | 5 min |
| Fix PII logging | Manual | 5 min |
| Fix race condition | Manual | 5 min |

**Key insight**: Parallel agents reduced what would be ~20 min sequential to ~5 min.

### Critical Issues Found & Fixed

#### 1. Memory Leaks (setTimeout not tracked)

**Problem:**
```typescript
setTimeout(() => setStep('profile'), 1500)  // Not cleaned up on unmount
```

**Fix:**
```typescript
const timeoutRef = useRef<NodeJS.Timeout | null>(null)

useEffect(() => {
  return () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }
}, [])

timeoutRef.current = setTimeout(() => setStep('profile'), 1500)
```

#### 2. PII Logging via console.error

**Problem:**
```typescript
console.error('Invalid identity:', result.error)  // Logs user data
```

**Fix:**
```typescript
// Return boolean instead of logging
setIdentity: (identity) => {
  const result = identitySchema.safeParse(identity)
  if (result.success) {
    set({ identity: result.data })
    return true
  }
  return false  // No logging, caller handles error
}
```

#### 3. Porto SDK Race Condition

**Problem:**
```typescript
resetPorto()  // Sync: destroys instance
const result = await createAccount(container)  // Async: creates new
// Race: if Porto has async init, this could fail
```

**Fix:**
```typescript
// Let createAccount handle it atomically
const result = await createAccount({ container, forceRecreate: true })
// getPorto() handles recreation internally - no race
```

#### 4. Improved Input Sanitization

**Before:** Only removed `<>` and escaped `&`

**After:**
```typescript
function sanitize(str: string): string {
  return str
    .replace(/[<>]/g, '')       // HTML tags
    .replace(/["'`]/g, '')      // Quotes (XSS, SQL injection)
    .replace(/\x00/g, '')       // Null bytes
    .replace(/\\/g, '')         // Backslashes (path traversal)
    .replace(/&/g, '&amp;')     // Ampersands
    .trim()
    .slice(0, 50)
}
```

### Learnings Applied

#### 1. Parallel Agents for Independent Tasks

**Pattern:**
```
After build completes:
  ├── @test agent (background)
  ├── @review agent (parallel)
  └── Continue chatting while they work
```

**When to parallelize:**
- Review + Tests (always independent)
- Multiple file searches
- Unit + Integration + Security tests

#### 2. Return Types > Console Logging

**Before:** Log errors, return void
```typescript
setIdentity: (identity) => void  // console.error on failure
```

**After:** Return success boolean, caller decides
```typescript
setIdentity: (identity) => boolean  // false on failure, no logging
```

Benefits:
- No PII in logs
- Caller can handle errors appropriately
- Testable without mocking console

#### 3. Atomic Instance Management

**Pattern for SDK singletons:**
```typescript
// Bad: Separate reset + create
resetInstance()
const result = await useInstance()

// Good: Atomic with options
const result = await useInstance({ forceRecreate: true })
```

#### 4. Timeout Cleanup Pattern

**Always track timeouts in React:**
```typescript
const timeoutRef = useRef<NodeJS.Timeout | null>(null)

// Cleanup on unmount
useEffect(() => () => {
  if (timeoutRef.current) clearTimeout(timeoutRef.current)
}, [])

// Clear before setting new
if (timeoutRef.current) clearTimeout(timeoutRef.current)
timeoutRef.current = setTimeout(callback, delay)
```

### Test Suite Created

| Type | Count | Coverage |
|------|-------|----------|
| Unit (validation) | 33 | XSS, sanitization, schema |
| Unit (store) | 22 | CRUD, persistence, errors |
| Unit (porto) | 21 | Helpers, error handling |
| Integration | 26 | Flows, mobile, persistence |
| Security | 24 | XSS vectors, CSP, session |
| E2E (existing) | 14 | Onboarding, home |
| **Total** | **140** | |

### Workflow Improvements

| Before | After | Benefit |
|--------|-------|---------|
| Sequential agent calls | Parallel agents | 4x faster |
| console.error for validation | Return boolean | No PII leaks |
| Manual resetPorto() calls | forceRecreate option | No race conditions |
| No timeout cleanup | useRef + useEffect | No memory leaks |
| Limited test coverage | 140+ tests | Catch regressions |

### Files Changed

**Security fixes:**
- `src/app/onboarding/page.tsx` — Memory leak fix + race condition fix
- `src/app/home/page.tsx` — Memory leak fix + clipboard error handling
- `src/lib/store.ts` — PII logging removed, return types added
- `src/lib/porto.ts` — AuthOptions, forceRecreate, atomic management
- `src/lib/validation.ts` — Enhanced sanitization

**Test infrastructure:**
- `tests/unit/*.test.ts` — 76 unit tests
- `tests/e2e/integration.spec.ts` — 26 integration tests
- `tests/security/comprehensive.spec.ts` — 24 security tests
- `vitest.config.*.ts` — Test configurations
- `tests/setup.ts` — Global test setup
- `playwright.config.ts` — Exclude unit tests from E2E

---

## Patterns to Apply

### For Code Review

Always run @review after significant changes. It catches:
- Memory leaks (setTimeout, addEventListener, subscriptions)
- PII logging (console.error with user data)
- Race conditions (async/sync mixing)
- Security gaps (sanitization, validation)

### For Error Handling

```typescript
// Don't: Log and return void
function doThing(): void {
  if (error) console.error('Error:', sensitiveData)
}

// Do: Return result, let caller handle
function doThing(): boolean | Result<T> {
  if (error) return false  // or { success: false, error }
}
```

### For React Cleanup

```typescript
// Timeouts
const ref = useRef<NodeJS.Timeout>()
useEffect(() => () => ref.current && clearTimeout(ref.current), [])

// Subscriptions
useEffect(() => {
  const sub = subscribe()
  return () => sub.unsubscribe()
}, [])

// Event listeners
useEffect(() => {
  window.addEventListener('resize', handler)
  return () => window.removeEventListener('resize', handler)
}, [])
```

### For SDK Integration

```typescript
// Provide atomic operations with options
export async function connectSDK(options: {
  container?: HTMLElement
  forceRecreate?: boolean  // Default true for clean state
}) {
  const instance = getInstance({ ...options })  // Handles recreation internally
  return instance.connect()
}
```

---

## Session: 2026-01-04 — Live QA Workflow Optimization

### What Happened

1. **Set up ngrok for mobile testing** — Enables passkey testing on real iOS/Android devices
2. **Created Claude Code-style terminal output** — Compact, scannable, functional
3. **Added local IP detection** — Faster testing when on same network
4. **Built QA session scripts** — Start/end rituals for structured testing
5. **Documented feedback loop** — Optimized for Claude + human tester workflow

### Problem Solved

**Before:** No way to test passkeys on mobile devices without deploying

**After:**
```bash
npm run qa  # Shows local IP + ngrok URL, testing checklist, Claude workflow
```

### Key Patterns

#### 1. Local IP Preferred, ngrok for Passkeys

| Use Case | Connection | Why |
|----------|------------|-----|
| UI/layout testing | `http://192.168.x.x:3000` | Faster (no tunnel) |
| Passkey testing | `https://xxxx.ngrok.app` | HTTPS required |
| Remote tester | ngrok URL | Works anywhere |

#### 2. Structured Feedback Format

**Tester reports:**
```
On [device], [action] shows [problem]
```

**Examples:**
- "On iPhone Safari, Create Villa ID spinner never stops"
- "On Android Chrome, profile name truncated"

**Claude responds:**
1. Read relevant file
2. Apply fix
3. Hot reload auto-refreshes device
4. Tester verifies

#### 3. Session Rituals

**Start (`npm run qa`):**
- Git status check
- TypeScript check
- Share URLs displayed
- Testing checklist shown

**End (`npm run qa:end`):**
- Changed files summary
- Lint/typecheck status
- Commit instructions

#### 4. Terminal Output Style (Claude Code)

**Principles:**
- Minimal color (functional, not decorative)
- Compact sections with dim separators
- Status indicators: `■` (in progress), `●` (ready), `✓` (done)
- URLs highlighted, instructions dimmed

**Example:**
```
Villa Local Share
─────────────────────────────────────────
■ Starting dev server...
■ Starting ngrok tunnel...
● Dev server ready

─────────────────────────────────────────
CONNECTIONS
─────────────────────────────────────────

Same Network (faster):
  http://192.168.1.100:3000

Any Network (ngrok):
  https://e76773c013fc.ngrok.app
```

### Hot Debugging Workflow

```
┌─────────────────────────────────────────────────────────────┐
│  HUMAN                         CLAUDE                        │
│  ──────                        ──────                        │
│  1. Runs npm run qa            Displays connection info      │
│  2. Opens URL on device        [Waits for feedback]          │
│  3. Tests feature              [Waits for feedback]          │
│  4. Reports: "X broken"        Reads code, applies fix       │
│  5. Pulls down to refresh      [File saved → hot reload]     │
│  6. Verifies fix               [Waits for next issue]        │
│  7. "looks good"               "commit the QA fixes"         │
└─────────────────────────────────────────────────────────────┘
```

### Files Created

| File | Purpose |
|------|---------|
| `scripts/ngrok-share.sh` | Start dev + ngrok, show connection info |
| `scripts/qa-start.sh` | Full session start (checks + share) |
| `scripts/qa-end.sh` | Session end (summary + commit prompt) |

### npm Scripts Added

| Command | Description |
|---------|-------------|
| `npm run dev:share` | Just ngrok sharing |
| `npm run qa` | Full QA session (typecheck → share) |
| `npm run qa:end` | End session, show changes |

### Learnings Applied

1. **Local network is faster** — Prefer `http://192.168.x.x:3000` for UI testing
2. **ngrok required for passkeys** — WebAuthn needs HTTPS
3. **Structured feedback reduces iteration time** — "On [device], [action] shows [problem]"
4. **Session rituals catch issues early** — Typecheck before sharing
5. **Claude Code terminal style** — Compact, functional, professional

---

## Patterns to Apply

### For Live QA Sessions

```bash
# Start
npm run qa

# Report issues as:
"On [device], [action] shows [problem]"

# End
npm run qa:end
# or tell Claude: "commit the QA fixes"
```

### For Terminal Scripts

```bash
# Colors (Claude Code style)
G='\033[0;32m'  # Green - success
Y='\033[0;33m'  # Yellow - in progress
R='\033[0;31m'  # Red - error
D='\033[0;90m'  # Dim - secondary
W='\033[1;37m'  # White bold - headers
N='\033[0m'     # Reset

# Status indicators
echo -e "${Y}■${N} In progress..."
echo -e "${G}●${N} Ready"
echo -e "${G}✓${N} Done"
```

### For Connection Options

```markdown
| Network | URL | Passkeys |
|---------|-----|----------|
| Same WiFi | http://LOCAL_IP:3000 | ❌ |
| ngrok | https://xxxx.ngrok.app | ✅ |
| Local HTTPS | https://localhost:3000 | ✅ |
```

---

*Last updated: 2026-01-04*
