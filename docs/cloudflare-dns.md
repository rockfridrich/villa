# CloudFlare CDN & DNS Setup for villa.cash

Complete guide for setting up CloudFlare with full CDN, caching, SSL, and security features.

## Quick Start (SDK-based)

```bash
# 1. Set environment variables
export CLOUDFLARE_API_TOKEN='your-token-here'
export CLOUDFLARE_ZONE_ID='your-zone-id'

# 2. Check status
npm run infra:status

# 3. List DNS records
npm run infra:dns:list

# 4. Purge cache (after deploy)
npm run infra:cache:purge
```

**Note:** Use TypeScript SDK (`src/lib/infra/cloudflare.ts`) instead of raw curl/bash.
See `.claude/MANIFESTO.md` for AI-Human collaboration principles.

## API Token Setup

Create a token at: https://dash.cloudflare.com/profile/api-tokens

Required permissions:
| Permission | Access |
|------------|--------|
| Zone → Zone | Read |
| Zone → DNS | Edit |
| Zone → SSL and Certificates | Edit |
| Zone → Caching | Purge |
| Zone → Zone Settings | Edit |

Zone Resources: Include → Specific zone → `villa.cash`

## Domain Architecture

| Domain                  | Environment | Deploy Trigger   | Provider     |
| ----------------------- | ----------- | ---------------- | ------------ |
| `villa.cash`            | Production  | Release tag `v*` | DigitalOcean |
| `beta.villa.cash`       | Staging     | Push to `main`   | DigitalOcean |
| `docs.villa.cash`       | Docs Portal | Push to `main`   | DigitalOcean |
| `dev-3.villa.cash`      | Local dev   | ngrok tunnel     | ngrok        |

> **Note:** Preview environments (dev-1, dev-2) were removed in Jan 2026. All PRs now use staging after merge.

## Prerequisites

1. CloudFlare account with `villa.cash` domain
2. DigitalOcean App Platform apps created
3. ngrok account (paid plan for custom domain)
4. Domains registered with Ithaca/Porto for passkey support

## DNS Records

### Step 1: Get DigitalOcean App URLs

```bash
# List all apps
doctl apps list --format Spec.Name,DefaultIngress

# Expected output (example):
# villa-production    villa-production-xxxxx.ondigitalocean.app
# villa-staging       villa-staging-xxxxx.ondigitalocean.app
# villa-developers    villa-developers-xxxxx.ondigitalocean.app
```

### Step 2: Configure CloudFlare DNS

Add these records in CloudFlare DNS settings:

| Type  | Name         | Target                                      | Proxy            | TTL  |
| ----- | ------------ | ------------------------------------------- | ---------------- | ---- |
| CNAME | `@`          | `villa-production-xxxxx.ondigitalocean.app` | Proxied (orange) | Auto |
| CNAME | `www`        | `villa.cash`                                | Proxied (orange) | Auto |
| CNAME | `beta`       | `villa-staging-xxxxx.ondigitalocean.app`    | Proxied (orange) | Auto |
| CNAME | `docs`       | `villa-developers-xxxxx.ondigitalocean.app` | Proxied (orange) | Auto |
| CNAME | `dev-3`      | `[your-ngrok-tunnel].ngrok.io`              | DNS only (grey)  | Auto |

**Important:** Set proxy status to **Proxied (orange cloud)** for CDN, caching, and SSL.
Only use **DNS only (grey)** for dev-3 since ngrok handles its own SSL.

### Step 3: Configure dev-3 for ngrok

For `dev-3.villa.cash` (local development):

1. Sign up for ngrok paid plan (for custom domains)
2. In ngrok dashboard: Domains → Add Domain → `dev-3.villa.cash`
3. ngrok provides a CNAME target like `xxxxx.ngrok-free.app`
4. Add CNAME record in CloudFlare pointing to that target

## CloudFlare Settings

### SSL/TLS

| Setting                  | Value       | Reason                          |
| ------------------------ | ----------- | ------------------------------- |
| Encryption mode          | **Full**    | DigitalOcean provides valid SSL |
| Always Use HTTPS         | **On**      | Required for passkeys           |
| Minimum TLS              | **TLS 1.2** | Security                        |
| TLS 1.3                  | **On**      | Modern encryption               |
| Automatic HTTPS Rewrites | **On**      | Fix mixed content               |

**Note:** "Full" mode validates DigitalOcean's Let's Encrypt cert.

### Security (Recommended)

| Setting                 | Value  |
| ----------------------- | ------ |
| Security Level          | Medium |
| Browser Integrity Check | On     |
| Hotlink Protection      | Off    |

### Performance

| Setting     | Value                      |
| ----------- | -------------------------- |
| Auto Minify | Off (Next.js handles this) |
| Brotli      | On                         |
| Early Hints | On                         |
| HTTP/3      | On                         |

### Caching

| Setting           | Value           |
| ----------------- | --------------- |
| Caching Level     | Standard        |
| Browser Cache TTL | Respect headers |

## Page Rules (Optional)

### Force HTTPS

```
URL: http://*villa.cash/*
Action: Always Use HTTPS
```

### Cache static assets

```
URL: *villa.cash/_next/static/*
Actions:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 month
  - Browser Cache TTL: 1 year
```

## Ithaca/Porto Domain Registration

**Critical:** All domains must be registered with Ithaca for passkey WebAuthn support.

Domains to register:

- `villa.cash`
- `beta.villa.cash`
- `dev-1.villa.cash`
- `dev-2.villa.cash`
- `dev-3.villa.cash`

Contact Ithaca team or use their domain registration portal.

## Verification

### Test DNS propagation

```bash
# Check all domains resolve
for d in villa.cash beta.villa.cash dev-1.villa.cash dev-2.villa.cash; do
  echo "=== $d ==="
  dig $d +short
done
```

### Test HTTPS

```bash
# Check SSL works
for d in villa.cash beta.villa.cash; do
  echo "=== $d ==="
  curl -sI "https://$d" | head -5
done
```

### Test health endpoints

```bash
# Check apps are healthy
for d in villa.cash beta.villa.cash; do
  echo "=== $d ==="
  curl -sf "https://$d/api/health" && echo "OK" || echo "FAIL"
done
```

## Local Development with dev-3

### Option 1: Custom domain (recommended)

```bash
# Set environment variable
export NGROK_DOMAIN=dev-3.villa.cash

# Start development
npm run dev:share
```

### Option 2: Random ngrok URL

```bash
# Uses random URL (passkeys work but need manual testing)
npm run dev:share
```

## Troubleshooting

### DNS not resolving

```bash
# Check propagation globally
dig @1.1.1.1 villa.cash
dig @8.8.8.8 villa.cash

# Flush local cache (macOS)
sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder
```

### "Too many redirects"

**Cause:** CloudFlare SSL set to "Flexible"
**Fix:** Change SSL/TLS encryption to "Full"

### Certificate errors

**Cause:** DigitalOcean cert not provisioned yet
**Fix:** Wait 5-10 minutes for Let's Encrypt cert

### Passkeys not working

**Cause:** Domain not registered with Ithaca/Porto
**Fix:** Register domain with Ithaca team

### Preview deploys failing

**Cause:** DNS not configured for dev-1/dev-2
**Fix:** Add CNAME records for preview domains

## CI/CD Awareness

The deploy workflow (`.github/workflows/deploy.yml`) knows about domains:

```yaml
env:
  PRODUCTION_DOMAIN: villa.cash
  STAGING_DOMAIN: beta.villa.cash
  DEV_1_DOMAIN: dev-1.villa.cash
  DEV_2_DOMAIN: dev-2.villa.cash
```

Domain configuration is also in `domains.json` for programmatic access.

## Security Considerations

1. **Always proxy through CloudFlare** for DigitalOcean apps (orange cloud)
2. **Keep SSL on Full** mode for proper certificate chain
3. **Rate limiting** - Consider enabling for `/api/*` endpoints
4. **WAF rules** - Enable for production if under attack
5. **Access control** - Use CloudFlare Access for staging if needed
6. **DDoS protection** - Automatic with proxied mode

## Cache Management

```bash
# Purge all cache after deploy
npm run infra:cache:purge

# Enable dev mode (bypass cache for debugging)
npm run infra cloudflare zone dev-mode-on

# Check status
npm run infra:status
```

For programmatic use:

```typescript
import { cloudflare } from "@/lib/infra/cloudflare";

await cloudflare.cache.purgeAll();
await cloudflare.cache.purgeUrls(["https://villa.cash/"]);
await cloudflare.zone.enableDevMode();
```

## Cost Optimization

| Resource               | Cost    | Notes              |
| ---------------------- | ------- | ------------------ |
| CloudFlare DNS         | Free    | Unlimited queries  |
| CloudFlare SSL         | Free    | Universal SSL      |
| DigitalOcean basic-xxs | ~$5/mo  | Preview apps       |
| DigitalOcean basic-xs  | ~$10/mo | Production/Staging |
| ngrok custom domain    | ~$8/mo  | Optional for dev-3 |

**Tip:** Delete preview apps after PRs close (CI does this automatically).
