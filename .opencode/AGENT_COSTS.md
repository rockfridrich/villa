# Villa Agent Cost Optimization Guide

## Model Assignment (ENFORCED) - v3.0

> **Preferred providers:** Anthropic, Google (Gemini), xAI (Grok), Qwen
> **Removed:** OpenAI (GPT), DeepSeek

| Task Type        | Agent      | Model           | Cost/1M | Rationale                            |
| ---------------- | ---------- | --------------- | ------- | ------------------------------------ |
| **Search/Read**  | @explore   | Gemini Flash    | $0.08   | 1M context, fastest for exploration  |
| **Tests**        | @test      | Haiku           | $0.25   | Run commands, check output           |
| **Git/Deploy**   | @ops       | Haiku           | $0.25   | Execute scripts, parse output        |
| **Route Tasks**  | @router    | Haiku           | $0.25   | Classification only                  |
| **Code/Fix**     | @build     | Sonnet          | $3.00   | Implementation requires reasoning    |
| **Quick Fix**    | @fix       | Qwen 72B        | $0.35   | Fast, cheap bug fixes                |
| **UI/UX**        | @design    | Sonnet          | $3.00   | Visual decisions                     |
| **Code Review**  | @review    | Gemini Pro      | $1.25   | Alternative perspective, large PRs   |
| **Validation**   | @quality   | Sonnet          | $3.00   | Verify against spec                  |
| **Architecture** | @architect | Opus            | $15.00  | Complex system design ONLY           |
| **Research**     | @research  | Grok            | $5.00   | Real-time web access                 |
| **Spec Writing** | @spec      | Opus            | $15.00  | Strategic thinking                   |

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

| Metric          | Target         | Current | Action if Exceeded           |
| --------------- | -------------- | ------- | ---------------------------- |
| Opus usage      | <10% of tokens | TBD     | Review task routing          |
| Sonnet usage    | <60% of tokens | TBD     | Move to Haiku where possible |
| Haiku usage     | >30% of tokens | TBD     | Good                         |
| Cost per commit | <$0.50         | TBD     | Review complexity            |
| Fixup ratio     | <15%           | TBD     | Improve first-pass quality   |

## Task Routing Decision Tree

```
Is it search/read/grep?
  → YES: @explore (Gemini Flash)
  → NO: ↓

Is it running tests/commands?
  → YES: @test or @ops (Haiku)
  → NO: ↓

Is it a quick bug fix?
  → YES: @fix (Qwen 72B)
  → NO: ↓

Is it writing/modifying code?
  → YES: Is it frontend/UI?
    → YES: @design (Sonnet)
    → NO: @build (Sonnet)
  → NO: ↓

Is it code review?
  → YES: @review (Gemini Pro)
  → NO: ↓

Is it web research with real-time data?
  → YES: @research (Grok)
  → NO: ↓

Is it system architecture/design?
  → YES: Is it security-critical or novel?
    → YES: @architect (Opus)
    → NO: @build (Sonnet) with @architect consultation
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

## Model Benchmarks

### Gemini Flash ($0.08/1M) - Search/Explore
- Context: 1M tokens
- Speed: 150+ tokens/sec
- Tasks: file search, codebase exploration, pattern matching

### Haiku ($0.25/1M) - Tests/Ops
- Context: 200K tokens
- Speed: 100+ tokens/sec
- Tasks: run tests, git ops, command execution

### Qwen 72B ($0.35/1M) - Quick Fixes
- Context: 131K tokens
- Speed: 80+ tokens/sec
- Tasks: bug fixes, small refactors, typo corrections

### Gemini Pro ($1.25/1M) - Code Review
- Context: 2M tokens
- Speed: 60+ tokens/sec
- Tasks: large PR reviews, cross-file analysis

### Sonnet ($3/1M) - Implementation
- Context: 200K tokens
- Speed: 50+ tokens/sec
- Tasks: feature implementation, UI development

### Grok ($5/1M) - Research
- Context: 131K tokens
- Speed: 40+ tokens/sec
- Features: real-time web access
- Tasks: documentation lookup, API research

### Opus ($15/1M) - Architecture ONLY
- Context: 200K tokens
- Speed: 30+ tokens/sec
- Tasks: system design, security decisions, breaking changes

## Anti-Patterns to Avoid

| Bad Pattern            | Cost Impact    | Fix                          |
| ---------------------- | -------------- | ---------------------------- |
| Opus writes unit tests | 60x overspend  | @test runs, @build writes    |
| Opus fixes typos       | 43x overspend  | @fix (Qwen)                  |
| Opus does code review  | 12x overspend  | @review (Gemini Pro)         |
| Opus searches codebase | 188x overspend | @explore (Gemini Flash)      |
| Sonnet does grep       | 38x overspend  | @explore (Gemini Flash)      |
| Sonnet does quick fix  | 9x overspend   | @fix (Qwen)                  |

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
