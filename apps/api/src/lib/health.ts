/**
 * Standardized health response utilities
 * Used across all Villa services for consistent monitoring
 */

export interface HealthResponse {
  /** Service status: ok | degraded | unhealthy */
  status: "ok" | "degraded" | "unhealthy";
  /** Package version from package.json */
  version: string;
  /** Git commit hash (short) */
  buildHash: string;
  /** Build timestamp ISO string */
  buildTime: string;
  /** Git commit SHA (full) */
  sha: string;
  /** Environment: production | staging | development */
  environment: string;
  /** Process uptime in seconds */
  uptime: number;
}

export interface DetailedHealthResponse extends HealthResponse {
  /** Service identifier */
  service: string;
  /** Current timestamp */
  timestamp: string;
  /** Node.js runtime info */
  runtime?: {
    node: string;
    memory: {
      heapUsed: number;
      heapTotal: number;
      rss: number;
    };
  };
  /** Database health (if applicable) */
  database?: {
    healthy: boolean;
    usingFallback?: boolean;
    latencyMs?: number;
    error?: string;
    lastError?: string;
  };
}

/**
 * Get build information from environment variables
 * Works across Railway, GitHub Actions, and local development
 */
export function getBuildInfo(): {
  version: string;
  buildHash: string;
  buildTime: string;
  sha: string;
} {
  // Version from package.json or default
  const version =
    process.env.npm_package_version ||
    process.env.NEXT_PUBLIC_VERSION ||
    process.env.VERSION ||
    "0.3.0-rc.1.1";

  // Git SHA from various CI environments
  const sha =
    process.env.RAILWAY_GIT_COMMIT_SHA ||
    process.env.NEXT_PUBLIC_GIT_SHA ||
    process.env.GIT_SHA ||
    process.env.GITHUB_SHA ||
    "unknown";

  // Build hash (short SHA for quick reference)
  const buildHash =
    process.env.NEXT_PUBLIC_BUILD_HASH ||
    process.env.BUILD_HASH ||
    (sha !== "unknown" ? sha.slice(0, 8) : "unknown");

  // Build time from CI or current time
  const buildTime =
    process.env.NEXT_PUBLIC_BUILD_TIME ||
    process.env.BUILD_TIME ||
    new Date().toISOString();

  return {
    version,
    buildHash,
    buildTime,
    sha,
  };
}

/**
 * Get environment name
 */
export function getEnvironment(): string {
  // Check various environment indicators
  if (process.env.RAILWAY_ENVIRONMENT_NAME) {
    return process.env.RAILWAY_ENVIRONMENT_NAME;
  }

  if (process.env.NEXT_PUBLIC_ENV) {
    return process.env.NEXT_PUBLIC_ENV;
  }

  if (process.env.NODE_ENV === "production") {
    return "production";
  }

  if (process.env.NODE_ENV === "test") {
    return "test";
  }

  return "development";
}

/**
 * Get memory usage in MB
 */
export function getMemoryUsage() {
  const usage = process.memoryUsage();
  return {
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
    rss: Math.round(usage.rss / 1024 / 1024),
  };
}

/**
 * Create basic health response
 */
export function createHealthResponse(
  overrides: Partial<HealthResponse> = {},
): HealthResponse {
  const build = getBuildInfo();

  return {
    status: "ok",
    version: build.version,
    buildHash: build.buildHash,
    buildTime: build.buildTime,
    sha: build.sha,
    environment: getEnvironment(),
    uptime: Math.floor(process.uptime()),
    ...overrides,
  };
}

/**
 * Create detailed health response with runtime info
 */
export function createDetailedHealthResponse(
  serviceName: string,
  overrides: Partial<DetailedHealthResponse> = {},
): DetailedHealthResponse {
  const baseHealth = createHealthResponse(overrides);

  return {
    ...baseHealth,
    service: serviceName,
    timestamp: new Date().toISOString(),
    runtime: {
      node: process.version,
      memory: getMemoryUsage(),
    },
    ...overrides,
  };
}
