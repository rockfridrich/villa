# Reflection: Docker Local Development Setup
**Date:** 2026-01-09  
**Duration:** ~2-3 hours  
**Commits:** 4 (ae6482e, eee8098, 903aedf, bde9211)

---

## Summary

Set up Docker-based local development for Next.js monorepo with HTTPS support for passkey testing. Encountered 4 major issues due to missing environment discovery phase:

1. BuildKit dependency (user has standalone docker-compose)
2. OOM kills during compilation (needed 6GB for monorepo)
3. Turbo exits after compile (use `pnpm dev` directly)
4. SDK redirect to beta-key.villa.cash (needed localhost config)

**Result:** Working, but with 90 minutes of token waste that could have been avoided.

---

## Token Efficiency Analysis

| Phase | Time | Should Have Been | Waste |
|-------|------|------------------|-------|
| BuildKit iteration | 20 min | 2 min (check first) | 18 min |
| OOM debugging | 25 min | 5 min (research) | 20 min |
| Turbo behavior | 20 min | 5 min (research) | 15 min |
| SDK localhost config | 25 min | 10 min (test auth) | 15 min |
| **Total** | **90 min** | **22 min** | **68 min** |

**Estimated Token Waste:** ~2000 tokens (at 30 tokens/min orchestration)

---

## Root Causes

### 1. No Environment Discovery Phase
**Missing:** Pre-flight checks for Docker version, BuildKit support, available memory

**Should Have Run:**
```bash
docker version
docker-compose version
docker buildx version 2>/dev/null
docker info | grep "Total Memory"
```

**Impact:** 2 commits to fix BuildKit and memory issues

---

### 2. No Knowledge Base for User Environment
**Missing:** `.claude/knowledge/docker-local-dev.md` with:
- User has standalone docker-compose (not V2 plugin)
- User prefers Docker for local dev (matches production)
- Previous issues with Docker memory limits

**Impact:** Had to rediscover environment constraints

**Fixed:** Created knowledge base with user's setup details

---

### 3. Insufficient Research Before Implementation
**Missing:** 
- "Next.js monorepo Docker memory requirements" → 4-8GB standard
- "Turbo dev mode in Docker" → exits after compile
- "pnpm workspace hot reload Docker" → mount source, not node_modules

**Impact:** Iterative debugging instead of one-shot solution

---

### 4. No End-to-End Testing
**Missing:** Full auth flow test after "Docker working"

**Should Have Done:**
```bash
# After docker-compose up:
1. Open https://localhost
2. Click "Sign in"
3. Verify stays on localhost (doesn't redirect)
4. Test passkey creation
```

**Impact:** 2 additional commits for SDK localhost config

---

## Anti-Patterns Detected

### Pattern: Assumed Modern Docker Setup
```
❌ Used BuildKit cache mounts without checking support
❌ Assumed Docker Compose V2 plugin
❌ Used "docker compose" syntax (fails on standalone)
```

### Pattern: Iterative Memory Tuning
```
❌ Try 4GB → OOM
❌ Try 6GB → OOM
❌ Never researched monorepo requirements first
```

### Pattern: Missing Documentation Context
```
❌ No knowledge base for user-specific environment
❌ Had to rediscover constraints each session
❌ User frustration: "forget of context"
```

### Pattern: Incomplete Testing
```
❌ Declared "Docker working" after `docker-compose up` succeeded
❌ Didn't test actual auth flow
❌ Found SDK issues later
```

---

## What Worked Well

1. **Caddy for HTTPS** - Simple, self-signed cert solution for local passkey testing
2. **Volume mounts** - Hot reload without full rebuilds
3. **Structured Dockerfile** - Clear separation of dependencies and source
4. **User feedback** - "Use docker always for local" made requirements clear

---

## Learnings Applied

### Added to LEARNINGS.md

**Pattern #63:** Docker Environment Pre-Check
- Check docker-compose version (standalone vs V2)
- Check BuildKit support before using cache mounts
- Research memory requirements for stack

**Pattern #64:** Turbo Behavior in Docker
- `turbo run dev` exits after compile
- Use `pnpm dev` directly for watch mode
- Reserve turbo for CI/CD one-shot builds

### Added to Knowledge Base

**File:** `.claude/knowledge/docker-local-dev.md`
- User's Docker setup (standalone compose, no BuildKit)
- Memory requirements (6GB for monorepo)
- Known issues (turbo exits, SDK localhost)
- Pre-flight checklist

---

## Recommendations for Future Sessions

### Before Writing Dockerfiles

1. **Environment Discovery (5 min):**
   ```bash
   docker version
   docker-compose version
   docker buildx version 2>/dev/null
   docker info | grep "Total Memory"
   ```

2. **Research Phase (10 min):**
   - "Next.js [version] Docker memory requirements"
   - "[Tool] behavior in Docker containers"
   - "pnpm workspace Docker hot reload"

3. **Documentation Check (2 min):**
   - Check `.claude/knowledge/docker-local-dev.md` for user setup
   - Check LEARNINGS.md for Docker patterns

4. **Implementation (15 min):**
   - Write Dockerfile based on environment constraints
   - No BuildKit if not supported
   - Use researched memory limits

5. **End-to-End Testing (10 min):**
   - Full startup → hot reload → auth flow
   - Not just "container started"

**Total Time:** 42 minutes (vs 150 minutes actual)

---

## Immediate Actions Completed

- [x] Created `.claude/knowledge/docker-local-dev.md`
- [x] Added Pattern #63 (Docker Pre-Check) to LEARNINGS.md
- [x] Added Pattern #64 (Turbo in Docker) to LEARNINGS.md
- [x] Documented user's environment (standalone docker-compose, 6GB memory)

---

## Grade: C-

**Positives:**
+ Eventually working solution
+ Created comprehensive documentation for future
+ User requirement met (Docker-based local dev)

**Negatives:**
- 68 minutes of avoidable waste
- Missing environment discovery phase
- Iterative debugging instead of research-first
- High user frustration ("forget of context")

**Key Takeaway:** "Measure twice, cut once" applies to Docker too. 5 minutes of environment checks + 10 minutes of research = saves 60+ minutes of iteration.

---

## Cost Impact

**Session Cost:**
- Orchestrator time: 90 min × 30 tokens/min = 2700 tokens
- Estimated cost: ~$0.40 (at Opus rates)

**If Pattern Applied:**
- Orchestrator time: 22 min × 30 tokens/min = 660 tokens
- Estimated cost: ~$0.10

**Savings if pattern followed:** 75% reduction ($0.30 per Docker setup)

**Annual impact (if pattern repeated 10x/year):** $3.00 waste

---

*This reflection serves as a template for future Docker/infrastructure work.*
