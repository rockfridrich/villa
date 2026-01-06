# Reflection Schedule Protocol

Automated reflection and learning extraction for Villa development.

## Trigger Points

### Automatic (Hooks)

| Event | Action | Output |
|-------|--------|--------|
| PR Merged | Quick reflection | `.claude/reflections/{date}-pr-{number}.md` |
| Tag Created | Release reflection | `.claude/reflections/{date}-release-{tag}.md` |
| Session End | Session summary | `.claude/sessions/{date}.md` |

### Scheduled

| Frequency | Focus | Responsibility |
|-----------|-------|----------------|
| Daily (EOD) | What shipped, blockers | Active developer |
| Weekly (Friday) | Patterns, LEARNINGS.md updates | @reflect agent |
| Sprint End | Retrospective, metrics | @product agent |

## Reflection Commands

```bash
# Quick reflection (after PR merge)
@reflect "Quick: PR #{number}"

# Daily summary
@reflect "Daily: What shipped today"

# Weekly patterns
@reflect "Weekly: Cross-session patterns"

# Sprint retro
@reflect "Sprint: {sprint-name} retrospective"
```

## Output Structure

### Quick Reflection (< 2 min)
```markdown
## PR #{number}: {title}

**Shipped:** {one-line summary}
**Tokens:** ~{estimate}
**Pattern:** {reusable pattern or "none"}
```

### Daily Summary
```markdown
## {date} Daily

### Shipped
- PR #{n}: {title}

### Blockers
- {blocker if any}

### Tomorrow
- {next priority}
```

### Weekly Patterns
```markdown
## Week of {date}

### Metrics
| Metric | Value | Target |
|--------|-------|--------|
| PRs merged | X | - |
| CI success rate | X% | 100% |
| Avg PR size | X lines | <400 |

### Patterns to Add to LEARNINGS.md
1. **{Pattern Name}**: {description}

### Anti-Patterns Detected
1. **{Anti-Pattern}**: {occurrence count} → {fix}

### Focus Next Week
- {priority 1}
- {priority 2}
```

## Auto-Update Targets

After each reflection, update:

1. **LEARNINGS.md** - If new pattern saves >10 min
2. **ROADMAP.md** - If priorities shifted
3. **shared/defaults.json** - If workflow preference emerged
4. **README.md** - If user-facing changes shipped

## Integration with Agents

Reflections feed back to agents:

```
@reflect output
    ↓
LEARNINGS.md update
    ↓
@build reads LEARNINGS.md on next task
    ↓
Applies learned patterns
```

## Metrics Tracked

```bash
# Generate metrics
git log --oneline --since="1 week ago" | wc -l  # Commits
gh pr list --state merged --limit 50 --json mergedAt | jq 'map(select(.mergedAt > "2026-01-01"))' | jq length  # PRs
```
