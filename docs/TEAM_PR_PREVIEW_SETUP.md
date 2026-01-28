# PR Preview Environments - Setup Complete

## What's New

Railway PR preview environments are now live! Every pull request automatically gets:

- **Isolated environment** with unique URLs
- **Full passkey support** (HTTPS enabled)
- **All three services**: Hub, Key, and Docs
- **Auto-cleanup** when PR is closed

## How It Works

1. **Open/update PR** → GitHub triggers deployment
2. **Environment created**: `villa-shard-{pr}-{date}`
3. **Services deployed**: Hub, Key, Docs with proper domains
4. **PR comment added** with working URLs
5. **Health checks** ensure everything is working
6. **Auto-cleanup** when PR is merged/closed

## URLs Format

```
Hub:  villa-shard-123-2025-01-28-hub.up.railway.app
Key:  villa-shard-123-2025-01-28-key.up.railway.app
Docs: villa-shard-123-2025-01-28-docs.up.railway.app
```

## Testing Workflow

1. **Create PR** with your changes
2. **Wait for comment** (usually 3-5 minutes)
3. **Click Hub URL** from PR comment
4. **Test passkey auth** - works just like production!
5. **Share URLs** with team for review

## Files Added/Modified

### New Files

- `.github/workflows/pr-preview.yml` - Main deployment workflow
- `.github/workflows/pr-preview-cleanup.yml` - Scheduled cleanup
- `scripts/pr-preview-manage.sh` - Manual management tools
- `railway-preview.toml` - Railway configuration template
- `docs/PR_PREVIEW_ENVIRONMENTS.md` - Full documentation

### Modified Files

- `README.md` - Added PR preview environment info
- `docs/DEVELOPMENT.md` - Added testing workflow

## Manual Management

```bash
# List all preview environments
./scripts/pr-preview-manage.sh list

# Deploy preview for PR #123
./scripts/pr-preview-manage.sh deploy 123

# Check status
./scripts/pr-preview-manage.sh status 123

# Force cleanup
./scripts/pr-preview-manage.sh destroy 123
```

## Cost Management

- **Auto-cleanup**: Environments removed when PR closes
- **Scheduled cleanup**: Daily job removes environments >7 days old
- **Resource limits**: Standard Railway limits per service
- **Monitor usage**: Check Railway dashboard for costs

## Troubleshooting

### Deployment Failed

- Check GitHub Actions tab for workflow logs
- Verify Railway token in repository secrets
- Review Railway project dashboard

### Health Checks Timeout

- Services may take 2-3 minutes to start
- Check specific service logs in Railway dashboard
- Try manual health check: `curl {url}/api/health`

### Passkeys Not Working

- Ensure using HTTPS URL from PR comment
- Clear browser data and retry
- Test with different browser/device

## Security

- **Isolated data**: Each preview has separate state
- **HTTPS enforced**: All domains use secure connections
- **Automatic cleanup**: No long-term exposure risk
- **Production settings**: Inherits security configuration

## Next Steps

1. **Test the system**: Create a test PR to verify everything works
2. **Team training**: Share this doc with all developers
3. **Monitor usage**: Keep an eye on Railway costs and cleanup
4. **Iterate**: Improve workflow based on team feedback

---

**Questions?** Check [PR_PREVIEW_ENVIRONMENTS.md](PR_PREVIEW_ENVIRONMENTS.md) for complete documentation.
