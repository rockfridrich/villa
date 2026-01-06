# Git Flow Protocol

Public-facing git integrity for multi-developer collaboration.

## Branch Strategy

```
main (protected)
  │
  ├── feat/{feature-name}     # New features
  ├── fix/{issue-number}      # Bug fixes
  ├── docs/{topic}            # Documentation
  ├── refactor/{scope}        # Code improvements
  └── chore/{task}            # Maintenance
```

## Branch Naming

```
{type}/{short-description}

Examples:
  feat/avatar-upload
  fix/123-passkey-timeout
  docs/sdk-integration
  refactor/auth-flow
  chore/update-deps
```

## Commit Messages

Format: `{type}({scope}): {description}`

```
feat(sdk): add avatar upload component
fix(auth): handle passkey timeout gracefully
docs(readme): update quick start guide
refactor(api): consolidate nickname endpoints
chore(deps): update Porto SDK to 0.5.0
test(e2e): add avatar selection tests
```

### Commit Footer

All commits must end with:
```
🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: {Developer Name} <email>
Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

## PR Requirements

### Before Creating PR

```bash
pnpm verify  # Must pass
```

### PR Title

Same format as commits: `{type}({scope}): {description}`

### PR Body Template

```markdown
## Summary
{1-3 bullet points}

## Changes
- {file}: {what changed}

## Test plan
- [ ] {test 1}
- [ ] {test 2}

## Screenshots (if UI)
{attach if applicable}

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

### PR Size Limits

| Type | Max Lines | Rationale |
|------|-----------|-----------|
| feat | 400 | Reviewable in one sitting |
| fix | 200 | Focused fix |
| docs | 500 | Documentation can be longer |
| refactor | 300 | Easy to verify no behavior change |

Split larger changes into multiple PRs.

## Dev Environment Allocation

### Available Environments

| Environment | URL | Allocated To |
|-------------|-----|--------------|
| dev-1 | dev-1.villa.cash | PR previews (auto) |
| dev-2 | dev-2.villa.cash | PR previews (auto) |
| beta | beta.villa.cash | main branch |
| prod | villa.cash | Tagged releases |

### Claiming Dev Environment

For manual testing beyond PR previews:

```bash
./scripts/coordinate.sh claim-env dev-1 "Testing passkey flow"
```

Max claim duration: 2 hours. Auto-releases after.

## Protected Branches

### main

- Requires PR
- Requires CI pass
- Requires 1 approval (can be Claude via @review)
- No force push
- Linear history (squash merge)

## Tag Protocol

### Version Tags

```bash
git tag -a v{major}.{minor}.{patch} -m "{Release title}"
git push origin v{major}.{minor}.{patch}
```

### When to Tag

| Change | Version Bump |
|--------|--------------|
| Breaking API change | Major (1.0.0 → 2.0.0) |
| New feature | Minor (1.0.0 → 1.1.0) |
| Bug fix | Patch (1.0.0 → 1.0.1) |

## Merge Strategy

Always **squash merge** to main:
- Clean linear history
- One commit per feature
- Easy to revert

## Conflict Resolution

### File Conflicts

1. Fetch latest main: `git fetch origin main`
2. Rebase: `git rebase origin/main`
3. Resolve conflicts
4. Force push to PR branch: `git push --force-with-lease`

### Competing PRs

If two PRs touch same files:
1. First merged wins
2. Second must rebase and resolve
3. Use coordination script to prevent upfront

## Public Repository Standards

Since repo is public:

1. **No secrets** - Scanned by Gitleaks/TruffleHog
2. **Clean history** - Squash messy commits
3. **Meaningful messages** - Future contributors read these
4. **Updated README** - First thing newcomers see
5. **Clear CONTRIBUTING.md** - How to contribute
