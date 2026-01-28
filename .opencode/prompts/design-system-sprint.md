# Villa Design System Sprint — OpenCode Prompt

> Route to @build (max parallel). Epic: villa-da7
> Run `bd ready` between waves to see unblocked work.

---

## Wave 1: Tailwind v4 Token Foundation (1 agent)

### @build Agent A: CSS-first design tokens (villa-m8e)
```
Migrate from Tailwind v3 JS config to v4 CSS-first @theme.

Current: packages/config/tailwind.preset.js (JS object with colors, fonts, etc.)
Target: packages/ui/src/theme.css (CSS custom properties via @theme)

1. Create packages/ui/src/theme.css:

@theme {
  /* Cream (backgrounds) */
  --color-cream-50: #fffcf8;
  --color-cream-100: #fef9f0;
  --color-cream-200: #fdf3e0;

  /* Ink (text) */
  --color-ink: #0d0d17;
  --color-ink-light: #45454f;
  --color-ink-muted: #61616b;

  /* Accent */
  --color-accent-yellow: #ffe047;
  --color-accent-green: #698f69;
  --color-accent-brown: #382207;

  /* Villa primary */
  --color-villa-500: #ffe047;
  --color-villa-600: #f5d63d;
  --color-villa-700: #e6c733;

  /* Neutral */
  --color-neutral-50: #f1f1f4;
  --color-neutral-100: #e2e2e8;
  --color-neutral-200: #c5c5d0;
  --color-neutral-300: #a8a8b8;
  --color-neutral-400: #8c8c98;

  /* Status colors */
  --color-error-bg: #fef0f0;
  --color-error-border: #fecaca;
  --color-error-text: #dc2626;
  --color-success-bg: #f0f9f0;
  --color-success-border: #d4e8d4;
  --color-success-text: #698f69;
  --color-warning-bg: #fffbeb;
  --color-warning-border: #ffe047;
  --color-warning-text: #382207;

  /* Typography */
  --font-serif: "DM Serif Display", Georgia, serif;
  --font-sans: "Inter", system-ui, sans-serif;

  /* Spacing */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 20px;

  /* Shadows */
  --shadow-villa: 0 4px 14px 0 rgba(0,0,0,0.05);
  --shadow-villa-lg: 0 10px 40px 0 rgba(0,0,0,0.08);

  /* Glass */
  --glass-blur: blur(20px) saturate(180%);
  --glass-bg: rgba(255, 253, 248, 0.72);
  --glass-bg-heavy: rgba(255, 253, 248, 0.85);
  --glass-border: rgba(0, 0, 0, 0.06);
  --glass-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.12);
}

2. Update packages/ui/src/index.ts — export theme.css
3. Update packages/ui/package.json — add tailwindcss v4 as peer dep
4. Update apps/hub/tailwind.config.ts → app.css with @import "@villa/ui/theme.css"
5. Keep packages/config/tailwind.preset.js as v3 fallback temporarily

bun verify && bd close villa-m8e
```

---

## Wave 2: Component Migrations (3 parallel agents)

### @build Agent B: Glass → Tailwind tokens (villa-i17)
> Blocked by: villa-m8e
```
Convert glass.css hardcoded values to CSS variable references.

Current (hardcoded):
  background: rgba(255, 253, 248, 0.72);
  backdrop-filter: blur(20px) saturate(180%);

Target (token-based):
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);

1. packages/ui/src/glass.css — replace ALL hardcoded RGBA with var(--glass-*)
2. Replace hardcoded cream colors with var(--color-cream-*)
3. Replace hardcoded ink colors with var(--color-ink*)
4. Replace shadow values with var(--shadow-villa*)
5. Replace border-radius with var(--radius-*)
6. Keep @media queries and accessibility fallbacks intact

bun verify && bd close villa-i17
```

### @build Agent C: VillaButton → Tailwind (villa-q10)
> Blocked by: villa-m8e
```
Rewrite VillaButton from inline styles to Tailwind classes.

Current (packages/sdk-react/src/VillaButton.tsx):
  const pillButtonStyle = {
    backgroundColor: "#FFE047",
    color: "#5C4813",
    borderRadius: "9999px",
    boxShadow: "0 4px 12px rgba(255, 224, 71, 0.25)..."
  };

Target:
  <button className={clsx(
    "bg-accent-yellow text-accent-brown rounded-full",
    "shadow-[0_4px_12px_rgba(255,224,71,0.25)]",
    "px-5 py-2.5 font-medium text-sm",
    "hover:bg-villa-600 transition-all duration-150",
    "min-h-11 sm:min-h-9",
    className  // developer override
  )}>

Steps:
1. Add clsx dependency to packages/sdk-react
2. Add @villa/ui as dependency (for theme.css import)
3. Replace ALL inline style objects with Tailwind classes
4. Add className prop to VillaButton component signature
5. 3 states: unsigned (yellow), signed-in (cream glass), loading (spinner)
6. Ensure styles work WITHOUT Tailwind (CSS variables still resolve)

bun verify && bd close villa-q10
```

### @build Agent D: VillaProfile → Tailwind (villa-hdy)
> Blocked by: villa-m8e
```
Rewrite VillaProfile from 9 inline style objects to Tailwind.

Current (packages/sdk-react/src/VillaProfile.tsx):
  9 const style objects: pillButtonStyle, avatarContainerStyle,
  dropdownStyle, menuItemStyle, walletSectionStyle, etc.

Target: All Tailwind classes via clsx(), className prop for overrides.

Steps:
1. Replace pillButtonStyle → Tailwind classes (bg-cream-50, text-ink, rounded-full, shadow-villa)
2. Replace dropdownStyle → Tailwind (absolute right-0 mt-2 bg-cream-50 rounded-xl shadow-villa-lg)
3. Replace menuItemStyle → Tailwind (px-4 py-3 hover:bg-cream-100 transition-colors)
4. Replace walletSectionStyle → Tailwind (bg-ink/[0.03] rounded-lg p-3)
5. Replace all hover state JS (onMouseEnter/Leave) with Tailwind hover: variants
6. Add className prop to VillaProfile
7. Remove ALL const style objects

bun verify && bd close villa-hdy
```

---

## Wave 3: Keyframe Consolidation (1 agent)

### @build Agent E: Deduplicate animations (villa-7tc)
> Blocked by: villa-i17
```
Animations defined in TWO places:
  1. packages/ui/src/glass.css — glass-animate-in/out, glass-slide-up
  2. packages/sdk/src/iframe/bridge.ts — villa-spin, villa-pulse, villa-scale-in/out, villa-slide-up, villa-shimmer

Consolidate:
1. Move ALL @keyframes to packages/ui/src/theme.css (or theme-animations.css)
2. Name consistently: villa-fade-in, villa-fade-out, villa-slide-up, villa-spin, villa-pulse, villa-shimmer
3. In glass.css: remove @keyframes, reference by name only
4. In bridge.ts: remove injected <style> keyframes, inject @import or minimal CSS that references shared keyframes
5. Export animation utility classes: .villa-animate-in, .villa-animate-out, .villa-slide-up

bun verify && bd close villa-7tc
```

---

## Wave 4: Bridge + Publish (2 parallel agents)

### @build Agent F: Bridge overlay → CSS classes (villa-sif)
> Blocked by: villa-m8e + villa-7tc
```
Replace Object.assign(container.style, {...}) with CSS class injection.

Current (packages/sdk/src/iframe/bridge.ts):
  Object.assign(container.style, {
    backdropFilter: "blur(20px) saturate(180%)",
    backgroundColor: "rgba(255, 253, 248, 0.72)",
    ...
  });

Target: Inject a <style> block with classes using CSS variables:
  .villa-overlay {
    backdrop-filter: var(--glass-blur);
    background: var(--glass-bg);
    ...
  }
  container.classList.add('villa-overlay');

Steps:
1. Create injectVillaStyles() — injects <style> once with all overlay classes
2. Classes: .villa-overlay, .villa-overlay-mobile, .villa-iframe-card, .villa-loading
3. All values use CSS custom properties (--glass-*, --color-*, --radius-*, --shadow-*)
4. Developers can override: :root { --glass-blur: blur(10px); } changes everything
5. Remove ALL Object.assign(*.style, {...}) calls
6. Keep animation references from Wave 3

bun verify && bd close villa-sif
```

### @build Agent G: Publish @villa/theme (villa-7pe)
> Blocked by: villa-m8e + villa-i17
```
Publish theme as npm package for external developers.

1. Create packages/theme/package.json:
   name: @rockfridrich/villa-theme
   main: dist/theme.css
   exports: { ".": "./dist/theme.css", "./glass": "./dist/glass.css" }

2. packages/theme/src/theme.css — @import from packages/ui/src/theme.css
3. packages/theme/src/glass.css — @import from packages/ui/src/glass.css
4. Build: copy + bundle CSS files to dist/
5. Update root package.json scripts: add theme:build, theme:publish
6. README: Usage for developers:
   @import '@rockfridrich/villa-theme';
   @import '@rockfridrich/villa-theme/glass';
   /* Override: */
   :root { --color-accent-yellow: #your-brand-color; }

bun verify && bd close villa-7pe
```

---

## Wave 5: Developer Experience (2 parallel agents)

### @build Agent H: Theming docs (villa-var)
> Blocked by: villa-7pe + villa-q10
```
Add theming documentation to docs.villa.cash/sdk.

1. apps/developers/src/app/sdk/page.tsx — add "Theming" section:
   - Install: bun add @rockfridrich/villa-theme
   - Import: @import '@rockfridrich/villa-theme'
   - Override: CSS variable list with descriptions
   - className prop: <VillaButton className="your-tailwind-classes" />
   - Examples: dark mode, custom brand colors, compact mode

bun verify && bd close villa-var
```

### @build Agent I: Theme playground (villa-94q)
> Blocked by: villa-var + villa-hdy
```
Live theme editor on playground page.

1. apps/developers/src/app/playground/page.tsx — add "Theme" tab
2. CSS variable sliders/inputs: colors (color picker), radius (range), blur (range)
3. Live preview: VillaButton + VillaProfile update in real-time
4. Export: "Copy CSS" button generates :root override block
5. Presets: "Villa Default", "Dark Mode", "Minimal", "Rounded"

bun verify && bd close villa-94q
```

---

## After All Waves

```bash
bd close villa-da7  # Close epic
bd sync --flush-only
bun verify
```

---

## Dependency Graph

```
Wave 1 (1):     m8e (tokens)
                 │ │ │
Wave 2 (3):     i17  q10  hdy     (parallel)
                 │    │    │
Wave 3 (1):     7tc   │    │
                 │    │    │
Wave 4 (2):     sif  7pe   │      (parallel)
                      │    │
Wave 5 (2):          var  94q     (parallel)
```
