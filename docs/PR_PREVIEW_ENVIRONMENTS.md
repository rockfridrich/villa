# PR Preview Environments

Automated preview environments for every pull request, enabling better testing and collaboration.

## Features

- **🚀 Automatic deployment** on PR creation/updates
- **🔒 Passkey authentication** enabled (HTTPS domains)
- **🎯 Isolated environments** with unique data
- **🗑️ Automatic cleanup** when PR is closed
- **⚡ Fast feedback** with health checks
- **📱 Mobile-friendly** URLs for testing

## Environment Naming

Preview environments use the format: `villa-shard-{pr-number}-{date}`

Examples:

- `villa-shard-123-2025-01-28` (PR #123 created on Jan 28, 2025)
- `villa-shard-456-2025-01-29` (PR #456 created on Jan 29, 2025)

## Services

Each PR preview includes all Villa services:

| Service | Domain Pattern                                | Purpose            |
| ------- | --------------------------------------------- | ------------------ |
| Hub     | `villa-shard-{pr}-{date}-hub.up.railway.app`  | Main app with auth |
| Key     | `villa-shard-{pr}-{date}-key.up.railway.app`  | Passkey service    |
| Docs    | `villa-shard-{pr}-{date}-docs.up.railway.app` | Documentation      |

## Workflow

### Automatic Deployment

1. **PR Creation/Update**: GitHub triggers the `pr-preview.yml` workflow
2. **Environment Creation**: Railway creates isolated environment
3. **Service Deployment**: All three services deploy in parallel
4. **Health Checks**: Automated verification all services are healthy
5. **PR Comment**: URLs posted as PR comment with status

### Cleanup

1. **PR Closed**: Automatic cleanup triggered
2. **Environment Removal**: All services and data deleted
3. **Scheduled Cleanup**: Daily job removes environments older than 7 days

## Usage

### For Developers

Preview environments are created automatically for every PR. No manual action required.

**PR Comment Example:**

```
🚀 PR Preview Environment Ready

Shard: villa-shard-123-2025-01-28

| Service | URL | Status |
|---------|-----|--------|
| 🏠 Hub | https://villa-shard-123-2025-01-28-hub.up.railway.app | ✅ |
| 🔐 Key | https://villa-shard-123-2025-01-28-key.up.railway.app | ✅ |
| 📖 Docs | https://villa-shard-123-2025-01-28-docs.up.railway.app | ✅ |

Features:
- 🔒 Passkey authentication enabled (HTTPS domains)
- 🎯 Isolated data and state
- 🔄 Auto-updates on PR changes
- 🗑️ Auto-cleanup after PR close
```

### Manual Management

Use the management script for manual operations:

```bash
# List all PR preview environments
./scripts/pr-preview-manage.sh list

# Deploy preview for specific PR
./scripts/pr-preview-manage.sh deploy 123

# Check status of PR preview
./scripts/pr-preview-manage.sh status 123

# Remove preview environment
./scripts/pr-preview-manage.sh destroy 123

# Cleanup old environments (older than 14 days)
./scripts/pr-preview-manage.sh cleanup 14
```

## Testing with Passkeys

Preview environments support full passkey authentication:

1. **HTTPS enabled** - Required for WebAuthn
2. **Stable domains** - Hardware keys work correctly
3. **Cross-origin setup** - Hub and Key services communicate properly

### Test Flow

1. Visit the Hub URL from PR comment
2. Click "Sign In with Villa"
3. Complete passkey authentication
4. Test your PR changes with real authentication

## Configuration

### GitHub Secrets Required

| Secret                 | Purpose                      |
| ---------------------- | ---------------------------- |
| `RAILWAY_TOKEN`        | Railway API access           |
| `CLOUDFLARE_API_TOKEN` | CDN cache purging (optional) |
| `CLOUDFLARE_ZONE_ID`   | CloudFlare zone (optional)   |

### Environment Variables

Each preview environment includes:

```bash
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
NEXT_PUBLIC_ENVIRONMENT=preview
NEXT_PUBLIC_PR_NUMBER={pr-number}
NEXT_PUBLIC_APP_URL=https://villa-shard-{pr}-{date}-hub.up.railway.app
NEXT_PUBLIC_KEY_URL=https://villa-shard-{pr}-{date}-key.up.railway.app
NEXT_PUBLIC_DOCS_URL=https://villa-shard-{pr}-{date}-docs.up.railway.app
```

## Architecture

```
GitHub PR Event
       ↓
.github/workflows/pr-preview.yml
       ↓
Railway CLI Commands
       ↓
┌─────────────────────────┐
│ villa-shard-123-2025... │
├─────────────────────────┤
│ Hub Service             │ ← Dockerfile
│ Key Service             │ ← apps/key/Dockerfile
│ Docs Service            │ ← apps/developers/Dockerfile
└─────────────────────────┘
       ↓
Health Checks & PR Comment
```

## Troubleshooting

### Common Issues

**Deployment Failed**

- Check Railway logs in project dashboard
- Verify Railway token has correct permissions
- Ensure Dockerfiles build successfully

**Health Checks Timeout**

- Services may take 2-3 minutes to start
- Check `/api/health` endpoint manually
- Review service logs for startup errors

**Passkey Not Working**

- Ensure using HTTPS URL from PR comment
- Clear browser data and try again
- Test with different browser/device

### Manual Intervention

```bash
# Check Railway project status
railway status

# View logs for specific service
railway logs --service villa-hub-pr-123

# Redeploy service
railway service --service-name villa-hub-pr-123
railway up --dockerfile Dockerfile

# Force cleanup of stuck environment
railway environment delete villa-shard-123-2025-01-28 --yes
```

## Cost Management

- **Resource Limits**: Each service uses 1 replica with standard Railway limits
- **Auto-cleanup**: Prevents cost accumulation from forgotten environments
- **Scheduled Cleanup**: Daily job removes environments older than 7 days
- **Manual Override**: Use management script to cleanup immediately if needed

## Security

- **Isolated Data**: Each preview has separate database/state
- **HTTPS Enforced**: All preview URLs use secure connections
- **Limited Access**: Preview environments inherit production security settings
- **Automatic Cleanup**: No long-term data exposure risk
