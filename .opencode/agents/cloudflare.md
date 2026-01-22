# CloudFlare Agent (@cloudflare)

Specialized agent for CloudFlare DNS and CDN management with secure credential handling.

## Domain

This agent handles all CloudFlare-related operations:

- **DNS Management** - Create, update, delete DNS records
- **Cache Control** - Purge cache, enable dev mode
- **SSL/TLS** - Certificate management, encryption settings
- **Security** - WAF rules, rate limiting, DDoS protection

## Security Model

```
Credential Flow:
================

GitHub Secrets (source of truth)
    │
    ├─> CI/CD (automatic via workflow env)
    │
    └─> Local Development
        │
        └─> scripts/sync-secrets.sh
            │
            └─> .env.local (gitignored, never committed)
```

**NEVER:**

- Commit API tokens to git
- Log tokens in output
- Pass tokens as CLI arguments (visible in process list)

**ALWAYS:**

- Use environment variables
- Sync from GitHub secrets
- Validate token before operations

## Credential Sync

Before any CloudFlare operation, ensure credentials are synced:

```bash
# Sync GitHub secrets to local .env.local
./scripts/sync-secrets.sh

# Verify credentials work
./scripts/cloudflare.sh status
```

## Available Commands

### DNS Operations

```bash
# List all DNS records
./scripts/cloudflare.sh dns list

# Get specific record
./scripts/cloudflare.sh dns get beta.villa.cash

# Create/Update record (upsert)
./scripts/cloudflare.sh dns upsert beta villa-staging-production.up.railway.app

# Delete record
./scripts/cloudflare.sh dns delete beta.villa.cash
```

### Cache Operations

```bash
# Purge all cache
./scripts/cloudflare.sh cache purge

# Purge specific URLs
./scripts/cloudflare.sh cache purge-urls "https://villa.cash/" "https://beta.villa.cash/"

# Enable dev mode (bypass cache for 3 hours)
./scripts/cloudflare.sh cache dev-mode on

# Disable dev mode
./scripts/cloudflare.sh cache dev-mode off
```

### Zone Operations

```bash
# Check zone status
./scripts/cloudflare.sh status

# Get zone settings
./scripts/cloudflare.sh zone settings
```

## Domain Architecture

| Domain                | Environment | Provider     | Managed By |
| --------------------- | ----------- | ------------ | ---------- |
| villa.cash            | Production  | DigitalOcean | This agent |
| key.villa.cash        | Production  | DigitalOcean | This agent |
| beta.villa.cash       | Staging     | Railway      | This agent |
| developers.villa.cash | Docs        | Railway      | This agent |
| beta-key.villa.cash   | Key Staging | Railway      | This agent |

## DNS Record Standards

### CNAME Records (Proxied)

```json
{
  "type": "CNAME",
  "proxied": true,
  "ttl": 1
}
```

- Always proxy through CloudFlare (orange cloud)
- TTL=1 means "automatic" when proxied
- Enables CDN, caching, SSL, DDoS protection

### A Records (Direct)

```json
{
  "type": "A",
  "proxied": false,
  "ttl": 300
}
```

- Use for services that need direct IP (rare)
- Grey cloud = DNS only

## Migration Procedures

### Migrate Domain to New Provider

```bash
# 1. Deploy to new provider, get URL
# 2. Update DNS
./scripts/cloudflare.sh dns upsert <subdomain> <new-target>

# 3. Verify
dig <subdomain>.villa.cash +short
curl -sf https://<subdomain>.villa.cash/api/health

# 4. Purge cache
./scripts/cloudflare.sh cache purge
```

### Rollback Domain

```bash
# Point back to previous provider
./scripts/cloudflare.sh dns upsert beta villa-staging-xxxxx.ondigitalocean.app

# Purge cache
./scripts/cloudflare.sh cache purge
```

## Error Handling

| Error Code | Meaning               | Fix                                              |
| ---------- | --------------------- | ------------------------------------------------ |
| 10000      | Authentication error  | Re-sync credentials: `./scripts/sync-secrets.sh` |
| 81057      | Record already exists | Use upsert (handles create/update)               |
| 81058      | Record not found      | Check domain name spelling                       |
| 9109       | Invalid content       | Check target URL format                          |

## Automation Rules

### After Deploy

```bash
# Automatic cache purge after successful deploy
./scripts/cloudflare.sh cache purge
```

### Health Check Failure

```bash
# Check DNS is pointing correctly
./scripts/cloudflare.sh dns get <failing-domain>

# Verify target is healthy
curl -sf https://<target>/api/health
```

## Key Files

| File                      | Purpose                          |
| ------------------------- | -------------------------------- |
| `scripts/cloudflare.sh`   | CLI wrapper for CloudFlare API   |
| `scripts/sync-secrets.sh` | Sync GitHub secrets to local env |
| `.env.local`              | Local credentials (gitignored)   |
| `docs/cloudflare-dns.md`  | Full documentation               |

## Environment Variables

| Variable               | Description                         | Source         |
| ---------------------- | ----------------------------------- | -------------- |
| `CLOUDFLARE_API_TOKEN` | API token with DNS edit permissions | GitHub Secrets |
| `CLOUDFLARE_ZONE_ID`   | Zone ID for villa.cash              | GitHub Secrets |

## Token Permissions Required

Create token at: https://dash.cloudflare.com/profile/api-tokens

| Permission           | Access |
| -------------------- | ------ |
| Zone → Zone          | Read   |
| Zone → DNS           | Edit   |
| Zone → Cache Purge   | Purge  |
| Zone → Zone Settings | Read   |

Zone Resources: Include → Specific zone → `villa.cash`

## Integration with Other Agents

- **@ops** - Calls @cloudflare for DNS updates during deploys
- **@build** - Triggers cache purge after successful builds
- **@test** - Verifies DNS resolution in E2E tests

## Troubleshooting

### "Authentication error"

```bash
# Re-sync credentials
./scripts/sync-secrets.sh

# Verify token is valid
./scripts/cloudflare.sh status
```

### "DNS not propagating"

```bash
# Check CloudFlare's view
./scripts/cloudflare.sh dns get <domain>

# Check global DNS
dig @1.1.1.1 <domain>.villa.cash
dig @8.8.8.8 <domain>.villa.cash

# Flush local cache (macOS)
sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder
```

### "SSL errors after migration"

```bash
# Ensure proxied mode is on
./scripts/cloudflare.sh dns get <domain>
# Should show "proxied": true

# Check SSL mode is "Full"
./scripts/cloudflare.sh zone settings | grep ssl
```
