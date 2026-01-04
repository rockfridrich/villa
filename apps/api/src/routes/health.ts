import { Hono } from 'hono'
import { checkDbHealth, isUsingFallback, getLastError } from '../db/client'
import { detectEnvironment } from '../config/database'

const health = new Hono()

/**
 * Health check endpoint
 * Returns service status, version, and database health
 */
health.get('/', async (c) => {
  const dbHealth = await checkDbHealth()
  const environment = detectEnvironment()

  // Status is 'ok' if DB healthy or in fallback mode
  // Status is 'degraded' if DB configured but unhealthy
  let status: 'ok' | 'degraded' | 'unhealthy' = 'ok'
  if (!dbHealth.healthy && !dbHealth.usingFallback) {
    status = 'degraded'
  }

  return c.json({
    status,
    service: 'villa-api',
    version: '0.1.0',
    environment,
    timestamp: new Date().toISOString(),
    database: {
      healthy: dbHealth.healthy,
      usingFallback: dbHealth.usingFallback,
      latencyMs: dbHealth.latencyMs,
      error: dbHealth.error,
    },
  })
})

/**
 * Detailed health check - includes more diagnostics
 */
health.get('/details', async (c) => {
  const dbHealth = await checkDbHealth()
  const lastError = getLastError()

  return c.json({
    service: 'villa-api',
    version: '0.1.0',
    environment: detectEnvironment(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: {
      ...dbHealth,
      lastError: lastError?.message,
    },
  })
})

/**
 * Readiness check - for Kubernetes/DO App Platform
 * Returns 200 if ready to receive traffic
 *
 * In production/staging: requires database
 * In development/local: fallback mode is acceptable
 */
health.get('/ready', async (c) => {
  const dbHealth = await checkDbHealth()
  const environment = detectEnvironment()

  // In production/staging, we require a healthy database
  if (environment === 'production' || environment === 'staging') {
    if (!dbHealth.healthy) {
      return c.json(
        {
          ready: false,
          reason: 'database_unhealthy',
          error: dbHealth.error,
        },
        503
      )
    }
  } else {
    // In dev/local, fallback mode is okay
    if (!dbHealth.healthy && !dbHealth.usingFallback) {
      return c.json(
        {
          ready: false,
          reason: 'database_unhealthy',
          error: dbHealth.error,
        },
        503
      )
    }
  }

  return c.json({
    ready: true,
    usingFallback: dbHealth.usingFallback,
  })
})

/**
 * Liveness check - for Kubernetes/DO App Platform
 * Returns 200 if service is alive (even if dependencies are down)
 */
health.get('/live', (c) => {
  return c.json({
    alive: true,
    timestamp: new Date().toISOString(),
    usingFallback: isUsingFallback(),
  })
})

export default health
