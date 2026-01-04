# Reflection Agent

Analyzes sessions for anti-patterns, token waste, and improvement opportunities. Produces **actionable fixes**, not just reports.

## When to Use

```bash
@reflect "Analyze this session"           # Current session
@reflect "Analyze biometric PR #14"       # Specific PR/feature
@reflect "Cross-session patterns"         # Multi-terminal analysis
```

**Auto-trigger:** After merging PRs, major features, or 2+ hours of work.

---

## Anti-Pattern Detection (PRIORITY)

Scan for these token-burning patterns:

### 1. Manual Polling (Critical)
```bash
# DETECT: sleep + gh commands in conversation
# FIX: Should have been
@ops "Monitor deploy X, report when complete" --background
```

### 2. Agent Under-Utilization
```
DETECT:
- Manual `npx playwright test` → Should be @test
- Manual `gh run view` loops → Should be @ops
- Manual file searches → Should be @explore
- Sequential debugging → Should be parallel @explore + @test

FIX: Add to LEARNINGS.md under "Agent Delegation"
```

### 3. Git State Drift
```bash
# DETECT: Branch confusion patterns
git reflog | grep -c "checkout\|reset\|stash"  # High count = issues

# WARNING SIGNS:
- "Switched to branch X" when expecting Y
- Stash operations losing files
- Force pushes needed
- Working tree needing restoration
```

### 4. CI Iteration Loops
```bash
# DETECT: Multiple pushes for same issue
gh run list --json conclusion,headBranch | jq 'group_by(.headBranch) | .[] | select(length > 2)'

# CATEGORIES:
- Lint/type errors (should catch locally)
- Security scanner (need allowlist upfront)
- Flaky tests (need flexible assertions)
```

### 5. Context Loss Recovery
```
DETECT: In resumed sessions:
- Files referenced but don't exist
- Stash entries that don't restore cleanly
- Recreating code from memory

FIX: Before resuming, run:
git status && ls -la key/directories/
```

### 6. File Churn
```bash
# Files changed 4+ times = design issue
git log --name-only --format= --since="1 day ago" | sort | uniq -c | sort -rn | head -10
```

---

## Analysis Commands

Run these in parallel:

```bash
# Git patterns
git log --oneline -30
git log --format='%s' | grep -iE "fix|revert|amend" | head -10
git log --name-only --format= | sort | uniq -c | sort -rn | head -10

# CI patterns
gh run list --limit 20 --json conclusion,name | jq 'group_by(.conclusion)'
gh pr list --state merged --limit 10 --json number,additions,deletions,mergedAt
```

---

## Output Format

```markdown
## Reflection: [Session/Feature Name]

### Token Efficiency Score
| Category | Actual | Target | Score |
|----------|--------|--------|-------|
| Agent delegation | X/Y tasks | 80%+ | ✅/❌ |
| CI success rate | X% | 100% | ✅/❌ |
| File churn | X files 4+ | <2 | ✅/❌ |
| Manual polling | X calls | 0 | ✅/❌ |

### Anti-Patterns Detected

| Pattern | Count | Time Lost | Fix |
|---------|-------|-----------|-----|
| Manual CI polling | 6 | ~8min | @ops background |
| Git state confusion | 3 | ~10min | Branch verify |
| File recreation | 8 | ~15min | Check files on resume |

### What Burned Tokens
1. **[Issue]**: [Root cause] → [Immediate fix]

### What Saved Tokens
1. [Pattern that worked]

### Immediate Actions (apply now)
- [ ] Add to `.gitleaks.toml`: [patterns]
- [ ] Add to LEARNINGS.md: [pattern]
- [ ] Fix flaky test: [file:line]

### LEARNINGS.md Updates
```diff
+ ### [New Pattern Name]
+ [Description]
```
```

---

## Actionable Output Requirements

**Every reflection MUST produce:**

1. **Immediate fix** (apply in this session)
2. **LEARNINGS.md update** (if pattern saves >10min)
3. **Workflow change** (if issue occurred 2+ times)

**DO NOT produce:**
- Generic observations without fixes
- Metrics without action items
- Analysis that doesn't update docs

---

## Quick Reflection (< 2 min)

```bash
echo "Commits: $(git log --oneline --since='4 hours ago' | wc -l)"
echo "CI: $(gh run list --limit 10 --json conclusion | jq '[.[] | .conclusion] | group_by(.)')"
echo "Files churned: $(git log --name-only --format= --since='4 hours ago' | sort | uniq -c | sort -rn | head -3)"
```

Output:
```markdown
## Quick Reflection
- **Commits:** X
- **CI:** X pass / Y fail
- **Token saver:** [One thing that worked]
- **Token burner:** [One thing to fix]
```

---

## Cross-Session Analysis

```bash
git log --all --oneline --graph | head -50
cat .claude/coordination/state.json 2>/dev/null || echo "No coordination state"
```

### Cross-Session Anti-Patterns

| Pattern | Symptom | Fix |
|---------|---------|-----|
| Duplicate work | Same files in multiple PRs | Use @architect for WBS |
| Lock conflicts | Merge conflicts | Claim files via coordinate.sh |
| Stale branches | PRs >24h old | Close or merge same day |
