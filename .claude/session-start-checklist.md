# Session Start Checklist

## 1. Context Load (2 min)
- [ ] `bd ready` - what's available to work on?
- [ ] `git status` - clean state?
- [ ] `git log --oneline -5` - recent work?

## 2. Agent Delegation Reminder

**Opus = Orchestrator ONLY**

| Task Type | Delegate To |
|-----------|-------------|
| File search | @explore (haiku) |
| Implementation | @build (sonnet) |
| Test runs | @test (haiku) |
| CI monitoring | @ops (haiku) |
| Design review | @design (sonnet) |
| Architecture | Opus only |

**Target: 80%+ work delegated to agents**

## 3. Anti-Patterns to Avoid

- [ ] No manual CI polling (use @ops background)
- [ ] No implementation without spec
- [ ] Two-Strike Rule: 2 CI fails = STOP
- [ ] All commits reference bead IDs

## 4. Two-Strike Rule

If CI fails twice:
```bash
# STOP. Check deployment health first:
curl -s https://beta.villa.cash/api/health | jq .timestamp
# Old timestamp = deploy issue, not code issue
# → Delegate to @ops, don't iterate code
```

## 5. Bead Selection

Before starting work:
```bash
bd ready                              # Find available work
bd show <id>                          # Get task details
./scripts/bd-workflow.sh start <id>   # Claim task
```

Commit format:
```bash
git commit -m "feat: implement X [villa-<id>]"
```

---

## Red Flags (Stop Immediately)

- Opus reading implementation files directly
- Opus writing component code
- Opus running git/CI commands manually
- No @ agent mentions in conversation
- Sequential work that could be parallel

## Recovery

```
STOP. This should be delegated to @{agent}.
I am an orchestrator, not an implementer.
```
