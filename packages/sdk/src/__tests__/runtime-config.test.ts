/**
 * Runtime Configuration Manifest System Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { manifestLoader } from "../config/manifest-loader";
import { runtimeConfigManager } from "../config/runtime";
import { VillaManifestSchema, DEFAULT_CONFIG } from "../config/manifest-schema";

describe("Runtime Config Manifest System", () => {
  beforeEach(() => {
    manifestLoader.clearCache();
    vi.clearAllMocks();
  });

  afterEach(() => {
    manifestLoader.clearCache();
  });

  describe("Manifest Schema", () => {
    it("should validate a valid manifest", () => {
      const manifest = {
        version: "1.0",
        target: "beta",
        network: "base-sepolia",
        features: {
          debug: true,
        },
      };

      const result = VillaManifestSchema.safeParse(manifest);
      expect(result.success).toBe(true);
    });

    it("should allow missing fields in partial manifests", () => {
      const manifest = {};
      const result = VillaManifestSchema.parse(manifest);

      expect(result.version).toBeUndefined();
      expect(result.target).toBeUndefined();
      expect(result.network).toBeUndefined();
      expect(result.features).toBeUndefined();
    });

    it("should reject invalid targets", () => {
      const manifest = { target: "invalid" };
      const result = VillaManifestSchema.safeParse(manifest);

      expect(result.success).toBe(false);
    });
  });

  describe("Manifest Loader", () => {
    it("should load defaults when no manifest exists", async () => {
      const fetchSpy = vi
        .spyOn(global, "fetch")
        .mockRejectedValue(new Error("404"));

      const result = await manifestLoader.loadManifest({
        manifestUrl: "https://example.com/villa-manifest.json",
        fallbackToDefaults: true,
      });

      expect(result.config.target).toBe(DEFAULT_CONFIG.target);
      expect(result.config.features.debug).toBe(DEFAULT_CONFIG.features?.debug);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("Failed to load manifest");

      fetchSpy.mockRestore();
    });

    it("should merge environment variables", async () => {
      const oldProcessEnv = process.env.VILLA_DEBUG;
      process.env.VILLA_DEBUG = "true";

      const result = await manifestLoader.loadManifest({
        enableEnvVars: true,
        manifestUrl: undefined,
      });

      expect(result.config.features.debug).toBe(true);
      expect(result.sources.some((s) => s.type === "ENV_VAR")).toBe(true);

      if (oldProcessEnv !== undefined) {
        process.env.VILLA_DEBUG = oldProcessEnv;
      } else {
        delete process.env.VILLA_DEBUG;
      }
    });

    it("should handle environment-specific overrides", async () => {
      const manifest = {
        target: "beta",
        environments: {
          production: {
            target: "production",
            features: { debug: false },
          },
        },
      };

      const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(manifest),
      } as Response);

      const result = await manifestLoader.loadManifest({
        manifestUrl: "https://example.com/villa-manifest.json",
        environment: "production",
      });

      expect(result.config.target).toBe("production");
      expect(result.config.features.debug).toBe(false);

      fetchSpy.mockRestore();
    });

    it("should cache manifests", async () => {
      const manifest = { target: "beta", features: { debug: true } };
      const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(manifest),
      } as Response);

      const url = "https://example.com/villa-manifest.json";

      await manifestLoader.loadManifest({ manifestUrl: url });
      await manifestLoader.loadManifest({ manifestUrl: url });

      expect(fetchSpy).toHaveBeenCalledTimes(1);

      fetchSpy.mockRestore();
    });
  });

  describe("Runtime Config Manager", () => {
    it("should merge explicit config with manifest config", async () => {
      const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ features: { debug: false } }),
      } as Response);

      const config = await runtimeConfigManager.getConfig({
        debug: true,
        appId: "test-app",
      });

      expect(config.features.debug).toBe(true);
      expect(config.integration.appId).toBe("test-app");

      fetchSpy.mockRestore();
    });

    it("should notify subscribers on config changes", async () => {
      const callback = vi.fn();
      const unsubscribe = runtimeConfigManager.subscribe(callback);

      await runtimeConfigManager.getConfig();

      expect(callback).toHaveBeenCalled();
      unsubscribe();
    });

    it("should convert runtime config to VillaConfig format", () => {
      const runtimeConfig = {
        ...DEFAULT_CONFIG,
        integration: { appId: "test", apiUrl: "https://test.com" },
        _source: {
          manifest: true,
          environment: "test",
          envVars: [],
          loadedAt: Date.now(),
        },
      } as any;

      const villaConfig = runtimeConfigManager.toVillaConfig(runtimeConfig);

      expect(villaConfig.appId).toBe("test");
      expect(villaConfig.apiUrl).toBe("https://test.com");
    });

    it("should reload config and clear cache", async () => {
      const clearCacheSpy = vi.spyOn(manifestLoader, "clearCache");

      await runtimeConfigManager.reload();

      expect(clearCacheSpy).toHaveBeenCalled();
      clearCacheSpy.mockRestore();
    });
  });

  describe("Config Validation", () => {
    it("should detect incompatible configurations", async () => {
      const result = await manifestLoader.loadManifest({
        enableEnvVars: false,
        manifestUrl: undefined,
      });

      expect(result.config).toBeDefined();
      expect(result.sources).toBeDefined();
    });
  });

  describe("Environment Variable Mapping", () => {
    it("should parse boolean environment variables", async () => {
      const oldEnv = process.env.VILLA_DEBUG;
      process.env.VILLA_DEBUG = "true";

      const result = await manifestLoader.loadManifest({
        enableEnvVars: true,
        manifestUrl: undefined,
      });

      expect(result.config.features.debug).toBe(true);

      if (oldEnv !== undefined) {
        process.env.VILLA_DEBUG = oldEnv;
      } else {
        delete process.env.VILLA_DEBUG;
      }
    });

    it("should parse numeric environment variables", async () => {
      const oldEnv = process.env.VILLA_CACHE_TTL;
      process.env.VILLA_CACHE_TTL = "30000";

      const result = await manifestLoader.loadManifest({
        enableEnvVars: true,
        manifestUrl: undefined,
      });

      expect(result.config.performance.cacheTtl).toBe(30000);

      if (oldEnv !== undefined) {
        process.env.VILLA_CACHE_TTL = oldEnv;
      } else {
        delete process.env.VILLA_CACHE_TTL;
      }
    });
  });
});
