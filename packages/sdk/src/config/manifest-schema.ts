/**
 * Villa SDK Runtime Configuration Manifest Schema
 *
 * Defines the structure for villa-manifest.json files that applications
 * can use to configure the SDK behavior at runtime.
 */

import { z } from "zod";

/** Available SDK environments */
export const TargetSchema = z.enum(["production", "beta", "local"]);

/** Supported blockchain networks */
export const NetworkSchema = z.enum(["base", "base-sepolia"]);

/** Avatar style options */
export const AvatarStyleSchema = z.enum([
  "lorelei",
  "adventurer",
  "avataaars",
  "bottts",
  "thumbs",
]);

/** SDK feature flags */
export const FeatureFlagsSchema = z
  .object({
    /** Enable debug logging */
    debug: z.boolean().default(false),
    /** Enable experimental features */
    experimental: z.boolean().default(false),
    /** Enable analytics tracking */
    analytics: z.boolean().default(true),
    /** Enable session persistence */
    persistence: z.boolean().default(true),
    /** Enable automatic config discovery */
    autoDiscovery: z.boolean().default(true),
  })
  .partial();

/** Performance optimization settings */
export const PerformanceSchema = z
  .object({
    /** Manifest cache TTL in milliseconds */
    cacheTtl: z
      .number()
      .min(0)
      .default(5 * 60 * 1000), // 5 minutes
    /** Authentication timeout in milliseconds */
    authTimeout: z
      .number()
      .min(1000)
      .default(5 * 60 * 1000), // 5 minutes
    /** Retry attempts for failed requests */
    retryAttempts: z.number().min(0).max(5).default(3),
    /** Request timeout in milliseconds */
    requestTimeout: z
      .number()
      .min(1000)
      .default(30 * 1000), // 30 seconds
  })
  .partial();

/** Security and validation settings */
export const SecuritySchema = z
  .object({
    /** Allowed origins for iframe communication */
    allowedOrigins: z.array(z.string().url()).optional(),
    /** Require HTTPS for production environments */
    requireHttps: z.boolean().default(true),
    /** Enable strict CSP validation */
    strictCsp: z.boolean().default(false),
    /** Maximum session duration in milliseconds */
    maxSessionDuration: z
      .number()
      .min(0)
      .default(7 * 24 * 60 * 60 * 1000), // 7 days
  })
  .partial();

/** SDK integration settings */
export const IntegrationSchema = z
  .object({
    /** Application identifier */
    appId: z.string().optional(),
    /** Custom API base URL */
    apiUrl: z.string().url().optional(),
    /** Custom RPC endpoint URL */
    rpcUrl: z.string().url().optional(),
    /** Default avatar style */
    defaultAvatarStyle: AvatarStyleSchema.default("lorelei"),
    /** Default scopes to request */
    defaultScopes: z.array(z.enum(["profile", "wallet"])).default(["profile"]),
  })
  .partial();

/** Full manifest schema */
export const VillaManifestSchema = z
  .object({
    /** Schema version for compatibility */
    version: z.literal("1.0").default("1.0"),

    /** Target environment */
    target: TargetSchema.default("beta"),

    /** Blockchain network */
    network: NetworkSchema.default("base-sepolia"),

    /** Feature flags */
    features: FeatureFlagsSchema.default({}),

    /** Performance settings */
    performance: PerformanceSchema.default({}),

    /** Security settings */
    security: SecuritySchema.default({}),

    /** Integration settings */
    integration: IntegrationSchema.default({}),

    /** Environment-specific overrides */
    environments: z
      .record(
        z.enum(["production", "staging", "development", "test"]),
        z
          .object({
            target: TargetSchema.optional(),
            network: NetworkSchema.optional(),
            features: FeatureFlagsSchema.optional(),
            performance: PerformanceSchema.optional(),
            security: SecuritySchema.optional(),
            integration: IntegrationSchema.optional(),
          })
          .partial(),
      )
      .optional(),

    /** Custom metadata */
    metadata: z.record(z.string(), z.any()).optional(),
  })
  .partial();

/** Parsed and validated manifest type */
export type VillaManifest = z.infer<typeof VillaManifestSchema>;

/** Runtime configuration type (post-merge with defaults) */
export type RuntimeConfig = Required<VillaManifest> & {
  /** Computed configuration source */
  _source: {
    manifest: boolean;
    environment: string | null;
    envVars: string[];
    loadedAt: number;
  };
};

/** Configuration precedence levels */
export enum ConfigPrecedence {
  DEFAULT = 0,
  MANIFEST = 10,
  ENVIRONMENT = 20,
  ENV_VAR = 30,
  EXPLICIT = 40,
}

/** Configuration merge result */
export interface ConfigMergeResult {
  config: RuntimeConfig;
  sources: Array<{
    type: keyof typeof ConfigPrecedence;
    precedence: number;
    keys: string[];
    valid: boolean;
  }>;
  warnings: string[];
  errors: string[];
}

/** Environment variable mapping */
export const ENV_VAR_MAP = {
  VILLA_TARGET: "target",
  VILLA_NETWORK: "network",
  VILLA_DEBUG: "features.debug",
  VILLA_EXPERIMENTAL: "features.experimental",
  VILLA_APP_ID: "integration.appId",
  VILLA_API_URL: "integration.apiUrl",
  VILLA_RPC_URL: "integration.rpcUrl",
  VILLA_REQUIRE_HTTPS: "security.requireHttps",
  VILLA_CACHE_TTL: "performance.cacheTtl",
  VILLA_AUTH_TIMEOUT: "performance.authTimeout",
} as const;

/** Default configuration */
export const DEFAULT_CONFIG: VillaManifest = {
  version: "1.0",
  target: "beta",
  network: "base-sepolia",
  features: {
    debug: false,
    experimental: false,
    analytics: true,
    persistence: true,
    autoDiscovery: true,
  },
  performance: {
    cacheTtl: 5 * 60 * 1000,
    authTimeout: 5 * 60 * 1000,
    retryAttempts: 3,
    requestTimeout: 30 * 1000,
  },
  security: {
    requireHttps: true,
    strictCsp: false,
    maxSessionDuration: 7 * 24 * 60 * 60 * 1000,
  },
  integration: {
    defaultAvatarStyle: "lorelei",
    defaultScopes: ["profile"],
  },
};

/** Validation helper functions */
export const validators = {
  /** Validate a partial manifest object */
  validateManifest(
    manifest: unknown,
  ):
    | { success: true; data: VillaManifest }
    | { success: false; error: z.ZodError } {
    try {
      const data = VillaManifestSchema.parse(manifest);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error as z.ZodError };
    }
  },

  /** Validate environment variable value */
  validateEnvVar(key: string, value: string): boolean {
    const configPath = ENV_VAR_MAP[key as keyof typeof ENV_VAR_MAP];
    if (!configPath) return false;

    // Basic validation for known types
    if (configPath.includes(".debug") || configPath.includes(".experimental")) {
      return ["true", "false", "1", "0"].includes(value.toLowerCase());
    }

    if (configPath.includes("Url")) {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    }

    if (configPath.includes("Timeout") || configPath.includes("Ttl")) {
      const num = parseInt(value, 10);
      return !isNaN(num) && num > 0;
    }

    return true; // Allow other values through
  },

  /** Check if configuration is compatible with current environment */
  isCompatible(config: VillaManifest): {
    compatible: boolean;
    reasons: string[];
  } {
    const reasons: string[] = [];

    // Check HTTPS requirement in production
    if (
      config.target === "production" &&
      config.security?.requireHttps !== false
    ) {
      if (
        typeof window !== "undefined" &&
        window.location.protocol !== "https:"
      ) {
        reasons.push("HTTPS is required for production environment");
      }
    }

    // Check network compatibility
    if (config.target === "production" && config.network === "base-sepolia") {
      reasons.push(
        "Production environment should use base network, not base-sepolia",
      );
    }

    if (config.target === "beta" && config.network === "base") {
      reasons.push("Beta environment typically uses base-sepolia network");
    }

    return {
      compatible: reasons.length === 0,
      reasons,
    };
  },
};
