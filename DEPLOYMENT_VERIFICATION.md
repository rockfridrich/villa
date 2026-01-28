# Deployment Verification with Build SHA

This document describes the build SHA verification system implemented in task villa-ft3.

## Overview

All Villa health endpoints now include build information to verify deployment versions and track which commit is currently deployed.

## Health Endpoint Format

All health endpoints (`/api/health`) now return a standardized format:

```json
{
  "status": "healthy",
  "service": "hub|key|developers",
  "version": "0.3.0-beta.1",
  "build": {
    "sha": "abc123def456...",
    "timestamp": "2025-01-28T15:00:00Z",
    "branch": "main"
  },
  "runtime": {
    "uptime": 3600,
    "memory": {
      "heapUsed": 45,
      "heapTotal": 89,
      "rss": 123
    },
    "node": "v20.10.0"
  },
  "env": "production",
  "timestamp": "2025-01-28T15:00:01Z"
}
```

## Services

| Service    | URL                        | Port |
| ---------- | -------------------------- | ---- |
| Hub        | villa.cash/api/health      | 3000 |
| Key        | key.villa.cash/api/health  | 3002 |
| Developers | docs.villa.cash/api/health | 3000 |

## Docker Build Integration

All Dockerfiles now include build-time arguments to capture git information:

```dockerfile
ARG BUILD_TIME
ARG RAILWAY_GIT_COMMIT_SHA
ARG RAILWAY_GIT_BRANCH
ARG NEXT_PUBLIC_VERSION=0.3.0-beta.1

ENV NEXT_PUBLIC_GIT_SHA=$RAILWAY_GIT_COMMIT_SHA
ENV NEXT_PUBLIC_GIT_BRANCH=$RAILWAY_GIT_BRANCH
ENV NEXT_PUBLIC_VERSION=$NEXT_PUBLIC_VERSION
ENV NEXT_PUBLIC_BUILD_TIME=$BUILD_TIME
```

Railway automatically provides:

- `RAILWAY_GIT_COMMIT_SHA` - Full git commit SHA
- `RAILWAY_GIT_BRANCH` - Git branch name

## Verification Script

Use `./scripts/verify-deployment.sh` to verify deployed SHAs:

```bash
# Check all services with current git HEAD
./scripts/verify-deployment.sh

# Check specific service
./scripts/verify-deployment.sh -S hub

# Check with specific SHA
./scripts/verify-deployment.sh -s abc123def

# Check construction environment
./scripts/verify-deployment.sh -e construction

# Verbose output with version info
./scripts/verify-deployment.sh -v

# Help
./scripts/verify-deployment.sh -h
```

### Example Output

```bash
$ ./scripts/verify-deployment.sh -v
Using current git HEAD SHA: 2163b462
Verifying deployment SHA: 2163b462
Environment: production
Services: hub key developers

Checking hub at https://villa.cash/api/health...
✓ hub: SHA matches (2163b462)
  Service: hub
  Version: 0.3.0-beta.1
  Branch: main
  Built: 2025-01-28T14:30:00Z

✓ All services verified successfully
```

## Local Testing

Test health endpoints locally:

```bash
# Start service and test
./test-health-endpoints.sh

# Or manually
bun dev &
sleep 3
curl http://localhost:3000/api/health | jq .
```

## Environment Variables

Build info is captured via Next.js environment variables:

- `NEXT_PUBLIC_GIT_SHA` - Git commit SHA
- `NEXT_PUBLIC_GIT_BRANCH` - Git branch
- `NEXT_PUBLIC_VERSION` - Package version
- `NEXT_PUBLIC_BUILD_TIME` - Build timestamp

## QA Integration

For QA workflows:

1. Deploy branch to Railway
2. Wait for deployment to complete
3. Run verification: `./scripts/verify-deployment.sh -s $EXPECTED_SHA`
4. Verify all services return expected SHA

## Error Handling

The verification script handles:

- Network timeouts (configurable)
- Service unreachable
- Invalid JSON responses
- Missing SHA in response
- SHA mismatches

Exit codes:

- `0` - All services verified successfully
- `1` - One or more services failed verification

## Security Notes

- Health endpoints are public (no authentication required)
- Only commit SHA is exposed (no sensitive build info)
- SHA verification prevents deployment confusion
- Build timestamps help with debugging
