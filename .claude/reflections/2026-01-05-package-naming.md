## Reflection: Package Naming Mistake

### Token Efficiency Score
| Category | Actual | Target | Score |
|----------|--------|--------|-------|
| First-time correct | 0/1 | 100% | ❌ |
| Commit reverts | 1 | 0 | ❌ |

### Anti-Pattern Detected

**Pattern:** Making assumptions about branding without verification
**Count:** 1
**Time Lost:** ~10min

### What Burned Tokens

1. **Assumed `@anthropic-villa/sdk`**: I incorrectly assumed the package should be under an Anthropic namespace when the original codebase clearly showed `@villa/sdk`.
2. **Committed before verifying**: The commit had to be reverted because of the wrong package name.
3. **Multiple find/replace cycles**: Wasted effort fixing files with wrong name, then fixing again.

### Root Cause

Did not check the existing `package.json` name before deciding on npm package naming. The original file clearly showed `"name": "@villa/sdk"`.

### What Saved Tokens

- User caught it immediately before push
- `git reset --soft HEAD~1` allowed clean revert

### Immediate Actions

- [x] Reset commit
- [x] Use correct `@villa/sdk` name
- [x] Document in reflection

### LEARNINGS.md Update

```diff
+ ### Package Naming
+ Always check existing package.json name before modifying for npm publication.
+ Don't assume organizational naming - verify against existing codebase.
```

### Fix Applied

All files now correctly use `@villa/sdk` and `@villa/sdk-react`.
