# Technical Specifications

This directory contains technical implementation specs that complement the product specs.

## Spec Hierarchy

```
specs/
├── *.md                    # Feature specs (what to build)
├── *.wbs.md                # Work breakdown (how to parallelize)
├── product/                # Product specs (user value, UX)
│   └── *.product.md
└── tech/                   # Technical specs (implementation details)
    └── *.tech.md
```

## Purpose

| Spec Type | Audience | Contains |
|-----------|----------|----------|
| **Feature spec** | Everyone | Goals, acceptance criteria, scope |
| **Product spec** | PM, Design, AI | JTBD, user flows, copy, analytics |
| **WBS** | Engineers, AI | Work units, file ownership, dependencies |
| **Tech spec** | Engineers, AI | API contracts, data models, algorithms |

## Tech Spec Template

```markdown
# Tech Spec: {Feature Name}

**Product Spec:** [link]
**WBS:** [link]
**Status:** DRAFT | APPROVED | IMPLEMENTED

## API Contracts

### Endpoint: {method} {path}

**Request:**
\`\`\`typescript
interface Request { }
\`\`\`

**Response:**
\`\`\`typescript
interface Response { }
\`\`\`

**Error codes:**
| Code | When |
|------|------|

## Data Models

### {Model Name}

\`\`\`typescript
interface Model { }
\`\`\`

**Storage:** PostgreSQL | TinyCloud | localStorage

## Implementation Notes

- {Key decision 1}
- {Key decision 2}

## Test Matrix

| Scenario | Input | Expected Output |
|----------|-------|-----------------|
```

## Syncing with Claude GUI

See [SPEC-SYNC.md](SPEC-SYNC.md) for workflow to sync specs between:
- Claude GUI (web interface) - for drafting with stakeholders
- This repo - for implementation by AI agents

## Files in this directory

- `README.md` - This file
- `SPEC-SYNC.md` - Spec synchronization workflow
- `avatar-system.tech.md` - Avatar generation implementation (WU-4)
