/**
 * Database Client with Retry and Fallback
 *
 * Features:
 * - Connection pooling via postgres.js
 * - Automatic retry on connection failure
 * - In-memory fallback for development/testing
 * - Health check support
 * - Graceful shutdown
 */

import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'
import { getDatabaseConfig, logConfig, type DatabaseConfig } from '../config/database'

// Connection state
let db: PostgresJsDatabase<typeof schema> | null = null
let sql: postgres.Sql | null = null
let config: DatabaseConfig | null = null
let connectionAttempts = 0
let lastError: Error | null = null
let usingFallback = false

// In-memory fallback stores
const fallbackProfiles = new Map<string, schema.Profile>()
const fallbackNicknames = new Map<string, string>() // nickname -> address

/**
 * Initialize database connection with retry logic
 */
async function initializeConnection(retryCount = 0): Promise<boolean> {
  if (!config) {
    config = getDatabaseConfig()
  }

  try {
    connectionAttempts++

    // Create postgres.js connection
    sql = postgres(config.url, {
      ssl: config.ssl,
      max: config.maxConnections,
      idle_timeout: config.idleTimeout,
      connect_timeout: config.connectTimeout,
      onnotice: () => {}, // Suppress notices
    })

    // Test connection
    await sql`SELECT 1`

    // Create Drizzle instance
    db = drizzle(sql, { schema })
    usingFallback = false
    lastError = null

    console.log(`Database connected (attempt ${connectionAttempts})`)
    return true
  } catch (error) {
    lastError = error as Error
    console.error(`Database connection failed (attempt ${retryCount + 1}/${config.retryAttempts}):`, error)

    // Clean up failed connection
    if (sql) {
      await sql.end().catch(() => {})
      sql = null
    }
    db = null

    // Retry if we have attempts remaining
    if (retryCount < config.retryAttempts - 1) {
      console.log(`Retrying in ${config.retryDelay}ms...`)
      await sleep(config.retryDelay)
      return initializeConnection(retryCount + 1)
    }

    // Enable fallback if configured
    if (config.enableFallback) {
      console.warn('Database unavailable, using in-memory fallback')
      usingFallback = true
      return false
    }

    throw new Error(`Failed to connect to database after ${config.retryAttempts} attempts: ${lastError.message}`)
  }
}

/**
 * Get database instance
 * Initializes connection if needed, falls back to memory if configured
 */
export function getDb(): PostgresJsDatabase<typeof schema> {
  if (db) {
    return db
  }

  if (usingFallback) {
    throw new Error('Database unavailable, using fallback mode')
  }

  // Synchronous check - connection should be initialized via initDb()
  if (!config) {
    config = getDatabaseConfig()
  }

  if (!process.env.DATABASE_URL && config.enableFallback) {
    usingFallback = true
    throw new Error('Database unavailable, using fallback mode')
  }

  throw new Error('Database not initialized. Call initDb() first.')
}

/**
 * Initialize database (call on startup)
 */
export async function initDb(): Promise<void> {
  if (db) return // Already initialized

  config = getDatabaseConfig()

  if (process.env.LOG_DB_CONFIG === 'true') {
    logConfig()
  }

  if (!process.env.DATABASE_URL) {
    if (config.enableFallback) {
      console.warn('DATABASE_URL not set, using in-memory fallback')
      usingFallback = true
      return
    }
    throw new Error('DATABASE_URL environment variable is required')
  }

  await initializeConnection()
}

/**
 * Close database connection
 */
export async function closeDb(): Promise<void> {
  if (sql) {
    await sql.end()
    sql = null
    db = null
  }
  connectionAttempts = 0
  lastError = null
}

/**
 * Health check - verify database connection
 */
export async function checkDbHealth(): Promise<{
  healthy: boolean
  usingFallback: boolean
  error?: string
  latencyMs?: number
}> {
  if (usingFallback) {
    return {
      healthy: true,
      usingFallback: true,
    }
  }

  if (!sql) {
    return {
      healthy: false,
      usingFallback: false,
      error: 'Not connected',
    }
  }

  try {
    const start = Date.now()
    await sql`SELECT 1`
    const latencyMs = Date.now() - start

    return {
      healthy: true,
      usingFallback: false,
      latencyMs,
    }
  } catch (error) {
    return {
      healthy: false,
      usingFallback: false,
      error: (error as Error).message,
    }
  }
}

/**
 * Check if using fallback mode
 */
export function isUsingFallback(): boolean {
  return usingFallback
}

/**
 * Get last connection error
 */
export function getLastError(): Error | null {
  return lastError
}

/**
 * Fallback storage operations
 */
export const fallback = {
  profiles: fallbackProfiles,
  nicknames: fallbackNicknames,

  /** Get profile by address */
  getProfileByAddress(address: string): schema.Profile | undefined {
    return fallbackProfiles.get(address.toLowerCase())
  },

  /** Get profile by nickname */
  getProfileByNickname(nickname: string): schema.Profile | undefined {
    const address = fallbackNicknames.get(nickname.toLowerCase())
    if (!address) return undefined
    return fallbackProfiles.get(address)
  },

  /** Create profile */
  createProfile(profile: schema.NewProfile): schema.Profile {
    const now = new Date()
    const fullProfile: schema.Profile = {
      id: crypto.randomUUID(),
      address: profile.address.toLowerCase(),
      nickname: profile.nickname || null,
      nicknameNormalized: profile.nicknameNormalized || null,
      avatarStyle: profile.avatarStyle || 'bottts',
      avatarSeed: profile.avatarSeed || null,
      avatarGender: profile.avatarGender || null,
      createdAt: now,
      updatedAt: now,
    }

    fallbackProfiles.set(fullProfile.address, fullProfile)
    if (fullProfile.nicknameNormalized) {
      fallbackNicknames.set(fullProfile.nicknameNormalized, fullProfile.address)
    }

    return fullProfile
  },

  /** Check if nickname is available */
  isNicknameAvailable(nickname: string): boolean {
    return !fallbackNicknames.has(nickname.toLowerCase())
  },

  /** Clear all fallback data (for testing) */
  clear(): void {
    fallbackProfiles.clear()
    fallbackNicknames.clear()
  },
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Export schema and types
export { schema }
export type { PostgresJsDatabase }
