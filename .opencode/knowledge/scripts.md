# Script Reference

## Rule: Use Scripts Over Repetitive AI Code

If a task can be scripted, it should be. Don't regenerate the same code patterns.

---

## Available Scripts

### Development

| Script                     | Purpose                            | Usage                           |
| -------------------------- | ---------------------------------- | ------------------------------- |
| `./scripts/dev.sh`         | Start local dev                    | `pnpm dev:local`                |
| `./scripts/doctor.sh`      | Environment health check           | `./scripts/doctor.sh`           |
| `./scripts/preflight.sh`   | Docker readiness                   | `./scripts/preflight.sh`        |
| `./scripts/setup-hosts.sh` | Add local.villa.cash to /etc/hosts | `sudo ./scripts/setup-hosts.sh` |

### CI/CD

| Script                            | Purpose                | Usage                          |
| --------------------------------- | ---------------------- | ------------------------------ |
| `./scripts/ci-monitor.sh`         | Check CI status        | `pnpm ci`                      |
| `./scripts/ci-monitor.sh --watch` | Watch until completion | `pnpm ci:watch`                |
| `./scripts/deploy.sh`             | Deploy to DigitalOcean | `./scripts/deploy.sh --update` |

### Testing

| Script                          | Purpose             | Usage              |
| ------------------------------- | ------------------- | ------------------ |
| `./scripts/verify-tests.sh`     | Run full test suite | `pnpm verify`      |
| `./scripts/test.sh`             | Run unit tests      | `pnpm test`        |
| `./scripts/run-tests-docker.sh` | Run tests in Docker | `pnpm test:docker` |

### Database

| Script                   | Purpose               | Usage            |
| ------------------------ | --------------------- | ---------------- |
| `./scripts/db-setup.sh`  | Initialize local DB   | `pnpm db:setup`  |
| `./scripts/db-tunnel.sh` | SSH tunnel to prod DB | `pnpm db:tunnel` |

### Task Management (Beads)

| Script                                | Purpose               | Usage               |
| ------------------------------------- | --------------------- | ------------------- |
| `./scripts/bd-workflow.sh ready`      | Show available tasks  | `pnpm beads:ready`  |
| `./scripts/bd-workflow.sh start <id>` | Claim a task          | Direct              |
| `./scripts/bd-workflow.sh done <id>`  | Complete a task       | Direct              |
| `./scripts/bd-workflow.sh status`     | Overview of all tasks | `pnpm beads:status` |

### Environment

| Script                           | Purpose             | Usage               |
| -------------------------------- | ------------------- | ------------------- |
| `./scripts/env-sync.sh`          | Sync env vars       | `pnpm env`          |
| `./scripts/env-sync.sh validate` | Check required vars | `pnpm env:validate` |

---

## Package.json Scripts

### Most Used

```bash
pnpm dev              # Start Next.js (HTTP)
pnpm dev:local        # Start with HTTPS (passkeys work)
pnpm verify           # Full verification (typecheck + build + E2E)
pnpm typecheck        # Fast type check only
pnpm build            # Production build
```

### Docker

```bash
pnpm docker:dev       # Start dev profile
pnpm docker:https     # Start HTTPS proxy only
pnpm docker:full      # Start all services
pnpm docker:down      # Stop all
pnpm docker:clean     # Stop and remove volumes
```

### Database

```bash
pnpm db:start         # Start postgres container
pnpm db:setup         # Full DB setup
pnpm db:migrate       # Run migrations
pnpm db:studio        # Open Drizzle Studio
```

### Testing

```bash
pnpm test             # Unit tests
pnpm test:e2e         # E2E tests (all browsers)
pnpm test:e2e:chromium # E2E tests (chromium only - faster)
```

---

## When to Create New Scripts

Create a script when:

1. Same sequence of commands repeated 3+ times
2. Complex logic that AI might get wrong
3. Environment-specific setup
4. Security-sensitive operations

Script template:

```bash
#!/bin/bash
# Script description
# Usage: ./scripts/my-script.sh [args]

set -euo pipefail

# Your code here
```
