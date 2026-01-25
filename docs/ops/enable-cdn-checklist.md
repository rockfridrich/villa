# Enable CloudFlare CDN - Checklist

> Quick guide to enable the CloudFlare CDN caching layer for Villa

## Pre-requisites

1. CloudFlare credentials in `.env.local`:
   ```bash
   CLOUDFLARE_API_TOKEN=<your-token>
   CLOUDFLARE_ZONE_ID=bf3804f5e64ef25baeb078f8d986b6b9
   ```

2. Railway deployed with latest code (includes cache headers + revalidate endpoint)

## Steps

### 1. Enable CloudFlare Proxy for docs.villa.cash

```bash
# Using the enable-cdn script
./scripts/enable-cdn.sh enable

# Or via CloudFlare dashboard:
# 1. Go to https://dash.cloudflare.com
# 2. Select villa.cash zone
# 3. DNS > Records
# 4. Find docs.villa.cash
# 5. Toggle "Proxy status" to orange cloud (proxied)
```

### 2. Add REVALIDATE_TOKEN to Railway (optional)

For programmatic cache purging:

```bash
# Generate a secure token
openssl rand -hex 32

# Add to Railway:
# 1. Go to Railway dashboard
# 2. Select villa-developers service
# 3. Variables tab
# 4. Add: REVALIDATE_TOKEN=<generated-token>
# 5. Also add: CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID
```

### 3. Verify CDN is Working

```bash
# Check headers - should show "server: cloudflare"
curl -sI https://docs.villa.cash | grep -iE "server|cf-cache|cf-ray"

# Expected output:
# server: cloudflare
# cf-cache-status: MISS (first request) or HIT (cached)
# cf-ray: <ray-id>
```

### 4. Test Cache Purge (optional)

```bash
# Via API endpoint
curl -X POST https://docs.villa.cash/api/revalidate \
  -H "x-revalidate-token: <your-token>" \
  -H "Content-Type: application/json" \
  -d '{"purgeAll": true}'

# Via script
./scripts/cloudflare.sh cache purge
```

## Verification

After enabling CDN, verify each domain:

| Domain | Expected Server | Expected Cache |
|--------|-----------------|----------------|
| docs.villa.cash | cloudflare | HIT after 2nd request |
| villa.cash | cloudflare | HIT after 2nd request |
| construction.villa.cash | cloudflare | HIT after 2nd request |

## Rollback

If issues occur:

```bash
# Disable CloudFlare proxy (direct to Railway)
./scripts/cloudflare.sh dns upsert docs tz6vy0iv.up.railway.app CNAME false

# Or enable CloudFlare Dev Mode (bypasses cache for 3 hours)
./scripts/cloudflare.sh cache dev-mode on
```

## Architecture

See: [docs/architecture/caching-layer.md](../architecture/caching-layer.md)

## Troubleshooting

### Still seeing stale content

1. Check if CloudFlare proxy is enabled:
   ```bash
   ./scripts/enable-cdn.sh status
   ```

2. Purge cache:
   ```bash
   ./scripts/cloudflare.sh cache purge
   ```

3. Check cache headers:
   ```bash
   curl -sI https://docs.villa.cash | grep -i cache
   ```

### cf-cache-status: BYPASS

This means CloudFlare isn't caching. Check:
- Cache Rules are configured correctly
- Response has cacheable Cache-Control header
- No `Set-Cookie` header in response

### cf-cache-status: DYNAMIC

Page is being treated as dynamic. Check:
- Page uses `"use client"` directive (client components aren't cached at build time)
- Consider using SSG or ISR for better caching
