/**
 * Villa API - Node.js Server
 *
 * Runs the Hono API on Node.js for DigitalOcean App Platform deployment.
 * Features:
 * - Database initialization with retry
 * - Graceful shutdown
 * - Health check endpoints
 */

import { serve } from '@hono/node-server'
import { config } from 'dotenv'
import app from './index'
import { initDb, closeDb, checkDbHealth, isUsingFallback } from './db/client'
import { detectEnvironment, logConfig } from './config/database'

// Load environment variables
config()

const port = parseInt(process.env.PORT || '3001')

// Graceful shutdown handler
let isShuttingDown = false

async function shutdown(signal: string): Promise<void> {
  if (isShuttingDown) return
  isShuttingDown = true

  console.log(`\n${signal} received, shutting down gracefully...`)

  // Close database connection
  await closeDb()

  console.log('Shutdown complete')
  process.exit(0)
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

// Unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

/**
 * Start the server
 */
async function main(): Promise<void> {
  const environment = detectEnvironment()
  console.log(`Villa API starting in ${environment} environment...`)

  // Log database config in development
  if (environment === 'local' || environment === 'development') {
    logConfig()
  }

  // Initialize database
  try {
    await initDb()
    const health = await checkDbHealth()

    if (health.usingFallback) {
      console.log('Database: Using in-memory fallback')
    } else if (health.healthy) {
      console.log(`Database: Connected (latency: ${health.latencyMs}ms)`)
    } else {
      console.error('Database: Health check failed:', health.error)
    }
  } catch (error) {
    console.error('Database initialization failed:', error)
    if (environment === 'production' || environment === 'staging') {
      process.exit(1)
    }
    console.warn('Continuing without database (fallback mode enabled)')
  }

  // Start HTTP server
  serve({
    fetch: app.fetch,
    port,
  })

  console.log(`Villa API running at http://localhost:${port}`)
  console.log(`Health check: http://localhost:${port}/health`)

  if (isUsingFallback()) {
    console.log('⚠️  Running in fallback mode - data will not persist')
  }
}

main().catch((error) => {
  console.error('Failed to start server:', error)
  process.exit(1)
})
