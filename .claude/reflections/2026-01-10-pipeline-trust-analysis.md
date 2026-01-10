# Pipeline Trust Analysis: Why Claude Code Doesn't Reuse Flows
**Date:** 2026-01-10  
**Scope:** Deep analysis of protocol adherence, agent automation, and trust architecture  
**Status:** CRITICAL — Identifies fundamental gaps in current orchestration model

---

## Executive Summary

**User Concern:** "I want as much as I can to be reused and strictly pipelined to be sure I can trust you"

**Reality Check:** Despite having:
- 17 agent definitions (`.claude/agents/`)
- 66+ documented patterns (`.claude/LEARNINGS.md`)
- Established workflows (`scripts/bd-workflow.sh`)
- Architecture documentation (SYSTEM_PROMPT.md, MANIFESTO.md)

**Claude Code currently:**
- Does NOT automatically invoke agents for known patterns
- Does NOT follow established pipelines without prompting
- Does NOT enforce mandatory flows (commit protocol, test-before-push, etc.)
- Reinvents approaches each session despite existing solutions

**Root Cause:** Architectural limitation — Claude Code is a **conversational assistant**, not a **workflow engine**.

---

## Part 1: Flow Reuse Analysis

### What SHOULD Be Automatic

| Flow | Trigger | Expected Behavior | Current Reality |
|------|---------|-------------------|-----------------|
| **Commit Protocol** | User says "commit" | Auto-invoke git safety checks → @quality-gate → commit with Co-Authored-By | Manual process, inconsistent format |
| **Pre-Push Validation** | Before ANY push | Auto-run `pnpm verify` → delegate to @test | Often skipped, causes CI failures |
| **Deploy Monitoring** | After push to main | Auto-invoke @ops background monitor → report when done | Manual polling loops (79 fix commits in 7 days) |
| **Agent Routing** | User request | @router classifies → delegates to appropriate tier → @quality-gate validates | Orchestrator (Opus) implements directly |
| **Spec-First Enforcement** | "Implement X" without spec | Block + ask for spec | Implements without spec, causes rework |
| **Test Execution** | After code changes | Auto-invoke @test haiku → report results | Manual `pnpm test` by orchestrator |
| **Two-Strike Rule** | 2nd CI failure on same issue | STOP → check deployment health → ask user | Continues iterating (wasted 60+ min on 2026-01-08) |

### Why Aren't They Automatic?

**Technical Reality:**
```
Claude Code = LLM + Tool Calling + Conversation History
≠ Workflow Engine with triggers and hooks
```

**What's Missing:**
1. **Event triggers** — No "on_commit", "on_push", "on_ci_failure" hooks
2. **State machine** — No "if in state X and event Y, execute flow Z"
3. **Mandatory gates** — No way to enforce "must run test before push"
4. **Pattern recognition** — No automatic detection of "this matches commit pattern"

**What EXISTS (but underused):**
- Agent definitions exist but require explicit `@agent` mention
- LEARNINGS.md exists but Claude doesn't auto-apply patterns
- Scripts exist but Claude doesn't auto-invoke them
- Protocols exist but Claude treats them as suggestions, not rules

---

## Part 2: Agent Pipeline Gaps

### When Agents SHOULD Auto-Invoke (But Don't)

#### 1. @test Should Auto-Run After:
- Any code change to `src/`
- Before any commit
- Before any push
- When CI fails 2x (sanity check locally)

**Current:** Orchestrator runs tests manually or skips entirely.

**Why:** No "post-code-change" hook in Claude Code architecture.

#### 2. @review Should Auto-Run Before:
- Creating any PR
- Merging to main
- After 400+ line changes (complexity threshold)

**Current:** Review is manual, inconsistent.

**Why:** No "pre-PR" gate in workflow.

#### 3. @ops Should Auto-Run For:
- Any git operation (commit, push, PR)
- CI/deploy monitoring (background)
- Deployment verification after merge

**Current:** Orchestrator does git operations directly (burns 60x cost).

**Why:** Git commands feel "simple" so Opus does them instead of delegating.

#### 4. @quality-gate Should Auto-Run:
- Before every commit
- Before every PR
- After every implementation by @build

**Current:** Skipped unless explicitly mentioned.

**Why:** No enforcement mechanism.

### The Delegation Problem

**By the numbers (last 7 days):**
- 79 fix/debug commits (= reactive iteration)
- 33 changes to LEARNINGS.md (= high churn, patterns not sticky)
- 44 Beads tasks (good: task tracking works)
- ~15+ CI failures (= testing gaps)

**Evidence of Opus implementing directly:**
- Most recent 30 commits: No "@build" mentions in any
- LEARNINGS.md patterns: Written BY Opus AFTER doing the work (should have delegated)
- File churn: `porto.ts` changed 10x (= architecture uncertainty, not delegation)

**Agent utilization (estimated from reflections):**
- @build: ~20% (should be 60%+)
- @test: ~10% (should be 30%+)
- @ops: ~5% (should be 20%+)
- @explore: ~15% (should be 20%+)
- Opus doing work: ~50% (should be 10%+)

**Cost impact:**
```
Current: Opus $882/week (91% of $970 total)
Target:  Opus $150/week (30% of $500 total)
Gap:     $732/week waste = $38k/year
```

---

## Part 3: Root Cause Analysis

### Why Claude Code Doesn't Follow Protocols Automatically

#### Problem 1: No Workflow Engine
**What users expect:**
```
"Commit these changes" →
  [Automatic pipeline]
  1. Check git status
  2. Run @quality-gate validation
  3. Stage files
  4. Generate commit message (format enforced)
  5. Run pre-commit hooks
  6. Commit with Co-Authored-By
  7. Run @test to verify nothing broke
  → Done, guaranteed consistent
```

**What Claude Code is:**
```
"Commit these changes" →
  [LLM interprets intent]
  1. Reads CLAUDE.md (maybe)
  2. Sees commit protocol (maybe)
  3. Decides to follow it (maybe)
  4. Executes bash commands
  5. Format varies by session
  → Inconsistent, depends on context window and interpretation
```

**Gap:** No state machine to enforce "these steps MUST execute in this order."

#### Problem 2: Pattern Matching ≠ Pattern Enforcement
**What exists:**
- LEARNINGS.md has 66 patterns
- Patterns #54, #55, #56 explicitly say "Background CI monitoring is MANDATORY"
- Two-Strike Rule is documented

**What happens:**
- Claude reads LEARNINGS.md at session start
- Context window fills with new information
- Old patterns drop out of attention
- Claude reinvents (manual CI polling happens again)

**Example from last week:**
```
Pattern #54 (2026-01-08): "Background CI Monitoring (CRITICAL)"
→ Saves 5-10 min per iteration

2026-01-09 session:
→ Manual CI polling still happened (pattern not auto-applied)
→ Another reflection written about the same issue
```

**Gap:** No "mandatory pattern enforcement" mechanism. Patterns are advisory, not binding.

#### Problem 3: Agent Invocation Is Manual
**Current model:**
```
User: "Implement feature X"
Claude: [Reads spec, implements directly with Opus]
Cost: $15 input + $75 output per 1M tokens
```

**Intended model:**
```
User: "Implement feature X"
Claude: @router "Classify feature X"
Router: "Complexity 3 → @build sonnet"
Claude: @build "Implement feature X per spec"
Build: [Implements with Sonnet]
Cost: $3 input + $15 output per 1M tokens
Savings: 5x reduction
```

**Why it doesn't happen:**
- No automatic routing (user must type `@build`)
- Orchestrator sees "simple" request, does it directly
- No cost awareness in real-time
- No "delegation enforcement" gate

#### Problem 4: Context Forgetting
**Session lifecycle:**
```
Start:    Reads SYSTEM_PROMPT.md, LEARNINGS.md, CLAUDE.md (~30k tokens)
          ✓ Knows all patterns

Middle:   User interaction, tool calls, file reads (100k+ tokens)
          ⚠️ Early context compressed/forgotten

End:      Operating on recent context only
          ✗ May not remember early patterns
```

**Evidence:**
- Two-Strike Rule documented but violated multiple times
- Opus Delegation Enforcement documented but not followed
- Porto Mode Selection Pattern documented but same mistake repeated

**Gap:** Long-running sessions lose early context. Patterns should be "loaded on demand" not "loaded once at start."

#### Problem 5: No Enforcement Layer
**What's needed:**
```typescript
// Hypothetical enforcement layer
enforcePattern("commit", async (args) => {
  await runQualityGate()
  await runTests()
  const msg = await generateCommitMessage(args)
  await gitCommit(msg)
  return { success: true }
})
```

**What exists:**
```markdown
## Before You Commit (CRITICAL)
1. Run pnpm verify
2. Generate message with Co-Authored-By
3. ...
```

**Gap:** Markdown instructions ≠ Code enforcement. Claude can skip steps. No technical barrier.

---

## Part 4: Trust Architecture — What Would Work

### Definition of "Trustable Pipeline"

A trustable pipeline has:
1. **Deterministic** — Same input → same output, always
2. **Enforced** — Steps cannot be skipped
3. **Observable** — Clear status at each stage
4. **Auditable** — Log of what executed, when, why
5. **Fail-safe** — Errors stop pipeline, don't silently continue

### Current State vs. Target

| Property | Current | Target |
|----------|---------|--------|
| Deterministic | ❌ Varies by session | ✅ Scripted flows |
| Enforced | ❌ Advisory docs | ✅ Programmatic gates |
| Observable | ⚠️ Manual status checks | ✅ Auto-reporting |
| Auditable | ⚠️ Git log only | ✅ Beads + workflow log |
| Fail-safe | ❌ Continues on error | ✅ Stops on failure |

### Architecture That Would Enable Trust

#### Option A: Workflow Scripts (Pragmatic)
```bash
# scripts/workflows/commit.sh
# Enforces commit protocol programmatically

set -euo pipefail

echo "Running pre-commit validation..."
pnpm verify || exit 1

echo "Generating commit message..."
SCOPE=$(git diff --cached --name-only | head -1 | cut -d/ -f2)
read -p "Describe change: " DESC
MSG="feat($SCOPE): $DESC

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"

git commit -m "$MSG"

echo "Running post-commit tests..."
pnpm test:quick || echo "⚠️ Tests failed, check before push"
```

**Usage:**
```
User: "Commit these changes"
Claude: [Delegates to script]
./scripts/workflows/commit.sh
→ Pipeline ALWAYS executes correctly
```

**Pros:**
- ✅ Enforced (script must complete)
- ✅ Deterministic (same steps every time)
- ✅ Auditable (script logs)
- ✅ Works TODAY (no Claude changes needed)

**Cons:**
- ⚠️ Still requires Claude to invoke script
- ⚠️ Not automatic (user must ask for commit)

#### Option B: Git Hooks (Stronger)
```bash
# .git/hooks/pre-commit
#!/bin/bash
pnpm verify || exit 1
echo "✓ Pre-commit validation passed"
```

**Pros:**
- ✅ Automatic (triggers on git commit)
- ✅ Enforced (can't bypass)
- ✅ Works for human AND AI

**Cons:**
- ⚠️ Doesn't help with "which agent to delegate to"
- ⚠️ Only covers Git operations

#### Option C: Agent Router as Default (Behavioral)
**Make @router the mandatory first step:**

```markdown
# SYSTEM_PROMPT.md (updated)

## CRITICAL RULE: Delegation is Mandatory

Before ANY implementation work:
1. @router "Classify: {user request}"
2. Execute router recommendation
3. Synthesize results

If you find yourself reading implementation files, STOP.
You are orchestrator, not implementer.
```

**Enforcement via prompt engineering:**
```
Cost penalty reminder:
- Opus implementing directly: $75/1M tokens
- Opus → @build sonnet: $15/1M tokens
- Your session cost: ${current_session_cost}
- Daily budget: $50
- Remaining: ${50 - current_session_cost}

If you implement directly, you WILL exceed budget.
```

**Pros:**
- ✅ Works within Claude Code architecture
- ✅ Self-enforcing via cost awareness
- ✅ No external tools needed

**Cons:**
- ⚠️ Still depends on Claude following instructions
- ⚠️ May drift in long sessions

#### Option D: Skill Chains (Hybrid)
**Define reusable multi-agent flows:**

```yaml
# .claude/workflows/feature-implementation.yml
name: Implement Feature
trigger: User says "implement" or "build"
required_input: spec_path

steps:
  - agent: router
    action: classify_complexity
    output: complexity_level

  - agent: build
    condition: complexity_level <= 3
    action: implement
    input: spec_path

  - agent: test
    action: run_e2e
    parallel: true

  - agent: review
    action: code_review
    parallel: true

  - agent: quality-gate
    action: validate
    depends: [build, test, review]

  - agent: ops
    action: commit
    depends: [quality-gate]
    
output: PR URL or commit SHA
```

**How it works:**
```
User: "Implement passkey feature"
Claude: [Detects "implement" trigger]
        [Loads feature-implementation workflow]
        [Executes each step in order]
        [Reports progress]
        → Consistent pipeline every time
```

**Pros:**
- ✅ Declarative (easy to audit)
- ✅ Reusable across sessions
- ✅ Version controlled
- ✅ Observable (status per step)

**Cons:**
- ❌ Requires new tooling (workflow engine)
- ❌ Not available in current Claude Code

---

## Part 5: Concrete Solutions (Apply Today)

### Solution 1: Workflow Scripts (Immediate)

**Create enforced pipelines for common flows:**

```bash
# scripts/workflows/implement-feature.sh
# Enforces spec-first, delegation, testing

SPEC_PATH=$1
[[ -z "$SPEC_PATH" ]] && echo "Usage: $0 <spec-path>" && exit 1
[[ ! -f "$SPEC_PATH" ]] && echo "Spec not found: $SPEC_PATH" && exit 1

echo "📋 Reading spec..."
cat "$SPEC_PATH"

echo "🔀 Routing to @build agent..."
# Simulate agent call (actual implementation would use agent system)
echo "@build 'Implement $(basename "$SPEC_PATH" .md)'"

echo "🧪 Running tests..."
pnpm test:e2e || exit 1

echo "✅ Feature implementation pipeline complete"
```

**Update CLAUDE.md:**
```markdown
## Mandatory Workflows

When user requests implementation:
1. Check if spec exists: `ls specs/active/*.md`
2. If no spec: ASK for spec, don't implement
3. If spec exists: `./scripts/workflows/implement-feature.sh <spec>`
4. Script will enforce: spec-first → delegation → testing
```

### Solution 2: Pre-Commit Hook (Immediate)

```bash
# .git/hooks/pre-commit
#!/bin/bash
echo "🔍 Running quality checks..."

# Type check
pnpm typecheck || {
  echo "❌ Type check failed"
  exit 1
}

# Ensure Co-Authored-By in message (check after user writes it)
# This runs post-commit-msg, implemented as commit-msg hook instead

echo "✅ Pre-commit checks passed"
```

```bash
# .git/hooks/commit-msg
#!/bin/bash
COMMIT_MSG_FILE=$1
COMMIT_MSG=$(cat "$COMMIT_MSG_FILE")

if ! echo "$COMMIT_MSG" | grep -q "Co-Authored-By:"; then
  echo "❌ Missing Co-Authored-By line"
  echo ""
  echo "Add to commit message:"
  echo "Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
  exit 1
fi

echo "✅ Commit message format valid"
```

### Solution 3: Agent Delegation Reminder (Immediate)

**Add to SYSTEM_PROMPT.md (top of file):**

```markdown
# DELEGATION ENFORCEMENT (Check every 3 interactions)

After every 3 user interactions, ask yourself:
1. Am I reading implementation files? → STOP, delegate to @explore
2. Am I writing code? → STOP, delegate to @build
3. Am I running tests? → STOP, delegate to @test
4. Am I doing git operations? → STOP, delegate to @ops

Your job: Orchestrate, not implement.

Session cost: Track mentally
- Each Opus tool call: ~$0.01
- Each Sonnet tool call: ~$0.002
- Each Haiku tool call: ~$0.0001
- Daily budget: $50
- If you implement directly, you WILL exceed budget.
```

### Solution 4: Pattern Loading (Immediate)

**Create pattern index for on-demand loading:**

```markdown
# .claude/patterns/INDEX.md

## Quick Reference

When situation X occurs, load pattern Y:

| Situation | Pattern | File |
|-----------|---------|------|
| CI fails 2x same issue | Two-Strike Rule | LEARNINGS.md #55 |
| User says "commit" | Commit Protocol | agents/ops.md |
| User says "implement" | Spec-First + Delegation | SYSTEM_PROMPT.md |
| Docker issues | Docker Pre-Check | LEARNINGS.md #63 |
| Porto auth changes | Mode Selection | LEARNINGS.md #50 |
```

**Update SYSTEM_PROMPT.md:**
```markdown
## Context Loading Strategy

Don't load all patterns at session start. Load on-demand:

1. User makes request
2. Check `.claude/patterns/INDEX.md` for relevant pattern
3. Load ONLY that pattern
4. Apply pattern
5. Proceed

This keeps relevant patterns in active context window.
```

### Solution 5: Quality Gate Script (Immediate)

```bash
# scripts/quality-gate.sh
# Run before ANY commit or PR

echo "🚦 Quality Gate"

echo "1. Type check..."
pnpm typecheck || exit 1

echo "2. Security scan..."
pnpm audit:fix || echo "⚠️ Audit issues found"

echo "3. Test suite..."
pnpm test:quick || exit 1

echo "4. Check for secrets..."
git diff --cached | grep -iE "(API_KEY|SECRET|PASSWORD|TOKEN)" && {
  echo "❌ Possible secret in diff"
  exit 1
}

echo "✅ Quality gate passed"
```

---

## Part 6: Implementation Plan

### Phase 1: Immediate (Today)

**Goal:** Reduce cognitive load via scripts

```bash
# Create workflow scripts
mkdir -p scripts/workflows
touch scripts/workflows/commit.sh
touch scripts/workflows/implement-feature.sh
touch scripts/workflows/create-pr.sh
chmod +x scripts/workflows/*.sh

# Install git hooks
cp scripts/hooks/pre-commit .git/hooks/
cp scripts/hooks/commit-msg .git/hooks/
chmod +x .git/hooks/*

# Create pattern index
touch .claude/patterns/INDEX.md

# Update SYSTEM_PROMPT.md with delegation enforcement
# (Add cost tracking reminder)
```

**Expected impact:**
- ✅ Commit protocol enforced (can't skip steps)
- ✅ Quality gate enforced (can't commit broken code)
- ✅ Pattern loading optimized (less context waste)

### Phase 2: Behavior Change (Week 1)

**Goal:** Train orchestrator to delegate

```markdown
# .claude/DELEGATION-CHECKLIST.md (new file)

Run this checklist every session:

## Session Start
- [ ] Read patterns/INDEX.md (not full LEARNINGS.md)
- [ ] Check bd ready for work
- [ ] Note daily cost budget: $50

## During Session (every 3 interactions)
- [ ] Did I read >3 files? → Should have used @explore
- [ ] Did I write code? → Should have used @build
- [ ] Did I run tests? → Should have used @test
- [ ] Did I do git ops? → Should have used @ops
- [ ] Cost tracking: Estimated $X so far

## Session End
- [ ] Delegation rate: X% (target: 80%+)
- [ ] Cost: $X (target: <$5/session)
- [ ] Patterns applied: List them
- [ ] Grade: A/B/C/D/F
```

**Update CLAUDE.md:**
```markdown
## Session Protocol

At session start:
1. Load .claude/DELEGATION-CHECKLIST.md
2. Follow checklist throughout session
3. Self-grade at end
4. Report grade to user
```

### Phase 3: Measurement (Week 2)

**Goal:** Track delegation compliance

```bash
# scripts/measure-delegation.sh
# Analyze recent sessions for delegation rate

echo "📊 Delegation Analysis (last 7 days)"

# Count agent mentions in commit messages
AGENT_COMMITS=$(git log --since='7 days ago' --grep='@build\|@test\|@ops\|@review' --oneline | wc -l)
TOTAL_COMMITS=$(git log --since='7 days ago' --oneline | wc -l)

DELEGATION_RATE=$((AGENT_COMMITS * 100 / TOTAL_COMMITS))

echo "Agent-delegated commits: $AGENT_COMMITS / $TOTAL_COMMITS"
echo "Delegation rate: $DELEGATION_RATE%"
echo "Target: 80%+"

if [ $DELEGATION_RATE -lt 80 ]; then
  echo "❌ Below target. Review DELEGATION-CHECKLIST.md"
else
  echo "✅ On target!"
fi
```

Run weekly to track progress.

### Phase 4: Automation (Week 3-4)

**Goal:** Automatic workflow triggers

**Approach 1: Shell wrapper**
```bash
# bin/claude (wrapper script)
#!/bin/bash
# Intercepts user commands and enforces workflows

case "$1" in
  commit)
    ./scripts/workflows/commit.sh
    ;;
  implement)
    ./scripts/workflows/implement-feature.sh "$2"
    ;;
  pr)
    ./scripts/workflows/create-pr.sh
    ;;
  *)
    # Pass through to Claude Code
    claude "$@"
    ;;
esac
```

**Approach 2: Alias-based**
```bash
# Add to .bashrc or .zshrc
alias claude-commit='./scripts/workflows/commit.sh'
alias claude-implement='./scripts/workflows/implement-feature.sh'
alias claude-pr='./scripts/workflows/create-pr.sh'
```

User types `claude-commit` instead of asking Claude to commit.

---

## Part 7: Limitations & Constraints

### What Cannot Be Fixed (Architecture)

**1. Claude Code is not a workflow engine**
- Cannot add "on_event" triggers
- Cannot enforce "must execute step X before Y"
- Cannot run in background (except Bash with --run_in_background)

**2. LLM context window limits**
- Long sessions forget early patterns
- Cannot load ALL patterns in every interaction
- Must choose what to load (= risk of missing relevant pattern)

**3. No cost awareness in real-time**
- Claude doesn't know session cost mid-conversation
- Cannot auto-throttle when approaching budget
- Requires user intervention if overspending

**4. Conversational flexibility**
- Users can override ANY instruction
- Claude will comply if user insists
- No "hard gate" that user cannot bypass

### What CAN Be Mitigated

**1. Workflow scripts** → Encode pipelines programmatically
**2. Git hooks** → Enforce quality gates at commit time
**3. Pattern index** → Load patterns on-demand, not all at start
**4. Delegation checklist** → Prompt engineering for self-enforcement
**5. Measurement scripts** → Track compliance, surface issues

### The Trust Boundary

**Can trust:**
- Scripts (deterministic, enforceable)
- Git hooks (automatic, mandatory)
- Beads tracking (persistent, auditable)

**Cannot fully trust:**
- Claude following instructions (advisory, not binding)
- Patterns being remembered (context window limits)
- Cost staying under budget (no real-time awareness)

**Hybrid approach:**
```
Critical paths (commit, deploy, security):
  → Use scripts + hooks (enforceable)

Non-critical paths (research, drafting):
  → Use Claude flexibility (advisory)
```

---

## Part 8: Recommendations

### For Villa Project (Immediate)

**1. Create Workflow Scripts (Priority 1)**
```bash
scripts/workflows/commit.sh      # Enforce commit protocol
scripts/workflows/implement.sh   # Enforce spec-first + delegation
scripts/workflows/pr.sh          # Enforce testing + review before PR
```

**2. Install Git Hooks (Priority 1)**
```bash
.git/hooks/pre-commit    # Type check + tests
.git/hooks/commit-msg    # Enforce Co-Authored-By format
```

**3. Add Delegation Checklist (Priority 2)**
```bash
.claude/DELEGATION-CHECKLIST.md  # Self-check every session
```

**4. Create Pattern Index (Priority 2)**
```bash
.claude/patterns/INDEX.md        # On-demand pattern loading
```

**5. Add Cost Tracking (Priority 3)**
```bash
scripts/measure-cost.sh          # Weekly cost report
```

### For User's Workflow

**When starting a session:**
```
1. Load delegation checklist
2. Check bd ready for work
3. Note: "My job is orchestrate, not implement"
```

**When user requests implementation:**
```
1. Check if spec exists
2. If no spec: "Need spec first. Should I create one?"
3. If spec exists: ./scripts/workflows/implement.sh <spec>
```

**When user requests commit:**
```
./scripts/workflows/commit.sh
(Script enforces protocol automatically)
```

**At session end:**
```
1. Self-grade delegation rate
2. Report to user: "X% delegation, target 80%"
3. Update LEARNINGS.md if new pattern discovered
```

### For Long-Term Trust

**What to build:**
1. Workflow library (scripts for common flows)
2. Git hooks (enforce quality)
3. Pattern index (faster context loading)
4. Measurement dashboard (track compliance)

**What to accept:**
1. Claude will never be 100% deterministic
2. Some decisions require human judgment
3. Cost overruns may happen in complex sessions
4. Trust comes from audit trail, not perfection

**What to monitor:**
1. Delegation rate (target: 80%+)
2. Cost per session (target: <$5)
3. Fix commit rate (target: <20% of total)
4. CI failure rate (target: <10%)

---

## Part 9: Honest Assessment of Current State

### What's Working

1. **Beads integration** — Task tracking survives sessions ✅
2. **Agent definitions exist** — Clear roles for @build, @ops, @test ✅
3. **Patterns documented** — LEARNINGS.md has 66 patterns ✅
4. **Cost awareness** — User knows Opus is expensive ✅
5. **Reflection habit** — Regular session analysis ✅

### What's Not Working

1. **Agent delegation** — Opus implements directly ~50% of the time ❌
2. **Pattern reuse** — Same mistakes repeated (Docker, Porto, CI) ❌
3. **Protocol adherence** — Commit format inconsistent ❌
4. **Cost control** — 3x over budget ($970 vs $350/week) ❌
5. **Pipeline enforcement** — No mandatory gates ❌

### The Brutal Truth

**Claude Code is an AI assistant, not a workflow engine.**

It can:
- Suggest patterns
- Delegate to agents (when prompted)
- Execute workflows (when instructed)
- Learn from mistakes (when documented)

It cannot:
- Automatically enforce pipelines
- Remember all patterns in long sessions
- Stop itself from implementing directly
- Track cost in real-time

**To get trustable pipelines:**
- Encode them in scripts (not docs)
- Use git hooks for enforcement
- Prompt engineer for delegation
- Accept some flexibility (feature, not bug)

**User expectation management:**
```
"Strictly pipelined" = Scripts + hooks (feasible)
"Claude always follows protocols" = Not feasible (LLM limitation)
"Hybrid: Scripts for critical, Claude for exploratory" = Optimal
```

---

## Part 10: Action Items (Prioritized)

### This Week (Must Have)

- [ ] Create `scripts/workflows/commit.sh` (enforce commit protocol)
- [ ] Create `scripts/workflows/implement.sh` (enforce spec-first)
- [ ] Install git hooks (pre-commit + commit-msg)
- [ ] Create `.claude/DELEGATION-CHECKLIST.md`
- [ ] Create `.claude/patterns/INDEX.md`
- [ ] Update SYSTEM_PROMPT.md with delegation enforcement

**Estimated time:** 4 hours  
**Expected impact:** 50% reduction in protocol violations

### Next Week (Should Have)

- [ ] Create `scripts/measure-delegation.sh`
- [ ] Create `scripts/measure-cost.sh`
- [ ] Document workflow scripts in CLAUDE.md
- [ ] Train on delegation: Run 5 sessions with checklist
- [ ] Review and grade sessions (target: B+ average)

**Estimated time:** 3 hours  
**Expected impact:** Visibility into compliance

### Month 1 (Nice to Have)

- [ ] Build workflow library (10+ common flows)
- [ ] Create dashboard for cost/delegation tracking
- [ ] Automate pattern application (helper scripts)
- [ ] Write "Villa Development Handbook" consolidating all patterns

**Estimated time:** 8 hours  
**Expected impact:** Self-service for common tasks

---

## Conclusion

**The Core Problem:**
User wants Claude Code to be a deterministic workflow engine. Claude Code is a conversational AI assistant.

**The Reality:**
- Workflows must be encoded in scripts (deterministic)
- Claude invokes scripts (flexible)
- Hybrid approach balances trust and adaptability

**The Path Forward:**
1. Create workflow scripts for critical paths (commit, implement, PR)
2. Use git hooks for quality enforcement
3. Prompt engineer for delegation (can't fully enforce)
4. Measure compliance (delegation rate, cost, CI success)
5. Accept that 80% consistency is realistic, 100% is not

**The Mindset Shift:**
- From: "Claude should automatically follow protocols"
- To: "Scripts enforce protocols, Claude orchestrates scripts"

**Cost Projection:**
- Current: $970/week (Opus implementing)
- With scripts + delegation: $400/week (60% reduction)
- Target: $350/week (achievable with discipline)

**Trust Model:**
- Trust scripts (deterministic)
- Audit Claude (via Beads, git log, reflections)
- Human validates (review, approve, merge)

---

## Appendix A: Evidence Analysis

### CI Failure Patterns (Last 7 Days)

From git log analysis:
- 79 commits with "fix", "debug", "revert", "amend"
- ~26% of all commits are reactive fixes
- Target: <15% reactive (more proactive via testing)

### File Churn Analysis

Most changed files:
- `.claude/LEARNINGS.md` — 33 changes (high pattern churn)
- `pnpm-lock.yaml` — 22 changes (dependency instability)
- `.github/workflows/deploy.yml` — 21 changes (CI iteration)
- `apps/web/src/app/onboarding/page.tsx` — 17 changes (unclear spec)
- `apps/web/src/lib/porto.ts` — 10 changes (architecture uncertainty)

**Interpretation:**
- High churn = reactive iteration, not proactive planning
- LEARNINGS.md churn = patterns not sticking
- deploy.yml churn = CI debugging (should be in staging)
- onboarding/porto churn = spec/architecture gaps

### Cost Breakdown (Jan 1-8)

From reflections:
- Opus: $882.06 (91%)
- Sonnet: $66.38 (7%)
- Haiku: $21.43 (2%)

**Target distribution:**
- Opus: $150 (30%) — orchestration only
- Sonnet: $200 (40%) — implementation
- Haiku: $150 (30%) — search, test, ops

**To achieve target:**
- Stop Opus from implementing (delegate to Sonnet)
- Use Haiku for all search/test/ops (60x cheaper)
- Measure per-session cost, throttle if needed

### Delegation Evidence

From recent commits (no "@agent" mentions):
- Suggests Opus did work directly
- Should see: "feat(auth): implement passkey [@build sonnet]"
- Reality: "feat(auth): implement passkey"

**Fix:** Add Co-Authored-By + agent mention to commit template

---

## Appendix B: Workflow Script Templates

### Template: commit.sh
```bash
#!/bin/bash
set -euo pipefail

echo "🔍 Pre-commit validation..."
pnpm verify || exit 1

echo "📝 Generating commit message..."
SCOPE=$(git diff --cached --name-only | head -1 | cut -d/ -f2)
read -p "Change type (feat/fix/docs): " TYPE
read -p "Description: " DESC

MSG="$TYPE($SCOPE): $DESC

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"

echo "$MSG"
read -p "Commit with this message? (y/n) " CONFIRM

if [[ "$CONFIRM" == "y" ]]; then
  git commit -m "$MSG"
  echo "✅ Committed"
else
  echo "❌ Aborted"
  exit 1
fi
```

### Template: implement.sh
```bash
#!/bin/bash
set -euo pipefail

SPEC_PATH=$1
[[ -z "$SPEC_PATH" ]] && echo "Usage: $0 <spec-path>" && exit 1
[[ ! -f "$SPEC_PATH" ]] && echo "Spec not found: $SPEC_PATH" && exit 1

echo "📋 Spec: $(basename "$SPEC_PATH")"
cat "$SPEC_PATH" | head -20

echo ""
echo "🤖 Delegating to @build agent..."
echo "@build 'Implement $(basename "$SPEC_PATH" .md) per spec'"

# In real implementation, this would trigger agent
# For now, just remind user to delegate

echo ""
echo "After implementation, run:"
echo "  pnpm test:e2e"
echo "  ./scripts/workflows/commit.sh"
```

### Template: pr.sh
```bash
#!/bin/bash
set -euo pipefail

echo "🚦 Quality gate..."
./scripts/quality-gate.sh || exit 1

echo "📊 Checking PR size..."
CHANGES=$(git diff main --stat | tail -1 | grep -oE '[0-9]+ insertion' | cut -d' ' -f1)
if [ "$CHANGES" -gt 400 ]; then
  echo "⚠️ PR too large: $CHANGES lines (max 400)"
  echo "Consider splitting into smaller PRs"
  read -p "Continue anyway? (y/n) " CONFIRM
  [[ "$CONFIRM" != "y" ]] && exit 1
fi

echo "📝 Creating PR..."
gh pr create --web

echo "✅ PR created. Remember to:"
echo "  - Add test plan"
echo "  - Reference spec"
echo "  - Request review"
```

---

**End of Analysis**

**Key Takeaway:** Trust comes from scripts + audit trails, not from expecting Claude to be perfectly consistent. Encode critical flows programmatically, let Claude orchestrate them flexibly.
