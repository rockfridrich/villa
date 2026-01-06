import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import type { ProfileRow } from '@/lib/db/schema'

// Disable caching - availability can change
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Reserved/banned nicknames
const RESERVED_NICKNAMES = new Set([
  'admin', 'administrator', 'root', 'system',
  'villa', 'support', 'help', 'info',
  'api', 'www', 'mail', 'email',
  'null', 'undefined', 'test', 'demo',
])

/**
 * Normalize nickname for comparison
 * - Lowercase
 * - Remove special characters except underscore
 */
function normalizeNickname(nickname: string): string {
  return nickname
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
}

/**
 * Validate nickname format
 */
function validateNickname(nickname: string): { valid: boolean; reason?: string } {
  // Length check
  if (nickname.length < 3) {
    return { valid: false, reason: 'Nickname must be at least 3 characters' }
  }
  if (nickname.length > 30) {
    return { valid: false, reason: 'Nickname must be 30 characters or less' }
  }

  // Format check - alphanumeric and underscore only
  if (!/^[a-zA-Z0-9_]+$/.test(nickname)) {
    return { valid: false, reason: 'Only letters, numbers, and underscores allowed' }
  }

  // Must start with letter
  if (!/^[a-zA-Z]/.test(nickname)) {
    return { valid: false, reason: 'Nickname must start with a letter' }
  }

  // Reserved check
  const normalized = normalizeNickname(nickname)
  if (RESERVED_NICKNAMES.has(normalized)) {
    return { valid: false, reason: 'This nickname is reserved' }
  }

  return { valid: true }
}

/**
 * GET /api/nicknames/check/:nickname
 * Check if a nickname is available
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ nickname: string }> }
) {
  const { nickname } = await params

  if (!nickname) {
    return NextResponse.json(
      { available: false, normalized: '', reason: 'invalid', error: 'Nickname is required' },
      { status: 400 }
    )
  }

  const normalized = normalizeNickname(nickname)

  // Validate format
  const validation = validateNickname(nickname)
  if (!validation.valid) {
    return NextResponse.json({
      available: false,
      normalized,
      reason: 'invalid',
      error: validation.reason,
    })
  }

  try {
    const sql = getDb()

    // Check if nickname exists
    const rows = await sql<ProfileRow[]>`
      SELECT address
      FROM profiles
      WHERE nickname_normalized = ${normalized}
      LIMIT 1
    `

    if (rows.length > 0) {
      // Nickname taken - suggest alternatives
      const suggestions = [
        `${normalized}_`,
        `${normalized}1`,
        `${normalized}2`,
      ]

      return NextResponse.json({
        available: false,
        normalized,
        reason: 'taken',
        suggestions,
      })
    }

    return NextResponse.json({
      available: true,
      normalized,
    })
  } catch (error) {
    console.error('Error checking nickname:', error)
    return NextResponse.json(
      { available: false, normalized, reason: 'invalid', error: 'Internal server error' },
      { status: 500 }
    )
  }
}
