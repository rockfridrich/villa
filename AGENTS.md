# Villa AI Agents

> **TL;DR**: Use **Sisyphus** (OpenCode) for everything. Fall back to Claude Code only if stuck.

## Quick Start

```
You: "Add dark mode to the settings page"
Sisyphus: *creates todo* → *delegates to frontend agent* → *verifies* → Done ✅
```

That's it. Sisyphus handles orchestration automatically.

---

## Which Agent to Use?

| Situation | Use |
|-----------|-----|
| **Any task** | Sisyphus (default) |
| **Sisyphus stuck 2+ times** | Claude Code |
| **Environment broken** | Claude Code |

### Sisyphus Capabilities

Sisyphus can delegate to specialized subagents:

| Task Type | Subagent | What It Does |
|-----------|----------|--------------|
| Find code | `explore` | Search codebase, find patterns |
| Library docs | `librarian` | External docs, OSS examples |
| UI/UX work | `frontend-ui-ux-engineer` | Visual design, styling |
| Architecture | `oracle` | Deep reasoning, design decisions |
| Documentation | `document-writer` | READMEs, API docs |

**Example workflow:**
```
User: "How does the auth flow work?"
Sisyphus: *fires explore agent in background*
Sisyphus: *reads results* → *explains to user*
```

---

## Cost Tiers

| Tier | Agents | Cost | Use For |
|------|--------|------|---------|
| **Cheap** | explore, librarian, test, ops | $0.25/1M | Search, deploy, tests |
| **Standard** | build, design, review | $3/1M | Implementation |
| **Premium** | oracle, architect | $15/1M | Architecture decisions |

Sisyphus automatically routes to the cheapest capable agent.

---

## Examples

### Find something
```
"Where is the login component?"
→ Sisyphus fires explore agent → Returns file path
Cost: ~$0.01
```

### Build something
```
"Add a logout button"
→ Sisyphus implements directly (or delegates to frontend agent for UI)
Cost: ~$0.10
```

### Design something
```
"Design the permission system"
→ Sisyphus consults oracle for architecture
Cost: ~$0.50
```

---

## When Things Go Wrong

| Problem | Solution |
|---------|----------|
| Sisyphus says "I'm stuck" | Switch to Claude Code |
| Build/tests failing repeatedly | Let Sisyphus try 2x, then Claude Code |
| "Command not found" errors | Claude Code (environment issue) |
| Need to update agent configs | Claude Code |

---

## For Contributors

See [OPENCODE-PARTNERSHIP.md](./OPENCODE-PARTNERSHIP.md) for detailed agent protocols.
