# Villa RC1.1 Deployment — Full Production Push

> Paste into OpenCode terminal. All 4 services deploy in parallel.
> Run `bd ready` to confirm all tasks unblocked.

---

## Deployment Status (Before)

| Service | Domain | Current | Target |
|---------|--------|---------|--------|
| Hub | villa.cash | v0.2.0 | v0.3.0-rc.1.1 |
| Key | key.villa.cash | old format | v0.3.0-rc.1.1 |
| Docs | docs.villa.cash | unknown | v0.3.0-rc.1.1 |
| API | api.villa.cash | ❌ not deployed | v0.3.0-rc.1.1 |

---

## Wave 1: All Deploys (4 parallel agents)

### @ops Agent A: Fix docs build metadata (villa-dy4)
```
docs.villa.cash health returns "unknown" version.

1. Verify apps/developers/src/app/api/health/route.ts uses process.env for build vars
2. Check apps/developers/Dockerfile passes BUILD_VERSION, BUILD_HASH, BUILD_TIME as build args
3. If PR #79 merged, just trigger redeploy:
   railway up --service developers
4. Verify: curl -s https://docs.villa.cash/api/health | jq .build

bd close villa-dy4
```

### @ops Agent B: Deploy api.villa.cash (villa-tp3)
```
Create new Railway service for apps/api.

1. Railway dashboard → New Service → From GitHub repo
2. Root directory: apps/api
3. Build command: (uses Dockerfile)
4. Domain: api.villa.cash
5. Environment variables:
   - DATABASE_URL (copy from hub service)
   - NODE_ENV=production
   - PORT=3001
6. Deploy and wait for health check
7. Verify: curl -s https://api.villa.cash/health | jq .

bd close villa-tp3
```

### @ops Agent C: Redeploy hub (villa-u1c)
```
Hub running v0.2.0, needs v0.3.0 changes.

1. Railway dashboard → hub service → Redeploy
   Or: railway up --service hub
2. Wait for deployment to complete (~3-5 min)
3. Verify: curl -s https://villa.cash/api/health | jq .build.version
4. Should return "0.3.0-rc.1.1" or similar

bd close villa-u1c
```

### @ops Agent D: Redeploy key (villa-xps)
```
Key service has old health format.

1. Railway dashboard → key service → Redeploy
   Or: railway up --service key
2. Wait for deployment to complete
3. Verify: curl -s https://key.villa.cash/api/health | jq .
4. Should return standardized format with version/build/sha

bd close villa-xps
```

---

## Wave 2: Release Tag (after Wave 1)

### @ops Agent E: Tag release (villa-usl)
> Blocked by: villa-dy4, villa-tp3, villa-u1c, villa-xps
```
All services deployed. Tag the release.

1. Verify ALL health endpoints:
   curl -s https://villa.cash/api/health | jq .build
   curl -s https://key.villa.cash/api/health | jq .
   curl -s https://docs.villa.cash/api/health | jq .build
   curl -s https://api.villa.cash/health | jq .

2. If all healthy, bump version and tag:
   # Update package.json version if needed
   bun version:bump 0.3.0-rc.1.1  # or manual edit

   git add -A
   git commit -m "bump: version to v0.3.0-rc.1.1"
   git tag -a v0.3.0-rc.1.1 -m "RC1.1: All services deployed to production"
   git push origin main --tags

3. Final verification:
   curl -s https://villa.cash/api/health | jq .build.version
   curl -s https://api.villa.cash/health | jq .version

bd close villa-usl
bd sync --flush-only
```

---

## Dependency Graph

```
Wave 1 (parallel):
  villa-dy4 (docs)  villa-tp3 (api)  villa-u1c (hub)  villa-xps (key)
       │                │                 │               │
       └────────────────┴────────────────┴───────────────┘
                                │
                                ▼
Wave 2:
                         villa-usl (tag)
```

---

## Verification Checklist

After all deploys, ALL should pass:

```bash
# Health checks
curl -s https://villa.cash/api/health | jq '.build.version'     # "0.3.0-rc.1.1"
curl -s https://key.villa.cash/api/health | jq '.version'       # "0.3.0-rc.1.1"
curl -s https://docs.villa.cash/api/health | jq '.build.version' # "0.3.0-rc.1.1"
curl -s https://api.villa.cash/health | jq '.version'           # "0.3.0-rc.1.1"

# Feature checks
# Settings popup (should open as iframe overlay, not new page):
# 1. Go to docs.villa.cash
# 2. Sign in with VillaButton
# 3. Click settings → should open overlay, not redirect
```

---

## Rollback (if needed)

```bash
# Rollback to previous deployment on Railway dashboard
# Or redeploy specific commit:
railway up --service <name> --commit <sha>
```
