# Multi-Terminal Coordination Protocol

Runtime coordination for parallel Claude Code terminals.

## Quick Start

Before editing any file during parallel work:

```bash
# Check if file is available
cat .claude/coordination/state.json | jq '.lockedFiles["src/path/to/file.ts"]'
# null = available, object = locked
```

## How It Works

1. **@architect** creates WBS with file ownership
2. Agents claim work units in `state.json` before starting
3. Other agents check state before editing
4. Conflicts detected early, not at git merge time

## Files

- `state.json` — Runtime coordination state (git-ignored)
- `state.schema.json` — JSON Schema for validation
- `README.md` — This file

## Protocol

See CLAUDE.md section "Runtime Coordination Protocol" for full details.
