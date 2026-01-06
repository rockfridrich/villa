# Session Reflection: 2026-01-06 Profile Persistence

**Session Duration:** ~3 hours
**Goal:** Build profile persistence API for returning users (avatar + nickname)

---

## What Shipped

### Database Integration
- `apps/web/src/lib/db/index.ts` - Connection pool with auto-migration
- `apps/web/src/lib/db/schema.ts` - Profile types
- `apps/web/src/lib/db/migrate.ts` - Migration script

### API Endpoints
- `POST /api/profile` - Create/update profile
- `GET /api/profile/[address]` - Get profile by address
- `GET /api/nicknames/check/[nickname]` - Check availability
- `GET /api/nicknames/reverse/[address]` - Reverse lookup for returning users
- `POST /api/db/migrate` - Migration endpoint with security fix

### Security Fixes
- Removed hardcoded fallback secret in migrate endpoint
- Added constant-time string comparison
- Fail-closed authentication pattern

### Documentation
- Updated LEARNINGS.md with Patterns #30, #32, #33
- Updated `.claude/knowledge/digitalocean.md` with database binding pattern
- Created Data Management agent definition

---

## Root Cause Analysis: DATABASE_URL Issue

**Problem:** DATABASE_URL reset to private hostname after every GitHub deploy

**Timeline:**
1. Manual `doctl apps update` with hardcoded DATABASE_URL worked
2. Next GitHub push reset it to `private-villa-db-...` (VPC-internal)
3. App couldn't connect → CONNECT_TIMEOUT errors
4. ~2 hours debugging envsubst/CI when issue was platform behavior

**Root Cause:** DO App Platform manages env vars. When GitHub triggers deploy, platform overwrites manual env var changes.

**Solution:** Database component binding in app spec:
```yaml
databases:
  - name: villa-db
    cluster_name: villa-db

envs:
  - key: DATABASE_URL
    value: "${villa-db.DATABASE_URL}"  # Platform resolves this
```

---

## Time Lost Analysis

| Issue | Time | Preventable? |
|-------|------|--------------|
| DATABASE_URL debugging | ~2h | Yes - check DO docs at 15 min |
| Invalid postgres.js options | 15m | Yes - check library docs |
| Security review findings | 10m | No - necessary fix |

**Total preventable time:** ~2h 15m (75% of session)

---

## Pattern Extracted: DevOps Time-Box

When infrastructure issue persists after 15 minutes:

```
STOP → ESCALATE → DOCUMENT
```

1. **15 min:** If same error after 2 attempts → try different approach
2. **30 min:** If platform-specific → check official docs, not Stack Overflow
3. **45 min:** If still stuck → minimal repro OR delegate to specialist

---

## What Could Improve

1. **Platform docs first** - Should have searched "digitalocean app platform database connection" immediately
2. **Time-box enforcement** - Needed circuit breaker at 15 min mark
3. **Hypothesis validation** - Assumed envsubst issue without verifying platform behavior

---

## Alignment Check

| Goal | Status |
|------|--------|
| Profile persistence for returning users | Shipped |
| Avatar saved to database | Shipped |
| Nickname persists on return | Shipped |
| Autonomous execution | Partial - asked questions early |

---

## Recommendations

1. Add DevOps time-box to CLAUDE.md as hard rule
2. Create `.claude/checklists/infra-debug.md` with escalation steps
3. Before infra debugging: always search `site:docs.{platform}.com` first

---

*Session ended with all APIs working on beta.villa.cash*
