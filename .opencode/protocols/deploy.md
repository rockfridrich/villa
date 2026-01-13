# Deployment Protocol

## TL;DR

```bash
# Check status
./scripts/ci-monitor.sh

# Deploy (after CI passes)
git push origin main              # Triggers beta.villa.cash deploy
git tag v1.x.x && git push --tags # Triggers villa.cash deploy
```

---

## Environment Hierarchy

| Environment | Domain               | Trigger        | Purpose                |
| ----------- | -------------------- | -------------- | ---------------------- |
| Preview     | `dev-1/2.villa.cash` | PR opened      | Feature testing        |
| Staging     | `beta.villa.cash`    | Push to `main` | Pre-release validation |
| Production  | `villa.cash`         | Tag `v*`       | Live users             |

---

## Pre-Deploy Checklist

```bash
# 1. Verify environment
./scripts/doctor.sh

# 2. Run full verification
pnpm verify  # typecheck + lint + build + E2E

# 3. Check CI status
./scripts/ci-monitor.sh
# Or watch until completion:
./scripts/ci-monitor.sh --watch
```

---

## Manual Deploy (Emergency)

Only if GitHub Actions unavailable:

```bash
# Check doctl auth
doctl auth list

# Deploy staging
./scripts/deploy.sh --update .do/app-staging.yaml

# Check status
./scripts/deploy.sh --status

# Follow logs
./scripts/deploy.sh --logs
```

---

## CloudFlare Cache Purge

After deploy, cache is auto-purged via CI. Manual purge:

```bash
pnpm infra:cache:purge
```

Requires `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ZONE_ID` in env.

---

## Rollback

```bash
# Get previous deployment ID
doctl apps list-deployments APP_ID

# Create deployment from previous commit
git revert HEAD
git push
```

---

## Health Check

After deploy, verify:

```bash
curl -s https://beta.villa.cash/api/health | jq .timestamp
```

Old timestamp = deploy issue, not code issue.
