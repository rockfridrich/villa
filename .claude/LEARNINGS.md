# Development Learnings

Patterns discovered during development. Session notes archived in `sessions/`.

---

## Core Patterns

### 1. Parallel Execution (DEFAULT)

```
✅ read files → edit → test + review (parallel)
❌ read → wait → edit → wait → test → wait
```

**When to parallelize:**
- Multiple file reads → single message
- Test + Review → always together after build
- Independent searches → multiple Grep/Glob calls

### 2. Environment-Agnostic Testing

```typescript
// ✅ Correct: relative URLs
await page.goto('/')

// ❌ Wrong: hardcoded URLs
const URL = 'https://prod.example.com'
```

Run against any environment:
```bash
BASE_URL=https://x.com npm run test:e2e:chromium
```

### 3. Return Types Over Logging

```typescript
// ❌ Bad: logs PII, returns void
setIdentity: (identity) => void {
  if (error) console.error('Error:', sensitiveData)
}

// ✅ Good: returns boolean, caller handles
setIdentity: (identity) => boolean {
  if (error) return false
}
```

### 4. Atomic SDK Operations

```typescript
// ❌ Bad: race condition
resetInstance()
await useInstance()

// ✅ Good: atomic with options
await useInstance({ forceRecreate: true })
```

### 5. React Cleanup Pattern

```typescript
const timeoutRef = useRef<NodeJS.Timeout>()

useEffect(() => () => {
  if (timeoutRef.current) clearTimeout(timeoutRef.current)
}, [])
```

---

## Platform Quirks

### DigitalOcean App Platform

| Issue | Fix |
|-------|-----|
| `doctl --format Name` returns `<nil>` | Use `--format Spec.Name` |
| Buildpacks prune devDeps before build | Use Dockerfile for Next.js |
| PR comments fail | Add `permissions: pull-requests: write` |

### Porto SDK

| Issue | Fix |
|-------|-----|
| Iframe mode needs domain registration | Contact @porto_devs on Telegram |
| ngrok always uses popup mode | Expected (not in trusted hosts) |
| Session TTL ~24h | Server-controlled, not configurable |

---

## Anti-Patterns

- ❌ Sequential when parallel possible
- ❌ Hardcoded URLs in tests
- ❌ console.error with user data
- ❌ setTimeout without cleanup ref
- ❌ Multiple builds without @architect
- ❌ Implementing before spec is clear

---

## Velocity Metrics

| Metric | Target | Phase 1 Actual |
|--------|--------|----------------|
| Pivots per feature | 0-1 | 2 |
| CI failures | 0 | 4 |
| Avg CI time | <5m | 3.1m |
| Tests | >100 | 145 |

---

## Session Archive

Historical session notes in `.claude/archive/`:
- `REFLECTION-PHASE1.md` - Phase 1 retrospective

Full session logs preserved in git history for reference.

---

*Auto-update: Extract patterns here, archive sessions after 2 weeks*
