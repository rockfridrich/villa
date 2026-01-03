# Villa

Privacy-first passkey authentication. Porto SDK wrapper with Villa theming.

**Repo:** https://github.com/rockfridrich/villa

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

---

## Agent-First Development

This project uses **Claude Code agents** for implementation. Humans focus on specs and review; agents handle code.

### Model Selection Guide

| Agent | Model | Why | Cost |
|-------|-------|-----|------|
| **spec** | `opus` | Needs deep reasoning for architecture decisions | $$$ |
| **build** | `sonnet` | Fast iteration, good code quality | $$ |
| **test** | `haiku` | Running commands, checking output | $ |
| **review** | `sonnet` | Security analysis needs quality, not speed | $$ |
| **explore** | `haiku` | Quick file searches, codebase navigation | $ |

**Rule of thumb:**
- **Opus** → Architecture, complex decisions, spec writing
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

### Agent Workflow

```
PHASE 1: Specification (human + opus)
├── Human describes feature
├── @spec agent writes spec (opus - needs reasoning)
└── Human approves spec

PHASE 2: Implementation (parallel, sonnet)
├── @build agent implements (sonnet - fast iteration)
├── [Optional] @explore agent researches in parallel (haiku)
└── Commit after each logical chunk

PHASE 3: Validation (parallel, haiku/sonnet)
├── @test agent runs E2E (haiku - just running commands)
├── @review agent checks code (sonnet - needs analysis)
└── Both run simultaneously

PHASE 4: Ship
├── Fix any issues from review
├── Re-run tests
└── Merge
```

### Quick Agent Commands

| Situation | Command | Model |
|-----------|---------|-------|
| New feature | `@spec "Feature X"` | opus |
| Implement spec | `@build "Implement X"` | sonnet |
| Run tests | `@test "Run E2E"` | haiku |
| Review PR | `@review "Review PR #1"` | sonnet |
| Find files | `@explore "Where is auth handled?"` | haiku |
| Quick edit | `@build "Fix typo in X" --model haiku` | haiku |

### Agent Definitions

All agents are defined in `.claude/agents/`:

- **spec.md** — Creates feature specs with Why, UI Boundaries, Tasks (opus)
- **build.md** — Implements code following specs (sonnet)
- **test.md** — E2E, integration, security tests (haiku)
- **review.md** — Code review for security, quality, spec compliance (sonnet)

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

## Links

- [Porto SDK](https://porto.sh/sdk) — Passkey infrastructure
- [Porto Theming](https://porto.sh/sdk/guides/theming) — Theme customization
- [Unforgettable](https://docs.unforgettable.app/sdk/) — Face recovery (Phase 2)
- [Telegram](https://t.me/proofofretreat) — Community chat
