# Villa Caching Architecture

> CloudFlare CDN + Railway Docker with controlled cache invalidation

## Problem

docs.villa.cash serves stale content due to:
1. Next.js ISR cache with 1-year `s-maxage` headers
2. DNS pointing directly to Railway (no CloudFlare proxy)
3. No cache invalidation mechanism on deploy

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                  Internet                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CloudFlare Edge (CDN)                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ Cache Rules:                                                            ││
│  │  - Static assets (_next/static/*): 1 year, immutable                   ││
│  │  - HTML pages: 1 hour edge, stale-while-revalidate 24h                 ││
│  │  - API routes: bypass cache (dynamic)                                   ││
│  │  - /api/revalidate: no cache, triggers purge                           ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  Edge Locations: 300+ cities worldwide                                       │
│  Latency: <50ms for most users                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Railway (Origin)                                    │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ Docker Container (Next.js Standalone)                                   ││
│  │  - Node.js 20 Alpine                                                    ││
│  │  - output: "standalone" (minimal bundle)                                ││
│  │  - No ISR cache (disabled for CDN setup)                               ││
│  │  - Headers: Cache-Control for CDN consumption                          ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  Regions: asia-southeast1 (primary), us-west1 (failover)                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Cache Strategy

### Layer 1: CloudFlare Edge Cache

| Route Pattern | Edge TTL | Browser TTL | Strategy |
|---------------|----------|-------------|----------|
| `/_next/static/*` | 1 year | 1 year | Immutable (hash in filename) |
| `/` (HTML pages) | 1 hour | 0 | Edge cache + SWR |
| `/api/health` | 0 | 0 | Always fresh |
| `/api/revalidate` | 0 | 0 | Triggers cache purge |
| `/CLAUDE.txt`, `/llms.txt` | 1 day | 1 hour | Aggressive cache |

### Layer 2: Origin Headers

Next.js sends these headers to CloudFlare:

```http
# HTML Pages
Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400

# Static Assets (automatic by Next.js)
Cache-Control: public, max-age=31536000, immutable

# API Routes
Cache-Control: no-store, no-cache, must-revalidate
```

### Cache Invalidation Flow

```
Deploy Trigger
      │
      ▼
┌──────────────┐     ┌───────────────────┐     ┌──────────────────┐
│ Railway      │────▶│ GitHub Action     │────▶│ CloudFlare API   │
│ Deploy Hook  │     │ (optional)        │     │ Purge Cache      │
└──────────────┘     └───────────────────┘     └──────────────────┘
      │
      ▼
┌──────────────┐
│ /api/revalidate
│ (fallback)   │
└──────────────┘
```

## Implementation

### 1. DNS Configuration

Enable CloudFlare proxy for docs.villa.cash:

```bash
# Current (direct to Railway - no CDN)
docs.villa.cash CNAME tz6vy0iv.up.railway.app (proxied: false)

# Target (through CloudFlare CDN)
docs.villa.cash CNAME tz6vy0iv.up.railway.app (proxied: true)
```

### 2. Next.js Headers (next.config.js)

```javascript
async headers() {
  return [
    // HTML pages - short edge cache with revalidation
    {
      source: "/:path*",
      has: [{ type: "header", key: "accept", value: ".*text/html.*" }],
      headers: [
        {
          key: "Cache-Control",
          value: "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      ],
    },
    // Static assets - immutable
    {
      source: "/_next/static/:path*",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=31536000, immutable",
        },
      ],
    },
    // API routes - no cache
    {
      source: "/api/:path*",
      headers: [
        {
          key: "Cache-Control",
          value: "no-store, no-cache, must-revalidate",
        },
      ],
    },
  ];
}
```

### 3. Revalidation Endpoint

`/api/revalidate` endpoint for cache purging:

```typescript
// POST /api/revalidate
// Headers: x-revalidate-token: <secret>
// Body: { paths?: string[] }

export async function POST(req: Request) {
  // Verify token
  const token = req.headers.get("x-revalidate-token");
  if (token !== process.env.REVALIDATE_TOKEN) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Purge CloudFlare cache
  const { paths } = await req.json();
  
  if (paths?.length) {
    await cloudflare.cache.purgeUrls(paths.map(p => `https://docs.villa.cash${p}`));
  } else {
    await cloudflare.cache.purgeAll();
  }

  return Response.json({ success: true, purged: paths || "all" });
}
```

### 4. CloudFlare Cache Rules (via API or Dashboard)

```json
{
  "rules": [
    {
      "expression": "(http.host eq \"docs.villa.cash\" and starts_with(http.request.uri.path, \"/_next/static\"))",
      "action": "cache",
      "cache_ttl": 31536000
    },
    {
      "expression": "(http.host eq \"docs.villa.cash\" and starts_with(http.request.uri.path, \"/api\"))",
      "action": "bypass"
    },
    {
      "expression": "(http.host eq \"docs.villa.cash\")",
      "action": "cache",
      "edge_ttl": 3600,
      "browser_ttl": 0
    }
  ]
}
```

## Deployment Workflow

### Automatic Cache Purge on Deploy

```yaml
# .github/workflows/deploy.yml (addition)
- name: Purge CloudFlare Cache
  if: success()
  run: |
    curl -X POST "https://api.cloudflare.com/client/v4/zones/${{ secrets.CLOUDFLARE_ZONE_ID }}/purge_cache" \
      -H "Authorization: Bearer ${{ secrets.CLOUDFLARE_API_TOKEN }}" \
      -H "Content-Type: application/json" \
      --data '{"purge_everything":true}'
```

### Manual Invalidation

```bash
# Purge everything
./scripts/cloudflare.sh cache purge

# Purge specific URLs
./scripts/cloudflare.sh cache purge-urls https://docs.villa.cash/ https://docs.villa.cash/playground
```

## Monitoring

### Cache Hit Rate

Check CloudFlare Analytics:
- Target: >90% cache hit rate for static assets
- Target: >70% cache hit rate for HTML pages

### Headers to Verify

```bash
# Check cache status
curl -sI https://docs.villa.cash | grep -i "cf-cache-status"
# Expected: HIT, MISS, EXPIRED, or STALE

# Check origin
curl -sI https://docs.villa.cash | grep -i "server"
# Expected: cloudflare (not railway-edge)
```

## Rollback

If caching causes issues:

1. **Immediate**: Enable CloudFlare Development Mode (3 hours)
   ```bash
   ./scripts/cloudflare.sh cache dev-mode on
   ```

2. **Permanent**: Disable CloudFlare proxy
   ```bash
   ./scripts/cloudflare.sh dns upsert docs tz6vy0iv.up.railway.app CNAME false
   ```

## Security

- Revalidation endpoint protected by token
- CloudFlare SSL in "Full (Strict)" mode
- Origin only accepts requests from CloudFlare IPs (optional)

## Cost

- CloudFlare Free tier: Unlimited CDN bandwidth
- Railway: Reduced origin traffic due to edge caching
- Expected savings: ~60-80% reduction in Railway egress
