# Docker-Based Testing Infrastructure

Comprehensive Docker testing setup for the Villa monorepo, providing consistent test environments across local development and CI/CD.

## Overview

**Architecture:**
```
Dockerfile.test → Multi-stage build with Playwright browsers
docker-compose.test.yml → Orchestrates test services + ephemeral PostgreSQL
scripts/run-tests-docker.sh → CLI wrapper for common test workflows
```

**Benefits:**
- Consistent environment across local + CI
- Isolated tests (no port conflicts, clean DB per run)
- Parallel E2E execution (4 workers)
- No local Playwright installation needed
- Ephemeral PostgreSQL (in-memory for speed)

---

## Quick Start

```bash
# Run unit tests
./scripts/run-tests-docker.sh --unit

# Run E2E tests with 4 parallel workers
./scripts/run-tests-docker.sh --e2e

# Run all tests + cleanup
./scripts/run-tests-docker.sh --all --cleanup

# Fast parallel execution (unit + integration)
./scripts/run-tests-docker.sh --parallel
```

---

## File Structure

```
/Users/me/Documents/Coding/villa/
├── Dockerfile.test              # Multi-stage test image
├── docker-compose.test.yml      # Test service orchestration
└── scripts/
    └── run-tests-docker.sh      # Test runner CLI
```

---

## Dockerfile.test Architecture

**Stage 1: Dependencies**
- Base: `node:20-alpine`
- Installs pnpm + all workspace dependencies
- Uses BuildKit cache mounts for speed

**Stage 2: Playwright Base**
- Base: `mcr.microsoft.com/playwright:v1.45.0-jammy`
- Pre-installed Chromium, Firefox, WebKit
- Copies dependencies from Stage 1

**Stage 3: Test Runner**
- Non-root user (testuser:testuser)
- Builds Next.js for E2E test server
- Default command: `pnpm test`

**Environment Variables:**
```dockerfile
CI=true                           # Enables CI mode for tests
NODE_ENV=test                     # Test environment
NEXT_TELEMETRY_DISABLED=1         # No telemetry
PLAYWRIGHT_BROWSERS_PATH=/ms-playwright  # Browser location
```

---

## docker-compose.test.yml Services

### postgres-test
Ephemeral PostgreSQL for integration/E2E tests:
```yaml
tmpfs:
  - /var/lib/postgresql/data      # In-memory for speed
healthcheck:
  interval: 2s                     # Fast startup
```

**Connection String:**
```
postgresql://villa_test:villa_test_password@postgres-test:5432/villa_test
```

### test-unit
Unit tests with vitest (no external dependencies):
```bash
docker compose -f docker-compose.test.yml --profile unit up
```

**Mounts:**
- `./apps/web/coverage` → Test coverage reports

### test-integration
Integration tests with MSW for API mocking:
```bash
docker compose -f docker-compose.test.yml --profile integration up
```

**Dependencies:**
- postgres-test (healthy)

**Mounts:**
- `./apps/web/coverage` → Test coverage reports

### test-e2e
E2E tests with Playwright (4 replicas for parallel execution):
```bash
docker compose -f docker-compose.test.yml --profile e2e up --scale test-e2e=4
```

**Dependencies:**
- postgres-test (healthy)

**Mounts:**
- `./apps/web/test-results` → Playwright test artifacts
- `./apps/web/playwright-report` → HTML reports

**Parallel Execution:**
- 4 replicas = 4 parallel workers
- Matches CI sharding strategy (see `.github/workflows/ci.yml`)
- Reduces E2E runtime by ~75%

### test-security
Security tests (shell script validation, auth flows):
```bash
docker compose -f docker-compose.test.yml --profile security up
```

---

## Usage Examples

### Run Specific Test Suite

```bash
# Unit tests only
./scripts/run-tests-docker.sh --unit

# Integration tests only
./scripts/run-tests-docker.sh --integration

# E2E tests only (4 parallel workers)
./scripts/run-tests-docker.sh --e2e

# Security tests only
./scripts/run-tests-docker.sh --security
```

### Run All Tests

```bash
# Sequential (unit → integration → security → e2e)
./scripts/run-tests-docker.sh --all

# With cleanup after
./scripts/run-tests-docker.sh --all --cleanup
```

### Parallel Execution

```bash
# Run unit + integration in parallel
./scripts/run-tests-docker.sh --parallel
```

### Debug Mode

```bash
# Verbose output
./scripts/run-tests-docker.sh --e2e --verbose

# Rebuild without cache
./scripts/run-tests-docker.sh --unit --no-cache
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Test

on: [push, pull_request]

jobs:
  docker-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run all tests in Docker
        run: ./scripts/run-tests-docker.sh --all --cleanup

      - name: Upload test artifacts
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: |
            apps/web/test-results/
            apps/web/playwright-report/
            apps/web/coverage/
```

### Local Pre-Commit Hook

```bash
# .githooks/pre-commit
#!/bin/bash
./scripts/run-tests-docker.sh --unit --integration
```

---

## Performance Characteristics

| Test Suite | Duration | Workers | Memory |
|------------|----------|---------|--------|
| Unit | ~30s | 1 | 1GB |
| Integration | ~45s | 1 | 2GB |
| E2E | ~2min | 4 | 8GB total (2GB each) |
| Security | ~20s | 1 | 512MB |
| **All** | ~3min | Mixed | 10GB peak |

**Optimization Tips:**
- Use `--parallel` for faster unit+integration (~1min vs 75s sequential)
- E2E scales with `--scale test-e2e=N` (max 8 workers on CI)
- In-memory PostgreSQL saves ~10s on integration tests

---

## Troubleshooting

### Port Already in Use

**Problem:** Port 5432 already in use by local PostgreSQL.

**Solution:**
```bash
# Stop local PostgreSQL
brew services stop postgresql@17

# Or change port in docker-compose.test.yml
ports:
  - "5433:5432"  # Use 5433 locally
```

### Out of Memory (OOM)

**Problem:** Docker container killed during E2E tests.

**Solution:**
```bash
# Increase Docker memory limit
# Docker Desktop → Settings → Resources → Memory: 8GB+

# Or reduce E2E workers
./scripts/run-tests-docker.sh --e2e  # Uses 4 workers by default
docker compose -f docker-compose.test.yml --profile e2e up --scale test-e2e=2
```

### BuildKit Cache Mount Errors

**Problem:** `--mount=type=cache` not supported.

**Solution:**
```bash
# Standalone docker-compose doesn't support BuildKit
# Upgrade to Docker Compose V2:
docker compose version  # Should be 2.x.x

# Or use docker buildx
DOCKER_BUILDKIT=1 docker build -f Dockerfile.test .
```

### Playwright Browsers Missing

**Problem:** Chromium/Firefox not found.

**Solution:**
```bash
# Rebuild with correct Playwright base image
./scripts/run-tests-docker.sh --e2e --no-cache

# Verify Playwright version matches package.json
grep playwright apps/web/package.json  # Should match Dockerfile.test
```

### Tests Pass Locally, Fail in Docker

**Symptoms:**
- Timing-sensitive tests fail in Docker
- Environment variables not set
- File paths incorrect

**Debug:**
```bash
# Run with verbose output
./scripts/run-tests-docker.sh --e2e --verbose

# Check environment variables
docker compose -f docker-compose.test.yml --profile e2e run test-e2e env

# Interactive shell
docker compose -f docker-compose.test.yml --profile e2e run test-e2e /bin/bash
```

---

## Cleanup

### Manual Cleanup

```bash
# Stop all test containers
docker compose -f docker-compose.test.yml down --volumes

# Remove test images
docker images | grep 'villa.*test' | awk '{print $3}' | xargs docker rmi -f

# Remove dangling volumes
docker volume prune -f
```

### Automatic Cleanup

```bash
# Run tests with automatic cleanup
./scripts/run-tests-docker.sh --all --cleanup
```

---

## Comparison: Docker vs Local

| Aspect | Docker | Local |
|--------|--------|-------|
| **Setup** | Zero (pulls images) | Install Playwright, PostgreSQL |
| **Speed** | Slightly slower (I/O overhead) | Fastest |
| **Isolation** | Perfect (clean DB, ports) | Shared state risks |
| **CI Parity** | Exact same environment | May diverge |
| **Memory** | 8-10GB | 4-6GB |
| **Best For** | CI, multi-dev, reproducibility | Fast iteration |

**Recommendation:**
- Local: `pnpm verify` for fast feedback
- Docker: Before pushing to main, debugging CI failures

---

## Future Enhancements

- [ ] GitHub Actions cache for Docker layers
- [ ] Test result parsing + Slack notifications
- [ ] Visual regression testing with Percy/Chromatic
- [ ] Load testing with k6 in Docker
- [ ] Database seeding for E2E tests
- [ ] Multi-browser E2E (Firefox, Safari)

---

## Related Documentation

- [LEARNINGS.md](../.claude/LEARNINGS.md) - Pattern #63: Docker Environment Pre-Check
- [playwright.config.ts](../apps/web/playwright.config.ts) - E2E test configuration
- [vitest.config.*.ts](../apps/web/) - Unit/integration test configs
- [.github/workflows/ci.yml](../.github/workflows/ci.yml) - CI pipeline

---

**Last Updated:** 2026-01-10
**Maintainer:** @build agent
