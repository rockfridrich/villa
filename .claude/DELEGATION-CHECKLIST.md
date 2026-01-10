# Delegation Checklist

Run this checklist every session to ensure proper orchestration.

## Session Start

- [ ] Read `patterns/INDEX.md` (NOT full LEARNINGS.md)
- [ ] Check `bd ready` for available work
- [ ] Note daily cost budget: **$50 max**
- [ ] Confirm: "My job is to ORCHESTRATE, not IMPLEMENT"

## Every 3 Interactions (Self-Check)

Ask yourself:

| Question | If YES | Action |
|----------|--------|--------|
| Am I reading >3 files? | Stop | Use `@explore` agent |
| Am I writing code? | Stop | Use `@build` agent |
| Am I running tests? | Stop | Use `@test` agent |
| Am I doing git operations? | Stop | Use `@ops` agent |
| Am I reviewing code? | Stop | Use `@review` agent |

**Cost tracking (mental estimate):**
- Each Opus tool call: ~$0.01
- Each Sonnet agent: ~$0.002
- Each Haiku agent: ~$0.0001
- Target: <$5/session

## Before Committing

- [ ] Used `@quality-gate` or ran `pnpm verify`
- [ ] All tests pass locally
- [ ] No secrets in diff
- [ ] Commit message follows conventional format

## Before Creating PR

- [ ] Ran `./scripts/workflows/pr.sh`
- [ ] Used `@review` agent for code review
- [ ] CI passing on branch

## Session End

### Delegation Report

```
Delegation rate: ___% (target: 80%+)
- @explore calls: ___
- @build calls: ___
- @test calls: ___
- @ops calls: ___
- Direct implementation: ___ (should be 0)

Estimated cost: $___ (target: <$5)
```

### Grade Yourself

| Grade | Criteria |
|-------|----------|
| A | 80%+ delegation, <$5, no direct implementation |
| B | 60%+ delegation, <$10, minimal direct impl |
| C | 40%+ delegation, <$20, some direct impl |
| D | <40% delegation, >$20, significant direct impl |
| F | No delegation, Opus did everything |

**My session grade: ___**

## Anti-Patterns to Avoid

❌ Reading full files when @explore could search
❌ Writing code when @build exists
❌ Running tests directly when @test could do it
❌ Manual git commands when @ops handles it
❌ Polling CI status instead of background monitoring
❌ Implementing before spec exists
❌ Fixing CI failures >2 times without asking

## Quick Commands

```bash
# Enforced workflows (USE THESE)
./scripts/workflows/commit.sh      # Commit with protocol
./scripts/workflows/push.sh        # Push with CI monitoring
./scripts/workflows/pr.sh          # Create PR with checks
./scripts/workflows/implement.sh   # Implement with delegation

# Agent invocation
@explore "Find files matching X"
@build "Implement feature from spec Y"
@test "Run tests for component Z"
@ops "Commit changes with message M"
@review "Review PR #N"
```
