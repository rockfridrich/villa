# SDK Package Architecture - Minimize Updates Strategy

## Problem Statement

The current SDK architecture has several issues that force unnecessary version bumps:

1. **Hardcoded URLs** - API URLs baked into build (simple.ts, bridge.ts)
2. **Version coupling** - SDK and SDK-React always bump together
3. **No runtime config** - Critical settings can't be changed without rebuild
4. **Manual publish process** - Workflow failed due to bun/npm mismatch

## Architectural Principles

### 1. Separate Concerns by Update Frequency

```
┌─────────────────────────────────────────────────────────────────┐
│                   UPDATE FREQUENCY SPECTRUM                      │
├─────────────────────────────────────────────────────────────────┤
│ NEVER CHANGE          RARELY CHANGE         FREQUENTLY CHANGE   │
│ (Core Protocol)       (Business Logic)      (Configuration)     │
│                                                                  │
│ • Type definitions    • Auth flow           • API URLs          │
│ • Message schema      • Bridge logic        • Feature flags     │
│ • Contract ABIs       • Session mgmt        • UI text           │
│ • Crypto utilities    • Error handling      • Avatar styles     │
│                                                                  │
│ ▼ BUNDLE IN SDK       ▼ BUNDLE IN SDK       ▼ FETCH AT RUNTIME  │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Runtime Configuration Strategy

**Current Problem:**

```typescript
// simple.ts - HARDCODED, requires SDK version bump to change
const API_URL = "https://villa.cash";
```

**Proposed Solution - Config Manifest:**

```typescript
// SDK fetches config from well-known URL at runtime
const CONFIG_MANIFEST_URL = "https://villa.cash/.well-known/villa-config.json";

// villa-config.json (server-side, no SDK update needed)
{
  "version": 1,
  "endpoints": {
    "hub": "https://villa.cash",
    "key": "https://key.villa.cash",
    "docs": "https://docs.villa.cash"
  },
  "features": {
    "socialLookup": true,
    "claimNickname": false
  },
  "avatarStyles": ["lorelei", "bottts", "adventurer"],
  "minSDKVersion": "0.2.0"
}
```

### 3. Package Split Strategy

**Current Structure (Tightly Coupled):**

```
@rockfridrich/villa-sdk        # Everything
@rockfridrich/villa-sdk-react  # Depends on villa-sdk
```

**Proposed Structure (Layered Independence):**

```
@rockfridrich/villa-core       # Types, schemas, crypto (STABLE)
  └── Never changes unless protocol changes
  └── Zero runtime deps
  └── ~5KB minified

@rockfridrich/villa-sdk        # Auth, bridge, client (BUSINESS)
  └── Depends on villa-core
  └── Runtime config fetch
  └── ~30KB minified

@rockfridrich/villa-sdk-react  # React hooks (FRAMEWORK)
  └── Depends on villa-sdk
  └── Framework-specific
  └── ~10KB minified
```

**Benefits:**

- Breaking type change = bump villa-core (rare)
- Auth flow change = bump villa-sdk (occasional)
- React hook change = bump villa-sdk-react (independent)

---

## Implementation Plan

### Phase 1: Runtime Config System [villa-cfg]

**Create server-side config manifest:**

```typescript
// apps/hub/public/.well-known/villa-config.json
{
  "version": 1,
  "schemaVersion": "2024-01",
  "endpoints": {
    "production": {
      "hub": "https://villa.cash",
      "key": "https://key.villa.cash",
      "api": "https://villa.cash/api"
    },
    "staging": {
      "hub": "https://construction.villa.cash",
      "key": "https://key.villa.cash",
      "api": "https://construction.villa.cash/api"
    }
  },
  "chains": {
    "production": { "id": 8453, "name": "Base" },
    "staging": { "id": 84532, "name": "Base Sepolia" }
  },
  "features": {
    "claimNickname": false,
    "socialLookup": true,
    "avatarUpload": true
  },
  "contracts": {
    "nicknameResolver": "0x180ddE044F1627156Cac6b2d068706508902AE9C",
    "recoverySigner": "0xdFb55a363bdF549EE5C2e77D0aAaC39068ED5836"
  },
  "ui": {
    "avatarStyles": ["lorelei", "bottts", "adventurer", "thumbs"],
    "defaultAvatarStyle": "lorelei"
  },
  "sdk": {
    "minVersion": "0.2.0",
    "deprecatedMethods": []
  }
}
```

**SDK fetches config on init:**

```typescript
// packages/sdk/src/config-loader.ts
const CONFIG_URL = "https://villa.cash/.well-known/villa-config.json";
const CONFIG_CACHE_MS = 5 * 60 * 1000; // 5 min cache

let cachedConfig: VillaConfig | null = null;
let cacheTime = 0;

export async function loadConfig(): Promise<VillaConfig> {
  const now = Date.now();
  if (cachedConfig && now - cacheTime < CONFIG_CACHE_MS) {
    return cachedConfig;
  }

  try {
    const res = await fetch(CONFIG_URL);
    cachedConfig = await res.json();
    cacheTime = now;
    return cachedConfig;
  } catch {
    // Fallback to hardcoded defaults (last resort)
    return DEFAULT_CONFIG;
  }
}
```

**Files to modify:**

- `apps/hub/public/.well-known/villa-config.json` (CREATE)
- `packages/sdk/src/config-loader.ts` (CREATE)
- `packages/sdk/src/simple.ts` (MODIFY - use config loader)
- `packages/sdk/src/iframe/bridge.ts` (MODIFY - use config loader)

### Phase 2: Package Independence [villa-pkg]

**Decouple version publishing:**

```yaml
# .github/workflows/sdk-publish.yml
name: SDK Publish

on:
  push:
    tags:
      - "sdk-v*" # Main SDK: sdk-v0.2.1
      - "sdk-react-v*" # React only: sdk-react-v0.2.1
      - "sdk-core-v*" # Core only: sdk-core-v0.2.1

jobs:
  detect-package:
    outputs:
      package: ${{ steps.detect.outputs.package }}
    steps:
      - id: detect
        run: |
          if [[ "${{ github.ref }}" == *"sdk-react-v"* ]]; then
            echo "package=sdk-react" >> $GITHUB_OUTPUT
          elif [[ "${{ github.ref }}" == *"sdk-core-v"* ]]; then
            echo "package=sdk-core" >> $GITHUB_OUTPUT
          else
            echo "package=sdk" >> $GITHUB_OUTPUT
          fi

  publish:
    needs: detect-package
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          registry-url: "https://registry.npmjs.org"

      - name: Build only changed package
        run: |
          cd packages/${{ needs.detect-package.outputs.package }}
          bun install
          bun run build

      - name: Publish
        run: npm publish --access public
        working-directory: packages/${{ needs.detect-package.outputs.package }}
```

### Phase 3: README Reference Protocol [villa-doc]

**Problem:** README references hardcoded versions, becomes stale.

**Solution: Dynamic version badges + auto-sync:**

````markdown
<!-- packages/sdk/README.md -->

# @rockfridrich/villa-sdk

[![npm version](https://img.shields.io/npm/v/@rockfridrich/villa-sdk.svg)](https://www.npmjs.com/package/@rockfridrich/villa-sdk)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@rockfridrich/villa-sdk)](https://bundlephobia.com/package/@rockfridrich/villa-sdk)

## Installation

```bash
npm install @rockfridrich/villa-sdk
# Version: <!-- AUTO_VERSION -->
```
````

## Quick Start

<!-- SDK_QUICKSTART_BEGIN -->

```typescript
import { villa } from "@rockfridrich/villa-sdk";

// Zero config - just works!
const user = await villa.signIn();
console.log(user.nickname);
```

<!-- SDK_QUICKSTART_END -->

````

**Auto-sync script:**

```typescript
// scripts/sync-readme-version.ts
const pkg = require('../packages/sdk/package.json');
const readme = fs.readFileSync('packages/sdk/README.md', 'utf8');

const updated = readme
  .replace(/<!-- AUTO_VERSION -->.*/, `<!-- AUTO_VERSION -->${pkg.version}`)
  .replace(/npm install @rockfridrich\/villa-sdk@[\d.]+/g,
           `npm install @rockfridrich/villa-sdk@${pkg.version}`);

fs.writeFileSync('packages/sdk/README.md', updated);
````

**CI integration:**

```yaml
# Run on version bump
- name: Sync README versions
  run: bun scripts/sync-readme-version.ts
```

---

## Security Considerations

### 1. Config Manifest Security

```typescript
// Config validation with Zod (already a peer dep)
const ConfigSchema = z.object({
  version: z.number(),
  schemaVersion: z.string(),
  endpoints: z.object({
    production: EndpointSchema,
    staging: EndpointSchema,
  }),
  sdk: z.object({
    minVersion: z.string(),
    deprecatedMethods: z.array(z.string()),
  }),
});

// Validate fetched config
const config = ConfigSchema.parse(await fetchConfig());
```

### 2. Version Compatibility Check

```typescript
// SDK checks if it's compatible with server config
const SDK_VERSION = "0.2.0"; // Baked in at build time

async function checkCompatibility(): Promise<boolean> {
  const config = await loadConfig();
  const minRequired = config.sdk.minVersion;

  if (semver.lt(SDK_VERSION, minRequired)) {
    console.warn(
      `[Villa] SDK v${SDK_VERSION} is outdated. Minimum: v${minRequired}`,
    );
    return false;
  }
  return true;
}
```

### 3. Fallback Strategy

```typescript
// If config fetch fails, use safe defaults
const DEFAULT_CONFIG = {
  endpoints: {
    production: {
      hub: "https://villa.cash",
      key: "https://key.villa.cash",
    },
  },
  features: {
    // Conservative defaults - disable experimental features
    claimNickname: false,
    socialLookup: false,
  },
};
```

---

## Beads Tasks

```bash
# Create tasks
bd create --title="SDK: Add runtime config manifest system" --type=task --priority=1 \
  --description="Create villa-config.json on server, SDK fetches at runtime. Eliminates hardcoded URLs."

bd create --title="SDK: Decouple package publishing" --type=task --priority=2 \
  --description="Allow independent version bumps for sdk, sdk-react, sdk-core. Fix bun workflow."

bd create --title="SDK: Auto-sync README versions" --type=task --priority=2 \
  --description="Script to update version references in README. Run on CI after publish."

bd create --title="SDK: Extract villa-core types package" --type=task --priority=3 \
  --description="Move stable types/schemas to @rockfridrich/villa-core. Reduces breaking changes."
```

---

## Migration Path

### For Existing SDK Users (0.2.0 → 0.3.0)

**No breaking changes required.** The config loader is additive:

```typescript
// v0.2.0 (current) - still works
import { villa } from "@rockfridrich/villa-sdk";
await villa.signIn();

// v0.3.0 (new) - same API, but config fetched at runtime
import { villa } from "@rockfridrich/villa-sdk";
await villa.signIn(); // Internally fetches config
```

### Config Override (Advanced Users)

```typescript
// For self-hosted Villa deployments
import { Villa } from "@rockfridrich/villa-sdk";

const villa = new Villa({
  configUrl: "https://my-villa.example.com/.well-known/villa-config.json",
  // OR inline config
  config: {
    endpoints: { production: { hub: "https://my-villa.example.com" } },
  },
});
```

---

## File Summary

| File                                            | Action | Purpose                        |
| ----------------------------------------------- | ------ | ------------------------------ |
| `apps/hub/public/.well-known/villa-config.json` | CREATE | Server-side config manifest    |
| `packages/sdk/src/config-loader.ts`             | CREATE | Runtime config fetching        |
| `packages/sdk/src/config-schema.ts`             | CREATE | Zod validation for config      |
| `packages/sdk/src/simple.ts`                    | MODIFY | Use config loader              |
| `packages/sdk/src/iframe/bridge.ts`             | MODIFY | Use config loader              |
| `.github/workflows/sdk-publish.yml`             | MODIFY | Independent package publishing |
| `scripts/sync-readme-version.ts`                | CREATE | Auto-update README versions    |
| `packages/sdk/README.md`                        | MODIFY | Add auto-version markers       |

---

## Verification Checklist

```bash
# After implementation
[ ] Config manifest accessible at villa.cash/.well-known/villa-config.json
[ ] SDK loads config at runtime (check network tab)
[ ] Fallback works when config unavailable
[ ] SDK version check warns on outdated version
[ ] Independent tag publish works (sdk-v*, sdk-react-v*)
[ ] README auto-updates on version bump
[ ] No breaking API changes for existing users
```

---

## OpenCode Prompt

```
Read .opencode/tasks/sdk-package-architecture.md

SESSION START:
bd prime
bd create --title="SDK: Add runtime config manifest system" --type=task --priority=1

IMPLEMENTATION:

1. Create config manifest on server:
   File: apps/hub/public/.well-known/villa-config.json
   Content: See Phase 1 in the architecture doc

2. Create config loader:
   File: packages/sdk/src/config-loader.ts
   - Fetch from villa.cash/.well-known/villa-config.json
   - 5 min cache
   - Fallback to DEFAULT_CONFIG

3. Create config schema (Zod):
   File: packages/sdk/src/config-schema.ts
   - Validate fetched config
   - Type-safe config object

4. Update simple.ts:
   - Remove hardcoded API_URL
   - Import and use loadConfig()
   - Lazy load on first villa.signIn()

5. Update bridge.ts:
   - Remove hardcoded AUTH_URLS
   - Get URLs from config

6. Fix publish workflow:
   File: .github/workflows/sdk-publish.yml
   - Use bun consistently throughout
   - Add independent tag support

AFTER EACH:
bun typecheck && bun lint

COMMIT:
git add -A && git commit -m "feat(sdk): add runtime config system"

IF STUCK 2x: Stop, note error, reassign to claude-code
```
