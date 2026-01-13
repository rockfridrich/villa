# Villa - OpenCode Integration

Privacy-first passkey authentication on **Base** network. Porto SDK + Villa theming.

**Repo:** https://github.com/rockfridrich/villa
**Network:** Base (Chain ID: 8453), Base Sepolia (84532)

---

## Quick Reference

```bash
# Development
pnpm dev:local           # Hybrid: Native Next.js + Docker HTTPS (passkeys work)
pnpm dev                 # Native only (HTTP, no passkeys)
./scripts/doctor.sh      # Environment health check

# Verification
pnpm verify              # ALWAYS run before pushing (typecheck + build + E2E)
pnpm typecheck           # Fast type check
pnpm ci                  # Check CI status

# Docker
./scripts/preflight.sh   # Check Docker/Colima readiness
docker-compose -f docker-compose.local.yml up -d   # HTTPS proxy only
docker-compose -f docker-compose.dev.yml up -d     # Full dev environment

# Deployment
./scripts/deploy.sh --status   # Check DO app status
./scripts/deploy.sh --update   # Deploy to DO
./scripts/ci-monitor.sh        # Monitor CI (non-blocking)
./scripts/ci-monitor.sh --watch  # Watch until completion
```

---

## Agent Routing

| Agent         | Model  | Use For                          | Script/Tool                        |
| ------------- | ------ | -------------------------------- | ---------------------------------- |
| @explore      | haiku  | Codebase search, file discovery  | Direct tools: Grep, Glob, Read     |
| @ops          | haiku  | Git, GitHub, deploy verification | `./scripts/deploy.sh`, `gh`, `git` |
| @test         | haiku  | Run tests, verify builds         | `pnpm verify`, `pnpm test:e2e`     |
| @build        | sonnet | Implementation                   | Direct editing                     |
| @design       | sonnet | UI/UX, frontend visuals          | `frontend-ui-ux-engineer` agent    |
| @review       | sonnet | Code review                      | `oracle` for complex reviews       |
| @quality-gate | sonnet | Pre-commit validation            | `pnpm verify`                      |
| @spec         | opus   | Architecture decisions           | `oracle` agent                     |

**Rule:** Use scripts over repetitive AI code. If a task can be scripted, it should be.

---

## Known Issues

### 1. key.villa.cash Iframe Issues

**Status:** Active investigation needed
**Location:** `apps/web/src/lib/porto.ts`, `packages/sdk/src/iframe/`
**Symptoms:**

- Porto dialog mode works on villa.cash (uses id.porto.sh)
- SDK iframe to key.villa.cash may have CORS/CSP issues
- 1Password interception requires dialog mode context

**Debug:**

```bash
# Check CSP headers
curl -I https://key.villa.cash/auth 2>&1 | grep -i content-security

# Test iframe locally
pnpm dev:local  # Opens https://local.villa.cash with HTTPS
```

### 2. Docker Local Dev

**Status:** Working (requires Colima)
**Fix:** Use `docker-compose` (hyphenated) not `docker compose` (space)

```bash
./scripts/preflight.sh   # Verify Colima/Docker ready
pnpm dev:local           # Hybrid mode with HTTPS
```

---

## Code Standards

- **TypeScript strict** - No `any`, no `@ts-ignore`
- **Functional React** - Hooks only
- **Validate input** - Zod schemas
- **No hardcoded URLs** - Use `BASE_URL` env var
- **Passkeys need HTTPS** - Always use `pnpm dev:local` for auth testing

---

## Project Structure

```
apps/
├── web/           # Next.js app (@villa/web) - main product
├── api/           # Backend API (Drizzle ORM)
└── developers/    # Developer portal

packages/
├── sdk/           # Identity SDK (@rockfridrich/villa-sdk)
├── sdk-react/     # React hooks for SDK
├── ui/            # Design system (@villa/ui)
└── config/        # Shared configs

contracts/         # Solidity contracts

scripts/           # Protocolized operations (USE THESE)
├── dev.sh         # Local development
├── deploy.sh      # DigitalOcean deployment
├── ci-monitor.sh  # GitHub Actions monitoring
├── doctor.sh      # Environment health check
├── preflight.sh   # Docker readiness check
└── bd-workflow.sh # Beads task management
```

---

## Domain Architecture

| Domain               | Environment | Trigger           |
| -------------------- | ----------- | ----------------- |
| `villa.cash`         | Production  | Tag `v*`          |
| `beta.villa.cash`    | Staging     | Push to `main`    |
| `dev-1/2.villa.cash` | Preview     | PR                |
| `key.villa.cash`     | Auth domain | SDK iframe target |

---

## Before You Code

1. **Run `./scripts/doctor.sh`** - Verify environment
2. **Check git status** - Clean working tree
3. **Use existing scripts** - Don't write repetitive code
4. **Run `pnpm verify` before every push**

---

## Links

- [Porto SDK](https://porto.sh/sdk)
- [.claude/LEARNINGS.md](../.claude/LEARNINGS.md) - Patterns that saved time
- [.claude/agents/](../.claude/agents/) - Agent definitions (shared)
