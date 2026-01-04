# Reflection: CloudFlare Infrastructure & SDK-First Architecture

**Date:** 2026-01-04
**Phase:** Infrastructure Setup
**Duration:** ~3 hours

## Velocity Metrics

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Commits | 8 | - | - |
| Deploy failures | 10 | 0 | ❌ |
| Pivots | 3 | 0-1 | ❌ |
| Knowledge files created | 2 | - | ✅ |
| SDK modules created | 2 | - | ✅ |

## What Went Well

1. **SDK-First Approach Adopted**
   - Created `src/lib/infra/cloudflare.ts` with typed API wrapper
   - CLI tool `npm run infra` for all CloudFlare operations
   - Removed 4 bash scripts with curl calls

2. **Knowledge Base Established**
   - `.claude/knowledge/cloudflare.md` with patterns and learnings
   - `.claude/knowledge/digitalocean.md` with doctl quirks documented
   - Manifesto created defining AI-Human collaboration principles

3. **CDN Successfully Enabled**
   - All production domains now behind CloudFlare CDN
   - SSL/TLS, caching, and security settings configured
   - Auto-purge on deploy integrated into CI

## What Slowed Us Down

### 1. Domain Verification Loop (45 min)
**Problem:** DO couldn't verify domains through CF proxy
**Root cause:** CloudFlare proxy intercepts verification requests
**Solution found:** Temporarily disable proxy → verify → re-enable
**Learning captured:** Yes, in cloudflare.md

### 2. WWW CNAME Misconfiguration (20 min)
**Problem:** www.villa.cash returning 404
**Root cause:** CNAME pointed to villa.cash instead of DO app URL
**Solution:** Point www directly to villa-production-xxx.ondigitalocean.app
**Learning captured:** Yes, in cloudflare.md

### 3. Multiple CI Failures (30 min total)
**Problems:**
- doctl `--format` returning `<nil>` for nested fields
- `doctl apps get` returns array, not object
- Double `https://` in URLs
- 403 permission errors on commit comments

**Root cause:** Undocumented doctl API quirks
**Learning captured:** Yes, in digitalocean.md

## Manifesto Compliance Audit

| Principle | Status | Notes |
|-----------|--------|-------|
| Repo as Single Source of Truth | ✅ | All config in repo |
| Knowledge Accumulation | ⚠️ | 2/5 knowledge files created |
| SDK-First Integration | ⚠️ | CloudFlare done, DO still uses doctl |
| Agent-Optimized Context | ✅ | Quick reference sections in knowledge |
| Secure Delegation | ✅ | Tokens in secrets, not code |
| Progressive Disclosure | ✅ | Layered knowledge structure |
| Feedback Loops | ✅ | Learnings captured after errors |

### Missing Knowledge Files
- [ ] `porto.md` - Passkey SDK patterns
- [ ] `ci-cd.md` - Deployment patterns
- [ ] `testing.md` - E2E, unit test patterns

### Missing SDK Wrappers
- [ ] `digitalocean.ts` - Still using doctl CLI

## Environment Status

| Environment | Domain | DO App | DNS | CDN | Status |
|-------------|--------|--------|-----|-----|--------|
| Production | villa.cash | ✅ | ✅ | ✅ | Working |
| Production | www.villa.cash | ✅ | ✅ | ✅ | Working |
| Staging | beta.villa.cash | ✅ | ✅ | ✅ | Working |
| Preview 1 | dev-1.villa.cash | ❌ | ❌ | ❌ | **Missing** |
| Preview 2 | dev-2.villa.cash | ✅ | ✅ | ✅ | Working |
| Local | dev-3.villa.cash | N/A | ❌ | N/A | **Missing** |

## Recommendations

### Immediate (This Session)
1. **Create dev-1 environment** - DO app + DNS record
2. **Create ngrok setup script** - For dev-3.villa.cash local tunnel
3. **Test all preview slots** - Ensure PR workflow works

### Short-term
1. **Create DigitalOcean SDK** - Replace doctl with typed wrapper
2. **Add missing knowledge files** - porto.md, ci-cd.md, testing.md
3. **Add retry logic** - Domain verification can be flaky

### Medium-term
1. **CloudFlare redirect rules** - Need token with ruleset permissions
2. **Monitoring dashboard** - Track CDN hit rates, errors
3. **Cost alerting** - Monitor DO and CF usage

## Security Checklist

- [x] API tokens in GitHub Secrets, not in code
- [x] SSL/TLS set to Full mode
- [x] Always HTTPS enforced
- [x] Minimum TLS 1.2
- [x] Production protected by release tags
- [ ] Rate limiting on API endpoints (todo)
- [ ] WAF rules (optional, if needed)

## Token Efficiency Analysis

| Task | Tokens (est) | Could Improve? |
|------|--------------|----------------|
| Initial CF setup | ~15k | SDK reduced curl debugging |
| Domain verification | ~20k | Knowledge base will help next time |
| WWW fix | ~5k | Learning captured |
| Reflection | ~3k | Template helped |

**Total estimate:** ~43k tokens
**Target:** <50k ✅

## Action Items

1. [ ] Create dev-1.villa.cash environment
2. [ ] Create ngrok setup script for dev-3
3. [ ] Verify all environments working
4. [ ] Commit reflection
