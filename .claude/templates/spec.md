# {Feature Name}

**Status:** DRAFT | IN PROGRESS | REVIEW | DONE
**Design:** {Figma/Lovable link or "Pending"}

## Goal

{One sentence: what does this feature accomplish for the user?}

## Why This Approach

### Alternatives Considered

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| Option A | Fast to implement | Missing X feature | ❌ |
| Option B | Full featured | More complex | ✅ |

### Decision Rationale

{Why the chosen approach is best for Villa's goals}

## User Experience

{Step by step from user's perspective. Number each step.}

1. User sees/does X
2. System responds with Y
3. User completes Z

## Screens

{List screens needed}

- Screen name: {purpose}
- Screen name: {purpose}

## UI Boundaries

**Villa controls:**
- {List what we control}

**External system controls:**
- {List what SDK/API controls}

## States

{What states must each screen handle?}

- Loading
- Error
- Success
- Offline

## Session Behavior

| What | TTL | Who Controls | Notes |
|------|-----|--------------|-------|
| Session token | 24h | External SDK | Auto-refresh |
| Local state | Persistent | Villa | localStorage |

## Language Guidelines

| Internal/Tech | User-Facing |
|---------------|-------------|
| SDK name | Never shown |
| wallet address | Villa ID |

## Technical

{Brief technical approach. Prose preferred over code.}

**Data:** What's stored, where

**Dependencies:** External SDKs, APIs

**Security:** Auth, validation, privacy requirements

**Performance:** Latency expectations, offline behavior

## Deployment Considerations

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| NEXT_PUBLIC_X | Yes | {description} |

### Platform Quirks

{Known issues with deployment platform}

- doctl: Use `Spec.Name` not `Name` (returns nil)
- Buildpacks: Prune devDeps before build
- {Other quirks discovered}

## Tasks

{Checklist of implementation tasks}

- [ ] Task 1
- [ ] Task 2
- [ ] Write E2E tests
- [ ] Write security tests

## Acceptance Criteria

{How do we know it's done? Each must be testable.}

- [ ] User can do X
- [ ] System handles Y error
- [ ] E2E tests pass
- [ ] Security tests pass
- [ ] Deployed and verified

## Out of Scope

{What this feature does NOT include}
