# Reflection Agent

Analyzes project history to identify workflow improvements and velocity optimizations.

## When to Use

Run after completing a major feature or phase:
```
@reflect "Analyze Phase 1 completion"
```

## Analysis Scope

### 1. Git History Analysis
```bash
# Commits and patterns
git log --oneline -50
git log --format='%s' | head -30  # Message patterns
git shortlog -sn  # Contributors

# Time between commits
git log --format='%ci' | head -20

# Files most changed
git log --name-only --format= | sort | uniq -c | sort -rn | head -10
```

### 2. Workflow Runs
```bash
# Recent runs
gh run list --limit 20

# Failure patterns
gh run list --status failure --limit 10

# Duration trends
gh run list --json databaseId,conclusion,createdAt,updatedAt
```

### 3. PR Analysis
```bash
# PR cycle time
gh pr list --state merged --json number,createdAt,mergedAt

# Review patterns
gh pr view N --json reviews
```

## Output Format

```markdown
## Reflection: [Phase/Feature Name]

### Velocity Metrics
| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Commits | N | - | - |
| Pivots | N | 0-1 | ✅/❌ |
| CI failures | N | 0 | ✅/❌ |
| Avg CI time | Nm | <5m | ✅/❌ |

### What Went Well
- [Pattern that worked]
- [Efficiency gained]

### What Slowed Us Down
- [Blocker and root cause]
- [Time lost and why]

### Recommendations
1. **[Category]**: [Specific action]
2. **[Category]**: [Specific action]

### Spec Improvements
- [ ] Add section for [X]
- [ ] Clarify [Y]

### Workflow Improvements
- [ ] Add step for [X]
- [ ] Parallelize [Y]
```

## Reflection Categories

### Code Quality
- Test coverage gaps
- Type safety issues
- Security vulnerabilities found

### Development Velocity
- Build time optimizations
- Test parallelization opportunities
- CI pipeline improvements

### Documentation
- Missing specs
- Outdated docs
- Unclear instructions

### Agent Workflow
- Model selection accuracy
- Parallel execution opportunities
- Context efficiency

## Example Analysis

```markdown
## Reflection: Phase 1 - Passkey Login

### Velocity Metrics
| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Commits | 25 | - | - |
| Pivots | 2 | 0-1 | ❌ |
| CI failures | 3 | 0 | ❌ |
| Avg CI time | 3m | <5m | ✅ |

### What Went Well
- Parallel test execution (unit + E2E)
- Preview deploys for quick feedback
- Porto SDK theming worked first try

### What Slowed Us Down
- doctl --format Name bug (2 CI failures)
- Missing spec for session behavior (1 pivot)
- Buildpacks vs Dockerfile decision (30min)

### Recommendations
1. **CI**: Add doctl format validation test
2. **Specs**: Always include session behavior section
3. **Docker**: Default to Dockerfile for Next.js apps
4. **Agents**: Run @review after every @build

### Spec Template Updates
- [ ] Add "Session Behavior" section
- [ ] Add "Deployment Considerations" section
- [ ] Add "Known Platform Quirks" section
```

## Integration

After reflection, create improvement PR:
```bash
git checkout -b improvement/[area]
# Apply recommendations
git commit -m "improvement: [summary]"
gh pr create --title "Improvement: [Area]" --body "[Reflection output]"
```
