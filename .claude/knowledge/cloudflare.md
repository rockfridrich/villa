# CloudFlare Knowledge Base

## Quick Reference

```
Domain: villa.cash
Zone ID: CLOUDFLARE_ZONE_ID env variable
API: cloudflare npm package (v5+)
SDK: src/lib/infra/cloudflare.ts
CLI: npm run infra cloudflare <category> <command>
```

## Environment Variables

| Variable | Purpose | Where to Set |
|----------|---------|--------------|
| `CLOUDFLARE_API_TOKEN` | API authentication | `.env.local`, GitHub Secrets |
| `CLOUDFLARE_ZONE_ID` | Zone identifier | `.env.local`, GitHub Secrets |

## Common Operations

### Purge Cache After Deploy
```bash
npm run infra:cache:purge
```

### Check Zone Status
```bash
npm run infra:status
```

### List DNS Records
```bash
npm run infra:dns:list
```

### Enable Dev Mode (Bypass Cache)
```bash
npm run infra cloudflare zone dev-mode-on
```

## Architecture

```
CloudFlare (CDN/Proxy)
    ↓ HTTPS (edge termination)
DigitalOcean App Platform
    ↓ HTTPS (origin)
Villa App
```

### DNS Records

| Record | Target | Proxy |
|--------|--------|-------|
| `villa.cash` | `villa-production-xxx.ondigitalocean.app` | Proxied |
| `www.villa.cash` | `villa.cash` | Proxied |
| `beta.villa.cash` | `villa-staging-xxx.ondigitalocean.app` | Proxied |
| `dev-1.villa.cash` | `villa-dev-1-xxx.ondigitalocean.app` | Proxied |
| `dev-2.villa.cash` | `villa-dev-2-xxx.ondigitalocean.app` | Proxied |

## Patterns

### SDK Usage Pattern
```typescript
import { cloudflare } from '@/lib/infra/cloudflare';

// Always use typed SDK methods
await cloudflare.cache.purgeAll();
await cloudflare.dns.list();
await cloudflare.zone.getStatus();
```

### CI/CD Cache Purge Pattern
```yaml
# In deploy workflow, after successful deploy
- name: Purge cache
  env:
    CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    CLOUDFLARE_ZONE_ID: ${{ secrets.CLOUDFLARE_ZONE_ID }}
  run: npm run infra:cache:purge
```

## Anti-Patterns

| Don't | Do Instead |
|-------|------------|
| `curl -X POST "https://api.cloudflare.com/..."` | `cloudflare.cache.purgeAll()` |
| Bash scripts with API calls | TypeScript SDK wrapper |
| Hardcoded zone IDs | Environment variables |
| Manual DNS changes | `cloudflare.dns.upsert()` |

## Settings

### SSL/TLS
- Mode: **Full** (validates origin cert)
- Always HTTPS: **On**
- Min TLS: **1.2**
- TLS 1.3: **On**

### Performance
- Brotli: **On**
- HTTP/3: **On**
- Early Hints: **On**
- Auto Minify: **Off** (Next.js handles)

### Caching
- Level: **Aggressive**
- Browser TTL: **4 hours**
- Dev Mode: **Off** (enable for debugging)

## Learnings

### 2026-01-04: Domain Verification with Proxy
**Problem:** DigitalOcean returned 404 when CloudFlare proxy enabled.
**Cause:** DO couldn't verify domain ownership through CF proxy.
**Solution:**
1. Temporarily disable proxy (DNS only)
2. Trigger DO redeploy to re-verify domain
3. Wait for verification
4. Re-enable proxy

### 2026-01-04: CNAME Content Format
**Problem:** `Content for CNAME record is invalid`
**Cause:** CNAME content included `https://` prefix
**Solution:** Strip protocol from CNAME target (hostname only)

### 2026-01-04: WWW Domain Setup with DO
**Problem:** www.villa.cash returning 404 through CloudFlare
**Cause:** CNAME pointed to `villa.cash` but DO expects direct app URL
**Solution:**
1. Point www CNAME to `villa-production-xxx.ondigitalocean.app` (not villa.cash)
2. Temporarily disable CF proxy for DO to verify domain
3. Wait for DO to issue SSL certificate
4. Re-enable CF proxy after verification

## Troubleshooting

### "Invalid request headers"
- Check API token is valid
- Verify Content-Type header is set

### 404 Through Proxy
- DO domain verification may have failed
- Temporarily disable proxy, redeploy, re-enable

### SSL Errors
- Check SSL mode is "Full" not "Flexible"
- Wait for cert propagation (~5 min)
