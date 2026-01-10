# Testing Quick Reference

Fast reference for running tests in the Villa monorepo.

## Local Development (Fastest)

```bash
# Quick verification before push
pnpm verify                      # typecheck + lint + build + E2E

# Individual test suites
pnpm --filter @villa/web test:unit
pnpm --filter @villa/web test:integration
pnpm --filter @villa/web test:e2e:chromium
pnpm --filter @villa/web test:security

# Watch mode (development)
pnpm --filter @villa/web test:unit --watch
```

## Docker Tests (CI Parity)

```bash
# Recommended: Fast parallel tests
pnpm test:docker:parallel        # unit + integration (~1min)

# Individual suites
pnpm test:docker:unit            # ~30s
pnpm test:docker:integration     # ~45s
pnpm test:docker:e2e             # ~2min (4 workers)
pnpm test:docker:security        # ~20s

# Full suite
pnpm test:docker:all             # ~3min
pnpm test:docker:clean           # + cleanup after
```

## When to Use What?

| Scenario | Command | Why |
|----------|---------|-----|
| Quick check during dev | `pnpm verify` | Fastest, local |
| Before pushing to main | `pnpm test:docker:parallel` | CI parity |
| Debugging CI failure | `pnpm test:docker:e2e --verbose` | Exact CI environment |
| Pre-commit hook | `pnpm test:docker:unit` | Fast, isolated |
| Full validation | `pnpm test:docker:all` | Complete coverage |

## Test Output Locations

```
apps/web/
├── coverage/              # Coverage reports (unit + integration)
├── test-results/          # Playwright artifacts (traces, videos)
└── playwright-report/     # HTML test report
```

## Debugging Failed Tests

```bash
# View Playwright report
pnpm --filter @villa/web test:e2e --reporter=html

# Run single test file
pnpm --filter @villa/web test:e2e tests/e2e/auth.spec.ts

# Debug mode (headed browser)
pnpm --filter @villa/web test:e2e:headed

# Docker verbose output
./scripts/run-tests-docker.sh --e2e --verbose
```

## Environment Requirements

### Local Tests
- Node.js 20+
- pnpm 9.0.0
- Playwright browsers installed (`pnpx playwright install`)

### Docker Tests
- Docker 20+
- Docker Compose V2
- 8GB+ memory for full suite

## Performance Comparison

| Suite | Local | Docker | CI |
|-------|-------|--------|-----|
| Unit | 20s | 30s | 25s |
| Integration | 30s | 45s | 40s |
| E2E | 90s | 120s | 110s |
| **Total** | 140s | 195s | 175s |

**Note:** Docker adds ~20-30% overhead but guarantees CI parity.

## Common Issues

### "Port 5432 already in use"
```bash
# Stop local PostgreSQL
brew services stop postgresql@17

# Or use Docker with different port
# Edit docker-compose.test.yml → ports: ["5433:5432"]
```

### "Playwright browsers not found"
```bash
# Local install
pnpx playwright install chromium

# Docker rebuild
pnpm test:docker:e2e --no-cache
```

### "Out of memory"
```bash
# Increase Docker memory: Docker Desktop → Settings → Resources
# Minimum 8GB for full suite
```

### "Tests pass locally, fail in CI"
```bash
# Use Docker to match CI environment
pnpm test:docker:e2e

# Check for timing issues
pnpm --filter @villa/web test:e2e --repeat-each=3
```

## Integration with Git Hooks

### Pre-commit (fast)
```bash
# .githooks/pre-commit
#!/bin/bash
pnpm test:docker:unit || exit 1
```

### Pre-push (comprehensive)
```bash
# .githooks/pre-push
#!/bin/bash
pnpm test:docker:parallel || exit 1
```

## CI/CD Usage

See `.github/workflows/test-docker.yml.example` for GitHub Actions integration.

**Key Features:**
- Parallel job execution (unit + integration + security)
- Artifact upload on failure
- Docker layer caching
- Branch protection integration

---

**For full documentation, see:** [DOCKER-TESTING.md](DOCKER-TESTING.md)
