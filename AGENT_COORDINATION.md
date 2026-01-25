# Multi-Agent Coordination System

> Unified agent orchestration across Claude Code, OpenCode, and Replit with multi-LLM optimization.

## Architecture Overview

```
                    GitHub (rockfridrich/villa)
                              ↕
        ┌─────────────────────┼─────────────────────┐
        ↓                     ↓                     ↓
   Local Dev              Replit                 CI/CD
   ├─ Claude Code         ├─ villa-hub          └─ GitHub Actions
   └─ OpenCode            ├─ villa-key
      (Sisyphus)          ├─ villa-docs
                          └─ villa-sdk
```

## LLM Assignment Matrix

Optimized for cost, capability, and context window:

| Task Type | Primary LLM | Fallback | Cost/1M | Rationale |
|-----------|-------------|----------|---------|-----------|
| **Search/Explore** | Gemini Flash | Haiku | $0.075 | Fastest, 1M context |
| **Test Execution** | Haiku | Gemini Flash | $0.25 | Structured output |
| **Git/Deploy** | Haiku | GPT-4o-mini | $0.25 | Deterministic tasks |
| **Implementation** | Sonnet | GPT-4o | $3.00 | Best code quality |
| **UI/Design** | Sonnet | GPT-4o | $3.00 | Visual reasoning |
| **Code Review** | GPT-4o | Sonnet | $2.50 | Alternative perspective |
| **Architecture** | Opus | o1-preview | $15.00 | Deep reasoning |
| **Research** | Grok | Perplexity | $5.00 | Real-time web access |
| **Spec Writing** | Opus | GPT-4o | $15.00 | Strategic thinking |

## Platform-Specific Assignments

### Claude Code (Local) - Primary Orchestrator
```yaml
role: Strategic orchestration, cross-service changes, specs
models:
  primary: claude-opus-4-5-20251101
  workers: claude-3-5-haiku-20241022
  specialists: claude-sonnet-4-20250514
agents:
  - @architect (opus)
  - @spec (opus)
  - @build (sonnet)
  - @review (sonnet)
  - @quality-gate (sonnet)
strengths:
  - Full monorepo context
  - Beads task tracking
  - Git operations
  - Cross-service refactoring
```

### OpenCode/Sisyphus (Local) - Background Workers
```yaml
role: Parallel exploration, documentation, library research
models:
  primary: gemini-2.0-flash-exp
  fallback: claude-3-5-haiku
agents:
  - explore (gemini flash)
  - librarian (gemini flash)
  - oracle (opus - escalation only)
  - document-writer (sonnet)
strengths:
  - 1M token context (Gemini)
  - Real-time web search
  - Parallel execution
  - Library documentation
```

### Replit Agents (Cloud) - Service-Specific
```yaml
role: Isolated service development, hot reload, collaborative
models:
  default: claude-sonnet-4-20250514
  available: [gpt-4o, gemini-1.5-pro]
services:
  villa-hub:
    focus: [auth flows, API routes, profiles]
    branch: replit/hub-*
  villa-key:
    focus: [passkey isolation, WebAuthn]
    branch: replit/key-*
  villa-docs:
    focus: [documentation, playground]
    branch: replit/docs-*
  villa-sdk:
    focus: [core library, types, tests]
    branch: replit/sdk-*
```

## Routing Decision Tree

```
User Request
     │
     ├─ "search/find/where" ──────────▶ Gemini Flash (@explore)
     │
     ├─ "test/verify" ────────────────▶ Haiku (@test)
     │
     ├─ "commit/push/deploy" ─────────▶ Haiku (@ops)
     │
     ├─ "implement/build" ────────────▶ Sonnet (@build)
     │      │
     │      └─ Service-specific? ─────▶ Replit Agent (isolated)
     │
     ├─ "review/check PR" ────────────▶ GPT-4o (@review) [alt perspective]
     │
     ├─ "design/UI/style" ────────────▶ Sonnet (@design)
     │
     ├─ "research/latest/docs" ───────▶ Grok (real-time web)
     │
     ├─ "architecture/system" ────────▶ Opus (@architect)
     │
     └─ "spec/roadmap/strategy" ──────▶ Opus (@spec)
```

## Branch Ownership

| Branch Pattern | Owner | Auto-merge |
|---------------|-------|------------|
| `main` | Protected | Requires review |
| `feat/*` | Claude Code | No |
| `fix/*` | Claude Code | No |
| `replit/hub-*` | Replit Hub Agent | No |
| `replit/key-*` | Replit Key Agent | No |
| `replit/docs-*` | Replit Docs Agent | No |
| `replit/sdk-*` | Replit SDK Agent | No |
| `opencode/*` | Sisyphus | No |

## Handoff Protocol

### Claude Code → Replit
```bash
# Create service-specific task
bd create --title="Fix auth iframe" --type=bug --service=hub

# Tag for Replit
bd update beads-xxx --assignee=replit-hub
git push origin main

# Replit picks up via webhook or manual check
```

### Replit → Claude Code
```bash
# Replit completes and creates PR
gh pr create --base main --title "fix: auth iframe"

# Claude Code reviews
gh pr checkout <num>
bun verify
gh pr review --approve
```

### Claude Code ↔ OpenCode
```bash
# Hand off exploration to Sisyphus (1M context)
# In Claude Code:
"@sisyphus search all authentication patterns across the codebase"

# Sisyphus returns summary, Claude Code continues implementation
```

## Cost Optimization Rules

### DO
- Use Gemini Flash for any search (1M context, $0.075/1M)
- Use Grok for real-time research (web access)
- Use GPT-4o for code review (alternative perspective)
- Use Haiku for deterministic tasks (git, tests)
- Reserve Opus for architecture and specs only

### DON'T
- Use Opus for file searches (60x more expensive than Gemini)
- Use Sonnet for test execution (12x more expensive than Haiku)
- Use multiple LLMs for same task without reason
- Skip @quality-gate validation

### Daily Budget Targets
| Platform | Target | Alert |
|----------|--------|-------|
| Claude Code | $30 | $40 |
| OpenCode | $10 | $15 |
| Replit | $10 | $15 |
| **Total** | **$50** | **$70** |

## Session Sync Protocol

### Session Start (Any Platform)
```bash
# 1. Pull latest
git pull origin main

# 2. Check task state
bd ready

# 3. Claim work
bd update beads-xxx --status=in_progress --assignee=<platform>
```

### Session End (Any Platform)
```bash
# 1. Commit changes
git add . && git commit -m "..."

# 2. Push to appropriate branch
git push origin <branch>

# 3. Sync beads
bd sync --flush-only

# 4. Handoff notes (if incomplete)
bd update beads-xxx --notes="Stopped at: ..."
```

## Emergency Escalation

```
Platform Stuck 2x on Same Issue
           │
           ▼
┌──────────────────────────────┐
│ 1. Document in beads         │
│ 2. Switch platform           │
│ 3. Escalate LLM tier if needed│
└──────────────────────────────┘
```

| Situation | Escalate To |
|-----------|-------------|
| Haiku stuck | Sonnet |
| Sonnet stuck | Opus or GPT-4o |
| Replit stuck | Claude Code (full context) |
| Claude Code stuck | OpenCode + Grok (research) |
| Architecture unclear | Opus + o1-preview |
