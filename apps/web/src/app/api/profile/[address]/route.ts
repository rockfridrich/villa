import { NextResponse } from 'next/server'
import { getDb, ensureTables } from '@/lib/db'
import type { ProfileRow } from '@/lib/db/schema'
import { rowToProfile } from '@/lib/db/schema'

// Disable caching - data can change
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/profile/:address
 * Get a user's profile by wallet address
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

  // Normalize address to lowercase
  const normalizedAddress = address.toLowerCase()

  try {
    await ensureTables()
    const sql = getDb()

    const rows = await sql<ProfileRow[]>`
      SELECT *
      FROM profiles
      WHERE LOWER(address) = ${normalizedAddress}
      LIMIT 1
    `

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(rowToProfile(rows[0]))
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
