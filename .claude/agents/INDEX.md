# Agent Index

Cost-optimized model assignments with quality guarantees.

## Model Tiers

### Tier 1: Workers (Haiku) - $0.25/$1.25 per 1M tokens
Fast, parallel, cheap. Use for deterministic tasks.

| Agent | Purpose | When to Use |
|-------|---------|-------------|
| @router | Task classification | Automatic (first step) |
| @explore | Codebase search | "find", "search", "where is" |
| @test | Run tests | "test", "verify", "check" |
| @ops | Git, deploy | "commit", "push", "deploy", "status" |

### Tier 2: Specialists (Sonnet) - $3/$15 per 1M tokens
Implementation and review. Use for coding tasks.

| Agent | Purpose | When to Use |
|-------|---------|-------------|
| @build | Feature implementation | "implement", "add", "create" |
| @design | UI/UX work | "style", "component", "layout" |
| @review | Code review | "review", "check PR" |
| @quality-gate | Validation | Automatic (before commit) |
| @fix | Bug fixes | "fix", "debug", "resolve" |
| @data | Database work | "schema", "migration", "query" |

### Tier 3: Architects (Opus) - $15/$75 per 1M tokens
Strategic decisions. Use sparingly for high-value work.

| Agent | Purpose | When to Use |
|-------|---------|-------------|
| @spec | Feature specs | "spec", "design", "architecture" |
| @architect | System design | "system", "infrastructure" |
| @reflect | Session analysis | Post-session review |
| @product | Product strategy | "roadmap", "prioritize" |

### Special Purpose

| Agent | Model | Purpose |
|-------|-------|---------|
| @solidity | Sonnet | Smart contracts |
| @sdk | Sonnet | SDK development |
| @ship | Haiku | Deployment |

## Routing Flow

```
User Request
    │
    ▼
┌─────────┐
│ @router │ (Haiku, ~$0.001)
│ classify│
└────┬────┘
     │
     ├─── Simple (1-2) ──▶ Haiku agents
     │
     ├─── Medium (3) ────▶ Sonnet agents
     │
     ├─── Complex (4) ───▶ Sonnet + @quality-gate
     │
     └─── Critical (5) ──▶ Opus agents
                              │
                              ▼
                        @quality-gate (Sonnet)
                              │
                              ▼
                         CI Pipeline
```

## Quality Metrics

Track per commit:
- `model`: which model produced the change
- `fixups`: correction commits needed
- `escalations`: times lower model escalated
- `ciPassed`: CI result

### Targets

| Metric | Target | Alert |
|--------|--------|-------|
| Fixup ratio | < 15% | > 20% |
| CI pass rate | > 95% | < 90% |
| Opus usage | < 30% | > 50% |
| Quality score | >= 85 | < 80 |

## Cost Optimization Rules

### DO
- Use @explore for any file search
- Use @test for running tests
- Use @build for implementation
- Let @quality-gate validate everything
- Escalate only when confidence < 80%

### DON'T
- Use Opus for file searches
- Use Opus for following existing patterns
- Skip @quality-gate validation
- Guess when uncertain (escalate instead)

## Escalation Path

```
Haiku uncertain → Sonnet review → Opus decision
```

Escalate when:
- Security implications
- Breaking changes
- Novel architecture
- Confidence < 60%
