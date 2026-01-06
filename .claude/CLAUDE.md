# Villa

Privacy-first passkey authentication on **Base** network. Porto SDK + Villa theming.

**Repo:** https://github.com/rockfridrich/villa
**Network:** Base (Chain ID: 8453), Base Sepolia (84532)

---

## Context Loading (RAG)

**Orchestrator Identity:** Read [SYSTEM_PROMPT.md](SYSTEM_PROMPT.md) for partnership model
**Philosophy:** Read [MANIFESTO.md](MANIFESTO.md) for repo-as-truth principles
**Test Context:** `pnpm context:validate` (also runs in CI)

---

## Multi-Developer Preferences

**Shared** (checked in): `.claude/shared/defaults.json`
**Local** (gitignored): `.claude/local/preferences.json`

```bash
pnpm prefs:show      # View effective preferences
pnpm prefs:report    # Full report with pending questions
cp .claude/local/preferences.template.json .claude/local/preferences.json  # Setup
```

Claude learns your preferences over time. See [shared/preferences.schema.ts](shared/preferences.schema.ts) for options.

---

## Quick Reference

```bash
pnpm dev             # Local dev (apps/web)
pnpm dev:https       # Passkey testing (requires mkcert)
pnpm verify          # ALWAYS run before pushing
pnpm qa              # Mobile QA via ngrok
pnpm build           # Build all packages
pnpm typecheck       # Type check all packages

# Task orchestration (Beads)
bd ready             # Find available work
bd show <id>         # Task details
./scripts/bd-workflow.sh start <id>   # Claim task
./scripts/bd-workflow.sh done <id>    # Complete task
```

### Cost-Optimized Agents (see [agents/INDEX.md](agents/INDEX.md))

| Tier | Model | Agents | Use For |
|------|-------|--------|---------|
| Workers | haiku | @explore, @test, @ops | Search, test, deploy |
| Specialists | sonnet | @build, @design, @review | Implementation |
| Quality | sonnet | @quality-gate | Auto-validation |
| Architects | opus | @spec, @architect | Architecture only |

**Routing:** @router (haiku) classifies → appropriate tier → @quality-gate validates

**Cost target:** < $50/day (down from $115/day)

---

## Before You Code

```
1. Is there an approved spec? → No? Write spec first.
2. Run `pnpm verify` before EVERY push.
3. Uncertain about approach? → ASK, don't guess.
4. One feature per PR. One commit per logical change.
```

---

## Domain Architecture

| Domain | Environment | Trigger |
|--------|-------------|---------|
| `villa.cash` | Production | Tag `v*` |
| `beta.villa.cash` | Staging | Push to `main` |
| `dev-1/2.villa.cash` | Preview | PR |

---

## Anti-Patterns (Token Burners)

- ❌ Using Opus for file searches (use @explore haiku)
- ❌ Using Opus for test runs (use @test haiku)
- ❌ Skipping @quality-gate validation
- ❌ Pushing without running tests locally
- ❌ Implementing before spec is approved
- ❌ Creating new files when editing existing works
- ❌ Multiple PRs for same feature (iterate in one PR)
- ❌ CI debugging loops without checking deployment health

---

## Debugging Principles

**Two-Strike Rule:** Same CI failure twice? STOP. Check deployment first:
```bash
curl -s https://beta.villa.cash/api/health | jq .timestamp
# Old timestamp = deploy issue, not code issue → delegate to @ops
```

**Time-Box:** Max 10 min on CI debugging. Then delegate or move on.

---

## Project Structure (Monorepo)

```
apps/
└── web/           # Next.js app (@villa/web)
    └── src/
        ├── app/           # Pages
        ├── components/    # UI + SDK components
        ├── animations/    # Lottie JSON files
        └── lib/           # Utilities (porto.ts, store.ts)

packages/
├── ui/            # Design system (@villa/ui)
├── sdk/           # Identity SDK types (@villa/sdk)
└── config/        # Shared configs

contracts/         # Solidity contracts (@villa/contracts)
specs/             # active/, reference/
```

**Workspace:** `pnpm --filter @villa/web dev`

---

## Code Standards

- **TypeScript strict** — No `any`
- **Functional React** — Hooks only
- **Validate input** — Zod schemas
- **No hardcoded URLs** — Use `BASE_URL` env var

---

## Security Rules

1. Passkeys stay in Porto — never intercept
2. Validate all user input with Zod
3. No secrets in code — use env vars
4. Sanitize display names (XSS)

---

## Language Guidelines

| Internal | User-Facing |
|----------|-------------|
| Porto account | Villa ID |
| wallet address | (hidden) |
| SDK names | Never shown |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Blank page | `pnpm dev:clean` |
| Port in use | `pkill -f "next dev"` |
| Passkeys fail | Use `pnpm dev:https` |
| Tests fail | Run `pnpm verify` locally first! |

---

## Links

- [Porto SDK](https://porto.sh/sdk)
- [LEARNINGS.md](LEARNINGS.md) — Patterns that saved time
- [.claude/agents/](agents/) — Agent definitions
- [knowledge/](knowledge/) — Platform-specific docs

---

## Orchestration Model

Human + Claude Code partnership:
1. **Human** — sets direction (specs, priorities)
2. **Claude** — orchestrates agents in parallel terminals
3. **Agents** — execute domains (@build, @design, @test)
4. **Human** — reviews, approves, merges

```bash
bd ready                        # Find tasks with no blockers
./scripts/bd-workflow.sh status # Full task overview
```

**Task Memory:** Beads (`.beads/`) — survives sessions, hash-based IDs, dependency tracking

**Animation:** Lottie (vectors) + Framer Motion (interactions)

---

*Keep this file under 200 lines. Move details to specific docs.*
