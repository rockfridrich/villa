# Villa Deployment Protocol

**Version:** 2.0 (Railway Migration)  
**Updated:** 2026-01-22

---

## Overview

Villa uses Railway for hosting with CloudFlare for DNS/CDN. This document defines the strict deployment protocol.

## Environments

| Environment    | Domain                  | Railway Service     | Deploy Trigger  |
| -------------- | ----------------------- | ------------------- | --------------- |
| **Production** | `villa.cash`            | `villa-production`  | Manual `v*` tag |
| **Staging**    | `beta.villa.cash`       | `villa-staging`     | Push to `main`  |
| **Developers** | `developers.villa.cash` | `villa-developers`  | Push to `main`  |
| **Key (Beta)** | `beta-key.villa.cash`   | `villa-key-staging` | Push to `main`  |

## Deployment Flow

```
Local Dev → PR → CI Checks → Merge → Staging → Manual Tag → Production
    │           │                      │                        │
    ▼           ▼                      ▼                        ▼
localhost   GitHub Actions         Railway                  Railway
            (lint, type, E2E)    (auto-deploy)           (tag-deploy)
```

---

## Railway Setup

### Project Structure

```
Railway Project: villa
├── villa-staging (beta.villa.cash)
│   └── GitHub: main branch, auto-deploy
├── villa-developers (developers.villa.cash)
│   └── GitHub: main branch, auto-deploy
├── villa-key-staging (beta-key.villa.cash)
│   └── GitHub: main branch, auto-deploy
└── villa-production (villa.cash)
    └── GitHub: v* tags only
```

### Service Configuration

Each service uses these settings:

```toml
# railway.toml
[build]
builder = "nixpacks"

[deploy]
healthcheckPath = "/api/health"
healthcheckTimeout = 60
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
```

### Environment Variables

**Required for all services:**

```bash
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
PORT=3000
```

**Hub/Key services additionally need:**

```bash
DATABASE_URL=${{Postgres.DATABASE_URL}}  # Reference variable
NEXT_PUBLIC_PORTO_ENV=stg|prod
NEXT_PUBLIC_CHAIN_ID=84532|8453
```

---

## CloudFlare DNS Configuration

### CNAME Records

| Record           | Type  | Target                             | Proxy   |
| ---------------- | ----- | ---------------------------------- | ------- |
| `@` (villa.cash) | CNAME | `villa-production.up.railway.app`  | Proxied |
| `www`            | CNAME | `villa.cash`                       | Proxied |
| `beta`           | CNAME | `villa-staging.up.railway.app`     | Proxied |
| `developers`     | CNAME | `villa-developers.up.railway.app`  | Proxied |
| `beta-key`       | CNAME | `villa-key-staging.up.railway.app` | Proxied |

### SSL/TLS Settings

- **SSL Mode:** Full (strict)
- **Always Use HTTPS:** On
- **Automatic HTTPS Rewrites:** On
- **Minimum TLS Version:** 1.2

### Cache Settings

- **Cache Level:** Standard
- **Browser Cache TTL:** 4 hours
- **Edge Cache TTL:** 2 hours (for API routes, use Cache-Control headers)

---

## Deployment Commands

### Local Development

```bash
# Start all apps
bun dev

# Start specific app
bun dev:hub
bun dev:developers
bun dev:key

# Run pre-push verification
bun verify
```

### Staging Deployment (Automatic)

```bash
# Merge PR to main triggers auto-deploy
git checkout main
git pull
git merge feature-branch
git push origin main
# Railway auto-deploys to staging
```

### Production Deployment (Manual)

```bash
# 1. Verify staging is healthy
curl -s https://beta.villa.cash/api/health | jq .

# 2. Create release tag
git tag v0.X.Y
git push origin v0.X.Y

# 3. Monitor Railway dashboard
railway logs -s villa-production

# 4. Verify production
curl -s https://villa.cash/api/health | jq .
```

### Rollback

```bash
# Railway one-click rollback via dashboard
# Or redeploy previous tag:
git checkout v0.X.Y-1
git tag v0.X.Y-hotfix
git push origin v0.X.Y-hotfix
```

---

## Railway CLI Commands

```bash
# Login
railway login

# List projects
railway list

# Link to project
railway link

# Deploy current directory
railway up

# View logs
railway logs

# Open dashboard
railway open

# Run command in Railway environment
railway run <command>

# Set environment variable
railway vars set KEY=value

# View variables
railway vars
```

---

## Health Checks

### Endpoints

| Service     | Health Check URL                         |
| ----------- | ---------------------------------------- |
| Production  | `https://villa.cash/api/health`          |
| Staging     | `https://beta.villa.cash/api/health`     |
| Developers  | `https://developers.villa.cash`          |
| Key Staging | `https://beta-key.villa.cash/api/health` |

### Expected Response

```json
{
  "status": "ok",
  "timestamp": "2026-01-22T09:00:00Z",
  "version": "0.19.0-alpha.1",
  "build": {
    "version": "0.19.0-alpha.1",
    "hash": "abc123",
    "sha": "abc1234567",
    "time": "2026-01-22T09:00:00Z"
  },
  "env": "production"
}
```

---

## Monitoring

### Railway Dashboard

1. **Metrics:** CPU, Memory, Network in real-time
2. **Logs:** Structured, filterable, 7-30 day retention
3. **Deployments:** History, one-click rollback
4. **Alerts:** Configure via Railway settings

### Telemetry Dashboard

Local dashboard at `http://localhost:3003` showing:

- Pipeline status
- Build progress
- Environment health
- GitHub Actions status

```bash
# Run telemetry dashboard
bun dev:telemetry
```

---

## Troubleshooting

### Build Failures

```bash
# Check Railway build logs
railway logs --build

# Force rebuild
railway up --ci
```

### DNS Issues

```bash
# Verify DNS propagation
dig beta.villa.cash CNAME
dig villa.cash CNAME

# Clear CloudFlare cache
curl -X POST "https://api.cloudflare.com/client/v4/zones/ZONE_ID/purge_cache" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"purge_everything":true}'
```

### Service Not Starting

1. Check health endpoint manually
2. Review Railway logs for errors
3. Verify environment variables are set
4. Check `railway.toml` configuration

---

## Checklist: New Deployment

- [ ] Code merged to `main`
- [ ] CI passes (lint, typecheck, E2E)
- [ ] Staging auto-deployed
- [ ] Staging health check passes
- [ ] Manual QA on staging
- [ ] Create version tag (production only)
- [ ] Production deployed
- [ ] Production health check passes
- [ ] CloudFlare cache purged (if needed)
- [ ] Notify team in Telegram

---

## Emergency Contacts

- **Railway Status:** https://status.railway.app
- **CloudFlare Status:** https://www.cloudflarestatus.com
- **Team Telegram:** https://t.me/proofofretreat
- **Security Issues:** security@villa.cash
