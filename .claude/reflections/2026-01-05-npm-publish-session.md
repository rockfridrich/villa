# Reflection: npm Package Publishing Session

**Date:** 2026-01-05
**Duration:** ~1 hour
**Outcome:** Successfully published 2 npm packages

---

## Token Efficiency Score

| Category | Actual | Target | Score |
|----------|--------|--------|-------|
| First-time correct | 2/4 | 100% | ⚠️ 50% |
| Commit reverts | 1 | 0 | ❌ |
| CI failures | 1 | 0 | ⚠️ |
| Manual polling | 0 | 0 | ✅ |

---

## Anti-Patterns Detected

| Pattern | Count | Time Lost | Fix Applied |
|---------|-------|-----------|-------------|
| Package name assumption | 2 | ~15min | Verified existing package.json |
| npm scope unavailable | 1 | ~5min | Used `@rockfridrich` instead of `@villa` |
| Git conflict resolution | 1 | ~5min | Used `--ours` during rebase |
| Type mismatch in React pkg | 1 | ~3min | Fixed AvatarConfig types |

---

## What Burned Tokens

### 1. Package Naming Mistakes (Critical)

**Problem:** Started with `@anthropic-villa/sdk`, then tried `@villa/sdk`, finally landed on `@rockfridrich/villa-sdk`.

**Root cause:**
- Assumed organizational naming without checking npm scope ownership
- Did not verify package.json name early in session (carried over from prior session's mistake)

**Token cost:** ~15min of rework, 1 commit revert

**Fix:** Created reflection document, added to LEARNINGS.md

### 2. npm Scope Not Owned

**Problem:** `@villa` scope doesn't exist on npm, so couldn't publish `@villa/sdk`.

**Root cause:** Assumed we could create scoped packages under any name.

**Token cost:** ~5min of debugging 404 errors

**Fix:** Used `@rockfridrich` scope (user's npm username)

### 3. AvatarConfig Type Mismatch

**Problem:** React package used `selection` and `variant` fields that don't exist in SDK types.

**Root cause:** Copied patterns from internal web app without checking SDK type definitions.

**Token cost:** ~3min build failure

**Fix:** Updated to match SDK types (`style`, `seed`, `gender`)

---

## What Saved Tokens

### 1. Parallel Package Publishing
- Built and published both packages in quick succession
- Didn't wait for propagation between publishes

### 2. npm Trusted Publishing Setup
- Configured OIDC workflow upfront
- Future releases are tokenless (no manual auth needed)

### 3. Immediate Reflection
- Caught package naming issue early via reflection doc
- Prevented same mistake in sdk-react package

### 4. Session-Based npm Login
- Used `npm login` with passkey instead of fighting token 2FA
- Clean auth flow

---

## Immediate Actions

- [x] Published @rockfridrich/villa-sdk v0.1.0
- [x] Published @rockfridrich/villa-sdk-react v0.1.0
- [x] Configured Trusted Publishing for both packages
- [x] Updated CI/CD workflow for both packages
- [x] Created SDK agent (.claude/agents/sdk.md)
- [ ] Verify CI passes (currently in_progress)

---

## LEARNINGS.md Update

```diff
+ ### 22. npm Package Publishing Pattern
+
+ **Pre-publish checklist:**
+ 1. Verify package.json `name` matches intended npm scope
+ 2. Check npm scope exists: `npm search @scope`
+ 3. Build locally: `pnpm build`
+ 4. Dry run: `npm pack --dry-run`
+
+ **Scope ownership:**
+ - `@username` scopes auto-exist for npm users
+ - `@org` scopes require creating npm organization
+ - Don't assume scope availability without checking
+
+ **Trusted Publishing (recommended):**
+ 1. Configure on npmjs.com package settings
+ 2. Add `id-token: write` permission to workflow
+ 3. No NPM_TOKEN needed after setup
+
+ ### 23. Peer Dependencies vs Regular Dependencies
+
+ ```json
+ // ❌ Bad: forces specific versions on consumers
+ "dependencies": { "viem": "^2.0.0" }
+
+ // ✅ Good: consumers control versions
+ "peerDependencies": { "viem": "^2.0.0" }
+ ```
+
+ **When to use peer deps:**
+ - Core libs consumers likely have (React, viem)
+ - Avoiding version conflicts
+ - Smaller bundle (deduplication)
```

---

## Session Metrics

| Metric | Value |
|--------|-------|
| Commits | 2 |
| Files created | 12 |
| Files modified | 8 |
| npm packages published | 2 |
| CI runs triggered | 3 |

---

## Recommendations for Next Session

1. **Before any npm publish:** Run `npm view @scope/pkg` to check availability
2. **Type definitions:** Read SDK types.ts before creating React bindings
3. **Consider @villa org:** Create npm organization to use `@villa/sdk` naming
4. **Version sync:** Consider keeping sdk and sdk-react versions aligned
