/**
 * Database connection module
 * Uses postgres.js for efficient connection pooling
 */
import postgres from 'postgres'

// Singleton connection pool
let sql: ReturnType<typeof postgres> | null = null
let migrationRun = false

/**
 * Get database connection
 * Creates a connection pool on first call, reuses on subsequent calls
 */
export function getDb() {
  if (sql) return sql

  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  sql = postgres(dbUrl, {
    // Connection pool settings
    max: 10, // Max connections in pool
    idle_timeout: 20, // Close idle connections after 20s
    connect_timeout: 10, // Connection timeout 10s

    // SSL required for DigitalOcean
    ssl: dbUrl.includes('sslmode=require') ? 'require' : false,
  })

  return sql
}

/**
 * Ensure tables exist (auto-migration on first request)
 * Safe to call multiple times - only runs once per process
 */
export async function ensureTables() {
  if (migrationRun) return

  const db = getDb()

  // Create profiles table if not exists
  await db`
    CREATE TABLE IF NOT EXISTS profiles (
      address VARCHAR(42) PRIMARY KEY,
      nickname VARCHAR(32) UNIQUE,
      nickname_normalized VARCHAR(32) UNIQUE,
      avatar_style VARCHAR(20),
      avatar_selection VARCHAR(10),
      avatar_variant INTEGER,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `

  // Create indexes (IF NOT EXISTS is implicit for CREATE INDEX in PG 9.5+)
  await db`
    CREATE INDEX IF NOT EXISTS idx_profiles_nickname
    ON profiles(nickname_normalized)
  `

  migrationRun = true
}

/**
 * Close database connection
 * Call during graceful shutdown
 */
export async function closeDb() {
  if (sql) {
    await sql.end()
    sql = null
  }
}

// Export types for use in queries
export type { Sql } from 'postgres'
