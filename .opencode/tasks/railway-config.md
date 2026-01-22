# Task: Configure Railway Services for Multi-App Deployment

Status: pending
Priority: high
Assigned: human (requires dashboard access)

## Context

Railway uses the root `railway.toml` for all services, but we have multiple apps that need different Dockerfiles:

- villa-staging (hub) → `Dockerfile`
- villa-developers → `apps/developers/Dockerfile`
- villa-key-staging → `apps/key/Dockerfile`

## Acceptance Criteria

- [ ] villa-developers builds from `apps/developers/Dockerfile`
- [ ] villa-key-staging builds from `apps/key/Dockerfile`
- [ ] CLAUDE.txt accessible at https://developers.villa.cash/CLAUDE.txt
- [ ] Health check works at https://fake-key.villa.cash/api/health

## Steps

1. Go to Railway Dashboard: https://railway.com/project/7c344004-cd63-4b10-8479-9991c3923115

2. For **villa-developers** service:
   - Click service → Settings → Build
   - Set "Dockerfile Path" to `apps/developers/Dockerfile`
   - Settings → Deploy
   - Set "Healthcheck Path" to `/`
   - Click "Redeploy"

3. For **villa-key-staging** service:
   - Click service → Settings → Build
   - Set "Dockerfile Path" to `apps/key/Dockerfile`
   - Settings → Deploy
   - Set "Healthcheck Path" to `/api/health`
   - Click "Redeploy"

4. Verify deployments:
   ```bash
   curl -sf https://developers.villa.cash/CLAUDE.txt | head -5
   curl -sf https://fake-key.villa.cash/api/health | jq .status
   ```

## Progress Log

- 2026-01-22 19:20: Task created after CLI attempts failed
