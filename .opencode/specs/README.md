# Feature Specifications

This directory contains feature specifications created by the @spec agent.

## Specification Format

Each spec follows the Why/UI Boundaries/Tasks structure:

```markdown
# Feature Name

## Why

Business justification and user value.

## UI Boundaries

What changes where. Component scope.

## Tasks

Parallelizable work units with file ownership.
```

## Active Specs

| Spec       | Status | Owner |
| ---------- | ------ | ----- |
| (none yet) | -      | -     |

## Creating Specs

Use the @spec agent:

```
@spec Create spec for [feature description]
```

## Spec Lifecycle

1. **Draft** - Initial creation
2. **Review** - Architecture validation by @architect
3. **Approved** - Ready for implementation
4. **Implemented** - Tasks completed
5. **Archived** - Feature shipped
