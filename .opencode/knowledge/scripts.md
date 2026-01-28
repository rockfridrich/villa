# Script Reference

## Rule: Use Scripts Over Repetitive AI Code

If a task can be scripted, it should be. Don't regenerate the same code patterns.

---

## Available Scripts

### Development

| Script                     | Purpose                            | Usage                           |
| -------------------------- | ---------------------------------- | ------------------------------- |
| `./scripts/dev.sh`         | Start local dev                    | `bun dev:local`                 |
| `./scripts/doctor.sh`      | Environment health check           | `./scripts/doctor.sh`           |
| `./scripts/preflight.sh`   | Docker readiness                   | `./scripts/preflight.sh`        |
| `./scripts/setup-hosts.sh` | Add local.villa.cash to /etc/hosts | `sudo ./scripts/setup-hosts.sh` |

### CI/CD

| Script                            | Purpose                | Usage                          |
| --------------------------------- | ---------------------- | ------------------------------ |
| `./scripts/ci-monitor.sh`         | Check CI status        | `bun ci`                       |
| `./scripts/ci-monitor.sh --watch` | Watch until completion | `bun ci:watch`                 |
| `./scripts/deploy.sh`             | Deploy to DigitalOcean | `./scripts/deploy.sh --update` |

### Testing

| Script                          | Purpose             | Usage             |
| ------------------------------- | ------------------- | ----------------- |
| `./scripts/verify-tests.sh`     | Run full test suite | `bun verify`      |
| `./scripts/test.sh`             | Run unit tests      | `bun test`        |
| `./scripts/run-tests-docker.sh` | Run tests in Docker | `bun test:docker` |

### Database

| Script                   | Purpose               | Usage           |
| ------------------------ | --------------------- | --------------- |
| `./scripts/db-setup.sh`  | Initialize local DB   | `bun db:setup`  |
| `./scripts/db-tunnel.sh` | SSH tunnel to prod DB | `bun db:tunnel` |

### Task Management (Beads)

| Script                                | Purpose               | Usage              |
| ------------------------------------- | --------------------- | ------------------ |
| `./scripts/bd-workflow.sh ready`      | Show available tasks  | `bun beads:ready`  |
| `./scripts/bd-workflow.sh start <id>` | Claim a task          | Direct             |
| `./scripts/bd-workflow.sh done <id>`  | Complete a task       | Direct             |
| `./scripts/bd-workflow.sh status`     | Overview of all tasks | `bun beads:status` |

### Environment

| Script                           | Purpose             | Usage              |
| -------------------------------- | ------------------- | ------------------ |
| `./scripts/env-sync.sh`          | Sync env vars       | `bun env`          |
| `./scripts/env-sync.sh validate` | Check required vars | `bun env:validate` |

---

## Package.json Scripts

### Most Used

```bash
bun dev              # Start Next.js (HTTP)
bun dev:local        # Start with HTTPS (passkeys work)
bun verify           # Full verification (typecheck + build + E2E)
bun typecheck        # Fast type check only
bun build            # Production build
```

### Docker

```bash
bun docker:dev       # Start dev profile
bun docker:https     # Start HTTPS proxy only
bun docker:full      # Start all services
bun docker:down      # Stop all
bun docker:clean     # Stop and remove volumes
```

### Database

```bash
bun db:start         # Start postgres container
bun db:setup         # Full DB setup
bun db:migrate       # Run migrations
bun db:studio        # Open Drizzle Studio
```

### Testing

```bash
bun test             # Unit tests
bun test:e2e         # E2E tests (all browsers)
bun test:e2e:chromium # E2E tests (chromium only - faster)
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
