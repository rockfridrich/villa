# Three-Platform AI Agent Orchestration

> Protocol for Claude Code GUI, OpenCode Terminal, and Claude Code Terminal coordination with optimized LLM routing.

## Platform Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Human                                    │
│            Sets direction, approves, reviews                     │
└───────────────────────────┬─────────────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Claude Code    │ │    OpenCode     │ │  Claude Code    │
│     (GUI)       │ │   (Terminal)    │ │   (Terminal)    │
│                 │ │                 │ │                 │
│ • Research      │ │ • Implement     │ │ • Recovery      │
│ • Planning      │ │ • Multi-file    │ │ • Debug CI      │
│ • Coordination  │ │ • Testing       │ │ • Unblock       │
│                 │ │                 │ │                 │
│ LLM: Opus       │ │ LLM: Sonnet     │ │ LLM: Haiku      │
│ Agents: Gemini  │ │ Agents: Qwen    │ │ Fast fixes      │
│         Grok    │ │         Gemini  │ │                 │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         └─────────┬─────────┴─────────┬─────────┘
                   ▼                   ▼
           ┌─────────────┐     ┌─────────────┐
           │   Beads     │     │    Git      │
           │ .beads/     │     │ fix/*,main  │
           └─────────────┘     └─────────────┘
```

---

## Platform Responsibilities

### Claude Code GUI (Research & Coordination)

**Primary Role:** Strategic planning, research, multi-platform coordination

**When to Use:**
- Complex research requiring web access
- Planning multi-step implementations
- Creating specs and architectural decisions
- Coordinating work between platforms
- Code review with visual context

**Default Models:**
- Orchestrator: Opus (complex reasoning)
- Search: Gemini Flash (1M context)
- Research: Grok (real-time web)

**Handoff Protocol:**
1. Create Beads task with clear scope
2. Write implementation prompt in `.opencode/tasks/`
3. Update task status: `bd update <id> --assignee=opencode`

### OpenCode Terminal (Implementation)

**Primary Role:** Code implementation, multi-file changes, testing

**When to Use:**
- Writing new features
- Bug fixes requiring code changes
- Running tests
- Multi-file refactoring
- Database migrations

**Default Models:**
- Orchestrator: Sonnet (code quality)
- Explore: Gemini Flash (fast search)
- Test: Haiku (command execution)
- Fix: Qwen 72B (quick fixes)
- Review: Gemini Pro (code review)

**Handoff Protocol:**
1. Read task from `.opencode/tasks/` or Beads
2. Execute implementation
3. Run `bun verify` before commit
4. Update Beads: `bd close <id> --reason="Implemented in <commit>"`

### Claude Code Terminal (Recovery)

**Primary Role:** Quick fixes, CI debugging, unblocking

**When to Use:**
- CI failures after OpenCode push
- Quick typo fixes
- Emergency hotfixes
- Unblocking stuck work

**Default Models:**
- Main: Haiku (fast, cheap)
- Escalate to Sonnet only if needed

**Handoff Protocol:**
1. Check CI status: `gh run list --limit 5`
2. Fix issue with minimal changes
3. Push and verify CI passes
4. Update Beads if applicable

---

## LLM Model Routing v3.0

### Preferred Providers

| Provider | Models | Use Case |
|----------|--------|----------|
| **Anthropic** | Opus, Sonnet, Haiku | Core reasoning, implementation |
| **Google** | Gemini Flash, Gemini Pro | Search, code review |
| **xAI** | Grok | Web research |
| **Qwen** | Qwen 72B | Quick fixes |

### Removed Providers

- ~~OpenAI (GPT-4o, GPT-4o-mini, o1-preview)~~
- ~~DeepSeek (deepseek-r1)~~

### Agent Model Assignments

| Agent | Model | Cost/1M | Tier | Use Case |
|-------|-------|---------|------|----------|
| @explore | Gemini Flash | $0.08 | Worker | File search, exploration |
| @test | Haiku | $0.25 | Worker | Test execution |
| @ops | Haiku | $0.25 | Worker | Git, deploy |
| @router | Haiku | $0.25 | Worker | Task classification |
| @fix | Qwen 72B | $0.35 | Specialist | Quick bug fixes |
| @review | Gemini Pro | $1.25 | Specialist | Code review |
| @build | Sonnet | $3.00 | Specialist | Implementation |
| @design | Sonnet | $3.00 | Specialist | UI/UX |
| @research | Grok | $5.00 | Specialist | Web research |
| @architect | Opus | $15.00 | Architect | System design |
| @spec | Opus | $15.00 | Architect | Feature specs |

---

## Beads Handoff Protocol

### Creating Delegatable Tasks

```bash
# Create task for OpenCode
bd create --title="Implement feature X" --type=task --priority=1

# Create task prompt file
cat > .opencode/tasks/feature-x-prompt.md << 'EOF'
# OpenCode Prompt: Feature X

**Beads:** <id>
**Priority:** P1
**Branch:** feat/feature-x

## SESSION START
bd prime
bd update <id> --status=in_progress

## IMPLEMENTATION
1. Step one...
2. Step two...

## AFTER EACH STEP
bun typecheck && bun lint

## WHEN DONE
bd close <id>
git push
EOF
```

### Task Status Flow

```
┌─────────┐     ┌─────────────┐     ┌──────────┐
│  open   │ ──▶ │ in_progress │ ──▶ │  closed  │
└─────────┘     └─────────────┘     └──────────┘
     │                │                   ▲
     │                │                   │
     │                ▼                   │
     │         ┌─────────────┐           │
     └────────▶│   blocked   │───────────┘
               └─────────────┘
```

### Handoff Commands

```bash
# Claude Code GUI → OpenCode
bd create --title="Task description" --type=task
bd update <id> --assignee=opencode --note="See .opencode/tasks/prompt.md"

# OpenCode → Claude Code Terminal (stuck)
bd update <id> --assignee=claude-code --note="Stuck on: <error>"

# Claude Code Terminal → Done
bd close <id> --reason="Fixed in <commit>"
```

---

## Escalation Rules

### Worker → Specialist

Escalate when:
- Complex reasoning required (not just pattern matching)
- Code generation needed (not just running commands)
- Ambiguous instructions need interpretation

### Specialist → Architect

Escalate when:
- Security implications detected
- Breaking changes to public API
- Multi-system integration (3+ services)
- Novel patterns not in codebase
- Confidence < 60% on approach

### Stuck Protocol

After 2 failures on same issue:
1. Stop implementation
2. Update Beads with error details
3. Reassign to different platform
4. Human reviews if still blocked

---

## Configuration Files

| File | Purpose |
|------|---------|
| `opencode.json` | OpenCode agent definitions |
| `.opencode/llm-router.json` | Multi-LLM routing config |
| `.opencode/AGENT_COSTS.md` | Cost optimization guide |
| `.opencode/tasks/*.md` | Delegatable task prompts |
| `.beads/issues.jsonl` | Persistent task memory |

---

## Quick Reference

### Start Work (OpenCode)

```bash
bd prime           # Load Beads context
bd ready           # Find available tasks
bd show <id>       # Review task details
bd update <id> --status=in_progress
```

### Complete Work

```bash
bun verify         # Typecheck + lint + test
git add -A
git commit -m "feat: description"
bd close <id> --reason="Implemented in <hash>"
bd sync --flush-only
git push
```

### Check Health

```bash
bd stats           # Task statistics
bd blocked         # Show blocked tasks
gh run list        # CI status
curl -s https://beta.villa.cash/api/health | jq .
```
