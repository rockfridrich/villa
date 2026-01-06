# Villa Context RAG System

This directory implements persistent, testable context loading for Claude Code agents.

## Load Hierarchy

```
Level 0: .claude/CLAUDE.md (auto-loaded by Claude Code)
    │
    ├── Level 1: SYSTEM_PROMPT.md (orchestrator identity)
    │   └── Partnership model, delegation patterns
    │
    ├── Level 2: MANIFESTO.md (philosophy)
    │   └── Repo as truth, SDK-first, knowledge accumulation
    │
    ├── Level 3: agents/{role}.md (role-specific)
    │   └── @build, @test, @design, @ops, @data, etc.
    │
    └── Level 4: knowledge/{domain}.md (domain-specific)
        └── cloudflare.md, digitalocean.md, porto.md
```

## Context Loading Rules

1. **CLAUDE.md** - Always loaded (Claude Code built-in)
2. **SYSTEM_PROMPT.md** - Referenced in CLAUDE.md header
3. **MANIFESTO.md** - Referenced for philosophy questions
4. **agents/{role}.md** - Loaded when spawning @role
5. **knowledge/{domain}.md** - Loaded for domain-specific tasks

## Token Budgets

| Context | Max Tokens | Notes |
|---------|------------|-------|
| CLAUDE.md | 2K | Quick reference only |
| SYSTEM_PROMPT | 3K | Orchestrator context |
| MANIFESTO | 2K | Philosophy |
| Agent prompt | 5K | Role-specific |
| Knowledge | 3K | Per domain |

## Validation

Run context tests:
```bash
pnpm test:context
```

This validates:
- All agents have required sections
- No duplicate definitions
- Token budgets respected
- Reference links resolve
