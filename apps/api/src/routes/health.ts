import { Hono } from "hono";
import { checkDbHealth, isUsingFallback, getLastError } from "../db/client";
import { detectEnvironment } from "../config/database";
import {
  createHealthResponse,
  createDetailedHealthResponse,
  getMemoryUsage,
} from "../lib/health";

const health = new Hono();

/**
 * Health check endpoint
 * Returns service status, version, and database health
 */
health.get("/", async (c) => {
  const dbHealth = await checkDbHealth();

  let status: "ok" | "degraded" | "unhealthy" = "ok";
  if (!dbHealth.healthy && !dbHealth.usingFallback) {
    status = "degraded";
  }

  const healthResponse = createHealthResponse({
    status,
    environment: detectEnvironment(),
  });

  return c.json(healthResponse);
});

/**
 * Detailed health check - includes more diagnostics
 */
health.get("/details", async (c) => {
  const dbHealth = await checkDbHealth();
  const lastError = getLastError();

  let status: "ok" | "degraded" | "unhealthy" = "ok";
  if (!dbHealth.healthy && !dbHealth.usingFallback) {
    status = "degraded";
  }

  const detailedHealth = createDetailedHealthResponse("villa-api", {
    status,
    environment: detectEnvironment(),
    database: {
      ...dbHealth,
      lastError: lastError?.message,
    },
  });

  return c.json(detailedHealth);
});

/**
 * Readiness check - for Kubernetes/DO App Platform
 * Returns 200 if ready to receive traffic
 *
 * In production/staging: requires database
 * In development/local: fallback mode is acceptable
 */
health.get("/ready", async (c) => {
  const dbHealth = await checkDbHealth();
  const environment = detectEnvironment();

  // In production/staging, we require a healthy database
  if (environment === "production" || environment === "staging") {
    if (!dbHealth.healthy) {
      return c.json(
        {
          ready: false,
          reason: "database_unhealthy",
          error: dbHealth.error,
        },
        503,
      );
    }
  } else {
    // In dev/local, fallback mode is okay
    if (!dbHealth.healthy && !dbHealth.usingFallback) {
      return c.json(
        {
          ready: false,
          reason: "database_unhealthy",
          error: dbHealth.error,
        },
        503,
      );
    }
  }

  return c.json({
    ready: true,
    usingFallback: dbHealth.usingFallback,
  });
});

/**
 * Liveness check - for Kubernetes/DO App Platform
 * Returns 200 if service is alive (even if dependencies are down)
 */
health.get("/live", (c) => {
  return c.json({
    alive: true,
    timestamp: new Date().toISOString(),
    usingFallback: isUsingFallback(),
  });
});

export default health;
