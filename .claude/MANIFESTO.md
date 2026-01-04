# Villa AI-Human Collaboration Manifesto

## Core Philosophy

**Humans and AI are equal partners** in building Villa. We learn together, improve together, and ship value to users together.

## Principles

### 1. Repo as Single Source of Truth

The repository is the canonical knowledge base for:
- **Claude Code** (CLI) - Reads `.claude/` for context
- **Claude GUI** (chat) - Same knowledge, different interface
- **Human developers** - Documentation serves all

Everything an agent needs to work autonomously should be in the repo.

### 2. Knowledge Accumulation

Every interaction teaches us something. Learnings are:
- **Captured** in `.claude/knowledge/` by domain
- **Structured** for efficient context loading
- **Actionable** with patterns, not just facts

```
.claude/knowledge/
├── cloudflare.md      # CDN, DNS, security patterns
├── digitalocean.md    # App Platform patterns
├── porto.md           # Passkey SDK patterns
├── ci-cd.md           # Deployment patterns
└── testing.md         # E2E, unit test patterns
```

### 3. SDK-First Integration

**Never use raw curl/bash for external services.**

| Bad | Good |
|-----|------|
| `curl -X POST "https://api.cloudflare.com/..."` | `cloudflare.zones.purgeCache()` |
| Bash scripts with API calls | TypeScript modules with SDKs |
| Hardcoded endpoints | Typed SDK methods |

Benefits:
- **Type safety** - Catch errors at compile time
- **Documentation** - SDK types are self-documenting
- **Reliability** - SDKs handle auth, retries, errors
- **Maintainability** - Version updates, not script fixes

### 4. Agent-Optimized Context

Structure information for efficient token usage:

```markdown
# Domain: CloudFlare

## Quick Reference (load first)
- Zone ID: stored in CLOUDFLARE_ZONE_ID env
- API: use `cloudflare` npm package
- Common ops: purgeCache, updateDNS, getStatus

## Patterns (load when needed)
[Detailed patterns here]

## Learnings (historical context)
[Past mistakes and solutions]
```

### 5. Secure Delegation

Agents can be trusted with:
- **Read operations** - Always safe
- **Idempotent writes** - DNS updates, config changes
- **Reversible actions** - Deploys with rollback

Agents must ask humans for:
- **Destructive operations** - Data deletion
- **Cost implications** - Resource scaling
- **Security decisions** - Permission changes

### 6. Progressive Disclosure

Not all context is needed upfront:

```
Level 1: Quick reference (always loaded)
Level 2: Common patterns (loaded on task type)
Level 3: Deep knowledge (loaded on specific need)
Level 4: Historical learnings (loaded on errors)
```

### 7. Feedback Loops

```
Human request
    ↓
Agent executes
    ↓
Result observed
    ↓
Learning captured ← Update knowledge base
    ↓
Next request (improved)
```

## Implementation

### Directory Structure

```
.claude/
├── CLAUDE.md           # Project instructions (always loaded)
├── MANIFESTO.md        # This file - philosophy
├── LEARNINGS.md        # Session learnings (append-only)
├── agents/             # Agent definitions
├── knowledge/          # Domain knowledge (structured)
│   ├── cloudflare.md
│   ├── digitalocean.md
│   └── ...
└── templates/          # Reusable templates

src/
├── lib/
│   └── infra/          # SDK wrappers (typed, tested)
│       ├── cloudflare.ts
│       ├── digitalocean.ts
│       └── index.ts
```

### SDK Integration Pattern

```typescript
// src/lib/infra/cloudflare.ts
import Cloudflare from 'cloudflare';

const cf = new Cloudflare({
  apiToken: process.env.CLOUDFLARE_API_TOKEN,
});

export const cloudflare = {
  async purgeCache(urls?: string[]) {
    const zoneId = process.env.CLOUDFLARE_ZONE_ID!;
    if (urls) {
      return cf.cache.purge({ zone_id: zoneId, files: urls });
    }
    return cf.cache.purge({ zone_id: zoneId, purge_everything: true });
  },

  async getStatus() {
    const zoneId = process.env.CLOUDFLARE_ZONE_ID!;
    return cf.zones.get({ zone_id: zoneId });
  },

  // ... more typed methods
};
```

### Knowledge File Pattern

```markdown
# Domain: [Name]

## Quick Reference
[5-10 lines, always relevant]

## Common Operations
[Step-by-step for frequent tasks]

## Patterns
[Reusable solutions to common problems]

## Anti-Patterns
[What NOT to do and why]

## Learnings
[Dated entries of discoveries]
```

## Metrics

Track collaboration quality:

| Metric | Target | Why |
|--------|--------|-----|
| Token efficiency | <50k per task | Less waste |
| First-attempt success | >80% | Good context |
| Knowledge reuse | >60% | Learning works |
| Human interventions | <20% | Trust building |

## Evolution

This manifesto evolves. When we discover:
- **New patterns** → Add to knowledge base
- **Better tools** → Update SDK integrations
- **Collaboration friction** → Refine process

---

*"The best code is written by humans and AI thinking together, not separately."*
