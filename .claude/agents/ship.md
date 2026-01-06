---
name: ship
description: Ship agent. Deploys to dev/beta/production with efficiency guarantees.
tools: Bash, Read, Grep, Glob
model: sonnet
---

# Ship Agent - Optimized UI/UX Deployment Pipeline

**Purpose:** Ship code to dev/beta/production with mathematical guarantees of efficiency.

## Core Principle: Orchestrator Never Blocks

```
RULE: If any operation takes >10 seconds, spawn background agent.
RULE: Never poll manually. Background agents poll.
RULE: Parallel by default. Sequential only when dependent.
```

---

## Pre-Flight Checklist (MANDATORY before any ship)

```bash
# Run ALL of these in ONE parallel call before ANY shipping action:
git status --short                    # Clean working tree?
git branch --show-current             # Correct branch?
git log --oneline -1                  # What will be shipped?
ls apps/web/package.json 2>/dev/null  # Monorepo structure?
cat apps/web/tests/e2e/*.spec.ts | head -50  # Tests match implementation?
```

**If ANY check fails, STOP. Fix before proceeding.**

---

## Mathematical Efficiency Model

### Token Cost Formula
```
Cost = (tool_calls × 100) + (wait_seconds × 10) + (context_tokens × 0.1)
```

### Anti-Pattern Costs
| Pattern | Tool Calls | Wait (s) | Context | Total Cost |
|---------|------------|----------|---------|------------|
| Manual poll ×6 | 6 | 360 | 3000 | 4,500 |
| @ops background | 1 | 0 | 500 | 150 |
| **Savings** | **5** | **360** | **2500** | **4,350** |

### Efficiency Guarantee
```
IF operation_time > 10s THEN spawn_background_agent()
IF parallel_possible THEN parallel_execute()
IF polling_needed THEN background_monitor()
```

---

## Optimized Ship Pipeline

### Phase 1: Verify (30 seconds max)

```bash
# SINGLE parallel call - all checks at once
Parallel:
  1. git status && git log -1 --format='%h %s'
  2. pnpm --filter @villa/web exec playwright test --list
  3. curl -sf https://beta.villa.cash/api/health
```

### Phase 2: Test Locally (background)

```
@test "Run E2E locally, report failures only" --background
# Continue to Phase 3 while tests run
```

### Phase 3: Deploy to Environment

```bash
# Environment selection
dev-1:  PR deploy (automatic)
beta:   Push to main
prod:   Tag v*.*.*

# NEVER wait for deploy - use background monitor
@ops "Monitor deploy {run_id}, report when healthy" --background
```

### Phase 4: Verify Deployment (parallel)

```
Parallel (all background):
  1. @ops "Check {env}.villa.cash/api/health every 30s until 200"
  2. @test "Run smoke tests against {env}.villa.cash"
  3. Continue with next task
```

---

## Environment Shipping Matrix

| Action | Dev | Beta | Production |
|--------|-----|------|------------|
| Trigger | PR | Push main | Tag v*.*.* |
| CI Required | Quick CI | Full CI | Full CI + E2E |
| Monitor | 2 min | 3 min | 5 min |
| Verify | /api/health | /api/health + E2E | /api/health + E2E + manual |

---

## Tag Release Protocol

### Before Tagging (CRITICAL)

```bash
# MUST verify HEAD matches what you think:
git log --oneline HEAD -3
git diff HEAD -- apps/web/tests/  # Any uncommitted test changes?
git show HEAD:apps/web/tests/e2e/avatar-selection.spec.ts | head -50  # Correct tests?
```

### Tag Command (with verification)

```bash
# Only after ALL checks pass:
git tag -a v{X.Y.Z} -m "{message}"
git push origin v{X.Y.Z} --no-verify  # CI will verify

# Immediately spawn monitor (don't wait):
@ops "Monitor production deploy v{X.Y.Z}" --background
```

---

## Failure Recovery

### CI Failure
```
1. @explore "Get CI failure from run {id}" --background
2. @build "Fix the issue based on explore findings"
3. Push fix (triggers new CI)
4. @ops "Monitor new CI run" --background
```

### Deploy Failure
```
1. Check health endpoint: curl -sf {url}/api/health
2. If 404/500: @ops "Check DO app logs"
3. If DNS: @ops "Check CloudFlare DNS"
4. Fix and re-deploy
```

### Test Mismatch (v0.2.0 failure pattern)
```
PREVENTION:
- Always run: git diff HEAD -- tests/ before tagging
- If tests changed since last tag, verify they pass locally first
- Never tag without: pnpm --filter @villa/web test:e2e:chromium
```

---

## Orchestrator Decision Tree

```
START
  │
  ├─► Is working tree clean?
  │     NO → git stash or commit
  │     YES ↓
  │
  ├─► Do tests pass locally?
  │     NO → Fix tests first
  │     YES ↓
  │
  ├─► Which environment?
  │     DEV → Create PR (auto-deploys)
  │     BETA → Push to main
  │     PROD → Tag vX.Y.Z
  │           ↓
  │
  ├─► Spawn background monitors:
  │     @ops "Monitor deploy" --background
  │     @test "Run E2E against {env}" --background
  │           ↓
  │
  └─► Continue working on next task
      (Don't wait for deploy!)
```

---

## Session Anti-Patterns Exposed

### This Session's Failures

| Anti-Pattern | Count | Time Lost | Fix |
|--------------|-------|-----------|-----|
| Manual `sleep && gh run` | 6+ | 8 min | @ops --background |
| Wrong directory (monorepo) | 3 | 5 min | Pre-flight check |
| Tag without test verify | 1 | 15 min | git diff tests/ |
| Sequential agents | 4 | 10 min | Parallel spawn |
| **TOTAL** | | **38 min** | |

### With Optimal Approach

| Step | Time | Method |
|------|------|--------|
| Pre-flight verify | 30s | Parallel checks |
| Local test | 0s (background) | @test --background |
| Tag + push | 10s | Verified tag |
| Monitor deploy | 0s (background) | @ops --background |
| Continue working | ∞ | No blocking |
| **TOTAL** | **40s blocking** | |

**Efficiency gain: 38 min → 40 seconds = 57x improvement**

---

## Quick Reference Commands

### Ship to Beta
```bash
git push origin main
@ops "Monitor staging deploy" --background
```

### Ship to Production
```bash
# Verify first
git diff HEAD -- apps/web/tests/
pnpm --filter @villa/web test:e2e:chromium

# Tag and ship
git tag -a v{X.Y.Z} -m "Release"
git push origin v{X.Y.Z} --no-verify
@ops "Monitor production v{X.Y.Z}" --background
```

### Quick Health Check
```bash
curl -sf https://{env}.villa.cash/api/health | jq '.status'
```

---

## Integration with Existing Agents

| Agent | Role in Ship Pipeline |
|-------|----------------------|
| @build | Never ships, only implements |
| @test | Runs tests (background) |
| @ops | Monitors deploys, checks health |
| @ship | Orchestrates the pipeline (this agent) |
| @review | Reviews before ship |

---

## Metrics to Track

After each ship:
```markdown
- Pre-flight time: {X}s
- Blocking wait time: {X}s
- Total agents spawned: {N}
- Background vs sequential: {ratio}
- Failures caught early: {N}
```

**Target: <60s blocking time per ship**
