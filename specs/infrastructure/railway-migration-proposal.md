# Railway Migration Proposal

**Status:** Proposed  
**Created:** 2026-01-22  
**Author:** Infrastructure Team

---

## Executive Summary

After weeks of debugging DigitalOcean App Platform deployment issues (Docker builds, buildpack compatibility, preview environments), we propose migrating to Railway for improved developer experience, cost optimization, and reduced operational overhead.

**Key Benefits:**

- Usage-based pricing (pay for actual compute, not provisioned)
- Native monorepo/Turborepo support
- Built-in preview environments for PRs
- Better observability and real-time logs
- Simpler configuration (no buildpack issues)

**Estimated Savings:** 40-65% reduction in infrastructure costs

---

## Current Pain Points with DigitalOcean

### 1. Build & Deployment Issues

| Issue                                 | Impact             | Time Spent |
| ------------------------------------- | ------------------ | ---------- |
| Docker build failures                 | Blocked releases   | ~2 weeks   |
| Buildpack compatibility (pnpm vs bun) | Manual fixes       | ~1 week    |
| Slow build times (~10-15 min)         | Developer friction | Ongoing    |
| No native Nixpacks/buildpack for Bun  | Workarounds needed | ~3 days    |

### 2. Preview Environment Complexity

- Required manual dev-1/dev-2 slot management
- $10/month for rarely-used preview apps
- Complex GitHub Actions workflow (700+ lines)
- No automatic PR environment cleanup

### 3. Limited Observability

- Basic logs with 7-day retention
- No real-time log streaming
- Manual health check debugging
- No integrated metrics dashboard

### 4. Configuration Drift

- Multiple `.do/app-*.yaml` files to maintain
- Environment variable sync issues
- Secret rotation complexity

---

## Railway Advantages

### 1. Pricing Model (Usage-Based)

| Resource | Railway Price      | DO App Platform    |
| -------- | ------------------ | ------------------ |
| Memory   | $0.000386/GB/sec   | Fixed per instance |
| CPU      | $0.000772/vCPU/sec | Fixed per instance |
| Egress   | $0.05/GB           | Included           |
| Volumes  | $0.00006/GB/sec    | Not supported      |

**Key Insight:** Railway only charges for active compute time. DO charges for provisioned instances 24/7.

#### Cost Projection for Villa

| Environment            | DO Current    | Railway Estimated |
| ---------------------- | ------------- | ----------------- |
| Production (basic-xs)  | $12/month     | ~$8/month         |
| Staging (basic-xxs)    | $5/month      | ~$3/month         |
| Developers (basic-xxs) | $5/month      | ~$2/month         |
| **Total**              | **$22/month** | **~$13/month**    |

**Savings:** ~40% ($9/month)

With Railway's serverless sleep feature (services sleep after 10min inactivity):

- Staging could drop to ~$1/month (mostly idle)
- Total could be **~$10/month** (55% savings)

### 2. Native Monorepo Support

Railway automatically detects and supports:

- **Turborepo** - Uses turbo.json for build optimization
- **Bun** - First-class runtime support
- **Next.js** - Standalone output mode
- **Nixpacks** - Automatic detection, no Dockerfile needed

```toml
# railway.toml (simple config)
[build]
builder = "nixpacks"

[deploy]
startCommand = "bun run start"
healthcheckPath = "/api/health"
```

### 3. Preview Environments (Built-in)

Railway creates automatic preview environments for every PR:

- Zero configuration required
- Unique URLs per PR
- Automatic cleanup on merge/close
- Shared database connections supported

**Comparison:**
| Feature | DO App Platform | Railway |
|---------|-----------------|---------|
| PR Previews | Manual GH Actions setup | Built-in |
| Cleanup | Manual or GH Actions | Automatic |
| Config | 100+ lines YAML | 0 lines |
| Cost | Fixed per slot | Usage-based |

### 4. Observability

| Feature            | DO App Platform | Railway        |
| ------------------ | --------------- | -------------- |
| Real-time logs     | No              | Yes            |
| Log retention      | 7 days          | 7-30 days      |
| Structured logging | No              | Yes            |
| Log filtering      | No              | Yes            |
| Metrics dashboard  | Basic           | Comprehensive  |
| Webhooks           | No              | Yes            |
| Alerts             | No              | Yes (Pro plan) |

### 5. Developer Experience

| Feature        | DO App Platform | Railway                   |
| -------------- | --------------- | ------------------------- |
| Dashboard      | Traditional     | Real-time canvas          |
| Deploy time    | 10-15 min       | 2-5 min                   |
| Rollbacks      | Manual          | One-click                 |
| CLI            | doctl (limited) | railway (full-featured)   |
| Local dev      | Separate setup  | `railway run` integration |
| Config as code | YAML only       | TOML/JSON                 |

---

## Railway Best Practices (Applied to Villa)

Based on [Railway Best Practices](https://docs.railway.com/overview/best-practices):

### 1. Private Networking

```toml
# Use private networking between services
# Reference: ${{api.RAILWAY_PRIVATE_DOMAIN}}
```

- Services communicate internally without egress costs
- Faster latency between services
- No public exposure for internal APIs

### 2. Related Services in Same Project

```
villa-project/
├── hub (Next.js app)
├── developers (docs portal)
├── postgres (database)
└── redis (cache, future)
```

- Shared private network
- Variable referencing between services
- Single project view

### 3. Reference Variables

```bash
# Instead of hardcoding:
DATABASE_URL=postgres://user:pass@host:5432/db

# Use reference variables:
DATABASE_URL=${{postgres.DATABASE_URL}}
NEXT_PUBLIC_API_URL=https://${{hub.RAILWAY_PUBLIC_DOMAIN}}
```

---

## Migration Plan

### Phase 1: Staging Environment (Week 1)

1. **Create Railway project**

   ```bash
   railway login
   railway init villa-staging
   ```

2. **Deploy hub app**

   ```bash
   railway link
   railway up --service hub
   ```

3. **Configure environment variables**
   - Import from DO via Railway dashboard
   - Set up reference variables

4. **Configure custom domain**
   - `beta.villa.cash` → Railway service domain
   - Update CloudFlare CNAME

5. **Verify**
   - Health checks pass
   - SDK integration works
   - Auth flow functional

### Phase 2: Developers Portal (Week 1)

1. Deploy `apps/developers` to Railway
2. Configure `developers.villa.cash` domain
3. Verify CLAUDE.txt accessible

### Phase 3: Production (Week 2)

1. **Blue-green deployment**
   - Keep DO production running
   - Deploy to Railway production
   - Test thoroughly

2. **DNS cutover**
   - Update `villa.cash` CNAME to Railway
   - Monitor for 24 hours

3. **Decommission DO**
   - Delete DO apps after 1 week stable

### Phase 4: Cleanup (Week 3)

1. Delete `.do/` directory
2. Simplify GitHub Actions (remove DO deploy jobs)
3. Update documentation
4. Archive DO-specific configs

---

## Configuration Changes

### Current (DigitalOcean)

```
.do/
├── app-production.yaml (55 lines)
├── app-staging.yaml (52 lines)
├── app-developers.yaml (43 lines)
└── app.yaml (45 lines)

.github/workflows/deploy.yml (500+ lines)
```

### Proposed (Railway)

```
railway.toml (20 lines)
.github/workflows/deploy.yml (~50 lines, optional)
```

### railway.toml Example

```toml
[build]
builder = "nixpacks"
buildCommand = "bun install && bun run build"

[deploy]
startCommand = "bun run start"
healthcheckPath = "/api/health"
healthcheckTimeout = 30
restartPolicyType = "ON_FAILURE"

[[services]]
name = "hub"
rootDir = "apps/hub"

[[services]]
name = "developers"
rootDir = "apps/developers"
```

---

## Risk Assessment

### Low Risk

- Railway is production-ready (SOC 2 compliant)
- Easy rollback (keep DO running during migration)
- No code changes required

### Medium Risk

- DNS propagation during cutover (~24 hours)
- Learning curve for Railway CLI/dashboard

### Mitigations

- Blue-green deployment strategy
- Keep DO running for 1 week post-migration
- Document Railway commands in CLAUDE.md

---

## Decision Matrix

| Criteria             | Weight | DO Score | Railway Score |
| -------------------- | ------ | -------- | ------------- |
| Build reliability    | 25%    | 3/10     | 9/10          |
| Cost efficiency      | 20%    | 5/10     | 9/10          |
| Developer experience | 20%    | 4/10     | 9/10          |
| Preview environments | 15%    | 3/10     | 10/10         |
| Observability        | 10%    | 4/10     | 8/10          |
| Documentation        | 10%    | 6/10     | 8/10          |
| **Weighted Total**   | 100%   | **3.95** | **9.05**      |

---

## Recommendation

**Migrate to Railway.**

The combination of:

1. Usage-based pricing (40-65% cost savings)
2. Native monorepo support (eliminates buildpack issues)
3. Built-in preview environments (simplifies CI/CD)
4. Better observability (faster debugging)

...makes Railway significantly better suited for Villa's needs.

### Immediate Next Steps

1. [ ] Create Railway account with Pro plan ($20/month minimum)
2. [ ] Deploy staging environment as proof-of-concept
3. [ ] Validate SDK integration works
4. [ ] Document migration runbook
5. [ ] Schedule production cutover

---

## Appendix: Useful Links

- [Railway vs DigitalOcean Comparison](https://docs.railway.com/maturity/compare-to-digitalocean)
- [Railway Best Practices](https://docs.railway.com/overview/best-practices)
- [Railway Pricing](https://railway.com/pricing)
- [Railway CLI Reference](https://docs.railway.com/reference/cli-api)
- [Railway Templates](https://railway.com/deploy)

---

## Approval

| Role          | Name | Date | Approved |
| ------------- | ---- | ---- | -------- |
| Lead Engineer |      |      | [ ]      |
| DevOps        |      |      | [ ]      |
| Product       |      |      | [ ]      |
