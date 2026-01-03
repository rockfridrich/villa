# Villa

Privacy-first passkey authentication. Porto SDK wrapper with Villa theming.

**Repo:** https://github.com/rockfridrich/villa

## Agent-First Development

This project uses **Claude Code agents** for implementation. Humans focus on specs and review; agents handle code.

### Workflow

```
1. Human describes feature/task
2. Claude spawns @spec agent → writes spec
3. Human reviews/approves spec
4. Claude spawns @build agent → implements
5. Claude spawns @test agent → writes tests
6. Claude spawns @review agent → code review
7. Human does final review → merge
```

### When to Spawn Agents

| Situation | Agent | Command |
|-----------|-------|---------|
| New feature request | spec | `@spec "Feature description"` |
| Implement approved spec | build | `@build "Implement {spec-name}"` |
| Write/update tests | test | `@test "Test {feature}"` |
| Review PR or code | review | `@review "Review {PR/code}"` |

### Agent Definitions

All agents are defined in `.claude/agents/`:

- **spec.md** — Creates feature specs with Why, UI Boundaries, Tasks
- **build.md** — Implements code following specs, TDD approach
- **test.md** — E2E, integration, security tests
- **review.md** — Code review for security, quality, spec compliance

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
npm run dev  # HTTPS required for passkeys
```

Dev server runs at `https://localhost:3000` (or 3001 if 3000 is busy).

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
