import {
  VillaConfigManifestSchema,
  type VillaConfigManifest,
  type VillaTarget,
} from "./config-schema";

const CONFIG_URL = "https://villa.cash/.well-known/villa-config.json";
const CONFIG_CACHE_MS = 5 * 60 * 1000; // 5 min cache

let cachedConfig: VillaConfigManifest | null = null;
let cacheTime = 0;

// Fallback config if fetch fails (conservative defaults)
const DEFAULT_CONFIG: VillaConfigManifest = {
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

export async function loadConfigManifest(): Promise<VillaConfigManifest> {
  const now = Date.now();
  if (cachedConfig && now - cacheTime < CONFIG_CACHE_MS) {
    return cachedConfig;
  }

  try {
    const res = await fetch(CONFIG_URL);
    if (!res.ok) throw new Error(`Config fetch failed: ${res.status}`);

    const data = await res.json();
    const validated = VillaConfigManifestSchema.parse(data);

    cachedConfig = validated;
    cacheTime = now;
    return validated;
  } catch (error) {
    console.warn("[Villa SDK] Config fetch failed, using defaults:", error);
    return DEFAULT_CONFIG;
  }
}

export function getEndpoints(
  config: VillaConfigManifest,
  target: VillaTarget = "production"
) {
  return config.endpoints[target];
}

export function getChain(
  config: VillaConfigManifest,
  target: VillaTarget = "production"
) {
  return config.chains[target];
}

// For testing/self-hosted deployments
export function clearConfigCache() {
  cachedConfig = null;
  cacheTime = 0;
}

export { DEFAULT_CONFIG };
