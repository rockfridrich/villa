# OpenCode Queue — Production Sprint v0.3.0-rc.1

> Paste this to queue work in running OpenCode terminal.
> Run `bd ready` to see what's unblocked.

---

## Currently In Progress

| ID | Task | Status |
|----|------|--------|
| villa-xgy | Settings avatar picker | in_progress @claude-code |

## Recently Closed

| ID | Task |
|----|------|
| villa-4in | Hub redesign |
| villa-1t0 | Health endpoints consistency |
| villa-9ri | API: Hub migration |

---

## Queue Next (ready to start)

### Priority 1: Fix docs deployment (villa-fod)
```
@ops

docs.villa.cash health returns "unknown" version.

1. Check apps/developers/src/app/api/health/route.ts — is BUILD_VERSION populated?
2. Check apps/developers/Dockerfile — are env vars passed at build time?
3. Trigger Railway redeploy: railway up --service developers
4. Verify: curl -s https://docs.villa.cash/api/health | jq .

bd close villa-fod
```

### Priority 2: API separation (villa-izq)
```
@build

Deploy apps/api as api.villa.cash on Railway.

1. Review apps/api/src/index.ts — Hono routes for nicknames, ENS, profiles, health
2. Create apps/api/railway.toml (copy pattern from apps/hub/railway.toml)
3. Create/verify apps/api/Dockerfile (Hono + Bun)
4. Railway dashboard: create new service, connect repo, set domain api.villa.cash
5. Test: curl -s https://api.villa.cash/health | jq .

bd close villa-izq
```

### Priority 3: ENS claiming after avatar done (villa-aih)
> Blocked by villa-xgy (avatar picker)
```
@build

After avatar picker is done, add ENS claiming to settings.

1. In apps/key/src/app/settings/page.tsx:
   - Add "Claim on Base" section
   - Connect wallet button (Porto SDK)
   - Call VillaNicknameResolverV3 at 0x180ddE044F1627156Cac6b2d068706508902AE9C
   - Show gas estimate, confirm, claim status
2. postMessage result to parent

bd close villa-aih
```

---

## Release Gate (villa-9td)

Blocked by: villa-aih (ENS), villa-fod (docs)
(villa-4in hub redesign already closed)

When all done:
```
@ops

bun verify
git tag -a v0.3.0-rc.1 -m "RC1: Settings popup, hub redesign, API separation"
git push origin v0.3.0-rc.1

# Verify all services
curl -s https://villa.cash/api/health | jq .version
curl -s https://key.villa.cash/api/health | jq .version
curl -s https://docs.villa.cash/api/health | jq .version
curl -s https://api.villa.cash/api/health | jq .version

bd close villa-9td villa-p0j
bd sync --flush-only
```

---

## Check Progress

```bash
bd list --status=in_progress  # What's running
bd ready                       # What can start
bd blocked                     # What's waiting
bd stats                       # Overall health
```
