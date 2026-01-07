# Claude Context Recovery Command

Run this at the start of any session to restore full context:

```bash
bd prime
```

Or manually:
```bash
# 1. Get project context
cat .claude/CLAUDE.md

# 2. Get current work
bd ready && bd list --status=in_progress

# 3. Check last session state
bd stats && git log --oneline -5

# 4. Load learnings
cat .claude/LEARNINGS.md | head -100
```

## Quick Context for Autonomous Sessions

**Project:** Villa - Privacy-first passkey auth on Base network
**Stack:** Next.js, TypeScript, Playwright, Porto SDK, Zustand
**Monorepo:** apps/web, apps/developers, packages/sdk, contracts

**Commands:**
- `pnpm dev` - Local development
- `pnpm verify` - Full verification (ALWAYS before push)
- `pnpm test:e2e:chromium` - E2E tests
- `bd ready` - Find available work
- `bd update <id> --status=in_progress` - Claim work
- `bd close <id>` - Complete work

**Deploy Environments:**
- `beta.villa.cash` - Push to main
- `dev-1.villa.cash` / `dev-2.villa.cash` - PR deployments

**Agent Routing:**
- @build (sonnet) - Implementation
- @test (haiku) - Testing
- @ops (haiku) - Deployment
- @explore (haiku) - Code search

**Session Close Protocol:**
```bash
bd sync --flush-only
```
