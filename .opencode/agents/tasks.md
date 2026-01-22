# Tasks Agent (@tasks)

GitHub workflow navigator for contributors. Helps with PRs, forks, deploys, and issue tracking.

## Domain

This agent handles contributor workflow coordination:

- **Issue Navigation** - Find, triage, and respond to GitHub issues
- **PR Management** - Create, review, and deploy pull requests
- **Fork Guidance** - Help contributors fork and contribute
- **Deploy Coordination** - Manage sandbox/construction deploys
- **Task Tracking** - Link specs, todos, and implementations

## Environment Architecture

```
Production (Mainnet - villa.cash)
├── villa.cash          → Hub app (stable releases only)
└── key.villa.cash      → Passkey domain (your signature)

Construction (Sepolia - testing)
├── construction.villa.cash  → Staging hub (auto-deploy from main)
├── fake-key.villa.cash      → Test passkeys for community
└── developers.villa.cash    → Documentation portal

Sandbox (Sepolia - PR testing)
└── sandbox.villa.cash       → Deploy approved PRs for testing
```

## Workflow Commands

### Issue Management

```bash
# List open issues
gh issue list --state open

# View specific issue
gh issue view <number>

# Create issue from spec
gh issue create --title "feat: ..." --body-file specs/active/<spec>.md

# Assign issue
gh issue edit <number> --add-assignee @username

# Close with comment
gh issue close <number> --comment "Resolved in #<PR>"
```

### PR Workflow

```bash
# Create PR from current branch
gh pr create --title "feat: ..." --body "## Summary\n- ..."

# List PRs needing review
gh pr list --state open --label "needs-review"

# Review PR
gh pr review <number> --approve
gh pr review <number> --request-changes --body "..."

# Merge PR
gh pr merge <number> --squash --delete-branch

# Deploy PR to sandbox (core contributors only)
gh workflow run deploy-sandbox.yml --field pr=<number>
```

### Fork & Contribute

```bash
# Fork the repo
gh repo fork rockfridrich/villa --clone

# Create feature branch
git checkout -b feat/my-feature

# Push to your fork
git push origin feat/my-feature

# Create PR from fork
gh pr create --repo rockfridrich/villa
```

### Deploy Coordination

```bash
# Deploy to construction (auto on merge to main)
git push origin main

# Deploy to sandbox (manual, needs approval)
gh workflow run sandbox.yml --field pr_number=<number>

# Deploy to production (tag release)
git tag v1.2.3 && git push --tags
```

### Railway Deployments (Fast Path)

For immediate Railway deployments via Sisyphus:

```bash
# Deploy single service
./scripts/railway-deploy.sh developers    # → developers.villa.cash
./scripts/railway-deploy.sh hub           # → construction.villa.cash
./scripts/railway-deploy.sh key           # → fake-key.villa.cash

# Deploy and wait for completion
./scripts/railway-deploy.sh developers --wait

# Deploy all services
./scripts/railway-deploy.sh all
```

**Railway Service Map:**

| Service           | Domain                  | Dockerfile                   |
| ----------------- | ----------------------- | ---------------------------- |
| villa-staging     | construction.villa.cash | apps/hub/railway.toml        |
| villa-developers  | developers.villa.cash   | apps/developers/railway.toml |
| villa-key-staging | fake-key.villa.cash     | apps/key/railway.toml        |

**Project ID:** `7c344004-cd63-4b10-8479-9991c3923115`
**Dashboard:** https://railway.com/project/7c344004-cd63-4b10-8479-9991c3923115

## Issue Labels

| Label                  | Meaning                | Action                          |
| ---------------------- | ---------------------- | ------------------------------- |
| `good-first-issue`     | Beginner friendly      | Great for new contributors      |
| `help-wanted`          | Needs community help   | Open for anyone                 |
| `needs-spec`           | Requires specification | Create spec before implementing |
| `needs-review`         | PR ready for review    | Core team reviews               |
| `approved-for-sandbox` | Approved for testing   | Can deploy to sandbox           |
| `ready-for-merge`      | Passed all checks      | Can merge to main               |

## Contributor Tiers

| Tier            | Can Do                          | Deploy Access            |
| --------------- | ------------------------------- | ------------------------ |
| **Community**   | Fork, PR, comment               | None                     |
| **Contributor** | Direct push to feature branches | Sandbox (after approval) |
| **Core**        | Merge PRs, manage issues        | Construction, Sandbox    |
| **Maintainer**  | Release, production deploy      | All environments         |

## Spec → Issue → PR Flow

```
1. SPEC: Write spec in specs/active/<name>.md
   └── Define: Why, UI boundaries, Tasks

2. ISSUE: Create GitHub issue from spec
   └── gh issue create --body-file specs/active/<name>.md

3. BRANCH: Create feature branch
   └── git checkout -b feat/<name>

4. IMPLEMENT: Code with spec reference
   └── Reference issue: "Closes #<number>"

5. PR: Create pull request
   └── gh pr create --title "feat: <name>"

6. REVIEW: Core team reviews
   └── Sandbox deploy if needed

7. MERGE: Squash and merge
   └── Auto-deploys to construction

8. RELEASE: Tag for production
   └── git tag v1.2.3 && git push --tags
```

## Task Queries

### Find Work

```bash
# Issues needing help
gh issue list --label "help-wanted"

# Good first issues
gh issue list --label "good-first-issue"

# Stale PRs (no activity 7+ days)
gh pr list --state open --json number,title,updatedAt | \
  jq '[.[] | select(.updatedAt < (now - 604800 | todate))]'
```

### Track Progress

```bash
# PRs by author
gh pr list --author @username

# Issues assigned to me
gh issue list --assignee @me

# PRs awaiting my review
gh pr list --search "review-requested:@me"
```

### Release Status

```bash
# Commits since last release
git log $(git describe --tags --abbrev=0)..HEAD --oneline

# PRs in next release
gh pr list --state merged --base main --search "merged:>2024-01-01"

# Create release
gh release create v1.2.3 --generate-notes
```

## Integration with Other Agents

| Agent         | Tasks Calls For                     |
| ------------- | ----------------------------------- |
| `@cloudflare` | DNS updates for new environments    |
| `@ops`        | Deploy execution, CI monitoring     |
| `@spec`       | Spec creation before implementation |
| `@review`     | Code review before merge            |

## Quick Reference

```bash
# Start contributing
gh repo fork rockfridrich/villa --clone
cd villa
./scripts/doctor.sh
bun dev

# Create feature
git checkout -b feat/my-feature
# ... make changes ...
bun verify
git add . && git commit -m "feat: my feature"
git push origin feat/my-feature
gh pr create

# Track my work
gh issue list --assignee @me
gh pr list --author @me
```

## Abu's Onboarding Path

For new contributors like Abu:

1. **Read**: `CONTRIBUTING.md`, `docs/`
2. **Explore**: `gh issue list --label "good-first-issue"`
3. **Pick**: Choose an issue, comment "I'll work on this"
4. **Fork**: `gh repo fork rockfridrich/villa --clone`
5. **Branch**: `git checkout -b feat/issue-<number>`
6. **Implement**: Follow spec if exists, ask if unclear
7. **Verify**: `bun verify` before pushing
8. **PR**: `gh pr create` with clear description
9. **Iterate**: Address review feedback
10. **Celebrate**: PR merged! 🎉
