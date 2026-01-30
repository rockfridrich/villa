# Villa - OpenCode Agent Protocol

**Primary agent system for Villa development.** All agents MUST follow these protocols.

**Repo:** https://github.com/rockfridrich/villa
**Network:** Base (Chain ID: 8453), Base Sepolia (84532)

---

## CLAUDE CODE PARTNERSHIP

**Claude Code** is the initialization and repair partner for OpenCode agents.

| Scenario | Use Claude Code | Use OpenCode |
|----------|-----------------|--------------|
| Session start | ✅ Bootstrap, run doctor.sh | After environment healthy |
| Environment broken | ✅ Diagnose and fix | Expects working env |
| Agent not working | ✅ Debug the agent | Normal agent operation |
| Protocol updates | ✅ Edit .opencode/ files | Follow protocols |
| Implementation | Hand off to OpenCode | ✅ Use @build, @design |
| File search | Hand off to OpenCode | ✅ Use @explore |
| Test runs | Hand off to OpenCode | ✅ Use @test |

**Typical session flow:**
```
1. Open Claude Code
2. Run ./scripts/doctor.sh
3. If issues → Claude Code fixes them
4. If healthy → Switch to OpenCode for implementation
5. If OpenCode agent fails → Return to Claude Code for repair
```

---

## ENFORCED PROTOCOLS (NON-NEGOTIABLE)

### Protocol 1: Environment Check (BLOCKING)

**BEFORE any dev work, ALWAYS run:**

```bash
./scripts/doctor.sh
```

| Check        | Required | Fix                          |
| ------------ | -------- | ---------------------------- |
| Node.js 20+  | YES      | `nvm use 20`                 |
| bun         | YES      | `npm i -g bun`              |
| git repo     | YES      | Must be in villa repo        |
| .env.local   | YES      | `cp .env.example .env.local` |
| node_modules | YES      | `bun install`               |

**If doctor.sh fails:** FIX BEFORE PROCEEDING. Do not skip.

---

### Protocol 2: HTTPS for Passkeys (BLOCKING)

**Passkeys/WebAuthn REQUIRE HTTPS.** The `localhost` exception does NOT work reliably.

| Scenario         | Command             | URL                      |
| ---------------- | ------------------- | ------------------------ |
| Passkey testing  | `bun dev:local`    | https://local.villa.cash |
| Non-passkey work | `bun dev`          | http://localhost:3000    |
| Docker full      | `docker compose up` | https://localhost        |

**NEVER test passkeys on HTTP.** If you see passkey errors, check protocol first.

**Setup for local.villa.cash:**

```bash
# One-time setup
sudo ./scripts/setup-hosts.sh  # Adds 127.0.0.1 local.villa.cash to /etc/hosts

# Start hybrid mode (Docker HTTPS proxy + native Next.js)
bun dev:local
```

**Verification:**

```bash
# Check if HTTPS proxy is running
curl -sk https://local.villa.cash/caddy-health
```

---

### Protocol 3: Pre-Push Verification (BLOCKING)

**BEFORE every push, ALWAYS run:**

```bash
bun verify
```

This runs: `typecheck` + `lint` + `build` + `E2E tests`

| Failure         | Action                                         |
| --------------- | ---------------------------------------------- |
| typecheck fails | Fix type errors (NO `as any`, NO `@ts-ignore`) |
| lint fails      | `bun lint:fix`                                |
| build fails     | Check imports, missing deps                    |
| E2E fails       | `bun test:e2e:ui` to debug                    |

**NEVER push with failing verify.** CI will reject it anyway.

---

## LOCAL DEVELOPMENT

### Quick Start

```bash
# 1. Check environment
./scripts/doctor.sh

# 2. Start development
bun dev:local    # With HTTPS (passkeys work)
# OR
bun dev          # HTTP only (faster, no passkeys)

# 3. Before pushing
bun verify
```

### Commands Reference

| Command                  | Description       | When to Use         |
| ------------------------ | ----------------- | ------------------- |
| `bun dev`               | HTTP dev server   | Non-passkey work    |
| `bun dev:local`         | HTTPS dev server  | Passkey testing     |
| `bun verify`            | Full verification | Before every push   |
| `bun typecheck`         | Type check only   | Quick validation    |
| `bun lint:fix`          | Auto-fix lint     | After lint failures |
| `bun test:e2e:ui`       | E2E with UI       | Debug failing tests |
| `bun test:e2e:chromium` | Fast E2E          | CI-like testing     |

### Troubleshooting

| Problem             | Fix                                 |
| ------------------- | ----------------------------------- |
| Blank page          | `rm -rf apps/hub/.next && bun dev` |
| Port in use         | `pkill -f "next dev"`               |
| Passkeys fail       | Use `bun dev:local` with HTTPS     |
| Docker not starting | `./scripts/preflight.sh`            |
| Tests fail          | `bun test:e2e:ui` to debug         |

---

## TESTING PROTOCOL

### Test Hierarchy

| Type        | Command                              | When               |
| ----------- | ------------------------------------ | ------------------ |
| Unit        | `bun --filter @villa/hub test:unit` | During development |
| E2E (fast)  | `bun test:e2e:chromium`             | Before push        |
| E2E (all)   | `bun test:e2e`                      | Full verification  |
| E2E (debug) | `bun test:e2e:ui`                   | Debugging failures |

### Docker Testing (CI-like)

```bash
# Run all tests in Docker (matches CI)
bun test:docker:all

# Run specific test type
bun test:docker:unit
bun test:docker:e2e
bun test:docker:security
```

### E2E Test Rules

1. **Always verify locally before push** - `bun test:e2e:chromium`
2. **Use Playwright UI for debugging** - `bun test:e2e:ui`
3. **CI runs 4 shards in parallel** - failures show in merged report
4. **Database tests skip in CI** - they run against deployed apps

---

## GITHUB WORKFLOW PROTOCOL

### Branch Strategy

| Branch      | Purpose      | Deploy Target           |
| ----------- | ------------ | ----------------------- |
| `main`      | Stable code  | beta.villa.cash (auto)  |
| `feature/*` | New features | dev-1 or dev-2 (PR)     |
| `fix/*`     | Bug fixes    | dev-1 or dev-2 (PR)     |
| `v*` tags   | Releases     | villa.cash (production) |

### PR Workflow

```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Make changes, commit
git add .
git commit -m "feat: add my feature"

# 3. Verify before push
bun verify

# 4. Push and create PR
git push -u origin feature/my-feature
gh pr create --title "feat: add my feature" --body "## Summary\n- Added X"
```

### PR Requirements (Auto-enforced by CI)

| Check         | Required | Blocker                         |
| ------------- | -------- | ------------------------------- |
| Lockfile sync | YES      | bun-lock.yaml must match       |
| Typecheck     | YES      | No type errors                  |
| Lint          | YES      | ESLint passes                   |
| Build         | YES      | Production build works          |
| E2E tests     | YES\*    | \*Skipped for docs-only changes |
| Security scan | YES      | No secrets in code              |

### PR Preview Deployments

- **Odd PR numbers** → dev-1.villa.cash
- **Even PR numbers** → dev-2.villa.cash

Bot comments preview URL when ready.

### CI Monitoring

```bash
# Quick status check
bun ci

# Watch until completion
bun ci:watch

# View logs
bun ci:log
```

---

## DEPLOYMENT PROTOCOL

### Deployment Flow

```
PR merged → main → beta.villa.cash (auto)
            ↓
     Create tag v* → villa.cash (production)
```

### Deploy to Staging (Automatic)

Push to `main` triggers:

1. CI checks (typecheck, lint, build, E2E)
2. Deploy to beta.villa.cash
3. CloudFlare cache purge
4. Commit comment with deploy info

### Deploy to Production (Manual Tag)

```bash
# 1. Verify staging is healthy
curl -sf https://beta.villa.cash/api/health

# 2. Create release tag
git tag v1.2.3
git push --tags

# 3. Monitor deployment
bun ci:watch
```

### Manual Deployment (Emergency)

```bash
# Check current status
./scripts/deploy.sh --status

# Update existing app
./scripts/deploy.sh --update

# View logs
./scripts/deploy.sh --logs
```

### Deployment Verification

```bash
# Check health endpoint
curl -sf https://villa.cash/api/health | jq .

# Check deployment timestamp
curl -s https://beta.villa.cash/api/health | jq .timestamp
```

---

## CLOUDFLARE DOMAIN MANAGEMENT

### Domain Architecture

| Domain             | Environment        | Trigger        | CloudFlare       |
| ------------------ | ------------------ | -------------- | ---------------- |
| `villa.cash`       | Production         | Tag `v*`       | Proxied (orange) |
| `beta.villa.cash`  | Staging            | Push to `main` | Proxied (orange) |
| `dev-1.villa.cash` | Preview (odd PRs)  | PR             | Proxied (orange) |
| `dev-2.villa.cash` | Preview (even PRs) | PR             | Proxied (orange) |
| `local.villa.cash` | Local dev          | Manual         | N/A (local)      |

### CloudFlare Commands

```bash
# Check status
bun infra:status

# List DNS records
bun infra:dns:list

# Purge cache (after deploy issues)
bun infra:cache:purge

# Enable dev mode (bypass cache)
bun infra cloudflare zone dev-mode-on
```

### DNS Troubleshooting

```bash
# Check propagation
dig @1.1.1.1 villa.cash
dig @8.8.8.8 beta.villa.cash

# Flush local DNS (macOS)
sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder
```

### SSL Configuration

| Setting          | Value | Reason                |
| ---------------- | ----- | --------------------- |
| Encryption mode  | Full  | DO provides valid SSL |
| Always Use HTTPS | On    | Required for passkeys |
| Minimum TLS      | 1.2   | Security              |

---

## AGENT ROUTING

| Agent | Model | Cost/1M tok | Use For |
|-------|-------|-------------|---------|
| @explore | Gemini 2.5 Flash | ~$0.08 | Search, read files (READ-ONLY) |
| @fix | Claude Haiku 3.5 | ~$0.25 | Quick fixes, 1-3 files |
| @test | Claude Haiku 3.5 | ~$0.25 | Run tests, report results |
| @build | Claude Sonnet 4.5 | ~$3.00 | Implementation |
| @review | Gemini 2.5 Pro | ~$3.00 | Code review, security |

**Route cheap first:** @explore -> @fix -> @test -> @build -> @review

**Rule:** Use scripts over repetitive AI code. If a task can be scripted, it should be.

---

## SCRIPTS REFERENCE

### Development

| Script                     | Description                           |
| -------------------------- | ------------------------------------- |
| `./scripts/dev.sh --local` | Hybrid: Docker HTTPS + native Next.js |
| `./scripts/doctor.sh`      | Environment health check              |
| `./scripts/preflight.sh`   | Docker/Colima readiness               |

### Testing

| Script                          | Description                       |
| ------------------------------- | --------------------------------- |
| `./scripts/test.sh`             | Run tests (--quick, --e2e, --all) |
| `./scripts/verify-tests.sh`     | Verify test setup                 |
| `./scripts/run-tests-docker.sh` | CI-like Docker tests              |

### Deployment

| Script                            | Description            |
| --------------------------------- | ---------------------- |
| `./scripts/deploy.sh --status`    | Check DO app status    |
| `./scripts/deploy.sh --update`    | Deploy to DO           |
| `./scripts/deploy.sh --logs`      | View deploy logs       |
| `./scripts/ci-monitor.sh`         | Monitor CI status      |
| `./scripts/ci-monitor.sh --watch` | Watch until completion |

### QA

| Script                     | Description              |
| -------------------------- | ------------------------ |
| `./scripts/qa-start.sh`    | Start QA session         |
| `./scripts/qa-end.sh`      | End QA session, summary  |
| `./scripts/ngrok-share.sh` | Share locally for mobile |

---

## CODE STANDARDS

- **TypeScript strict** - No `any`, no `@ts-ignore`, no `@ts-expect-error`
- **Functional React** - Hooks only
- **Validate input** - Zod schemas
- **No hardcoded URLs** - Use env vars
- **Passkeys need HTTPS** - Always use `bun dev:local`

---

## PROJECT STRUCTURE

```
apps/
├── hub/           # Main Next.js app (@villa/hub)
├── key/           # Auth domain app (@villa/key)
├── api/           # Backend API (Drizzle ORM)
└── developers/    # Developer portal

packages/
├── sdk/           # Identity SDK (@rockfridrich/villa-sdk)
├── sdk-react/     # React hooks for SDK
├── ui/            # Design system (@villa/ui)
└── config/        # Shared configs

contracts/         # Solidity contracts
scripts/           # PROTOCOLIZED OPERATIONS (USE THESE)
specs/             # Feature specifications
.opencode/         # OpenCode agent context (this file)
.claude/           # Claude Code (initialization & repair partner)
```

---

## ANTI-PATTERNS (BLOCKING)

| Violation               | Why It's Bad                  | Fix                  |
| ----------------------- | ----------------------------- | -------------------- |
| Skip doctor.sh          | Environment issues waste time | Always run first     |
| HTTP for passkeys       | WebAuthn requires HTTPS       | Use `bun dev:local` |
| Push without verify     | CI will reject anyway         | `bun verify` first  |
| `as any` / `@ts-ignore` | Type safety is critical       | Fix the types        |
| Hardcoded URLs          | Breaks across environments    | Use env vars         |
| Skip E2E tests          | Regressions slip through      | Run before push      |
| Direct edit to deploy   | No audit trail                | Use GitHub Actions   |

---

## QUICK REFERENCE CARD

```bash
# Environment check (ALWAYS FIRST)
./scripts/doctor.sh

# Development
bun dev:local     # HTTPS for passkeys
bun dev           # HTTP (fast, no passkeys)

# Before push (ALWAYS)
bun verify

# CI monitoring
bun ci            # Quick status
bun ci:watch      # Watch completion

# Deployment
# Staging: just push to main
# Production: git tag v1.2.3 && git push --tags

# Troubleshooting
./scripts/preflight.sh    # Docker issues
bun test:e2e:ui          # Debug E2E
bun infra:cache:purge    # CloudFlare cache
```

---

_This is the master protocol file. All agents MUST follow these protocols._
