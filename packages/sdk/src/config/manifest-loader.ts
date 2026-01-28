import type {
  VillaManifest,
  RuntimeConfig,
  ConfigMergeResult,
} from "./manifest-schema";
import {
  VillaManifestSchema,
  DEFAULT_CONFIG,
  ENV_VAR_MAP,
  validators,
} from "./manifest-schema";

export interface ManifestCache {
  data: VillaManifest;
  loadedAt: number;
  ttl: number;
  url: string;
}

export interface ManifestLoaderOptions {
  manifestUrl?: string;
  cacheTtl?: number;
  fallbackToDefaults?: boolean;
  enableEnvVars?: boolean;
  environment?: string;
}

class ManifestLoader {
  private cache = new Map<string, ManifestCache>();
  private loadingPromises = new Map<string, Promise<VillaManifest | null>>();

  async loadManifest(
    options: ManifestLoaderOptions = {},
  ): Promise<ConfigMergeResult> {
    const {
      manifestUrl = this.discoverManifestUrl(),
      cacheTtl = 5 * 60 * 1000,
      fallbackToDefaults = true,
      enableEnvVars = true,
      environment = this.detectEnvironment(),
    } = options;

    const sources: ConfigMergeResult["sources"] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    let manifestConfig: VillaManifest | null = null;
    let envVarConfig: Partial<VillaManifest> = {};

    if (enableEnvVars) {
      const envResult = this.loadFromEnvironmentVariables();
      envVarConfig = envResult.config;
      sources.push({
        type: "ENV_VAR",
        precedence: 30,
        keys: envResult.keys,
        valid: true,
      });
    }

    if (manifestUrl) {
      try {
        manifestConfig = await this.fetchManifest(manifestUrl, cacheTtl);
        if (manifestConfig) {
          sources.push({
            type: "MANIFEST",
            precedence: 10,
            keys: Object.keys(manifestConfig),
            valid: true,
          });
        }
      } catch (error) {
        errors.push(
          `Failed to load manifest from ${manifestUrl}: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
        if (!fallbackToDefaults) {
          throw error;
        }
      }
    }

    sources.push({
      type: "DEFAULT",
      precedence: 0,
      keys: Object.keys(DEFAULT_CONFIG),
      valid: true,
    });

    const mergedConfig = this.mergeConfigurations({
      defaults: DEFAULT_CONFIG,
      manifest: manifestConfig,
      environment: environment,
      envVars: envVarConfig,
    });

    const compatibility = validators.isCompatible(mergedConfig);
    if (!compatibility.compatible) {
      warnings.push(...compatibility.reasons);
    }

    const runtimeConfig: RuntimeConfig = {
      ...mergedConfig,
      _source: {
        manifest: !!manifestConfig,
        environment,
        envVars: Object.keys(envVarConfig),
        loadedAt: Date.now(),
      },
    } as RuntimeConfig;

    return {
      config: runtimeConfig,
      sources,
      warnings,
      errors,
    };
  }

  private discoverManifestUrl(): string | null {
    if (typeof window === "undefined") {
      return null;
    }

    const possiblePaths = [
      "/villa-manifest.json",
      "/public/villa-manifest.json",
      "/assets/villa-manifest.json",
      "/.villa/manifest.json",
    ];

    const origin = window.location.origin;
    return `${origin}${possiblePaths[0]}`;
  }

  private detectEnvironment(): string {
    if (typeof window === "undefined") {
      return process.env.NODE_ENV || "development";
    }

    const hostname = window.location.hostname;

    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "development";
    }

    if (hostname.includes("staging") || hostname.includes("preview")) {
      return "staging";
    }

    if (hostname.includes("test") || hostname.includes("demo")) {
      return "test";
    }

    return "production";
  }

  private loadFromEnvironmentVariables(): {
    config: Partial<VillaManifest>;
    keys: string[];
  } {
    const config: any = {};
    const keys: string[] = [];

    Object.entries(ENV_VAR_MAP).forEach(([envKey, configPath]) => {
      const value =
        typeof window === "undefined"
          ? process.env[envKey]
          : (window as any).__VILLA_ENV__?.[envKey];

      if (value !== undefined) {
        if (validators.validateEnvVar(envKey, String(value))) {
          this.setNestedValue(config, configPath, this.parseEnvValue(value));
          keys.push(envKey);
        }
      }
    });

    return { config, keys };
  }

  private parseEnvValue(value: string | any): any {
    if (typeof value !== "string") return value;

    const lower = value.toLowerCase();

    if (lower === "true" || lower === "1") return true;
    if (lower === "false" || lower === "0") return false;

    const num = Number(value);
    if (!isNaN(num) && isFinite(num)) return num;

    return value;
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split(".");
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== "object") {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
  }

  private async fetchManifest(
    url: string,
    ttl: number,
  ): Promise<VillaManifest | null> {
    const cacheKey = url;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.loadedAt < cached.ttl) {
      return cached.data;
    }

    const existingPromise = this.loadingPromises.get(cacheKey);
    if (existingPromise) {
      return existingPromise;
    }

    const promise = this.doFetchManifest(url);
    this.loadingPromises.set(cacheKey, promise);

    try {
      const manifest = await promise;
      if (manifest) {
        this.cache.set(cacheKey, {
          data: manifest,
          loadedAt: Date.now(),
          ttl,
          url,
        });
      }
      return manifest;
    } finally {
      this.loadingPromises.delete(cacheKey);
    }
  }

  private async doFetchManifest(url: string): Promise<VillaManifest | null> {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-cache",
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const validation = validators.validateManifest(data);

      if (!validation.success) {
        throw new Error(`Invalid manifest schema: ${validation.error.message}`);
      }

      return validation.data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        return null;
      }
      throw error;
    }
  }

  private mergeConfigurations(configs: {
    defaults: VillaManifest;
    manifest: VillaManifest | null;
    environment: string;
    envVars: Partial<VillaManifest>;
  }): VillaManifest {
    const { defaults, manifest, environment, envVars } = configs;

    let result = { ...defaults };

    if (manifest) {
      result = this.deepMerge(result, manifest);

      if (
        manifest.environments?.[
          environment as keyof typeof manifest.environments
        ]
      ) {
        const envOverrides =
          manifest.environments[
            environment as keyof typeof manifest.environments
          ];
        result = this.deepMerge(result, envOverrides);
      }
    }

    if (Object.keys(envVars).length > 0) {
      result = this.deepMerge(result, envVars);
    }

    return result;
  }

  private deepMerge(target: any, source: any): any {
    const result = { ...target };

    for (const key in source) {
      if (source[key] !== undefined && source[key] !== null) {
        if (
          target[key] &&
          typeof target[key] === "object" &&
          typeof source[key] === "object" &&
          !Array.isArray(target[key]) &&
          !Array.isArray(source[key])
        ) {
          result[key] = this.deepMerge(target[key], source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }

    return result;
  }

  clearCache(url?: string): void {
    if (url) {
      this.cache.delete(url);
    } else {
      this.cache.clear();
    }
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

export const manifestLoader = new ManifestLoader();
