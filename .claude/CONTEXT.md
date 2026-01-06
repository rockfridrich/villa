# Claude Code Context Structure

## Load Priority (highest to lowest)

1. **System prompt** (built-in) - Claude Code baseline behavior
2. **.claude/CLAUDE.md** (project root) - Project-specific instructions
3. **.claude/settings.json** - Configuration and permissions
4. **agents/*.md** (when spawned via @agent) - Role-specific behavior
5. **knowledge/*.md** - Domain-specific documentation
6. **specs/active/*.md** - Current work in progress

## Token Budget per Session

| Budget | Tokens | Notes |
|--------|--------|-------|
| Context window | ~200K | Total capacity |
| Ideal working set | <50K | Optimal for speed |
| Agent spawns | ~2-5K each | Per delegation |
| Large file read | ~5-10K | Full file context |

## Agent Market Model

Each agent has "traits" - tasks they're optimized for:

| Agent | Exclusive Domain | Avg Tokens | Best For |
|-------|-----------------|------------|----------|
| @spec | Architecture decisions | 3-5K | New features |
| @build | Implementation | 5-10K | Code changes |
| @test | Verification | 2-4K | E2E, security |
| @review | Quality gates | 2-3K | PR review |
| @ops | Infrastructure | 1-2K | Deploy, git |
| @data | Database | 1-3K | Schema, queries |
| @design | UI/UX | 3-5K | Components |

## Model Selection by Task

| Model | Cost | Use For |
|-------|------|---------|
| **Haiku** | $ | Simple lookups, verification, monitoring |
| **Sonnet** | $$ | Implementation, code changes, reviews |
| **Opus** | $$$ | Architecture decisions, complex reasoning |

## Efficient Delegation Patterns

### Parallel (when tasks are independent)

```
Terminal 1: @build "implement user preferences API"
Terminal 2: @test "write tests for auth flow"
Terminal 3: @ops "monitor CI pipeline"
```

### Sequential (when there are dependencies)

```
1. @spec "design preferences feature" → approval
2. @data "create preferences schema" → migration complete
3. @build "implement preferences API" → code ready
4. @test "verify preferences flow" → tests pass
5. @ops "create PR and deploy" → live
```

## Context Loading Optimization

### Do:
- Read only necessary files
- Use Grep for targeted searches
- Spawn appropriate model for task
- Delegate to specialists

### Don't:
- Load entire codebase
- Use Opus for simple tasks
- Keep stale context in memory
- Duplicate work across agents

## File Discovery Order

When an agent starts, it typically reads:

1. `.claude/CLAUDE.md` - Always (project rules)
2. `.claude/LEARNINGS.md` - Always (past mistakes)
3. `agents/{self}.md` - Self-identity
4. Relevant `specs/active/*.md` - Current work
5. Target files for the task

## Memory Boundaries

Each agent spawn is stateless. To persist context:

1. Write to files (specs, docs)
2. Use git commits as checkpoints
3. Update STATUS.md for progress
4. Leave TODO comments in code

## Cost Tracking

See `.claude/cost-tracking.md` for token usage patterns and optimization strategies.
