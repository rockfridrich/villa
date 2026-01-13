import { NextResponse } from 'next/server'
import { getDb, ensureTables, isDatabaseAvailable } from '@/lib/db'
import type { ProfileRow } from '@/lib/db/schema'

// Disable caching - data can change
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/nicknames/reverse/:address
 * Look up nickname by wallet address
 * Used for returning user detection
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params

  // Validate address format
  if (!address || !/^0x[a-fA-F0-9]{40}$/i.test(address)) {
    return NextResponse.json(
      { error: 'Invalid address format' },
      { status: 400 }
    )
  }

  // Graceful degradation: If no DB, return 404 (user not found)
  // This allows CI E2E tests to run without database access
  if (!isDatabaseAvailable()) {
    return NextResponse.json(null, { status: 404 })
  }

  // Normalize address to lowercase
  const normalizedAddress = address.toLowerCase()

  try {
    await ensureTables()
    const sql = getDb()

    const rows = await sql<ProfileRow[]>`
      SELECT address, nickname, nickname_normalized
      FROM profiles
      WHERE LOWER(address) = ${normalizedAddress}
      LIMIT 1
    `

    if (rows.length === 0) {
      return NextResponse.json(null, { status: 404 })
    }

    const profile = rows[0]

    return NextResponse.json({
      address: profile.address,
      nickname: profile.nickname,
      ens: profile.nickname ? `${profile.nickname}.villa.cash` : null,
    })
  } catch (error) {
    console.error('Error looking up nickname by address:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
