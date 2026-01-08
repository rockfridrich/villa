/**
 * Database connection module
 * Uses postgres.js for efficient connection pooling
 *
 * Graceful degradation: Returns appropriate errors if DATABASE_URL not set,
 * allowing app to start without DB (for CI E2E tests that don't need DB).
 */
import postgres from 'postgres'

// Singleton connection pool
let sql: ReturnType<typeof postgres> | null = null
let migrationRun = false

/**
 * Check if database is configured
 * Used by API routes to return graceful errors instead of crashing
 */
export function isDatabaseAvailable(): boolean {
  return !!process.env.DATABASE_URL
}

/**
 * Get database connection
 * Creates a connection pool on first call, reuses on subsequent calls
 * Throws if DATABASE_URL not set - callers should check isDatabaseAvailable() first
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
 *
 * Migrations run on app startup within DigitalOcean VPC.
 * CI/CD cannot access the private database network.
 * Gracefully skips if DATABASE_URL not configured.
 */
export async function ensureTables() {
  if (migrationRun) return
  if (!isDatabaseAvailable()) return // Skip migration if no DB

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
      nickname_change_count INTEGER DEFAULT 0,
      last_nickname_change TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `

  // Create webauthn_credentials table if not exists
  await db`
    CREATE TABLE IF NOT EXISTS webauthn_credentials (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      public_key TEXT NOT NULL,
      counter BIGINT DEFAULT 0,
      address VARCHAR(42) NOT NULL,
      nickname VARCHAR(32) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `

  // Create indexes (IF NOT EXISTS is implicit for CREATE INDEX in PG 9.5+)
  await db`
    CREATE INDEX IF NOT EXISTS idx_profiles_nickname
    ON profiles(nickname_normalized)
  `

  await db`
    CREATE INDEX IF NOT EXISTS idx_webauthn_user_id
    ON webauthn_credentials(user_id)
  `

  await db`
    CREATE INDEX IF NOT EXISTS idx_webauthn_address
    ON webauthn_credentials(address)
  `

  // Migration: Add nickname change tracking columns if they don't exist
  // Uses DO $$ block which is idempotent - safe to run multiple times
  await db.unsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'nickname_change_count'
      ) THEN
        ALTER TABLE profiles ADD COLUMN nickname_change_count INTEGER DEFAULT 0;
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'last_nickname_change'
      ) THEN
        ALTER TABLE profiles ADD COLUMN last_nickname_change TIMESTAMP WITH TIME ZONE;
      END IF;
    END $$;
  `)

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
