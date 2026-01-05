# Git Workflow for Agents

Standard git workflow for Claude Code agents working on Villa.

## Branch Strategy

```
main (protected)
  │
  ├── feat/<feature-name>     # New features
  ├── fix/<issue-description> # Bug fixes
  ├── hotfix/<urgent-fix>     # Production hotfixes
  └── chore/<maintenance>     # Non-code changes
```

## Agent Responsibilities

### @ops Agent

**Primary owner of git operations:**

```bash
# Launch ops agent for git work
@ops "create branch, commit changes, push and create PR"
```

**Capabilities:**
- Create branches
- Stage and commit changes
- Push to remote
- Create/update PRs
- Manage PR comments
- Cherry-pick commits
- Handle merge conflicts

### Other Agents (@build, @spec, @test)

**Should NOT:**
- Commit directly to main
- Push without PR
- Force push

**Should:**
- Work on feature branches
- Request @ops for git operations
- Focus on their domain

## Standard Workflow

### 1. Start New Feature

```bash
# @ops creates branch
git checkout main
git pull origin main
git checkout -b feat/my-feature
```

### 2. During Development

```bash
# @build makes changes...

# @ops commits incrementally
git add -A
git commit -m "feat(scope): description

Details of what changed.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

### 3. Create PR

```bash
# @ops pushes and creates PR
git push -u origin feat/my-feature

gh pr create \
  --title "feat(scope): description" \
  --body "$(cat <<'EOF'
## Summary
- What changed
- Why it changed

## Test plan
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Manual QA

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

### 4. After Review

```bash
# @ops merges (squash preferred)
gh pr merge --squash

# Clean up
git checkout main
git pull origin main
git branch -d feat/my-feature
```

## Commit Message Format

```
<type>(<scope>): <subject>

[body]

[footer]

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

### Types

| Type | Use For |
|------|---------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation |
| `style` | Formatting |
| `refactor` | Code restructure |
| `test` | Adding tests |
| `chore` | Maintenance |

### Scopes

| Scope | Area |
|-------|------|
| `sdk` | SDK components |
| `api` | API routes |
| `ui` | UI components |
| `db` | Database |
| `deploy` | Deployment |
| `infra` | Infrastructure |

## Branch Naming

```
feat/profile-settings      ✅ Good
feature/add-profile        ❌ Use feat/
fix/avatar-upload-crash    ✅ Good
bugfix/avatar              ❌ Use fix/
hotfix/prod-db-connection  ✅ Good (urgent prod fixes)
```

## PR Checklist

Before creating PR:

```bash
# 1. Run verification
pnpm verify

# 2. Check for conflicts
git fetch origin main
git rebase origin/main

# 3. Review changes
git diff origin/main...HEAD
```

## Emergency Procedures

### Revert Bad Merge

```bash
# @ops handles reverts
git revert <commit-hash>
git push origin main
```

### Hotfix Production

```bash
# Create hotfix from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-fix

# Fix, commit, push
# Create PR with "hotfix" label
gh pr create --label hotfix
```

## Integration with Agents

### Parallel Development

```
Terminal 1: @build working on feat/feature-a
Terminal 2: @build working on feat/feature-b
Terminal 3: @ops managing both branches

# @ops coordinates:
# - Creates both branches
# - Commits each independently
# - Creates separate PRs
# - Handles any conflicts
```

### Handoff Protocol

```bash
# @build finishes work
"@ops please commit and create PR for profile settings changes"

# @ops takes over
git status
git add -A
git commit -m "..."
gh pr create
```

## Common Issues

### Merge Conflict

```bash
# @ops resolves
git fetch origin main
git rebase origin/main
# Fix conflicts
git add .
git rebase --continue
git push --force-with-lease
```

### Wrong Branch

```bash
# Move commits to correct branch
git stash
git checkout correct-branch
git stash pop
git add -A
git commit
```

### Undo Last Commit (not pushed)

```bash
git reset --soft HEAD~1
```

## Automation

### Pre-commit Hook

Located in `.githooks/pre-commit`:
- Runs linting
- Checks types
- Prevents commits to main

### CI/CD

On PR:
- Build verification
- Test suite
- Preview deployment

On merge to main:
- Deploy to beta.villa.cash
- Run E2E tests

On tag (v*):
- Deploy to villa.cash
- Create release
