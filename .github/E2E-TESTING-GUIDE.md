# E2E Testing Guide

Quick reference for the new parallel E2E testing infrastructure.

## What Changed

E2E tests now run on **4 separate machines in parallel** instead of sequentially on 1 machine.

## How It Works

### PR Workflow
```
┌─────────────┐
│  quick-ci   │  Lint + Typecheck (~2 min)
└──────┬──────┘
       │
       ├─────────────────────────────────────┐
       │                                     │
┌──────▼──────┐  ┌──────────┐  ┌──────────┐ │
│ E2E Shard 1 │  │  Shard 2 │  │  Shard 3 │ │ Shard 4
│   Machine   │  │  Machine │  │  Machine │ │ Machine
│   (25%)     │  │   (25%)  │  │   (25%)  │ │  (25%)
└──────┬──────┘  └─────┬────┘  └─────┬────┘ └───┬────
       │               │              │          │
       └───────────────┴──────────────┴──────────┘
                       │
                ┌──────▼──────┐
                │ Merge       │  Combine reports
                │ Reports     │
                └──────┬──────┘
                       │
                ┌──────▼──────┐
                │   Deploy    │  If tests pass
                │   Preview   │
                └─────────────┘
```

**Timeline**:
- Before: ~12 minutes total
- After: ~4 minutes total
- **3x faster feedback**

## For Developers

### Viewing Results

**GitHub Actions UI**:
- See 4 parallel jobs: "E2E Tests (Shard 1/4)" through "E2E Tests (Shard 4/4)"
- Each shard shows its portion of tests
- "Merge E2E Reports" shows combined results

**Downloading Reports**:
```bash
# Download merged report (recommended)
gh run download <run-id> -n e2e-report-merged

# Or download specific shard
gh run download <run-id> -n e2e-report-shard-1
```

### Debugging Failures

1. **Check which shard failed**:
   - Look at Actions summary
   - Failed shards show ❌

2. **Download the report**:
   - Click on failed job
   - Scroll to "Artifacts" section
   - Download `e2e-report-shard-X` or `e2e-report-merged`

3. **View locally**:
   ```bash
   cd playwright-report
   npx playwright show-report
   ```

### Testing Locally

You can simulate sharding locally:

```bash
# Run shard 1 of 4
pnpm --filter @villa/web exec playwright test --project=chromium --shard=1/4

# Run shard 2 of 4
pnpm --filter @villa/web exec playwright test --project=chromium --shard=2/4

# Run all tests (no sharding)
pnpm run test:e2e:chromium
```

## For CI/CD Maintainers

### Architecture

**Reusable Action**: `.github/actions/setup-test-env/action.yml`
- Handles pnpm, Node.js, dependencies setup
- Manages Playwright browser caching
- Caches Next.js builds
- Used by 10+ jobs across both workflows

**Cache Strategy**:
```yaml
Playwright: playwright-{os}-{lockfile-hash}-{browser}
Next.js:    nextjs-{os}-{lockfile-hash}-{source-hash}
pnpm:       Handled by actions/setup-node
```

**Shard Distribution**:
- Playwright automatically balances tests across shards
- Each machine is completely independent
- No shared state between runners

### Monitoring

**Success Indicators**:
- All 4 shards complete ✅
- Merge job succeeds ✅
- Merged report artifact created ✅

**Failure Scenarios**:

| Scenario | What It Means | Action |
|----------|---------------|--------|
| 1 shard fails | Specific tests failing | Debug that shard |
| All shards fail | Setup issue | Check dependencies/config |
| Merge job fails | Report corruption | Re-run workflow |
| Cache miss | First run or lockfile changed | Expected, will rebuild |

### Cost Analysis

**GitHub Actions Minutes**:
- Before: 1 machine × 12 min = 12 minutes
- After: 4 machines × 3 min = 12 minutes
- **Same cost, 3x faster**

**Why no cost increase?**
- Parallel execution doesn't cost more on GitHub Actions
- You pay for total runtime, not wall-clock time
- 4 machines running 3 min each = 12 minutes total

## Troubleshooting

### "Merge reports failed"

**Cause**: Playwright merge-reports command failed

**Solution**:
```bash
# Re-run failed jobs in GitHub UI
# Or manually merge locally:
pnpm --filter @villa/web exec playwright merge-reports --reporter html ./reports/*
```

### "Some tests skipped in shard"

**Cause**: Playwright's automatic distribution

**Solution**: This is expected. Each shard runs different tests.

### "Cache not working"

**Cause**: Lockfile changed or first run

**Solution**:
- Check if `pnpm-lock.yaml` was modified
- Wait for first run to complete (will populate cache)
- Subsequent runs will be faster

### "Shard timing imbalance"

**Cause**: Some shards finish much faster than others

**Solution**:
- Current: File-based distribution
- Future: Duration-based distribution (TBD)

## Quick Commands

```bash
# Check workflow status
gh run list --workflow=ci.yml

# View specific run
gh run view <run-id>

# Download artifacts
gh run download <run-id>

# Re-run failed jobs
gh run rerun <run-id> --failed

# Test locally with sharding
pnpm --filter @villa/web exec playwright test --shard=1/4
```

## Related Docs

- [E2E-PARALLEL-TESTING.md](../E2E-PARALLEL-TESTING.md) - Full technical details
- [Playwright Sharding](https://playwright.dev/docs/test-parallel#sharding)
- [GitHub Actions Caching](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows)
