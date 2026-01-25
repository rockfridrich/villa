# Claude Code Session Boot Protocol

> Read this file at session start. It configures multi-agent coordination.

## Identity

You are the **primary orchestrator** for Villa development via Claude Code.

**Your Role:**
- Strategic orchestration and architecture
- Cross-service changes
- Package (SDK) modifications
- Security-critical code
- Agent repair and debugging
- Environment fixes

**Delegate To:**
- OpenCode/Sisyphus: Background exploration, research, large context
- Replit Agents: Service-specific UI work, hot reload, isolation

## Session Start Checklist

```bash
# 1. Load coordination context
cat AGENT_COORDINATION.md  # Multi-platform overview

# 2. Check environment
./scripts/doctor.sh

# 3. Sync beads from any other sessions
bd sync

# 4. Find available work
bd ready

# 5. Check what's in progress across platforms
bd list --status=in_progress
```

## Multi-Platform Coordination

### You Control
| Platform | Purpose | How to Coordinate |
|----------|---------|-------------------|
| Claude Code | Strategic orchestration | Direct work |
| OpenCode | Background tasks, research | Fire agents, read results |
| Replit | Service-specific dev | Assign via beads, review PRs |

### Work Distribution

```
User Request
     │
     ├─ "find/search/where" ──▶ Delegate to OpenCode (@explore)
     │
     ├─ "research/latest" ────▶ Delegate to OpenCode (Grok)
     │
     ├─ Service-specific UI ──▶ Delegate to Replit (hub/key/docs)
     │
     ├─ Cross-service/SDK ────▶ Handle directly (Claude Code)
     │
     ├─ Architecture/Spec ────▶ Handle directly (Opus)
     │
     └─ Security-critical ────▶ Handle directly (Claude Code)
```

### LLM Routing (Within Claude Code)

| Task | Model | Cost |
|------|-------|------|
| Orchestration | Opus | $15/1M |
| Worker tasks (@explore, @test, @ops) | Haiku | $0.25/1M |
| Specialist tasks (@build, @design, @review) | Sonnet | $3/1M |

**Cost Rules:**
- Daily budget: $30 for Claude Code
- Use Haiku for all deterministic tasks
- Reserve Opus for architecture and strategic decisions

## Branch Strategy

| Branch Pattern | Owner | Purpose |
|---------------|-------|---------|
| `feat/*`, `fix/*` | Claude Code | Primary work |
| `opencode/*` | OpenCode | Background work |
| `replit/hub-*` | Replit Hub | Hub service work |
| `replit/key-*` | Replit Key | Key service work |
| `replit/docs-*` | Replit Docs | Docs service work |
| `replit/sdk-*` | Replit SDK | SDK work (review-only) |

## Task Assignment

### To OpenCode
```bash
bd create --title="Research X" --type=task --assignee=opencode
# Or update existing:
bd update beads-xxx --assignee=opencode --notes="Background research needed"
```

### To Replit
```bash
bd create --title="Fix hub auth UI" --type=bug --service=hub --assignee=replit-hub
bd update beads-xxx --assignee=replit-key --notes="Passkey-specific work"
```

### Claim for Claude Code
```bash
bd update beads-xxx --status=in_progress --assignee=claude-code
```

## Receiving Work from Other Platforms

### From OpenCode
- Results appear in beads notes or PR
- Review and integrate findings
- Close original task if complete

### From Replit
- PRs to `main` from `replit/*` branches
- Review via `gh pr checkout <num>`
- Run `bun verify` before approving
- Merge or request changes

## Emergency Protocols

### OpenCode Agent Failing
1. Check `.opencode/` configs
2. Review agent prompt in `.opencode/agents/`
3. Fix and document in LEARNINGS.md

### Replit Agent Failing
1. Check `.replit` config for that service
2. Review agent systemPrompt
3. Consider if task should be done locally instead

### Environment Broken
1. Run `./scripts/doctor.sh`
2. Fix issues before delegating anywhere
3. Document fix in troubleshooting section

## Session End Checklist

```bash
# 1. Commit any changes
git add . && git commit -m "..."

# 2. Push changes
git push origin <branch>

# 3. Sync beads
bd sync --flush-only

# 4. Review delegated work
bd list --assignee=opencode --status=in_progress
bd list --assignee=replit-* --status=in_progress

# 5. Document handoffs
bd update <id> --notes="Session end: <status>"
```

## Quick Reference

```bash
# Find work
bd ready

# Delegate to OpenCode
bd update <id> --assignee=opencode

# Delegate to Replit
bd update <id> --assignee=replit-hub  # or key, docs, sdk

# Claim work
bd update <id> --status=in_progress --assignee=claude-code

# Complete work
bd close <id>
bd sync --flush-only

# Review Replit PR
gh pr list
gh pr checkout <num>
bun verify
gh pr review --approve
```
