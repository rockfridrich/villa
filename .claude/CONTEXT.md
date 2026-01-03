# Villa Context (Compact)

Quick reference for Claude Code sessions. Full details in LEARNINGS.md.

## Core Patterns

### Parallel Execution (DEFAULT)
```
✅ read files → edit → test + review (parallel)
❌ read → wait → edit → wait → test → wait
```

### Environment URLs
```bash
# Never hardcode URLs
await page.goto('/')  # ✅ relative
BASE_URL=https://x.com npm test  # ✅ env var
const URL = 'https://prod.com'  # ❌ hardcoded
```

### doctl App Names
```bash
# Use Spec.Name (not Name - returns <nil>)
doctl apps list --format ID,Spec.Name --no-header
```

## Quick Commands

| Task | Command |
|------|---------|
| Dev server | `npm run dev` |
| HTTPS (passkeys) | `npm run dev:https` |
| Mobile QA | `npm run qa` |
| Tests | `npm run verify` |
| E2E only | `npm run test:e2e:chromium` |
| Deploy test | `BASE_URL=https://x.com npm run test:e2e:chromium` |

## Agent Selection

| Task | Agent | Model |
|------|-------|-------|
| Architecture | @architect | opus |
| Implementation | @build | sonnet |
| Tests | @test | haiku |
| Review | @review | sonnet |
| Search | @explore | haiku |

## Anti-Patterns

- ❌ Sequential when parallel possible
- ❌ Hardcoded URLs in tests
- ❌ `doctl --format Name` (use Spec.Name)
- ❌ console.error with user data
- ❌ setTimeout without cleanup ref
- ❌ Multiple builds without @architect

## Key Files

| File | Purpose |
|------|---------|
| `playwright.config.ts` | BASE_URL handling |
| `.do/app-*.yaml` | DO App Platform specs |
| `src/lib/porto.ts` | Porto SDK wrapper |
| `src/lib/store.ts` | Zustand state |
| `src/lib/validation.ts` | Input sanitization |

## CI Flow

```
PR:   ci → permission → deploy-preview → e2e-preview
main: ci-production → deploy-production → e2e-production
```

## Production

- **URL**: https://villa-production-vcryk.ondigitalocean.app
- **Health**: /api/health
- **Tests**: 145 passing (76 unit + 69 E2E)
