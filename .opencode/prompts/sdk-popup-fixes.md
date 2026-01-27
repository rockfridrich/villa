# SDK Popup Fixes — Build Prompt

> Paste this into OpenCode. Route to @build.
> Beads: villa-184 → villa-5qc → villa-kle

Execute these 3 beads in order. Each has a detailed spec below.

## Bead A: Nickname Generator — Vietnam Animals

**Bead:** `villa-184`
**File:** `packages/sdk/src/nickname-generator.ts`

1. Replace `NOUNS` array (lines 34-65) with `VIETNAM_ANIMALS`:
   Copy from `apps/key/src/lib/nickname.ts` — buffalo, pangolin, macaque, langur, loris, civet, deer, otter, crane, pheasant, python, gecko, turtle, egret, heron, peacock, gibbon, muntjac, serow, gaur, leopard, tiger, elephant, rhino, bear, dolphin, dugong, hornbill, kingfisher, ibis

2. Replace `ADJECTIVES` array (lines 1-32) to match key app:
   swift, gentle, brave, calm, keen, bold, wise, free, wild, bright, noble, proud, quick, sure, true, agile, clever, fierce, lucky, merry, nimble, silent, steady, strong, vivid, golden, misty, sunny, serene, radiant

3. Update `generateNickname()` to use `VIETNAM_ANIMALS` instead of `NOUNS`
4. Keep `getAvailableNouns()` function name (backward compat), return `VIETNAM_ANIMALS`

**Verify:** `bun verify` passes
**Done:** `bd close villa-184`

---

## Bead B: Settings Popup

**Bead:** `villa-5qc`

### B1. Route to /settings (bridge.ts)

**File:** `packages/sdk/src/iframe/bridge.ts`

- Add `private readonly settingsUrl: string;` property (after line 85)
- In constructor: `this.settingsUrl = this.authUrl.replace('/auth', '/settings');`
- Add optional `params?: Record<string, string>` to `open()` method signature
- In `createIframe()`: if `scopes.includes("settings")`, use `this.settingsUrl` instead of `this.authUrl`. Append `params` as query params.
- In `openPopup()`: same routing logic

### B2. Pass address (simple.ts)

**File:** `packages/sdk/src/simple.ts`

- Line 213: `bridge.open(["settings"], { address: _user!.address })` instead of `bridge.open(["settings"])`

### B3. Iframe support for settings page

**File:** `apps/key/src/app/settings/page.tsx`

- Add `isInIframe()` helper (same as auth page: `window.self !== window.top`)
- Update `postToParent` to work in both iframe AND popup modes:
  - Check `inIframe` alongside `inPopup`
  - Use `window.parent` for iframe, `window.opener` for popup

**Verify:** `bun verify` passes
**Done:** `bd close villa-5qc`

---

## Bead C: Frosted Glass Overlay

**Bead:** `villa-kle`
**File:** `packages/sdk/src/iframe/bridge.ts`

### Desktop backdrop (createContainer, line 508-515):
- `rgba(0, 0, 0, 0.5)` → `rgba(255, 253, 248, 0.72)`
- `blur(12px)` → `blur(20px) saturate(180%)`
- Update both `backdropFilter` and `WebkitBackdropFilter`

### Close animation (close method, ~line 300-330):
- Match reverse: `rgba(255, 253, 248, 0)` and `blur(0px) saturate(100%)`

### Loading overlay (createLoadingOverlay, line 623):
- `backgroundColor: "#FFFDF8"` → `"rgba(255, 253, 248, 0.85)"`

### Shadows (lines 632, ~757):
- `0 25px 50px -12px rgba(0, 0, 0, 0.25)` → `0 20px 40px -12px rgba(0, 0, 0, 0.12)`
- `0 0 0 1px rgba(0, 0, 0, 0.05)` → `0 0 0 1px rgba(0, 0, 0, 0.04)`

### Logo glow (line 646):
- `0 8px 24px rgba(245, 208, 48, 0.35)` → `0 4px 16px rgba(245, 208, 48, 0.2)`

**Verify:** `bun verify` passes, then `bun build`
**Done:** `bd close villa-kle`

---

After all 3: `bun verify && bun build` from repo root.
Then: `bd sync --flush-only`
