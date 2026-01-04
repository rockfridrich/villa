# Session Reflection: Avatar Male/Female/Other Implementation

**Date:** 2026-01-04
**Task:** Commit avatar changes and test on beta
**Outcome:** Completed but highly inefficient

---

## Velocity Metrics

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Tool calls for deploy check | ~15 | 2-3 | FAIL |
| Sub-agents spawned | 0 | 3-4 | FAIL |
| Manual sleep/poll cycles | 6+ | 0 | FAIL |
| Parallel operations | 0 | 3+ | FAIL |
| Time burned polling | ~8 min | 0 | FAIL |

---

## What Went Wrong

### 1. No Sub-Agent Usage (Critical)
**Should have done:**
```
@ops "Monitor deploy 20694307681 and report when staging is live"
@test "Run avatar E2E tests against beta.villa.cash"
```

**Actually did:**
- Manual `gh run view` commands
- Manual `sleep 60 && gh run view` repeated 6+ times
- Manual `npx playwright test` with full output parsing

### 2. Sequential Polling Instead of Background Tasks
**Should have done:**
```
Task tool with run_in_background: true
Continue working while deploy runs
Check output when needed
```

**Actually did:**
- Blocked on each `sleep 60` command
- Waited synchronously for each status check
- Burned context on repeated identical queries

### 3. No Parallel Debugging
**When tests failed showing "6 elements":**

**Should have done:**
```
Parallel:
1. @explore "Why does getStyleButton find 6 elements?"
2. @test "Run single avatar test with debug output"
3. Continue analyzing locally
```

**Actually did:**
- Sequential file reads
- Manual git log checks
- More manual test runs

### 4. Ignored Agent Definitions
The project has explicit agent definitions:
- `@ops` for GitHub Actions, deploys, git
- `@test` for running tests
- `@explore` for codebase investigation

All three would have been appropriate. None were used.

---

## Root Cause Analysis

### Mental Model Failure
Started with "I'll just check the deploy status" mindset instead of "This is an ops task, delegate it."

### Pattern Recognition Gap
Did not recognize these patterns:
- "Wait for CI" → @ops background task
- "Run tests against URL" → @test agent
- "Debug test failure" → @explore agent

### Context Efficiency Blindness
Each `sleep 60` command:
- Uses a tool call
- Returns minimal information
- Could have been delegated once

---

## Recommendations

### 1. Default to Agents for Multi-Step Tasks
**Rule:** If a task has >2 steps, spawn an agent.

```
# Instead of manual polling:
@ops "Deploy is running (ID: X). Monitor and report when complete."

# Instead of manual test runs:
@test "Run avatar E2E tests against beta.villa.cash and summarize results"
```

### 2. Use Background Tasks for Waiting
```typescript
Task tool: {
  run_in_background: true,
  prompt: "Monitor deploy and report status"
}
// Continue other work
// Check TaskOutput when needed
```

### 3. Parallel Debug Pattern
When something fails, spawn parallel investigations:
```
Parallel agents:
1. @explore "Find root cause of X"
2. @test "Run minimal repro of X"
3. Continue manual analysis
```

### 4. Pre-Task Agent Check
Before starting any task, ask:
- Is this an ops task? → @ops
- Does it involve tests? → @test
- Does it need investigation? → @explore
- Is it code changes? → @build

---

## Specific Anti-Patterns Exhibited

| Anti-Pattern | Count | Fix |
|--------------|-------|-----|
| Manual sleep polling | 6 | Background @ops task |
| Sequential status checks | 8 | Single @ops monitor |
| Manual test execution | 2 | @test agent |
| Sequential file reads | 5 | Parallel Read calls |
| No parallelism | All | Always consider parallel |

---

## Action Items for LEARNINGS.md

1. **CI Monitoring**: Always delegate to @ops with `run_in_background: true`
2. **Test Execution**: Always use @test agent for running tests against URLs
3. **Debug Parallelism**: When debugging, spawn @explore + @test in parallel
4. **Agent-First**: Check agent applicability BEFORE starting manual work

---

## Token Cost Estimate

| Activity | Est. Tokens | With Agents |
|----------|-------------|-------------|
| Deploy polling | ~3000 | ~500 |
| Test execution | ~2000 | ~400 |
| Debug analysis | ~1500 | ~300 |
| **Total** | **~6500** | **~1200** |

**Efficiency loss: ~5x**

---

## Session Summary

The avatar implementation itself was correct. The delivery process was highly inefficient due to not using the agent infrastructure that exists specifically for these tasks.

**Key Learning:** The agent system is not optional tooling - it's the primary development interface. Manual operations should be the exception, not the default.
