# Villa Production Sprint v0.3.0 — OpenCode Prompt

> Route to @build (parallel agents). Epic: villa-p0j
> Run `bd ready` to see unblocked work. Max parallel execution.

---

## Parallel Wave 1 (no blockers — start ALL simultaneously)

### @build Agent A: Fix settings iframe (villa-bql) — P0 CRITICAL
```
Settings opens new page instead of iframe overlay on docs.villa.cash.

villa.settings() → bridge.open(["settings"]) → iframe to key.villa.cash/settings
Iframe gets blocked/times out → falls back to popup → opens new page

Fix:
1. apps/key/next.config.ts — Ensure X-Frame-Options/CSP allows iframe from any HTTPS origin
2. packages/sdk/src/iframe/bridge.ts — Check iframeDetectionTimeout for settings (may need longer)
3. apps/key/src/app/settings/page.tsx — Verify isInIframe() + postMessage works in both modes
4. Test: villa.settings() on docs.villa.cash opens as overlay, not new page

bun verify && bd close villa-bql
```

### @build Agent B: UI consolidation (villa-j2v)
```
Move hub components to packages/ui as shared library.

1. packages/ui/src/Button.tsx — Merge hub 5 variants (primary/secondary/ghost/outline/destructive)
2. packages/ui/src/Card.tsx — Export Card/CardHeader/CardTitle/CardContent
3. packages/ui/src/Input.tsx — Add error state support (errorMessage prop)
4. packages/ui/src/Avatar.tsx — DiceBear generation + display component
5. packages/ui/src/BottomSheet.tsx — Mobile sheet pattern
6. packages/ui/src/index.ts — Export all new components
7. Source: apps/hub/src/components/ui/ (copy + improve, don't delete yet)

bun verify && bd close villa-j2v
```

### @build Agent C: Mobile accessibility fixes (villa-2bj)
```
1. packages/ui/src/Button.tsx — min-height: 44px on mobile (@media max-width: 640px)
2. apps/hub/src/app/layout.tsx — Change maximumScale: 1 → maximumScale: 5
3. packages/sdk-react/src/VillaButton.tsx — 44px touch target on mobile

bun verify && bd close villa-2bj
```

### @build Agent D: API routes finalization (villa-pe1)
```
Finalize apps/api Hono routes for production:

1. apps/api/src/routes/nicknames.ts — claim, check, resolve, reverse lookup
2. apps/api/src/routes/ens.ts — CCIP-Read gateway, /addr/:name, /name/:address
3. apps/api/src/routes/profiles.ts — Create/update/get profile
4. apps/api/src/routes/health.ts — Version/build/sha/environment
5. Database: Drizzle ORM + shared Postgres connection
6. Middleware: CORS (allow any HTTPS), rate limiting

bun verify && bd close villa-pe1
```

### @ops Agent E: Docs deploy fix (villa-fod)
```
docs.villa.cash health returns unknown version.

1. Fix apps/developers/src/app/api/health/route.ts — populate build metadata at build time
2. Trigger Railway redeploy
3. Verify: curl https://docs.villa.cash/api/health | jq .

bd close villa-fod
```

### @ops Agent F: CI failures + triage (villa-1bh + villa-m6e)
```
1. gh pr list --state open — check 4 failing PRs
2. For each: fix or close with comment
3. bd list --status=open — triage 16 open issues
4. Close stale (>14 days no activity), update active

bd close villa-1bh villa-m6e
```

### @build Agent G: Responsive typography (villa-msd)
```
1. apps/hub/src/app/globals.css — fluid clamp() typography
   - h1: clamp(1.75rem, 4vw, 2.5rem)
   - h2: clamp(1.25rem, 3vw, 1.75rem)
   - body: clamp(0.875rem, 2vw, 1rem)
2. packages/config/tailwind.preset.js — add fontSize scale with fluid values

bun verify && bd close villa-msd
```

---

## Parallel Wave 2 (after Wave 1 unblocks)

### @build Agent H: Settings — nickname editing (villa-omk)
> Blocked by: villa-bql (iframe fix)
```
In settings iframe (apps/key/src/app/settings/page.tsx):

1. Nickname input field with live validation
2. Check availability: fetch /api/nicknames/check/{nickname}
3. Save: POST /api/profile with { address, nickname }
4. postMessage({ type: 'VILLA_SETTINGS_UPDATE', nickname }) to parent
5. Success/error states with warm UI

bun verify && bd close villa-omk
```

### @build Agent I: Hub layout shell (villa-q7c)
> Blocked by: villa-2bj (mobile fixes)
```
New layout for hub app:

1. apps/hub/src/app/layout.tsx — responsive shell
2. Mobile: bottom nav (Home, Settings, Profile) fixed at bottom
3. Desktop: sidebar nav with Villa branding
4. Glass design overlay from @villa/ui glass.css
5. Safe area insets for notch/Dynamic Island

bun verify && bd close villa-q7c
```

### @build Agent J: Hub imports migration (villa-rjx)
> Blocked by: villa-j2v (UI consolidation)
```
1. Replace all imports in apps/hub/src/components/ui/*:
   - import { Button } from "@villa/ui" (not ./button)
   - import { Card, CardHeader } from "@villa/ui"
   - import { Input } from "@villa/ui"
   - import { Avatar } from "@villa/ui"
2. Delete duplicate local component files
3. Update any type imports

bun verify && bd close villa-rjx
```

### @build Agent K: API Railway deployment (villa-l6t)
> Blocked by: villa-pe1 (API routes)
```
1. Create apps/api/railway.toml — service config, healthcheck
2. Create/update apps/api/Dockerfile — Hono + Bun
3. Domain: api.villa.cash
4. Database: connect to shared Railway Postgres
5. Environment variables: DATABASE_URL, NODE_ENV

bd close villa-l6t
```

---

## Parallel Wave 3 (after Wave 2)

### @build Agent L: Settings — avatar picker (villa-xgy)
> Blocked by: villa-omk (nickname)
```
In settings iframe:

1. Avatar style picker: lorelei, adventurer, avataaars, web3
2. Live preview with DiceBear SVG generation
3. Random seed button
4. Save avatar config alongside nickname: POST /api/profile { avatar: { style, seed } }
5. postMessage avatar update to parent

bun verify && bd close villa-xgy
```

### @build Agent M: Hub full redesign (villa-4in)
> Blocked by: villa-j2v + villa-q7c
```
Full redesign of all hub pages using @villa/ui components:

1. apps/hub/src/app/page.tsx — Warm landing, Villa branding, CTA
2. apps/hub/src/app/home/page.tsx — Full-screen dashboard, glass cards, profile display
3. apps/hub/src/app/settings/page.tsx — Full-screen settings using villa.settings() iframe
4. apps/hub/src/app/onboarding/page.tsx — Step-by-step friendly flow
5. All pages: glass.css integration, warm cream tones, mobile-first

bun verify && bd close villa-4in
```

### @build Agent N: Health endpoints + Hub→API migration (villa-1t0 + villa-9ri)
> Blocked by: villa-l6t (API railway)
```
1. Standardize health response across all 4 services:
   { status, version, buildHash, buildTime, sha, environment, uptime }
2. Hub API routes → proxy to api.villa.cash or remove
3. SDK: packages/sdk/src/simple.ts — apiUrl default to https://api.villa.cash

bun verify && bd close villa-1t0 villa-9ri
```

---

## Wave 4 (final)

### @build Agent O: ENS nickname claiming (villa-aih)
> Blocked by: villa-xgy (avatar)
```
In settings iframe:

1. "Claim on Base" button in settings
2. Connect wallet via Porto SDK
3. Call VillaNicknameResolverV3 at 0x180ddE044F1627156Cac6b2d068706508902AE9C
4. Show gas estimate before confirm
5. Claim status: pending → confirmed → success
6. postMessage claim result to parent

bun verify && bd close villa-aih
```

### @ops Agent P: Tag release (villa-9td)
> Blocked by: villa-4in, villa-9ri, villa-aih, villa-fod, villa-1bh
```
All gates passed. Tag release:

bun verify
git tag -a v0.3.0-rc.1 -m "RC1: Settings popup, hub redesign, API separation, UI consolidation"
git push origin v0.3.0-rc.1

Verify all services:
curl -s https://villa.cash/api/health | jq .version
curl -s https://key.villa.cash/api/health | jq .version
curl -s https://docs.villa.cash/api/health | jq .version
curl -s https://api.villa.cash/api/health | jq .version

bd close villa-9td villa-p0j
bd sync --flush-only
```

---

## Dependency Graph

```
Wave 1 (7 parallel):
  villa-bql (iframe fix)     villa-j2v (UI)     villa-2bj (mobile)     villa-pe1 (API routes)     villa-fod (docs)     villa-1bh+m6e (CI+triage)     villa-msd (typography)
       │                         │  │                  │                      │
       ▼                         │  ▼                  ▼                      ▼
Wave 2 (4 parallel):             │
  villa-omk (nickname)     villa-rjx (imports)   villa-q7c (layout)    villa-l6t (API deploy)
       │                         │                    │                   │  │
       ▼                         ▼                    ▼                   ▼  ▼
Wave 3 (3 parallel):
  villa-xgy (avatar)           villa-4in (hub redesign)           villa-1t0+9ri (health+migration)
       │                              │                                │
       ▼                              ▼                                ▼
Wave 4 (2 parallel):
  villa-aih (ENS claim)         villa-9td (tag release) ◄── all gates
```
