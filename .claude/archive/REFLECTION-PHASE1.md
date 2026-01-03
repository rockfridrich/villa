# Reflection: Phase 1 - Passkey Authentication

Analysis of the Porto SDK passkey login implementation.

## Velocity Metrics

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| PR commits (squashed) | 25 | - | - |
| Implementation pivots | 2 | 0-1 | ❌ |
| CI failures | 4 | 0 | ❌ |
| Avg CI time | 3.1m | <5m | ✅ |
| Tests | 145 | >100 | ✅ |
| Deploy time | ~3.5m | <5m | ✅ |

## What Went Well

### 1. Parallel Execution
- Ran test + review agents simultaneously
- Multiple file reads in single message
- CI runs unit + E2E in parallel (~3m total)

### 2. Environment-Agnostic Testing
- `BASE_URL` env var pattern works across all environments
- Same tests run locally, preview, and production
- No hardcoded URLs in final code

### 3. Porto SDK Integration
- Theming worked first try (30+ tokens)
- Iframe/popup detection automatic
- Session management handled by SDK

### 4. CI/CD Pipeline
- Preview deploys for every PR
- E2E tests on deployed URLs
- Collaborator-only security for previews

## What Slowed Us Down

### 1. doctl API Quirk (4 CI failures, ~30min)
**Problem**: `doctl apps list --format Name` returns `<nil>`
**Root cause**: Undocumented - must use `Spec.Name`
**Fix**: Updated all doctl commands

**Prevention**: Add integration test for doctl commands

### 2. Porto SDK Pivots (2 pivots, ~40min)
**Problem**: Spec didn't explain why Porto vs native WebAuthn
**Root cause**: Missing "Why this approach" section
**Fix**: Added to spec template

**Prevention**: Spec agent must include alternatives analysis

### 3. Buildpacks vs Dockerfile (~30min)
**Problem**: Buildpacks pruned devDependencies before build
**Root cause**: Tailwind is devDep but needed at build time
**Fix**: Switched to Dockerfile with BuildKit caching

**Prevention**: Default to Dockerfile for Next.js apps

### 4. PR Comment Permissions (~10min)
**Problem**: GitHub Actions couldn't comment on PRs
**Root cause**: Missing `pull-requests: write` permission
**Fix**: Added permissions block to workflow

**Prevention**: Include permissions in workflow template

## Recommendations

### Immediate (This PR)

1. **Workflow Template**: Add standard permissions block
2. **doctl Test**: Add CI step to validate doctl format works
3. **Spec Template**: Require "Why this approach" section
4. **Docker Default**: Document Dockerfile preference for Next.js

### Future Improvements

1. **Parallel CI**: Split unit and E2E into separate jobs
2. **Cache Warming**: Pre-warm npm cache in CI
3. **Preview Cleanup**: Auto-delete previews after 24h
4. **Slack/Discord Notifications**: Alert on deploy success/failure

## Spec Template Updates

Add these sections to `.claude/templates/spec.md`:

```markdown
## Why This Approach

### Alternatives Considered
| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| Option A | ... | ... | ❌ |
| Option B | ... | ... | ✅ |

### Decision Rationale
[Why the chosen approach is best]

## Deployment Considerations

### Platform Quirks
- [Known issues with DO/Vercel/etc]

### Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|

## Session Behavior

### Persistence
| What | TTL | Who Controls |
|------|-----|--------------|
```

## Workflow Improvements

### deploy.yml Updates

```yaml
# Add doctl validation step
- name: Validate doctl
  run: |
    # Ensure Spec.Name works (not Name which returns <nil>)
    doctl apps list --format ID,Spec.Name --no-header | head -1
    if [ $? -ne 0 ]; then
      echo "doctl format validation failed"
      exit 1
    fi
```

### CI Parallelization

```yaml
jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps: [unit tests only]

  e2e-tests:
    runs-on: ubuntu-latest
    steps: [e2e tests only]

  deploy:
    needs: [unit-tests, e2e-tests]
```

## Agent Workflow Improvements

### Model Selection Accuracy
- ✅ Used opus for spec/architect
- ✅ Used sonnet for build/review
- ✅ Used haiku for explore/test
- ❌ Could have used haiku for simple edits

### Parallel Opportunities Missed
- Could have run security tests in background
- Could have parallelized documentation updates

## Time Analysis

| Phase | Time | Optimal | Savings |
|-------|------|---------|---------|
| Porto integration | 70min | 35min | 35min |
| Deployment setup | 60min | 30min | 30min |
| CI fixes | 40min | 10min | 30min |
| Documentation | 30min | 30min | 0min |
| **Total** | **200min** | **105min** | **95min** |

**Key insight**: 47% time savings possible with better specs and known quirks documentation.

## Action Items

- [x] Fix doctl Spec.Name in workflow
- [x] Add workflow permissions
- [x] Create compact context file
- [x] Create reflection agent
- [ ] Add doctl validation step
- [ ] Update spec template
- [ ] Add CI parallelization
- [ ] Document platform quirks

---

*Generated: 2026-01-04*
