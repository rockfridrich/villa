import { NextResponse } from 'next/server'
import postgres from 'postgres'

// Disable caching for health check - must return fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Database health check endpoint
 * Tests connection to PostgreSQL and returns status
 */
export async function GET() {
  const dbUrl = process.env.DATABASE_URL

  if (!dbUrl) {
    return NextResponse.json({
      status: 'unconfigured',
      message: 'DATABASE_URL not set',
      timestamp: new Date().toISOString(),
    })
  }

  const startTime = Date.now()

  try {
    const sql = postgres(dbUrl, {
      connect_timeout: 10,
      idle_timeout: 5,
      max: 1,
    })

    // Test query
    const result = await sql`SELECT 1 as test, NOW() as server_time`
    await sql.end()

    const latencyMs = Date.now() - startTime

    return NextResponse.json({
      status: 'healthy',
      latencyMs,
      serverTime: result[0].server_time,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    const latencyMs = Date.now() - startTime

    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        latencyMs,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}
