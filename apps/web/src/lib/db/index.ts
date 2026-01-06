/**
 * Database connection module
 * Uses postgres.js for efficient connection pooling
 */
import postgres from 'postgres'

// Singleton connection pool
let sql: ReturnType<typeof postgres> | null = null

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
