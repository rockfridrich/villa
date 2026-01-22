# Villa Agent Cost Optimization Guide

## Model Assignment (ENFORCED)

| Task Type        | Agent            | Model  | Cost/1M | Rationale                         |
| ---------------- | ---------------- | ------ | ------- | --------------------------------- |
| **Search/Read**  | @explore         | Haiku  | $0.25   | Pattern matching, no reasoning    |
| **Tests**        | @test            | Haiku  | $0.25   | Run commands, check output        |
| **Git/Deploy**   | @ops             | Haiku  | $0.25   | Execute scripts, parse output     |
| **Route Tasks**  | @router          | Haiku  | $0.25   | Classification only               |
| **Code/Fix**     | @build           | Sonnet | $3      | Implementation requires reasoning |
| **UI/UX**        | @design          | Sonnet | $3      | Visual decisions                  |
| **Code Review**  | @review          | Sonnet | $3      | Quality checks                    |
| **Validation**   | @quality-gate    | Sonnet | $3      | Verify against spec               |
| **Architecture** | @spec            | Opus   | $15     | Complex system design ONLY        |
| **Docs**         | @document-writer | Haiku  | $0.25   | Templated content                 |
| **Research**     | @librarian       | Haiku  | $0.25   | Fetch + summarize                 |

## CRITICAL RULES

### 1. NEVER Use Opus For:

- Writing code (use Sonnet @build)
- Unit tests (use Haiku @test to run, Sonnet @build to write)
- Bug fixes (use Sonnet @build)
- UI changes (use Sonnet @design)
- Documentation (use Haiku @document-writer)
- Code review (use Sonnet @review)

### 2. ONLY Use Opus For:

- Initial system architecture
- Security-critical design decisions
- Breaking API changes
- Multi-system integration design
- Novel pattern decisions

### 3. Cost Targets

| Metric          | Target         | Current (Jan 2026) | Action if Exceeded           |
| --------------- | -------------- | ------------------ | ---------------------------- |
| Opus usage      | <10% of tokens | **92.8%** ⚠️       | Review task routing          |
| Sonnet usage    | <60% of tokens | 5.2%               | Move to Haiku where possible |
| Haiku usage     | >30% of tokens | 1.9%               | Good                         |
| Cost per commit | <$0.50         | ~$127/day ⚠️       | Review complexity            |
| Fixup ratio     | <15%           | ~20% estimated     | Improve first-pass quality   |

### 4. Actual Cost Data (Jan 2-7, 2026)

**Source:** `.claude/costs.json` (Anthropic console export)

| Day        | Total       | Opus        | Sonnet     | Haiku      |
| ---------- | ----------- | ----------- | ---------- | ---------- |
| 2026-01-02 | $4.35       | $4.30       | $0.03      | $0.02      |
| 2026-01-03 | $131.79     | $126.11     | $4.10      | $1.48      |
| 2026-01-04 | $336.10     | $312.14     | $17.81     | $6.01      |
| 2026-01-05 | $137.40     | $130.07     | $4.37      | $2.82      |
| 2026-01-06 | $84.40      | $79.49      | $3.45      | $1.43      |
| 2026-01-07 | $69.57      | $56.72      | $10.05     | $2.79      |
| **TOTAL**  | **$763.61** | **$708.83** | **$39.81** | **$14.55** |

**Daily Average:** $127.27 (target: $50)
**Problem:** Orchestrator doing manual work instead of delegating to cheaper models

## Task Routing Decision Tree

```
Is it search/read/grep?
  → YES: @explore (Haiku)
  → NO: ↓

Is it running tests/commands?
  → YES: @test or @ops (Haiku)
  → NO: ↓

Is it writing documentation?
  → YES: @document-writer (Haiku)
  → NO: ↓

Is it looking up external docs/examples?
  → YES: @librarian (Haiku)
  → NO: ↓

Is it writing/modifying code?
  → YES: Is it frontend/UI?
    → YES: @design (Sonnet)
    → NO: @build (Sonnet)
  → NO: ↓

Is it code review?
  → YES: @review (Sonnet)
  → NO: ↓

Is it system architecture/design?
  → YES: Is it security-critical or novel?
    → YES: @spec (Opus)
    → NO: @build (Sonnet) with Oracle consultation
  → NO: ↓

Default: @build (Sonnet)
```

## Usage Tracking

### Session Metrics (Check after each session)

```bash
# View session stats
opencode session stats

# View cost breakdown
opencode session costs

# Export for review
opencode session export --format json > session_$(date +%Y%m%d).json
```

### Weekly Review Checklist

1. [ ] Check Opus usage % - should be <10%
2. [ ] Check average cost per commit
3. [ ] Check fixup ratio (commits that needed follow-up fixes)
4. [ ] Identify tasks incorrectly routed to expensive models
5. [ ] Update routing rules if patterns emerge

### Cost Audit Command

```bash
# Generate cost report for last 7 days
./scripts/agent-costs.sh --days 7

# Output:
# | Agent | Tokens | Cost | % Total |
# |-------|--------|------|---------|
# | explore | 50K | $0.01 | 5% |
# | build | 200K | $0.60 | 60% |
# | ... |
```

## Benchmarks

### Haiku ($0.25/1M) - Use For:

- Speed: 100+ tokens/sec
- Good at: Pattern matching, extraction, classification
- Tasks: grep, find, read, summarize, route, run tests

### Sonnet ($3/1M) - Use For:

- Speed: 50+ tokens/sec
- Good at: Reasoning, code generation, analysis
- Tasks: implement features, fix bugs, review code

### Opus ($15/1M) - Use ONLY For:

- Speed: 30+ tokens/sec
- Good at: Complex reasoning, novel problems, security
- Tasks: system architecture, security design, breaking changes

## Anti-Patterns to Avoid

| Bad Pattern            | Cost Impact   | Fix                       |
| ---------------------- | ------------- | ------------------------- |
| Opus writes unit tests | 60x overspend | @test runs, @build writes |
| Opus fixes typos       | 60x overspend | @build or manual          |
| Opus does code review  | 5x overspend  | @review (Sonnet)          |
| Opus searches codebase | 60x overspend | @explore (Haiku)          |
| Sonnet does grep       | 12x overspend | @explore (Haiku)          |

## Escalation Protocol

When should Sonnet escalate to Opus?

1. **Confidence < 80%** on architectural decision
2. **Security implications** detected
3. **Breaking changes** to public API
4. **Novel patterns** not seen in codebase
5. **Multi-system integration** (3+ services)

When should Haiku escalate to Sonnet?

1. **Complex reasoning** required (not just pattern matching)
2. **Code generation** needed (not just running code)
3. **Ambiguous instructions** need interpretation

## Implementation

The routing is enforced by the main orchestrator (Sisyphus) which:

1. Classifies incoming request complexity (1-5)
2. Routes to appropriate agent based on keywords and complexity
3. Monitors token usage per agent
4. Flags violations for review

### Enforcement Points

- [ ] Main prompt includes cost-conscious routing
- [ ] Background tasks use Haiku by default
- [ ] Code changes always use @build (Sonnet), never Opus
- [ ] Architecture questions go through @spec only when truly novel
