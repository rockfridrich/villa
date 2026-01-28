import type { VillaConfig } from "../types";
import type { RuntimeConfig, VillaManifest } from "./manifest-schema";
import { manifestLoader } from "./manifest-loader";
import { DEFAULT_CONFIG } from "./manifest-schema";

export class RuntimeConfigManager {
  private currentConfig: RuntimeConfig | null = null;
  private loadPromise: Promise<RuntimeConfig> | null = null;
  private subscribers = new Set<(config: RuntimeConfig) => void>();

  async getConfig(explicitConfig?: VillaConfig): Promise<RuntimeConfig> {
    if (this.currentConfig && !explicitConfig) {
      return this.currentConfig;
    }

    if (this.loadPromise && !explicitConfig) {
      return this.loadPromise;
    }

    this.loadPromise = this.loadConfiguration(explicitConfig);
    this.currentConfig = await this.loadPromise;
    this.loadPromise = null;

    this.notifySubscribers(this.currentConfig);
    return this.currentConfig;
  }

  private async loadConfiguration(
    explicitConfig?: VillaConfig,
  ): Promise<RuntimeConfig> {
    try {
      const manifestResult = await manifestLoader.loadManifest({
        enableEnvVars: true,
        fallbackToDefaults: true,
      });

      let finalConfig = manifestResult.config;

      if (explicitConfig) {
        finalConfig = this.mergeExplicitConfig(finalConfig, explicitConfig);
      }

      if (manifestResult.warnings.length > 0 && finalConfig.features.debug) {
        console.warn(
          "[Villa SDK] Configuration warnings:",
          manifestResult.warnings,
        );
      }

      if (manifestResult.errors.length > 0 && finalConfig.features.debug) {
        console.error(
          "[Villa SDK] Configuration errors:",
          manifestResult.errors,
        );
      }

      return finalConfig;
    } catch (error) {
      console.error(
        "[Villa SDK] Failed to load configuration, using defaults:",
        error,
      );
      return this.createFallbackConfig(explicitConfig);
    }
  }

  private mergeExplicitConfig(
    runtimeConfig: RuntimeConfig,
    explicitConfig: VillaConfig,
  ): RuntimeConfig {
    const merged = { ...runtimeConfig };

    if (explicitConfig.appId !== undefined) {
      merged.integration.appId = explicitConfig.appId;
    }

    if (explicitConfig.target !== undefined) {
      merged.target = explicitConfig.target;
    }

    if (explicitConfig.network !== undefined) {
      merged.network = explicitConfig.network;
    }

    if (explicitConfig.debug !== undefined) {
      merged.features.debug = explicitConfig.debug;
    }

    if (explicitConfig.apiUrl !== undefined) {
      merged.integration.apiUrl = explicitConfig.apiUrl;
    }

    if (explicitConfig.rpcUrl !== undefined) {
      merged.integration.rpcUrl = explicitConfig.rpcUrl;
    }

    return merged;
  }

  private createFallbackConfig(explicitConfig?: VillaConfig): RuntimeConfig {
    const base = {
      ...DEFAULT_CONFIG,
      _source: {
        manifest: false,
        environment: null,
        envVars: [],
        loadedAt: Date.now(),
      },
    } as RuntimeConfig;

    if (explicitConfig) {
      return this.mergeExplicitConfig(base, explicitConfig);
    }

    return base;
  }

  toVillaConfig(runtimeConfig?: RuntimeConfig): VillaConfig {
    const config = runtimeConfig || this.currentConfig;
    if (!config) {
      return {};
    }

    return {
      appId: config.integration.appId,
      target: config.target === "local" ? undefined : config.target,
      network: config.network,
      debug: config.features.debug,
      apiUrl: config.integration.apiUrl,
      rpcUrl: config.integration.rpcUrl,
    };
  }

  subscribe(callback: (config: RuntimeConfig) => void): () => void {
    this.subscribers.add(callback);
    if (this.currentConfig) {
      callback(this.currentConfig);
    }
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers(config: RuntimeConfig): void {
    this.subscribers.forEach((callback) => {
      try {
        callback(config);
      } catch (error) {
        console.error("[Villa SDK] Error in config subscriber:", error);
      }
    });
  }

  async reload(): Promise<RuntimeConfig> {
    manifestLoader.clearCache();
    this.currentConfig = null;
    this.loadPromise = null;
    return this.getConfig();
  }

  getCurrentConfig(): RuntimeConfig | null {
    return this.currentConfig;
  }

  isLoaded(): boolean {
    return this.currentConfig !== null;
  }
}

export const runtimeConfigManager = new RuntimeConfigManager();

export async function createVillaConfigFromManifest(
  explicitConfig?: VillaConfig,
): Promise<VillaConfig> {
  const runtimeConfig = await runtimeConfigManager.getConfig(explicitConfig);
  return runtimeConfigManager.toVillaConfig(runtimeConfig);
}
