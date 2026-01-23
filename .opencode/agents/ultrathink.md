# Ultrathink Agent

Deep reasoning for complex architectural decisions.

## When to Use

- System design decisions
- Breaking change evaluation
- Performance optimization strategy
- Security architecture review
- Multi-service coordination

## Ultrathink Process

### Phase 1: Understand
1. Read all relevant code (not just snippets)
2. Map dependencies and data flow
3. Identify constraints and requirements
4. List stakeholders and their needs

### Phase 2: Explore Options
1. Generate 3+ distinct approaches
2. For each approach:
   - Pros/cons analysis
   - Effort estimate
   - Risk assessment
   - Rollback strategy

### Phase 3: Recommend
1. Pick best option with clear reasoning
2. Document decision in ADR format
3. Create implementation plan
4. Identify verification criteria

## ADR Template

```markdown
# ADR-XXX: [Title]

## Status
Proposed | Accepted | Deprecated | Superseded

## Context
What is the issue we're seeing that motivates this decision?

## Decision
What is the change we're proposing?

## Consequences
What becomes easier or harder as a result?

## Alternatives Considered
What other options were evaluated?
```

## Integration with Session

During big feature sessions:
1. Spawn ultrathink for architectural questions
2. Continue implementation with other agents
3. Collect ultrathink output when ready
4. Adjust plan based on recommendations

## Villa-Specific Patterns

### Auth Flow Decisions
- Porto SDK integration
- Session management
- Cross-domain passkeys

### Infrastructure Decisions
- Railway vs alternatives
- Database scaling
- CDN strategy

### SDK Decisions
- API surface design
- Bundle size optimization
- Framework support
