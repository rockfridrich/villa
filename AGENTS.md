# Villa AI Agents

> **TL;DR**: Multi-platform agent system - Claude Code orchestrates, OpenCode/Replit execute.

## Quick Reference

| Platform | Role | When to Use |
|----------|------|-------------|
| **Claude Code** | Primary orchestrator | Architecture, cross-service, SDK, security |
| **OpenCode (Sisyphus)** | Background workers | Search, research, large context (1M) |
| **Replit Agents** | Service-specific | Hub/Key/Docs UI, hot reload, isolation |

**Coordination doc:** `AGENT_COORDINATION.md`

---

## Platform Decision Tree

```
User Request
     │
     ├─ "find/search/where" ──────▶ OpenCode (@explore, Gemini)
     │
     ├─ "research/latest/docs" ───▶ OpenCode (Grok, real-time web)
     │
     ├─ Service-specific UI ──────▶ Replit (hub/key/docs agents)
     │
     ├─ Cross-service/SDK ────────▶ Claude Code (full context)
     │
     ├─ Architecture/Spec ────────▶ Claude Code (Opus)
     │
     └─ Security-critical ────────▶ Claude Code (review required)
```

---

## Multi-LLM Routing

See `.opencode/llm-router.json` for full config.

| Task | Primary LLM | Cost | Rationale |
|------|-------------|------|-----------|
| Search/Explore | Gemini Flash | $0.075/1M | 1M context, fastest |
| Test/Git/Deploy | Haiku | $0.25/1M | Deterministic tasks |
| Implementation | Sonnet | $3/1M | Best code quality |
| Code Review | GPT-4o | $2.50/1M | Alternative perspective |
| Research | Grok | $5/1M | Real-time web access |
| Architecture | Opus | $15/1M | Deep reasoning |
| Quick fixes | DeepSeek R1 | $0.55/1M | Fast, cheap |

**Daily Budget:** $50 total ($30 Claude Code, $10 OpenCode, $10 Replit)

---

## Replit Services

Each service has dedicated Replit agent with `.replit` config:

| Service | Domain | Branch Pattern | Focus |
|---------|--------|----------------|-------|
| Hub | villa.cash | `replit/hub-*` | Auth, API, profiles |
| Key | key.villa.cash | `replit/key-*` | Passkeys, WebAuthn |
| Docs | docs.villa.cash | `replit/docs-*` | SDK docs, playground |
| SDK | npm package | `replit/sdk-*` | Core library (review-only) |

---

## Session Boot

### Claude Code
```bash
cat .claude/BOOT.md           # Load boot protocol
./scripts/doctor.sh           # Check environment
bd ready                      # Find available work
```

### OpenCode
```bash
cat .opencode/BOOT.md         # Load boot protocol
cat .opencode/llm-router.json # Check LLM assignments
bd ready                      # Find available work
```

### Replit
- Each `.replit` file has `[agent].systemPrompt` with service-specific context
- Check `bd ready` for assigned tasks

---

## Task Flow

### Claim Task
```bash
bd update beads-xxx --status=in_progress --assignee=<platform>
# claude-code | opencode | replit-hub | replit-key | replit-docs | replit-sdk
```

### Complete Task
```bash
bd close beads-xxx
bd sync --flush-only
```

### Handoff Between Platforms
```bash
bd update beads-xxx --assignee=<new-platform> --notes="Handoff: <reason>"
```

---

## Emergency Escalation

| Stuck On | Escalate To | Why |
|----------|-------------|-----|
| Haiku task | Sonnet | More capable |
| Sonnet task | GPT-4o or Opus | Different perspective |
| Replit stuck | Claude Code | Full monorepo context |
| OpenCode stuck | Claude Code | Can debug agents |
| Architecture unclear | Opus + o1-preview | Deep reasoning |

**Two-Strike Rule:** Same failure 2x → STOP, switch platform or LLM.

---

## Cost Optimization

### DO
- Use Gemini Flash for search (not Haiku or Sonnet)
- Use Grok for real-time research
- Use GPT-4o for code review (catches different issues)
- Reserve Opus for architecture only

### DON'T
- Use Opus for file searches (60x more expensive)
- Use Sonnet for tests (12x more expensive than Haiku)
- Push without `bun verify` (CI rejection costs tokens)

---

## For Contributors

- `.claude/BOOT.md` - Claude Code session boot
- `.opencode/BOOT.md` - OpenCode session boot
- `.opencode/llm-router.json` - LLM routing config
- `AGENT_COORDINATION.md` - Full multi-platform docs
- `.replit` files - Replit agent prompts
