# Docker Local Development

## User's Environment

**Docker Setup:**
- Standalone `docker-compose` (Python-based CLI)
- NOT Docker Compose V2 plugin
- Commands: `docker-compose up` (NOT `docker compose`)
- No BuildKit support - cannot use `--mount=type=cache`

**System Resources:**
- Can allocate up to 8GB memory to containers
- Next.js monorepo compilation needs 6GB minimum

**User Preference:**
- "Use docker always for local" - critical requirement
- Reason: Matches DigitalOcean production environment
- Needs HTTPS for passkey testing

---

## Requirements

### HTTPS for Passkeys (CRITICAL)
WebAuthn/passkeys require secure context. Local dev MUST use HTTPS.

**Solution:** Caddy reverse proxy with self-signed certs
- `docker-compose.dev.yml` includes Caddy service
- Auto-generates TLS certificate
- `https://localhost` → passkey auth works

### Hot Reload
Source code mounted as volumes:
```yaml
volumes:
  - ./apps/web/src:/app/apps/web/src
  - ./packages/sdk/src:/app/packages/sdk/src
  - ./packages/ui/src:/app/packages/ui/src
```

**Note:** Don't mount `node_modules` - breaks pnpm workspace symlinks

---

## Known Issues & Solutions

### Issue: BuildKit Cache Mounts
**Symptom:** `unknown flag: --mount`  
**Cause:** Standalone docker-compose doesn't support BuildKit  
**Solution:** Use standard `COPY` commands, no cache mounts

### Issue: OOM Kills During Compilation
**Symptom:** Container exits with code 137  
**Cause:** Next.js + Turbo + pnpm monorepo = high memory usage  
**Solution:** Set `mem_limit: 6g` in docker-compose.dev.yml

### Issue: Turbo Exits After Initial Compile
**Symptom:** Container starts, compiles, then stops  
**Cause:** `turbo run dev` exits in container context (not watch mode)  
**Solution:** Run `pnpm dev` directly instead of turbo wrapper
```dockerfile
WORKDIR /app/apps/web
CMD ["pnpm", "dev"]
```

### Issue: SDK Redirects to beta-key.villa.cash
**Symptom:** Auth flow redirects away from localhost  
**Cause:** SDK doesn't detect localhost as development environment  
**Solution:** Explicitly pass origin to VillaBridge:
```typescript
<VillaBridge appId="..." origin="https://localhost" />
```

---

## Commands

```bash
# Start local dev (Docker + HTTPS)
pnpm dev:docker

# This runs:
# - docker-compose -f docker-compose.dev.yml up
# - HTTP: http://localhost:3000
# - HTTPS: https://localhost (use this for passkeys)

# Stop and clean up
docker-compose -f docker-compose.dev.yml down

# Rebuild after dependency changes
docker-compose -f docker-compose.dev.yml up --build

# View logs
docker-compose -f docker-compose.dev.yml logs -f web
```

---

## Pre-Flight Checklist (Before Docker Changes)

```bash
# 1. Check Docker setup
docker version
docker-compose version  # Note: NOT "docker compose"

# 2. Check BuildKit support
docker buildx version 2>/dev/null || echo "No BuildKit"

# 3. Check available memory
docker info | grep "Total Memory"

# 4. Test current setup
pnpm dev:docker
curl https://localhost  # Should show Next.js app
```

---

## Architecture Notes

**Why Docker for local dev?**
- Matches DigitalOcean App Platform production environment
- Consistent Node.js version, dependencies, build process
- HTTPS via Caddy matches production TLS setup
- Isolates development environment

**Dockerfile.dev vs Production Dockerfile:**
- `Dockerfile.dev`: Mounts source, hot reload, includes dev dependencies
- `Dockerfile`: Optimized build, prunes dev deps, multi-stage build
