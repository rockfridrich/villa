# Cross-Terminal Coordination Protocol

Prevents conflicts when multiple Claude instances work in parallel.

## State File

Location: `.claude/coordination/state.json` (gitignored)

```json
{
  "terminals": {
    "terminal-1": {
      "agent": "@build",
      "task": "Implementing avatar upload",
      "files": ["src/components/sdk/AvatarUpload.tsx"],
      "startedAt": "2026-01-06T08:00:00Z",
      "lastHeartbeat": "2026-01-06T08:05:00Z"
    }
  },
  "locks": {
    "src/components/sdk/AvatarUpload.tsx": "terminal-1"
  },
  "goals": {
    "current": "Sprint 4: SDK screens",
    "priorities": ["P0: SignInWelcome", "P1: Navigation"]
  }
}
```

## Coordination Script

```bash
./scripts/coordinate.sh status      # Show all terminal states
./scripts/coordinate.sh claim WU-1  # Claim a work unit
./scripts/coordinate.sh lock file   # Lock a file for editing
./scripts/coordinate.sh check file  # Check if file is available
./scripts/coordinate.sh complete    # Release locks, mark done
./scripts/coordinate.sh goals       # Show current goals
```

## Rules

### Before Editing Any File

```bash
# Terminal must check before editing
./scripts/coordinate.sh check src/path/to/file.tsx

# Returns:
# OK - file is available
# BLOCKED by terminal-2 (@design) - wait or coordinate
```

### File Ownership by Agent Type

| Agent | Owns | Can Edit |
|-------|------|----------|
| @build | src/components/, src/lib/ | src/app/, tests/ |
| @design | src/components/ui/ | src/app/ |
| @test | tests/ | src/ (read-only) |
| @ops | .github/, scripts/ | package.json |
| @data | src/lib/db/, drizzle/ | src/app/api/ |

### Conflict Resolution

1. **Same file, different sections**: Coordinate via comment in state
2. **Same file, same section**: First claimer wins, second waits
3. **Deadlock**: Human arbitrates

## Heartbeat

Terminals must heartbeat every 5 minutes:

```bash
./scripts/coordinate.sh heartbeat
```

Stale terminals (>10 min no heartbeat) have locks auto-released.

## Goals Alignment

All terminals read goals from state:

```bash
./scripts/coordinate.sh goals

# Output:
# Current: Sprint 4 - SDK screens
# Priorities:
#   P0: SignInWelcome screen
#   P1: Sidebar navigation
#   P2: E2E stability
#
# Your focus: [based on agent type]
```

## Handoff Protocol

When terminal completes work:

```bash
./scripts/coordinate.sh complete WU-1 "Implemented AvatarUpload with tests"
```

This:
1. Releases all file locks
2. Updates state with completion message
3. Notifies other terminals (if watching)
4. Suggests next work unit

## Emergency Override

If coordination state is corrupted:

```bash
./scripts/coordinate.sh reset  # Clears all state (use carefully)
```
