# Villa Agent System

Cost-optimized agent routing with quality guarantees.

## Sisyphus (OpenCode) ↔ Claude Code Partnership

**Sisyphus** (OpenCode) is the **primary** agent. Claude Code is the **backup**.

| Role | Sisyphus (OpenCode) | Claude Code |
|------|---------------------|-------------|
| **Primary Use** | All implementation, orchestration, delegation | Backup & repair only |
| **Cost** | Cheaper (optimized routing) | More expensive |
| **Capabilities** | Full tool access, subagent orchestration | Deep debugging when Sisyphus fails |
| **When to use** | **Default for everything** | Only when Sisyphus is stuck or env broken |

### Why Sisyphus First?
- **Smarter**: Better reasoning with explicit tool access
- **Cheaper**: Optimized model routing ($0.25-$3/1M vs higher)
- **Orchestration**: Can delegate to specialized subagents (explore, librarian, frontend-ui-ux-engineer, oracle)
- **Parallel execution**: Fires multiple background agents simultaneously

### Workflow
```
User request → Sisyphus (handles 95% of work)
                  ↓
        Stuck after 2+ attempts → Claude Code (repair) → Resume Sisyphus
```

### When to Fall Back to Claude Code
- Sisyphus explicitly says it's stuck
- Environment/tooling broken (not code issues)
- Agent infrastructure itself needs debugging
- OpenCode config needs updates

**DO NOT use Claude Code for:**
- Normal implementation tasks
- Code exploration (use Sisyphus + explore agent)
- Library questions (use Sisyphus + librarian agent)
- UI work (use Sisyphus + frontend-ui-ux-engineer agent)

## Quick Reference

| Agent         | Model  | Cost     | Use For                    |
| ------------- | ------ | -------- | -------------------------- |
| @router       | haiku  | $0.25/1M | Task classification (auto) |
| @explore      | haiku  | $0.25/1M | Search, read files         |
| @test         | haiku  | $0.25/1M | Run tests                  |
| @ops          | haiku  | $0.25/1M | Git, deploy                |
| @build        | sonnet | $3/1M    | Implementation             |
| @design       | sonnet | $3/1M    | UI/UX                      |
| @review       | sonnet | $3/1M    | Code review                |
| @quality-gate | sonnet | $3/1M    | Validation (auto)          |
| @spec         | opus   | $15/1M   | Architecture               |
| @architect    | opus   | $15/1M   | System design              |

## Routing Rules

```
User request → @router (haiku) → Appropriate agent → @quality-gate (sonnet) → Commit
```

### Complexity Levels

| Level | Model         | Trigger Keywords                                    |
| ----- | ------------- | --------------------------------------------------- |
| 1-2   | Haiku         | "find", "search", "test", "deploy", "status"        |
| 3     | Sonnet        | "implement", "fix", "build", "add", "update"        |
| 4     | Sonnet+Review | "refactor", "redesign", "migrate"                   |
| 5     | Opus          | "spec", "architecture", "security", "design system" |

### Auto-Escalation

Sonnet/Haiku agents escalate to Opus when:

- Confidence < 80%
- Security implications detected
- Breaking changes required
- Novel architecture decisions needed

## Quality Gates

Every commit passes through:

1. **@quality-gate** (Sonnet) - Validates against spec
2. **CI Pipeline** - typecheck, lint, build, test
3. **Metrics tracking** - fixup ratio, cost per commit

### Quality Thresholds

| Metric        | Target | Action if Failed       |
| ------------- | ------ | ---------------------- |
| Fixup ratio   | < 15%  | Review agent selection |
| CI pass rate  | > 95%  | Block deploy           |
| Quality score | >= 85  | Human review required  |

## Usage Examples

### Simple task (Haiku)

```
"Find all files that import Porto SDK"
→ @router → @explore (haiku) → Results
Cost: ~$0.01
```

### Implementation (Sonnet)

```
"Add a logout button to the header"
→ @router → @build (sonnet) → @quality-gate → Commit
Cost: ~$0.10
```

### Architecture (Opus)

```
"Design the permission system for SDK apps"
→ @router → @spec (opus) → Spec document
Cost: ~$0.50
```

## Cost Projections

| Model Mix             | Daily Cost | Monthly |
| --------------------- | ---------- | ------- |
| Current (94% Opus)    | $115       | $3,450  |
| Optimized (30% Opus)  | $50        | $1,500  |
| Aggressive (10% Opus) | $35        | $1,050  |

Target: 30% Opus for 57% cost reduction.
