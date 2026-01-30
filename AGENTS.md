# Villa AI Agents

> **TL;DR**: Multi-platform agent system. Claude Code orchestrates, OpenCode executes.

## Quick Reference

| Platform | Role | When to Use |
|----------|------|-------------|
| **Claude Code** | Primary orchestrator | Architecture, cross-service, SDK, security |
| **OpenCode** | Implementation workers | Search, build, test, review, fix |

---

## Platform Decision Tree

```
User Request
     |
     +- "find/search/where" ----> OpenCode (@explore, Gemini Flash)
     |
     +- "quick fix/typo/type" --> OpenCode (@fix, Haiku)
     |
     +- "run tests" -----------> OpenCode (@test, Haiku)
     |
     +- "implement/build" -----> OpenCode (@build, Sonnet 4.5)
     |
     +- "review code" ---------> OpenCode (@review, Gemini Pro)
     |
     +- Cross-service/SDK -----> Claude Code (full context)
     |
     +- Architecture/Spec -----> Claude Code (Opus)
     |
     +- Security-critical -----> Claude Code (review required)
```

---

## OpenCode Agent Models

| Agent | Model | Cost/1M tok | Use For |
|-------|-------|-------------|---------|
| @explore | Gemini 2.5 Flash | ~$0.08 | Search, read files (READ-ONLY) |
| @fix | Claude Haiku 3.5 | ~$0.25 | Quick fixes, 1-3 files |
| @test | Claude Haiku 3.5 | ~$0.25 | Run tests, report results |
| @build | Claude Sonnet 4.5 | ~$3.00 | Implementation |
| @review | Gemini 2.5 Pro | ~$3.00 | Code review, security |

**Routing rule:** Use cheapest capable agent. Search before building.

---

## Session Boot

### Claude Code
```bash
# Boot protocol loaded automatically from .claude/BOOT.md
./scripts/doctor.sh           # Check environment
bd ready                      # Find available work
```

### OpenCode
```bash
# Boot protocol loaded automatically from .opencode/BOOT.md
bd ready                      # Find available work
```

---

## Task Flow

### Claim Task
```bash
bd update beads-xxx --status=in_progress
```

### Complete Task
```bash
bd close beads-xxx
bd sync --flush-only
```

### Handoff Between Platforms
```bash
bd update beads-xxx --notes="Handoff: <reason>"
```

---

## Escalation

| Stuck On | Escalate To | Why |
|----------|-------------|-----|
| @fix task | @build | More capable |
| @build task | Claude Code | Full context, architecture |
| OpenCode stuck | Claude Code | Can debug agents |
| Architecture unclear | Claude Code (Opus) | Deep reasoning |

**Two-Strike Rule:** Same failure 2x -> STOP, escalate.

---

## Cost Optimization

### Do
- Use Gemini Flash for search (not Haiku or Sonnet)
- Use @fix for 1-3 file changes (12x cheaper than @build)
- Reserve Claude Code (Opus) for architecture only

### Don't
- Use @build for file searches (40x more expensive than @explore)
- Use @build for tests (12x more expensive than @test)
- Push without `bun verify` (CI rejection wastes tokens)

---

## For Contributors

- `.claude/BOOT.md` - Claude Code session boot
- `.opencode/BOOT.md` - OpenCode session boot
- `.opencode/agents/` - Agent prompt files
- `.opencode/OPENCODE.md` - Master protocol (all agents follow)
