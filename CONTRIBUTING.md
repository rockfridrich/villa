# Contributing to Villa

Welcome to Villa! This guide helps you get started with our AI-assisted development workflow.

## Quick Start for Product/Vision Contributors

If you're focused on product direction and vision (like Abu), here's your streamlined workflow:

### 1. Share Ideas via GitHub Issues

```bash
# Create a feature request
gh issue create --title "Feature: [Your idea]" --body "## Problem\n...\n## Proposed Solution\n..."

# Or use the web UI
open https://github.com/rockfridrich/villa/issues/new
```

### 2. Discuss in Issue Comments

- Tag relevant people: `@rockfridrich`, `@AbuSantos`
- Use reactions to vote on ideas
- Reference related issues: `Related to #47`

### 3. Review PRs

When implementation PRs are created, review them for:

- Does it match the product vision?
- Is the UX intuitive?
- Any edge cases missed?

## Collaboration Workflow

```
[Issue] → [Discussion] → [Spec] → [PR] → [Review] → [Ship]
   ↑                                         |
   └─────────── Feedback Loop ───────────────┘
```

### Issue Types

| Label         | Use For                  |
| ------------- | ------------------------ |
| `feature`     | New functionality        |
| `enhancement` | Improve existing feature |
| `bug`         | Something broken         |
| `question`    | Need clarification       |
| `product`     | Product/UX decisions     |

### Linking Issues to Work

When creating specs or PRs, always reference the issue:

```markdown
Closes #47
Related to #45
```

## Using OpenCode (AI Assistant)

OpenCode is our AI coding assistant. Here's how to use it effectively:

### Starting a Session

```bash
# In terminal, from villa directory
opencode

# Or with a specific task
opencode "Review issue #47 and propose implementation"
```

### Effective Prompts for Product People

**For exploring ideas:**

```
Look at issue #47 and tell me:
1. What's the current state?
2. What would implementation involve?
3. What are the tradeoffs?
```

**For creating specs:**

```
Create a product spec for [feature] based on issue #XX.
Include: user stories, acceptance criteria, and edge cases.
```

**For reviewing code:**

```
Review PR #XX from a product perspective.
Does it match the spec? Any UX concerns?
```

### Key Commands

| Command    | What It Does                   |
| ---------- | ------------------------------ |
| `@explore` | Search codebase                |
| `@oracle`  | Deep technical analysis        |
| `@product` | Product specs and user stories |
| `@design`  | UI/UX review                   |

## Repository Structure

```
villa/
├── apps/
│   ├── hub/          # Main Villa app (villa.cash)
│   └── developers/   # Developer portal (developers.villa.cash)
├── packages/
│   ├── sdk/          # Villa SDK (npm package)
│   └── sdk-react/    # React bindings
├── specs/            # Feature specifications
│   ├── product/      # Product specs
│   └── decisions/    # Architecture decisions (ADRs)
├── docs/             # Documentation
│   └── guides/       # Integration guides
└── contracts/        # Smart contracts (Solidity)
```

### Key Files to Know

| File                    | Purpose                  |
| ----------------------- | ------------------------ |
| `specs/STATUS.md`       | Current spec status      |
| `specs/product/*.md`    | Product specifications   |
| `AGENTS.md`             | AI agent system overview |
| `.opencode/OPENCODE.md` | OpenCode protocols       |

## Product Decision Process

### 1. Identify Need

Create an issue describing the user problem.

### 2. Discuss Options

Use issue comments to explore solutions.

### 3. Create Spec (if approved)

```
specs/product/[feature-name].product.md
```

### 4. Implementation

Engineers create PRs linked to the spec.

### 5. Review & Ship

Product review → Merge → Deploy

## Communication Channels

| Channel       | Use For                              |
| ------------- | ------------------------------------ |
| GitHub Issues | Feature requests, bugs, discussions  |
| GitHub PRs    | Code review, implementation feedback |
| Telegram      | Quick questions, real-time chat      |

## Getting Help

- **Technical questions**: Create an issue with `question` label
- **Product decisions**: Tag `@AbuSantos` or `@rockfridrich`
- **AI assistance**: Use OpenCode with `@oracle` for deep analysis

---

## For Engineers

See [AGENTS.md](./AGENTS.md) for the full AI agent system and [.opencode/OPENCODE.md](./.opencode/OPENCODE.md) for protocols.
