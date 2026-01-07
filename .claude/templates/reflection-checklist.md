# Session Reflection Checklist

Run this after every 2-hour session or PR merge.

## Quick Check (< 2 min)

```bash
# Delegation rate
git log --oneline --since='4 hours ago' | wc -l
echo "Commits: $?"

# CI success
gh run list --limit 10 --json conclusion | jq '[.[] | .conclusion] | group_by(.) | map({key: .[0], count: length})'

# File churn
git log --name-only --format= --since='4 hours ago' | sort | uniq -c | sort -rn | head -5
```

## Delegation Audit

- [ ] Did Opus read implementation files? → FAIL
- [ ] Did Opus write component code? → FAIL
- [ ] Did Opus run tests manually? → FAIL
- [ ] Were agents used for < 80% of work? → FAIL
- [ ] Did Opus monitor CI manually? → FAIL

**If ANY checked:** Add to next session context: "MUST delegate to agents"

## Token Efficiency

| Anti-Pattern | Detected? | Time Lost | Fix Applied? |
|--------------|-----------|-----------|--------------|
| Manual polling | Y/N | ~Xmin | Y/N |
| Direct file reads | Y/N | ~Xmin | Y/N |
| No parallelism | Y/N | ~Xmin | Y/N |
| Implementation by Opus | Y/N | ~Xmin | Y/N |

## Learnings

**What saved time?** (add to LEARNINGS.md if >10min saved)
- 

**What burned tokens?** (fix now)
- 

## Actions

- [ ] Update LEARNINGS.md with pattern (if >10min saved)
- [ ] Update .gitleaks.toml (if security scan failed)
- [ ] Fix flaky test (if CI flake detected)
- [ ] Grade session: A/B/C/D/F

---

**Grade criteria:**
- A: 90%+ delegated, 100% CI pass, 0 anti-patterns
- B: 80%+ delegated, 90%+ CI pass, <2 anti-patterns
- C: 70%+ delegated, 80%+ CI pass, <4 anti-patterns
- D: 50%+ delegated, 70%+ CI pass, <6 anti-patterns
- F: <50% delegated OR Opus did implementation
