# Villa

Privacy-first passkey authentication. Porto SDK wrapper with Villa theming.

**Repo:** https://github.com/rockfridrich/villa

---

## Quick Reference

```bash
npm run dev          # Local dev
npm run dev:https    # Passkey testing
npm run qa           # Mobile QA (ngrok)
npm run verify       # Full check
```

| Agent | Model | Use For |
|-------|-------|---------|
| @spec | opus | Architecture |
| @build | sonnet | Implementation |
| @ops | haiku | Git/GitHub/Deploy |
| @test | haiku | Run tests |
| @review | sonnet | Code review |

**See also:** [rules.md](rules.md) for code quality standards

---

## Fast Development Workflow

### PR Speed Tiers

| PR Type | What Runs | Time |
|---------|-----------|------|
| **Draft PR** | Quick CI (typecheck, lint, unit) | ~30s |
| **Ready PR** | Quick CI + E2E | ~3min |
| **Ready PR (deploy)** | Quick CI + Deploy + E2E on preview | ~5min |

### Skip Flags (in PR title)

| Flag | Effect |
|------|--------|
| `[wip]` | Skip E2E tests |
| `[skip e2e]` | Skip E2E tests |
| `[skip deploy]` | Skip preview deploy |

**Example:** `feat: add button [wip]` → Only runs Quick CI

### Fast Local Development

```bash
npm run check        # TypeScript + lint (~10s)
npm run test:unit    # Unit tests only (~15s)
npm run verify       # Full check before push
```

### CI Bot Messages

The CI bot posts delightful comments with:
- 🎉 GIFs for deploys and test results
- 📋 Clickable preview URLs
- 📝 Commit changelog
- 🔗 Links to logs and artifacts

---

## Session Best Practices (Ultrathink)

### Before Starting Any Task

1. **Read LEARNINGS.md** — Contains past mistakes and patterns
2. **Check STATUS.md** — Know what's done, what's in progress
3. **Clarify intent** — Ask before assuming (especially UX decisions)

### Workflow That Works

```
1. Clarify intent first (don't assume)
2. Update spec BEFORE code (Language Guidelines, Copy Standards)
3. @build implements in single pass
4. @review catches dead code
5. Commit after each phase (clear git history)
6. Run tests before pushing
```

### Language Guidelines Pattern

Always add to specs when external systems are involved:

| Internal/Tech | User-Facing |
|---------------|-------------|
| Porto account | Villa ID |
| wallet address | (hidden or "Villa ID") |
| SDK names | Never shown to users |

### Copy Standards Pattern

| Action | Button Text | Helper Text |
|--------|-------------|-------------|
| Primary action | "Sign In" | — |
| Secondary action | "Create Villa ID" | — |
| Leave session | "Switch Account" | "Your passkey stays active..." |

### Anti-Patterns to Avoid

- ❌ Implementing before spec is clear
- ❌ Pivoting without updating spec first
- ❌ Over-engineering detection logic
- ❌ Leaving unused code/props
- ❌ Committing without running tests
- ❌ Running multiple build agents without @architect decomposition
- ❌ Editing files not assigned to your Work Unit
- ❌ Starting dependent WU before blocking WU commits

---

## Live QA Workflow (Mobile Testing)

**Optimized for rapid iteration with real device feedback.**

### Start a QA Session

```bash
npm run qa          # Full session: typecheck → share
# or
npm run dev:share   # Just share (skip checks)
```

Output shows:
- Local IP URL (faster, same network)
- ngrok URL (any network, passkeys work)
- Testing checklist
- Claude workflow tips

### Connection Options

| Network | URL | Passkeys | Speed |
|---------|-----|----------|-------|
| Same WiFi | `http://192.168.x.x:3000` | ❌ HTTP only | Fast |
| Any network | `https://xxxx.ngrok.app` | ✅ HTTPS | ~100ms latency |
| Local HTTPS | `https://localhost:3000` | ✅ mkcert | Fastest |

**Passkeys require HTTPS** — use ngrok URL for real passkey testing.

### Feedback Loop Pattern

```
┌─────────────────────────────────────────────────────────────┐
│  1. Tester reports: "On iPhone, Sign In button unresponsive"│
│  2. Claude fixes: Edit button handler, add loading state    │
│  3. Hot reload: Tester pulls down to refresh                │
│  4. Verify: "Working now" or iterate                        │
└─────────────────────────────────────────────────────────────┘
```

**Report format (paste to Claude):**
```
On [device], [action] shows [problem]

Example: "On iPhone Safari, Create Villa ID shows spinner forever"
```

### Hot Debugging Commands

| Issue | Fix |
|-------|-----|
| UI not updating | Pull down to refresh on mobile |
| State stuck | Add `?reset` to URL |
| Style issues | `npm run dev:clean` then reshare |
| Passkey fails | Check ngrok URL is HTTPS |

### End QA Session

```bash
npm run qa:end
```

Shows:
- Changed files summary
- TypeScript/lint check results
- Commit instructions

Or tell Claude: **"commit the QA fixes"**

### Device Testing Checklist

**iOS Safari:**
- [ ] Create Villa ID → Face ID prompt
- [ ] Sign In → passkey auto-select
- [ ] Home screen → profile displays
- [ ] Switch Account → re-auth flow

**Android Chrome:**
- [ ] Create Villa ID → fingerprint prompt
- [ ] Sign In → Google Password Manager
- [ ] Cross-device passkey sync

---

## Agent-First Development

This project uses **Claude Code agents** for implementation. Humans focus on specs and review; agents handle code.

### PARALLEL BY DEFAULT

**Always run independent tasks in parallel.** This is the single biggest speedup for development.

```
❌ NEVER do this (sequential):
  read file → wait → edit → wait → test → wait → review

✅ ALWAYS do this (parallel):
  read files in parallel → edit → test + review in parallel
```

**Parallel patterns to use automatically:**
- Multiple file reads → single message with multiple Read calls
- Test + Review → always run together after build
- Independent searches → multiple Grep/Glob calls in parallel
- E2E + Unit tests → can run simultaneously

### Model Selection Guide

| Agent | Model | Why | Cost |
|-------|-------|-----|------|
| **spec** | `opus` | Needs deep reasoning for architecture decisions | $$$ |
| **architect** | `opus` | Task decomposition requires deep reasoning about dependencies | $$$ |
| **build** | `sonnet` | Fast iteration, good code quality | $$ |
| **ops** | `haiku` | Procedural git/gh/doctl commands, speed over reasoning | $ |
| **test** | `haiku` | Running commands, checking output | $ |
| **review** | `sonnet` | Security analysis needs quality, not speed | $$ |
| **explore** | `haiku` | Quick file searches, codebase navigation | $ |

**Rule of thumb:**
- **Opus** → Architecture, complex decisions, spec writing, task decomposition
- **Sonnet** → Implementation, code review, moderate complexity
- **Haiku** → Quick tasks, searches, running tests, simple edits

### Parallel Agent Patterns

**Maximize parallelism to reduce human wait time:**

```
❌ Sequential (slow):
  spec → wait → build → wait → test → wait → review

✅ Parallel (fast):
  spec → build ─┬─ test (background)
                └─ review (parallel)
```

### When to Run Agents in Parallel

| Scenario | Parallel Agents | Why |
|----------|-----------------|-----|
| After build completes | `test` + `review` | Independent tasks |
| Multiple file changes | Multiple `build` agents | Different files |
| Research + implement | `explore` + `build` | Don't block on research |
| Multi-feature PR | Separate `review` per feature | Faster feedback |

### Parallel Invocation Syntax

**Single message, multiple agents:**
```
Run these in parallel:
1. @test "Run E2E tests"
2. @review "Review onboarding changes"
```

**Background agent (don't wait):**
```
@build "Implement feature X" --background
[Continue chatting while it works]
```

### Agent Workflow (Orchestrated)

**Claude Code orchestrates sub-agents.** Main Claude directs specialized agents and coordinates handoffs.

```
PHASE 1: Specification (human + opus)
├── Human describes feature
├── @spec agent writes spec (opus - needs reasoning)
└── Human approves spec

PHASE 2: Architecture (opus) — REQUIRED for multi-terminal work
├── @architect decomposes spec into Work Units (WU)
├── Assigns explicit file ownership per WU
├── Defines shared interfaces (created first)
└── Outputs: specs/{feature}.wbs.md

PHASE 3: Implementation (sonnet + haiku)
├── @build implements code changes
├── @ops commits atomically (one logical change per commit)
└── Repeat for each WU

PHASE 4: Validation (parallel, haiku/sonnet)
├── @test agent runs E2E (haiku - just running commands)
├── @review agent checks code (sonnet - needs analysis)
└── Both run simultaneously

PHASE 5: Ship (haiku)
├── @ops creates PR with details and test plan
├── Human reviews and merges
├── @ops verifies deploy health
└── Report completion
```

### Orchestration Pattern

**Claude Code as conductor:**

```
Human request
    ↓
Claude Code (orchestrator)
    ├── @spec → defines what to build
    ├── @build → writes code
    ├── @ops → commits + creates PR
    ├── @test + @review (parallel)
    └── @ops → verifies deploy
```

**Key principle:** Each agent does ONE thing well. Orchestrator coordinates.

### Quick Agent Commands

| Situation | Command | Model |
|-----------|---------|-------|
| New feature | `@spec "Feature X"` | opus |
| Decompose for parallel work | `@architect "Decompose Feature X"` | opus |
| Implement spec | `@build "Implement X"` | sonnet |
| Implement work unit | `@build "Implement WU-1: Task name"` | sonnet |
| Commit changes | `@ops "Commit auth changes"` | haiku |
| Create PR | `@ops "Create PR for feature X"` | haiku |
| Verify deploy | `@ops "Verify production deploy"` | haiku |
| Run tests | `@test "Run E2E"` | haiku |
| Review PR | `@review "Review PR #1"` | sonnet |
| Find files | `@explore "Where is auth handled?"` | haiku |
| Quick edit | `@build "Fix typo in X" --model haiku` | haiku |

### Agent Definitions

All agents are defined in `.claude/agents/`:

- **spec.md** — Creates feature specs with Why, UI Boundaries, Tasks (opus)
- **architect.md** — Decomposes specs into parallel Work Units with file ownership (opus)
- **build.md** — Implements code following specs (sonnet)
- **ops.md** — Git commits, GitHub PRs/comments, deploy verification (haiku)
- **test.md** — E2E, integration, security tests (haiku)
- **review.md** — Code review for security, quality, spec compliance (sonnet)

---

## Multi-Terminal Coordination

When running **multiple Claude Code terminals** simultaneously, use this protocol to prevent conflicts.

### The Problem

Without coordination, multiple terminals can:
- Edit the same file simultaneously (merge conflicts)
- Duplicate work (wasted tokens/time)
- Create incompatible implementations (integration failures)
- Block each other waiting for shared resources

### The Solution: Work Breakdown Structure (WBS)

**Before parallel work, run the architect agent:**

```bash
@architect "Decompose {feature} for parallel implementation"
```

This produces `specs/{feature}.wbs.md` with:
- Work Units (WU) with explicit file ownership
- Dependency graph (what blocks what)
- Shared interfaces (created first, read-only thereafter)
- Parallel execution plan

### File Ownership Rules

| Type | Rule | Example |
|------|------|---------|
| **Exclusive** | Only assigned agent edits | `src/components/Feature/` |
| **Read-only** | Any agent imports, none edit | `src/types/shared.ts` |
| **Shared types** | Created in WU-0, locked after | `src/types/{feature}.ts` |

### Coordination Protocol

```
Terminal 1              Terminal 2              Terminal 3
─────────────────────────────────────────────────────────
@architect (WU-0)       [wait]                  [wait]
  ↓ commit types
@build WU-1             @build WU-2             @build WU-3
  ↓ commit              ↓ commit                ↓ commit
[wait for all]          [wait for all]          [wait for all]
@build WU-4 (integration)
```

### Commit Convention

Signal completion via commit messages:
```bash
git commit -m "feat(WU-1): Complete user profile component"
```

Other terminals check for dependent WU commits before starting blocked work.

### When to Use Architect

| Scenario | Use Architect? |
|----------|----------------|
| Single terminal, small feature | No |
| Single terminal, large feature | Optional (helps planning) |
| Multiple terminals, any feature | **Yes (required)** |
| Refactoring across many files | **Yes (required)** |

### Quick Start: Parallel Implementation

```bash
# Terminal 1: Create work breakdown
@architect "Decompose user settings feature"

# Review specs/{feature}.wbs.md, then:

# Terminal 1: Shared types (blocking)
@build "Implement WU-0: Shared types for user settings"

# After WU-0 commits, in parallel:
# Terminal 1:
@build "Implement WU-1: Settings API hook"

# Terminal 2:
@build "Implement WU-2: Display name editor"

# Terminal 3:
@build "Implement WU-3: Avatar picker"

# After all WUs complete:
# Any terminal:
@build "Implement WU-N: Integration and E2E tests"
```

## Learnings Integration

Check `.claude/LEARNINGS.md` before starting work. It contains:
- Past mistakes and how to avoid them
- Discovered patterns (e.g., Porto SDK theming)
- Metrics to improve

**Key learnings to apply:**
1. Specs must include "Why this approach" section
2. Specs must define UI boundaries (what we control vs external)
3. Ask clarifying questions before pivoting implementation
4. Implement minimal version first, validate, then expand

## What We're Building

| Phase | Focus | Status |
|-------|-------|--------|
| 1 | Passkey login (Porto SDK) | IN PROGRESS |
| 2 | Recovery (face + guardians) | Next |
| 3 | Community features | Later |
| 4 | AI assistant | Future |

See [BACKLOG.md](../BACKLOG.md) for full roadmap.

## Quick Start

```bash
npm install
npm run dev        # Start at http://localhost:3000
npm run dev:https  # Start with HTTPS (for passkey testing)
npm run dev:clean  # Clear cache and start fresh
```

## Essential Commands

| Task | Command |
|------|---------|
| **Start dev server** | `npm run dev` |
| **Start with HTTPS** | `npm run dev:https` |
| **Clear cache + start** | `npm run dev:clean` |
| **Type check** | `npm run typecheck` |
| **Run E2E tests** | `npm run test:e2e:chromium` |
| **Full verification** | `npm run verify` |
| **Debug E2E tests** | `npm run test:e2e:ui` |

See [DEVELOPMENT.md](../DEVELOPMENT.md) for full command reference.

## Troubleshooting

**Blank page / no styles?** → `npm run dev:clean`
**Port in use?** → `pkill -f "next dev"` then `npm run dev`
**Passkeys not working?** → Use `npm run dev:https`

## Project Structure

```
.claude/
├── CLAUDE.md           # This file (project instructions)
├── LEARNINGS.md        # Session learnings and patterns
├── agents/             # Agent definitions
│   ├── spec.md
│   ├── architect.md
│   ├── build.md
│   ├── test.md
│   └── review.md
└── templates/          # Spec templates

specs/
├── v1-passkey-login.md # Current spec
├── design-system.md    # Tailwind patterns
├── vision.md           # Product vision
└── STATUS.md           # Progress tracking

src/
├── app/                # Next.js pages
├── components/ui/      # UI components
├── lib/                # Utilities (porto.ts, store.ts)
└── providers/          # React providers

tests/
├── e2e/                # Playwright E2E tests
└── security/           # Security tests
```

## Code Quality

- **TypeScript strict** — No `any`, no untyped assertions
- **Functional React** — Hooks, no class components
- **Result types** — `{ success: true, data } | { success: false, error }`
- **Mobile-first** — <100ms response, offline-aware

## Security Rules

1. **Passkeys stay in Porto** — Never intercept key operations
2. **Validate all input** — Zod schemas for user data
3. **No secrets in code** — Use environment variables
4. **XSS prevention** — Sanitize display names
5. **No hardcoded URLs** — Use `BASE_URL` env var for tests

---

## Environment Handling

**Never hardcode environment-specific URLs in code.** Use environment variables.

### Test Environments

```bash
# Local development
npm run test:e2e:chromium

# Against deployed URL
BASE_URL=https://example.ondigitalocean.app npm run test:e2e:chromium
```

### Environment Detection

```typescript
// playwright.config.ts handles this automatically
const baseURL = process.env.BASE_URL || 'http://localhost:3000'
const isExternalUrl = baseURL !== 'http://localhost:3000'
```

### Writing Environment-Agnostic Tests

```typescript
// ✅ CORRECT: Use relative URLs
await page.goto('/')
await page.goto('/onboarding')

// ❌ WRONG: Never hardcode URLs
const BASE_URL = 'https://production.example.com'  // NO!
await page.goto(BASE_URL)  // NO!
```

### Environment Matrix

| Environment | URL Source | Passkeys | Use For |
|-------------|------------|----------|---------|
| Local HTTP | `localhost:3000` | ❌ | UI development |
| Local HTTPS | `localhost:3000` (mkcert) | ✅ | Passkey development |
| ngrok | Dynamic URL | ✅ | Mobile QA |
| Preview | `villa-pr-N.ondigitalocean.app` | ✅ | PR testing |
| Production | `villa-production-*.ondigitalocean.app` | ✅ | Live |

### Open Source Considerations

- **No secrets in repo** — Use GitHub secrets, DO environment variables
- **No production URLs in code** — All URLs via BASE_URL env var
- **No PII in tests** — Use mock data only
- **Public CI logs** — Never log sensitive data

## Links

- [Porto SDK](https://porto.sh/sdk) — Passkey infrastructure
- [Porto Theming](https://porto.sh/sdk/guides/theming) — Theme customization
- [Unforgettable](https://docs.unforgettable.app/sdk/) — Face recovery (Phase 2)
- [Telegram](https://t.me/proofofretreat) — Community chat
