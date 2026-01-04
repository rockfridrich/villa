# Reflection: CI Loop Anti-Pattern

**Date:** 2026-01-05
**Issue:** Spent ~45 min in a loop trying to fix CI instead of understanding root cause

---

## What Happened

```
1. Push celebration code → CI fails
2. Increase timeout 800→1200ms → CI fails
3. Increase timeout 1200→1500ms → CI fails
4. Manual polling gh run list (8+ times)
5. Finally checked beta health → timestamp STUCK at 15:13
6. Root cause: DigitalOcean deploy not rebuilding
```

**Time wasted:** ~45 min
**Tool calls wasted:** 30+
**Root cause discovery:** Should have been step 2, not step 15

---

## Anti-Patterns Committed

| Anti-Pattern | Count | Time Lost |
|--------------|-------|-----------|
| Manual CI polling | 8+ | ~15 min |
| Fixing wrong problem | 3 attempts | ~20 min |
| Not checking deployment health | 1 | ~10 min |
| Sequential instead of parallel | Many | N/A |

---

## How to Avoid Completely

### 1. ALWAYS Check Deployment First

```bash
# BEFORE debugging CI failures:
curl -s $BETA_URL/api/health | jq .timestamp
# If timestamp is old → deployment issue, not code issue
```

### 2. Time-Box CI Debugging

```
IF ci_fails_twice_with_same_symptom:
    STOP
    CHECK deployment_health
    DELEGATE to @ops if infra issue
    MOVE ON to other work
```

### 3. Use Real Data for Decisions

```bash
# How long does deploy actually take?
doctl apps list-deployments $APP_ID --output json | \
  jq '[.[] | .duration] | add / length'

# How long does CI actually take?
gh run list --limit 10 --json updatedAt,createdAt | \
  jq '[.[] | ((.updatedAt | fromdate) - (.createdAt | fromdate))] | add / length'
```

### 4. Fail Fast Principle

After 2 CI failures with same error:
1. Check if target environment has new code
2. If not → infra issue → delegate
3. If yes → real bug → debug locally first

---

## CLAUDE.md Updates Needed

Add to principles:

```markdown
## Debugging Principles

1. **Check deployment before code** - CI fails? Check if target has new code first.
2. **Two-strike rule** - Same failure twice? Stop and investigate root cause.
3. **Time-box loops** - Max 10 min on CI debugging before delegating.
4. **Real data decisions** - Use actual timestamps, not assumptions.
```

---

## Metrics That Would Have Helped

| Metric | How to Get | Decision |
|--------|------------|----------|
| Beta timestamp | `curl $URL/api/health` | If old → deploy issue |
| Deploy duration | DO API | Set realistic wait time |
| CI duration | GitHub API | Know when to check |
| Last successful deploy | DO API | Compare to current |

---

## Session Outcome

- Celebration code: ✅ Correct, works locally
- CI status: ❌ Blocked by deployment
- Root cause: DO deploy not rebuilding
- Resolution: Forced rebuild (pending)

**Learning:** Would have saved 40+ min by checking `curl /api/health` timestamp FIRST.
