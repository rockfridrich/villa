# GitHub Repository Setup

This document contains manual configuration steps for repository maintainers.

## Branch Protection (Required)

Navigate to: `Settings > Branches > Branch protection rules`

Add rule for `main`:
- [x] Require a pull request before merging
  - [x] Require approvals: 1
  - [x] Dismiss stale pull request approvals when new commits are pushed
  - [x] Require review from Code Owners
- [x] Require status checks to pass before merging
  - [x] Require branches to be up to date before merging
  - Required checks: `lint`, `build`
- [ ] Do not allow bypassing the above settings

## Environment Protection (Required)

Navigate to: `Settings > Environments`

### staging
- Required reviewers: @rockfridrich (owner)
- Deployment branches: `main` only

### production
- Required reviewers: @rockfridrich (owner)
- Deployment branches: Tags matching `v*`

### preview-1, preview-2
- No protection required (auto-deploy on PR)

## Labels (Auto-created)

The following labels are created by CI or can be created manually:

| Label | Color | Description |
|-------|-------|-------------|
| `achievement` | #ffd700 | Contributor achievement badge |
| `contributor-level-1` | #c5def5 | Completed onboarding |
| `contributor-level-2` | #bfd4f2 | 5+ merged PRs |
| `contributor-level-3` | #a2d2ff | Trusted contributor |
| `first-pr` | #7cfc00 | First PR from this contributor |
| `needs-review` | #fbca04 | Awaiting maintainer review |

## Secrets (Required for CI)

Navigate to: `Settings > Secrets and variables > Actions`

| Secret | Description |
|--------|-------------|
| `DIGITALOCEAN_ACCESS_TOKEN` | DigitalOcean API token for deployments |
| `CLOUDFLARE_API_TOKEN` | CloudFlare API token for DNS/cache |
| `CLOUDFLARE_ZONE_ID` | CloudFlare zone ID for villa.cash |
| `NPM_TOKEN` | NPM publish token for SDK releases |

## GitHub Apps (Optional)

- **Renovate**: Automated dependency updates
- **Codecov**: Code coverage reporting

## Verification

After setup, verify:

1. Create a test PR - should trigger preview deploy
2. Merge to main - should require approval for staging
3. Create tag `v0.0.0-test` - should require approval for production (delete after testing)
