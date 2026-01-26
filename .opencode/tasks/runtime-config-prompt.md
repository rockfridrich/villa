# OpenCode Prompt: SDK Runtime Config System

**Beads:** villa-1gd
**Priority:** P1
**Branch:** fix/sdk-runtime-config

---

## SESSION START

```bash
bd prime
bd update villa-1gd --status=in_progress --assignee=opencode
git checkout -b fix/sdk-runtime-config
```

---

## TASK OVERVIEW

Implement runtime config fetching for the SDK to eliminate hardcoded URLs. This allows config changes (API endpoints, feature flags, contract addresses) without SDK version bumps.

**Read:** `.opencode/tasks/sdk-package-architecture.md` for full context

---

## IMPLEMENTATION STEPS

### Step 1: Create Config Manifest on Server

**File:** `apps/hub/public/.well-known/villa-config.json`

```json
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

**Verify:** `curl http://localhost:3000/.well-known/villa-config.json | jq .`

---

### Step 2: Create Config Schema (Zod)

**File:** `packages/sdk/src/config-schema.ts`

```typescript
import { z } from "zod";

const EndpointSchema = z.object({
  hub: z.string().url(),
  key: z.string().url(),
  api: z.string().url(),
});

const ChainSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export const VillaConfigSchema = z.object({
  version: z.number(),
  schemaVersion: z.string(),
  endpoints: z.object({
    production: EndpointSchema,
    staging: EndpointSchema,
  }),
  chains: z.object({
    production: ChainSchema,
    staging: ChainSchema,
  }),
  features: z.object({
    claimNickname: z.boolean(),
    socialLookup: z.boolean(),
    avatarUpload: z.boolean(),
  }),
  contracts: z.object({
    nicknameResolver: z.string(),
    recoverySigner: z.string(),
  }),
  ui: z.object({
    avatarStyles: z.array(z.string()),
    defaultAvatarStyle: z.string(),
  }),
  sdk: z.object({
    minVersion: z.string(),
    deprecatedMethods: z.array(z.string()),
  }),
});

export type VillaConfig = z.infer<typeof VillaConfigSchema>;
export type VillaEndpoints = z.infer<typeof EndpointSchema>;
export type VillaTarget = "production" | "staging";
```

---

### Step 3: Create Config Loader

**File:** `packages/sdk/src/config-loader.ts`

```typescript
import { VillaConfigSchema, type VillaConfig, type VillaTarget } from "./config-schema";

const CONFIG_URL = "https://villa.cash/.well-known/villa-config.json";
const CONFIG_CACHE_MS = 5 * 60 * 1000; // 5 min cache

let cachedConfig: VillaConfig | null = null;
let cacheTime = 0;

// Fallback config if fetch fails (conservative defaults)
const DEFAULT_CONFIG: VillaConfig = {
  version: 1,
  schemaVersion: "2024-01",
  endpoints: {
    production: {
      hub: "https://villa.cash",
      key: "https://key.villa.cash",
      api: "https://villa.cash/api",
    },
    staging: {
      hub: "https://construction.villa.cash",
      key: "https://key.villa.cash",
      api: "https://construction.villa.cash/api",
    },
  },
  chains: {
    production: { id: 8453, name: "Base" },
    staging: { id: 84532, name: "Base Sepolia" },
  },
  features: {
    claimNickname: false,
    socialLookup: false, // Conservative default
    avatarUpload: true,
  },
  contracts: {
    nicknameResolver: "0x180ddE044F1627156Cac6b2d068706508902AE9C",
    recoverySigner: "0xdFb55a363bdF549EE5C2e77D0aAaC39068ED5836",
  },
  ui: {
    avatarStyles: ["lorelei", "bottts", "adventurer", "thumbs"],
    defaultAvatarStyle: "lorelei",
  },
  sdk: {
    minVersion: "0.2.0",
    deprecatedMethods: [],
  },
};

export async function loadConfig(): Promise<VillaConfig> {
  const now = Date.now();
  if (cachedConfig && now - cacheTime < CONFIG_CACHE_MS) {
    return cachedConfig;
  }

  try {
    const res = await fetch(CONFIG_URL);
    if (!res.ok) throw new Error(`Config fetch failed: ${res.status}`);

    const data = await res.json();
    const validated = VillaConfigSchema.parse(data);

    cachedConfig = validated;
    cacheTime = now;
    return validated;
  } catch (error) {
    console.warn("[Villa SDK] Config fetch failed, using defaults:", error);
    return DEFAULT_CONFIG;
  }
}

export function getEndpoints(config: VillaConfig, target: VillaTarget = "production") {
  return config.endpoints[target];
}

export function getChain(config: VillaConfig, target: VillaTarget = "production") {
  return config.chains[target];
}

// For testing/self-hosted deployments
export function setConfigUrl(url: string) {
  // Reset cache when URL changes
  cachedConfig = null;
  cacheTime = 0;
  // Note: This is a module-level variable override pattern
  // In production, consider using a class-based approach
}

export { DEFAULT_CONFIG };
```

---

### Step 4: Update simple.ts

**File:** `packages/sdk/src/simple.ts`

Find hardcoded API_URL and replace with config loader.

**Before:**
```typescript
const API_URL = "https://villa.cash";
```

**After:**
```typescript
import { loadConfig, getEndpoints } from "./config-loader";

// Lazy-loaded config
let configPromise: Promise<VillaConfig> | null = null;

async function getConfig() {
  if (!configPromise) {
    configPromise = loadConfig();
  }
  return configPromise;
}

// Use in API calls:
const config = await getConfig();
const endpoints = getEndpoints(config, "production");
const response = await fetch(`${endpoints.api}/profile/${address}`);
```

---

### Step 5: Update bridge.ts

**File:** `packages/sdk/src/iframe/bridge.ts`

Find hardcoded AUTH_URLS and replace with config loader.

**Before:**
```typescript
const AUTH_URLS = {
  production: "https://villa.cash/auth",
  staging: "https://construction.villa.cash/auth",
};
```

**After:**
```typescript
import { loadConfig, getEndpoints, type VillaTarget } from "../config-loader";

// Derive auth URL from config endpoints
async function getAuthUrl(target: VillaTarget = "production"): Promise<string> {
  const config = await loadConfig();
  const endpoints = getEndpoints(config, target);
  return `${endpoints.hub}/auth`;
}
```

---

## AFTER EACH STEP

```bash
bun typecheck && bun lint
```

If errors, fix before proceeding.

---

## COMMIT

```bash
git add -A && git commit -m "$(cat <<'EOF'
feat(sdk): add runtime config system

- Add villa-config.json manifest to hub public folder
- Create config-loader.ts with caching and fallback
- Create config-schema.ts with Zod validation
- Update simple.ts to use config loader
- Update bridge.ts to derive auth URLs from config

This eliminates hardcoded URLs in the SDK, allowing config changes
(endpoints, feature flags, contracts) without SDK version bumps.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## IF STUCK (same error 2x)

```bash
bd update villa-1gd --assignee=claude-code --note="Stuck on: {describe error}"
```

Stop and wait for Claude Code Terminal to recover.

---

## WHEN DONE

```bash
bd close villa-1gd --reason="Implemented in {commit-hash}"
bd sync --flush-only
git push -u origin fix/sdk-runtime-config
gh pr create --title "feat(sdk): add runtime config system" --body "..."
```

---

## VERIFICATION CHECKLIST

```bash
[ ] Config manifest accessible: curl http://localhost:3000/.well-known/villa-config.json
[ ] SDK loads config at runtime (check browser network tab)
[ ] Fallback works when config unavailable
[ ] bun typecheck passes
[ ] bun lint passes
[ ] No breaking API changes for existing SDK users
```
