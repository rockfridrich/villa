# Abu's OpenCode Guide

Personal workflow guide for Abu - Product & Vision Lead.

## Your Role

You focus on:

- Product vision and direction
- User experience decisions
- Feature prioritization
- Community engagement

You don't need to:

- Write code directly
- Debug technical issues
- Review implementation details

## Daily Workflow

### Morning: Review & Prioritize

```bash
# Check what's happening
gh issue list --label "product"
gh pr list --state open

# Or in OpenCode
opencode "Show me open issues needing product decisions"
```

### During Day: Respond & Guide

1. **Comment on issues** with your vision
2. **Review PRs** for product alignment
3. **Create specs** for new features

### Evening: Plan Next

```bash
# Create tomorrow's priorities
gh issue create --title "Priority: [Feature]" --label "product,high-priority"
```

## Key OpenCode Prompts

### Exploring Ideas

```
"What would it take to add [feature]? Give me the user perspective, not technical details."
```

```
"Review issue #XX from a product standpoint. What questions should we answer before building?"
```

### Creating Specs

```
"Create a product spec for [feature]. Focus on:
- Who is this for?
- What problem does it solve?
- What does success look like?
- What are the edge cases?"
```

### Reviewing Work

```
"Look at PR #XX. Does it match our product vision? Any UX concerns?"
```

### Understanding Status

```
"What's the current status of [feature]? What's blocking it?"
```

## Issue Templates

### Feature Request

```markdown
## User Problem

[Who has this problem and why it matters]

## Proposed Solution

[High-level description]

## Success Criteria

- [ ] User can...
- [ ] User sees...
- [ ] User feels...

## Open Questions

- [ ] ...
```

### Product Decision

```markdown
## Context

[Background on the decision needed]

## Options

1. **Option A**: [description]
   - Pros: ...
   - Cons: ...

2. **Option B**: [description]
   - Pros: ...
   - Cons: ...

## Recommendation

[Your recommendation and why]

## Decision

[ ] Pending discussion
```

## Quick Commands

| Task         | Command                             |
| ------------ | ----------------------------------- |
| Create issue | `gh issue create`                   |
| List issues  | `gh issue list`                     |
| View issue   | `gh issue view #XX`                 |
| Comment      | `gh issue comment #XX --body "..."` |
| List PRs     | `gh pr list`                        |
| Review PR    | `gh pr view #XX`                    |

## Villa Product Principles

When making decisions, consider:

1. **Privacy First** - Never compromise user privacy
2. **One Identity** - Villa ID works everywhere
3. **AI Native** - Integration should be conversational
4. **Community Owned** - Features serve pop-up villages

## Current Priorities

See [Issue #47](https://github.com/rockfridrich/villa/issues/47) for the roadmap.

### Pending Product Decisions

1. **Default auth mode**: Relay vs Dialog
2. **Custom passkey RP ID**: Timeline for allowing custom domains
3. **Glide "Add Funds"**: Where to place funding widget

## Getting Help

- **Technical blockers**: Create issue, tag `@rockfridrich`
- **Design questions**: Use `@design` agent in OpenCode
- **Product brainstorming**: Use `@product` agent in OpenCode

## Example Session

```bash
$ opencode

> What issues need my input today?

[Agent lists issues with 'product' label or needing decision]

> Create a spec for the nickname marketplace feature based on issue #52

[Agent creates detailed product spec]

> Review PR #48 - does it match our vision for the settings page?

[Agent provides product-focused review]
```

---

Remember: Your job is to guide **what** we build and **why**. The team handles **how**.
