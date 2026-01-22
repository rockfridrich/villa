# Deploy Agent (@deploy)

Infrastructure deployment and debugging specialist. Manages Railway deployments, monitors CI/CD pipelines, and troubleshoots deployment issues.

## Domain

- Railway deployments for all staging environments
- DigitalOcean App Platform for production
- GitHub Actions workflow monitoring and debugging
- DNS configuration via CloudFlare
- Database backups and migrations

## Environment Map

| Environment  | Domain                  | Provider     | Service           |
| ------------ | ----------------------- | ------------ | ----------------- |
| Production   | villa.cash              | DigitalOcean | villa-production  |
| Construction | construction.villa.cash | Railway      | villa-staging     |
| Docs         | docs.villa.cash         | Railway      | villa-developers  |
| Fake Key     | fake-key.villa.cash     | Railway      | villa-key-staging |

## Quick Deploy Commands

```bash
# Deploy specific service to Railway
./scripts/railway-deploy.sh hub           # → construction.villa.cash
./scripts/railway-deploy.sh developers    # → docs.villa.cash
./scripts/railway-deploy.sh key           # → fake-key.villa.cash
./scripts/railway-deploy.sh all           # Deploy all

# Deploy and wait for completion
./scripts/railway-deploy.sh hub --wait

# Verify deployments
curl -sf https://construction.villa.cash/api/health | jq .status
curl -sf https://docs.villa.cash/CLAUDE.txt | head -1
curl -sf https://fake-key.villa.cash/api/health | jq .status
```

## Railway Dashboard

Project: https://railway.com/project/7c344004-cd63-4b10-8479-9991c3923115

### Service Configuration

Each service needs Dockerfile path configured in Railway dashboard:

| Service           | Dockerfile Path            | Health Check |
| ----------------- | -------------------------- | ------------ |
| villa-staging     | Dockerfile                 | /api/health  |
| villa-developers  | apps/developers/Dockerfile | /            |
| villa-key-staging | apps/key/Dockerfile        | /api/health  |

## GitHub Actions Workflows

| Workflow    | Trigger                 | Purpose                       |
| ----------- | ----------------------- | ----------------------------- |
| ci.yml      | PR, push to main        | Lint, typecheck, build, tests |
| deploy.yml  | Push main, tags         | Deploy to staging/production  |
| sandbox.yml | Manual, `/deploy [app]` | PR preview to staging env     |
| dns.yml     | Manual                  | CloudFlare DNS updates        |
| docs.yml    | Push main               | Generate documentation        |

### Sandbox Deployment

Deploy PR changes to staging for testing:

```bash
# Via GitHub Actions UI
gh workflow run sandbox.yml --field pr_number=123 --field app=hub

# Via PR comment (core contributors only)
/deploy          # Deploy hub
/deploy hub      # Deploy hub
/deploy docs     # Deploy developers app
/deploy key      # Deploy key app
```

### Debugging Failed Workflows

```bash
# List recent workflow runs
gh run list --limit 10

# View specific run
gh run view <run-id>

# View logs for failed job
gh run view <run-id> --log-failed

# Re-run failed jobs
gh run rerun <run-id> --failed

# Watch running workflow
gh run watch <run-id>
```

### Common Failures

| Error                | Cause                   | Fix                                |
| -------------------- | ----------------------- | ---------------------------------- |
| Lockfile out of sync | bun.lock not committed  | `bun install && git add bun.lock`  |
| Healthcheck failed   | App not responding      | Check Railway logs, extend timeout |
| Build timeout        | Large build, cold cache | Re-run, Railway caches layers      |
| Secret not found     | Missing GitHub secret   | Add in repo Settings → Secrets     |

## Database Operations

```bash
# Backup production database
./scripts/backup-db.sh

# Run migrations
cd apps/hub && bun run db:migrate

# Check database status
curl -sf https://villa.cash/api/status | jq .database
```

## DNS Management

```bash
# Update DNS via GitHub workflow
gh workflow run dns.yml \
  --field action=add \
  --field name=docs \
  --field target=p7xpf8ox.up.railway.app

# Verify DNS propagation
dig docs.villa.cash +short
```

## Monitoring

Telemetry Dashboard: http://localhost:3003 (run `bun run dev:telemetry`)

### Health Endpoints

```bash
# Check all environments
for env in villa.cash construction.villa.cash docs.villa.cash fake-key.villa.cash; do
  echo -n "$env: "
  curl -sf "https://$env/api/health" | jq -r '.status // "N/A"' 2>/dev/null || echo "FAIL"
done
```

## Rollback Procedures

### Railway Rollback

1. Go to Railway dashboard
2. Click on service → Deployments
3. Click "..." on previous deployment → Redeploy

### DigitalOcean Rollback

```bash
# List recent deployments
doctl apps list-deployments <app-id> --format ID,Phase,CreatedAt

# Rollback to previous
doctl apps create-deployment <app-id> --force-rebuild
```

## Troubleshooting Checklist

1. **Build Fails**
   - Check build logs: `railway logs --build`
   - Verify Dockerfile path in Railway settings
   - Check for missing dependencies

2. **Deploy Succeeds but App Fails**
   - Check runtime logs: `railway logs`
   - Verify environment variables
   - Check healthcheck endpoint

3. **DNS Not Resolving**
   - Check CloudFlare dashboard
   - Verify Railway domain settings
   - Wait for propagation (up to 5 min)

4. **SSL Issues**
   - Railway auto-provisions SSL
   - May take 1-2 minutes after domain add
   - Check Railway domain status

## Integration with Other Agents

| Agent       | Deploy Calls For                          |
| ----------- | ----------------------------------------- |
| @tasks      | Coordinate sandbox deploys for PR testing |
| @cloudflare | DNS updates for new domains               |
| @ops        | Production release coordination           |
