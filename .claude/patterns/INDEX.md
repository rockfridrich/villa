# Pattern Index

Load patterns ON-DEMAND, not all at once. This keeps relevant context in the active window.

## Quick Reference

| Situation | Pattern | Location | Action |
|-----------|---------|----------|--------|
| CI fails 2x same issue | Two-Strike Rule | LEARNINGS.md #55 | STOP, check deploy health |
| User says "commit" | Commit Protocol | agents/ops.md | Use `./scripts/workflows/commit.sh` |
| User says "implement" | Spec-First | SYSTEM_PROMPT.md | Check spec exists first |
| Docker issues | Pre-Check | LEARNINGS.md #63 | Check Docker daemon + memory |
| Porto auth changes | Mode Selection | LEARNINGS.md #50 | Verify API exists first |
| API integration | Verify Before Plan | LEARNINGS.md #65 | Check types in node_modules |
| Session resume | Resume Protocol | LEARNINGS.md #66 | Use git diff, not full re-read |
| E2E test flaky | Timing Issues | LEARNINGS.md #45 | Increase timeout, add waitFor |
| Build fails | Cache Clear | LEARNINGS.md #12 | rm -rf .next && pnpm dev |

## When to Load Full LEARNINGS.md

Only load full LEARNINGS.md when:
1. Debugging unfamiliar error
2. User explicitly asks about patterns
3. Writing new pattern (to avoid duplicates)

Otherwise: Use this index → Load specific pattern → Apply

## Agent Selection Guide

| Task Type | Agent | Model | Cost/call |
|-----------|-------|-------|-----------|
| File search, exploration | @explore | Haiku | $0.0001 |
| Running tests | @test | Haiku | $0.0001 |
| Git operations, deploy | @ops | Haiku | $0.0001 |
| Code implementation | @build | Sonnet | $0.002 |
| UI/UX work | @design | Sonnet | $0.002 |
| Code review | @review | Sonnet | $0.002 |
| Architecture decisions | @architect | Opus | $0.01 |
| Spec writing | @spec | Opus | $0.01 |

**Rule:** Use the CHEAPEST agent that can do the job.

## Workflow Scripts

| Script | When to Use |
|--------|-------------|
| `./scripts/workflows/commit.sh` | Any commit (enforces protocol) |
| `./scripts/workflows/push.sh` | Any push (adds CI monitoring) |
| `./scripts/workflows/pr.sh` | Creating PRs (runs checks) |
| `./scripts/workflows/implement.sh` | Feature implementation (enforces spec-first) |

## Cost Budget

| Timeframe | Budget | Typical Usage |
|-----------|--------|---------------|
| Per session | $5 | 3-4 features, lots of delegation |
| Per day | $50 | Full workday |
| Per week | $350 | Target for efficient ops |

**Current:** $970/week → **Target:** $350/week

## Red Flags (Stop and Ask)

🚨 **Stop immediately if:**
- Same CI failure 2x (Two-Strike Rule)
- No spec exists for feature request
- Cost estimate >$10 for single task
- Implementing directly instead of delegating
- Reading >5 files without @explore

## Session Checklist

```
[ ] Loaded this INDEX.md
[ ] Checked bd ready
[ ] Noted cost budget
[ ] Using workflows, not manual commands
[ ] Delegating to agents
```
