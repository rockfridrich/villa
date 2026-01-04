# Villa Secrets Management

**Status:** Implemented
**Date:** 2026-01-05

---

## Overview

Villa uses a layered environment configuration system that syncs between:
- **Local development** (`.env.local` files)
- **GitHub Secrets** (CI/CD)
- **DigitalOcean App Platform** (production/staging)

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECRETS FLOW                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   .env.local ────────────► GitHub Secrets                       │
│       │                         │                                │
│       │   npm run env:push:github                               │
│       │                         │                                │
│       │                         ▼                                │
│       │                   GitHub Actions ──► DO App Platform    │
│       │                                                          │
│       │                                                          │
│       └──────────────────► Local Dev Server                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### 1. Initialize Local Environment

```bash
# Create .env.local from template
npm run env:init

# Edit with your values
code .env.local

# Validate configuration
npm run env:validate
```

### 2. Sync to GitHub

```bash
# Push secrets to GitHub
npm run env:push:github

# List GitHub secrets
npm run env:list

# Compare local vs GitHub
npm run env:diff
```

### 3. Commands Reference

| Command | Description |
|---------|-------------|
| `npm run env:init` | Create `.env.local` from template |
| `npm run env:validate` | Check for missing required vars |
| `npm run env:diff` | Compare local vs GitHub |
| `npm run env:push:github` | Push secrets to GitHub |
| `npm run env:list` | List GitHub secrets |
| `npm run env` | Show all env-sync commands |

---

## File Structure

```
villa/
├── .env.example          # Master template (all variables documented)
├── .env.local            # Local dev (gitignored)
├── apps/
│   ├── web/
│   │   ├── .env.example  # Web-specific vars
│   │   └── .env.local    # Web local config (gitignored)
│   ├── api/
│   │   ├── .env.example  # API-specific vars
│   │   └── .env          # API local config (gitignored)
│   └── relay/
│       ├── .env.example  # Relay-specific vars
│       └── .env          # Relay local config (gitignored)
├── contracts/
│   ├── .env.example      # Contract deployment vars
│   └── .env              # Contract local config (gitignored)
└── scripts/
    └── env-sync.sh       # Sync script
```

---

## Secrets Categories

### Infrastructure Secrets

| Variable | Where Used | Sync Target |
|----------|------------|-------------|
| `DIGITALOCEAN_ACCESS_TOKEN` | CI/CD | GitHub Secrets |
| `CLOUDFLARE_API_TOKEN` | DNS management | GitHub + DO |
| `CLOUDFLARE_ZONE_ID` | DNS zone | GitHub + DO |

### Database Secrets

| Variable | Where Used | Sync Target |
|----------|------------|-------------|
| `DATABASE_URL` | API service | GitHub + DO |
| `DATABASE_POOL_URL` | Serverless API | GitHub + DO |

### Blockchain Secrets

| Variable | Where Used | Sync Target |
|----------|------------|-------------|
| `DEPLOYER_PRIVATE_KEY` | Contract deployment | GitHub Secrets |
| `BASESCAN_API_KEY` | Contract verification | GitHub Secrets |
| `MERCHANT_PRIVATE_KEY` | Relay service | DO App Platform |

### Optional Secrets

| Variable | Where Used | Notes |
|----------|------------|-------|
| `ANTHROPIC_API_KEY` | AI features | Optional |
| `NEXT_PUBLIC_UNFORGETTABLE_APP_ID` | Face recovery | Phase 2 |

---

## Environment Specifics

### Local Development

```bash
# 1. Start local database
npm run db:start

# 2. Use local .env.local
DATABASE_URL=postgresql://villa:villa_dev_password@localhost:5432/villa_dev

# 3. No secrets required for basic dev
npm run dev
```

### Staging (DO App: villa-staging)

- Database: Uses `DATABASE_URL` from DO App env
- Porto: Uses staging (`NEXT_PUBLIC_PORTO_ENV=stg`)
- Chain: Uses testnet (`CHAIN_ENV=testnet`)

### Production (DO App: villa-production)

- Database: Uses `DATABASE_URL` from DO App env (VPC private)
- Porto: Uses production (`NEXT_PUBLIC_PORTO_ENV=prod`)
- Chain: Uses mainnet (`CHAIN_ENV=production`)

---

## Security Best Practices

### Never Commit Secrets

```gitignore
# These are in .gitignore
.env
.env.local
.env*.local
```

### Rotate Secrets Regularly

```bash
# 1. Update in secure storage (1Password, etc.)
# 2. Update .env.local
# 3. Push to GitHub
npm run env:push:github

# 4. Redeploy apps
doctl apps create-deployment <app-id>
```

### Audit Access

```bash
# List who has access to GitHub secrets
gh api repos/{owner}/{repo}/actions/secrets

# List DO team members
doctl account get
```

---

## Troubleshooting

### "DATABASE_URL not set"

```bash
# Check if variable exists
npm run env:validate

# For local dev, start Docker Postgres
npm run db:start

# For production, check DO App Platform env
doctl apps list-deployments <app-id>
```

### "GitHub secret not syncing"

```bash
# Check authentication
gh auth status

# List secrets
gh secret list

# Re-push secrets
npm run env:push:github
```

### "DO App missing env vars"

```bash
# List app env vars
./scripts/env-sync.sh list do villa-production

# Update via DO console or doctl
doctl apps update <app-id> --spec app.yaml
```

---

## Secret Locations

| Secret | 1Password | GitHub | DO Apps |
|--------|-----------|--------|---------|
| `DIGITALOCEAN_ACCESS_TOKEN` | ✓ | ✓ | - |
| `CLOUDFLARE_API_TOKEN` | ✓ | ✓ | ✓ |
| `CLOUDFLARE_ZONE_ID` | ✓ | ✓ | ✓ |
| `DATABASE_URL` | ✓ | ✓ | ✓ |
| `DATABASE_POOL_URL` | ✓ | ✓ | ✓ |
| `DEPLOYER_PRIVATE_KEY` | ✓ | ✓ | - |
| `BASESCAN_API_KEY` | ✓ | ✓ | - |
| `MERCHANT_PRIVATE_KEY` | ✓ | - | ✓ |

---

## Adding New Secrets

1. **Document** in root `.env.example`
2. **Add to `SYNC_SECRETS`** in `scripts/env-sync.sh` if it should sync
3. **Update validation** in sync script if required
4. **Add to app-specific** `.env.example` if app-specific
5. **Push to GitHub** with `npm run env:push:github`
6. **Update DO apps** via console or doctl
