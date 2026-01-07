# Agent Optimization Spec

## Why

Current costs: $694/6 days = $115/day
- Opus: $652 (94%) - too expensive for routine work
- Sonnet: $30 (4%) - underutilized
- Haiku: $12 (2%) - underutilized

Target: Reduce to $50-70/day without quality regression.

## Model Selection Matrix

| Task Type | Complexity | Model | Cost/1M | Rationale |
|-----------|------------|-------|---------|-----------|
| Exploration | 1-2 | Haiku | $0.25 | Fast, cheap, sufficient |
| File operations | 1 | Haiku | $0.25 | Deterministic |
| Test running | 1 | Haiku | $0.25 | Pass/fail is clear |
| Git operations | 1 | Haiku | $0.25 | Scripted workflows |
| Bug fixes | 2-3 | Sonnet | $3 | Good at following patterns |
| Implementation | 3 | Sonnet | $3 | Strong coding ability |
| Code review | 3 | Sonnet | $3 | Pattern matching |
| UI/Design | 3 | Sonnet | $3 | Creative but bounded |
| Spec writing | 4 | Sonnet | $3 | Opus outlines, Sonnet details |
| Architecture | 5 | Opus | $15 | Novel decisions |
| Security review | 5 | Opus | $15 | Critical thinking |
| Escalations | varies | Opus | $15 | When lower tiers uncertain |

## Quality Gates

### Pre-commit (automated)
1. `pnpm typecheck` - zero errors
2. `pnpm lint` - zero errors
3. `pnpm build` - success
4. `pnpm test:e2e:chromium` - all pass

### Post-commit (tracked)
1. Fixup ratio: `fix:` commits / total commits < 15%
2. Escalation ratio: escalations / tasks < 20%
3. CI pass rate: > 95%

### Quality Score Formula
```
qualityScore = (
  (testPassRate * 0.3) +
  (1 - fixupRatio) * 0.3 +
  (1 - lintErrors/100) * 0.2 +
  (coverage/100) * 0.2
) * 100
```

Target: qualityScore >= 85

## Agent Structure

### Tier 1: Workers (Haiku) - $0.25/1M
Fast, cheap, parallel execution.

- **@explore** - Codebase search, file reading
- **@test** - Run tests, report results
- **@ops** - Git, GitHub, deploy verification
- **@lint** - Run linters, formatters

### Tier 2: Specialists (Sonnet) - $3/1M
Implementation and review.

- **@build** - Implement features from specs
- **@design** - UI components, styling
- **@fix** - Bug fixes, error resolution
- **@review** - Code review, PR review

### Tier 3: Quality (Sonnet) - $3/1M
Validation layer.

- **@quality-gate** - Validates all changes before commit
  - Checks against spec
  - Looks for regressions
  - Escalates if confidence < 80%

### Tier 4: Architects (Opus) - $15/1M
Strategic decisions only.

- **@spec** - System architecture, feature specs
- **@architect** - Major refactors, new systems
- **@security** - Security audit, threat modeling

### Router (Haiku) - $0.25/1M
- **@router** - Classifies tasks, routes to appropriate tier

## Routing Logic

```
INPUT: user_request

1. @router analyzes request (Haiku, fast)
   - Extract intent
   - Estimate complexity (1-5)
   - Check for keywords: "security", "architecture", "spec" → Opus
   - Check for keywords: "search", "find", "test", "deploy" → Haiku

2. Route to appropriate agent:
   complexity 1-2 → Tier 1 (Haiku)
   complexity 3   → Tier 2 (Sonnet)
   complexity 4   → Tier 2 + @quality-gate review
   complexity 5   → Tier 4 (Opus)

3. Execute task

4. @quality-gate validates (Sonnet)
   - If confidence >= 80%: proceed
   - If confidence < 80%: escalate to Opus

5. CI/CD runs automated checks

6. Track metrics for learning
```

## Metrics Dashboard

Add to developers.villa.cash/metrics:

### Model Efficiency Section
- Cost by model (pie chart)
- Cost per commit (trend)
- Fixup ratio (trend)
- Escalation ratio (trend)
- Quality score (gauge)

### Routing Analytics
- Tasks by complexity level
- Model utilization
- Escalation patterns

## Success Criteria

1. **Cost**: Reduce from $115/day to $50-70/day
2. **Quality**: Maintain qualityScore >= 85
3. **Fixups**: Keep fixup ratio < 15%
4. **Speed**: No increase in task completion time

## Implementation Phases

### Phase 1: Agent Definitions
- Create @router agent
- Create @quality-gate agent
- Update existing agents with explicit models

### Phase 2: CI Integration
- Add quality metrics to CI
- Create metrics collection script
- Update dashboard

### Phase 3: Learning Loop
- Track routing decisions
- Analyze escalation patterns
- Tune complexity thresholds

## Approved

- [x] Human review
- [x] Ready for implementation
