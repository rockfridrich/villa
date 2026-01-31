# Villa — Claude Code Context

Privacy-first passkey authentication on **Base** network. Porto SDK + Villa theming.

**Repo:** https://github.com/rockfridrich/villa
**Network:** Base (Chain ID: 8453), Base Sepolia (84532)

---

## Critical: Local Development with Passkeys

**Passkeys/WebAuthn require HTTPS.** For any local development involving authentication:

```bash
# Option 1: Native HTTPS (requires mkcert setup)
bun dev:https

# Option 2: Docker with HTTPS proxy (recommended)
bun docker:https   # Start Caddy HTTPS proxy
bun dev            # Run Next.js natively
# Access at: https://local.villa.cash
```

**Why:** WebAuthn requires a "secure context" (HTTPS). The `localhost` exception doesn't work reliably for passkey APIs, especially with cross-origin iframes (Porto SDK). Always use HTTPS.

**Setup for docker:https:**

1. Add to `/etc/hosts`: `127.0.0.1 local.villa.cash local-key.villa.cash`
2. Run `bun docker:https` to start Caddy with self-signed certs
3. Run `bun dev` to start Next.js
4. Access at `https://local.villa.cash`

---

## Quick Reference

```bash
bun dev              # Local dev (hub on :3000)
bun verify           # ALWAYS run before pushing (typecheck + lint + test)
bun build            # Build all packages
bun typecheck        # TypeScript only
bun test             # All tests

# Task orchestration (Beads)
bd ready             # Find available work
bd show <id>         # Task details
bd update <id> --status=in_progress   # Claim task
bd close <id>        # Complete task
bd sync --flush-only # Export to JSONL
```

---

## Before You Code

```
1. Is there an approved spec? No? Write spec first.
2. Run `bun verify` before EVERY push.
3. Uncertain about approach? ASK, don't guess.
4. One feature per PR. One commit per logical change.
```

---

## Collaboration Protocol

### Session Start
Confirm with human: **Goal** (specific outcome), **Scope** (minimal or comprehensive), **Handoff** (testing participation?)

### CI Time-Box (ENFORCED)
- 1st failure: Fix and push
- 2nd same failure: **STOP** — Ask user for direction
- Never >3 attempts without explicit approval

### Human Testing Handoff
When user offers to test:
1. Push current state (even imperfect)
2. Provide: URL, steps, expected behavior
3. **WAIT** — do NOT continue "fixing"

### Clean Exit
Before ending: `git status` clean, `bun verify` passes, summary of done/pending/blocked

---

## Domain Architecture

| Domain               | Environment | Trigger        |
| -------------------- | ----------- | -------------- |
| `villa.cash`         | Production  | Tag `v*`       |
| `beta.villa.cash`    | Staging     | Push to `main` |
| `dev-1/2.villa.cash` | Preview     | PR             |

---

## Anti-Patterns

- Do not push without running `bun verify` locally
- Do not implement before spec is approved
- Do not create new files when editing existing ones works
- Do not open multiple PRs for the same feature (iterate in one PR)
- Do not loop on CI failures — 2nd same failure means STOP

---

## Debugging Principles

**Two-Strike Rule:** Same CI failure twice? STOP. Check deployment first:

```bash
curl -s https://beta.villa.cash/api/health | jq .timestamp
# Old timestamp = deploy issue, not code issue
```

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
5. Smart contracts: Use [Trail of Bits Claude Code skills](https://github.com/trailofbits/skills) for AI-assisted security analysis (see `contracts/CLAUDE.md`)

---

## Language Guidelines

| Internal       | User-Facing |
| -------------- | ----------- |
| Porto account  | Villa ID    |
| wallet address | (hidden)    |
| SDK names      | Never shown |

---

## Troubleshooting

| Problem       | Fix                                                                    |
| ------------- | ---------------------------------------------------------------------- |
| Blank page    | Clear `.next/` cache: `rm -rf apps/hub/.next && bun dev`              |
| Port in use   | `pkill -f "next dev"`                                                  |
| Passkeys fail | Use HTTPS: `bun docker:https && bun dev` then https://local.villa.cash |
| Tests fail    | Run `bun verify` locally first                                         |
| Deploy fail   | Check `apps/*/Dockerfile` and `apps/*/railway.toml` config             |

---

## Links

- [Porto SDK](https://porto.sh/sdk)
- [LEARNINGS.md](LEARNINGS.md) — Patterns that saved time

---

## Agent Orchestration (OpenCode)

Agent routing is managed by OpenCode (see `.opencode/BOOT.md`). Five agents:

| Agent | Model | Cost/1M tok | Role |
|-------|-------|-------------|------|
| @explore | Gemini 2.5 Flash | ~$0.08 | Fast codebase search (READ-ONLY) |
| @fix | Claude Haiku 3.5 | ~$0.25 | Quick fixes, 1-3 files |
| @test | Claude Haiku 3.5 | ~$0.25 | Run tests, report results |
| @build | Claude Sonnet 4.5 | ~$3.00 | Full implementation |
| @review | Gemini 2.5 Pro | ~$3.00 | Code review, security audit |

**Routing:** Use cheapest capable agent. @explore -> @fix -> @test -> @build -> @review.

---

_Keep this file under 150 lines. Move details to specific docs._
