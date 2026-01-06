# Shared Knowledge Protocol

How agents share learnings, goals, and focus across sessions and terminals.

## Knowledge Hierarchy

```
.claude/
├── LEARNINGS.md              # Cross-cutting patterns (append-only)
├── ROADMAP.md                # Strategic direction
├── shared/
│   ├── defaults.json         # Shared preferences
│   └── goals.json            # Current goals & priorities
├── knowledge/
│   ├── cloudflare.md         # Domain: CDN/DNS
│   ├── digitalocean.md       # Domain: Hosting
│   ├── porto.md              # Domain: Passkey SDK
│   └── {domain}.md           # Add as needed
└── sessions/
    └── {date}.md             # Session summaries
```

## Goals File

`.claude/shared/goals.json`:

```json
{
  "mission": "Privacy-first passkey authentication for pop-up villages",
  "currentSprint": {
    "name": "Sprint 4",
    "focus": "SDK screens + Developer portal",
    "endDate": "2026-01-13"
  },
  "priorities": [
    {
      "id": "P0",
      "title": "SignInWelcome screen",
      "owner": null,
      "status": "in_progress"
    },
    {
      "id": "P1",
      "title": "Sidebar navigation",
      "owner": null,
      "status": "pending"
    }
  ],
  "blocked": [],
  "completed": [
    "RAG system",
    "Multi-developer preferences"
  ]
}
```

## Agent Knowledge Loading

When an agent starts, it reads:

```
1. CLAUDE.md (always)
2. LEARNINGS.md (always)
3. shared/goals.json (always)
4. agents/{self}.md (own definition)
5. knowledge/{relevant}.md (if domain-specific)
6. specs/active/{current}.md (if working on spec)
```

## Updating Shared Knowledge

### LEARNINGS.md

Add when pattern saves >10 minutes:

```markdown
### {Number}. {Pattern Name}

**Problem:** {what went wrong}
**Solution:** {what works}
**Time saved:** ~{estimate}

```bash
# Example
{code snippet}
```
```

### goals.json

Update when:
- Sprint changes
- Priority completed/blocked
- New priority emerges

```bash
# View current goals
cat .claude/shared/goals.json | jq '.priorities'

# Update (manual or via @ops)
```

### knowledge/{domain}.md

Add when:
- New external service integrated
- Platform-specific gotcha discovered
- API pattern worth documenting

## Cross-Terminal Sync

Terminals sync via git:

```bash
# Before starting work
git pull origin main

# Goals are in repo, always current
cat .claude/shared/goals.json
```

For real-time coordination (not in git):

```bash
# coordination/state.json is gitignored
# Use coordinate.sh for real-time state
./scripts/coordinate.sh goals
```

## Knowledge Extraction

After significant work, extract learnings:

```bash
@reflect "Extract learnings from {feature}"
```

Reflect agent will:
1. Identify reusable patterns
2. Propose LEARNINGS.md additions
3. Update goals.json if needed
4. Create session summary

## Conflict Prevention

### Same Knowledge, Different Terminals

If two terminals discover same pattern:
- First to commit wins
- Second sees on next `git pull`
- No conflict if append-only

### Competing Goals Updates

Goals should only update via:
1. Human decision
2. @ops agent after human approval
3. Sprint planning session

Never auto-update priorities without human approval.

## Knowledge Deprecation

When knowledge becomes stale:

```markdown
### ~~{Old Pattern}~~ (Deprecated)

**Superseded by:** {new pattern or removal reason}
**Deprecated:** {date}
```

Keep for 2 sprints, then remove.

## Metrics

Track knowledge effectiveness:

| Metric | Target | How to Measure |
|--------|--------|----------------|
| LEARNINGS.md entries used | >50% | Grep in commits |
| Stale knowledge | <10% | Manual review |
| Pattern discovery rate | 2/week | Count new entries |
