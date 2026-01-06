import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getDb, ensureTables } from '@/lib/db'
import type { ProfileRow } from '@/lib/db/schema'
import { rowToProfile, canChangeNickname, MAX_NICKNAME_CHANGES, NICKNAME_CHANGE_COOLDOWN_MS } from '@/lib/db/schema'

// Disable caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Validation schema for profile creation
const createProfileSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/i, 'Invalid address format'),
  nickname: z.string()
    .min(3, 'Nickname must be at least 3 characters')
    .max(30, 'Nickname must be 30 characters or less')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Nickname must start with a letter and contain only letters, numbers, and underscores'),
  avatar: z.object({
    style: z.string(),
    selection: z.string(),
    variant: z.number().int().min(0),
  }).optional(),
})

/**
 * POST /api/profile
 * Create or update a user profile
 */
export async function POST(request: Request) {
  try {
    // Ensure tables exist on first request
    await ensureTables()

    const body = await request.json()
    const parsed = createProfileSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid request' },
        { status: 400 }
      )
    }

    const { address, nickname, avatar } = parsed.data
    const normalizedAddress = address.toLowerCase()
    const normalizedNickname = nickname.toLowerCase().replace(/[^a-z0-9_]/g, '')

    const sql = getDb()

    // Check if nickname is already taken by another address
    const existing = await sql<ProfileRow[]>`
      SELECT address FROM profiles
      WHERE nickname_normalized = ${normalizedNickname}
      AND LOWER(address) != ${normalizedAddress}
      LIMIT 1
    `

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Nickname is already taken' },
        { status: 409 }
      )
    }

    // Upsert profile
    const rows = await sql<ProfileRow[]>`
      INSERT INTO profiles (
        address,
        nickname,
        nickname_normalized,
        avatar_style,
        avatar_selection,
        avatar_variant
      ) VALUES (
        ${normalizedAddress},
        ${nickname},
        ${normalizedNickname},
        ${avatar?.style ?? null},
        ${avatar?.selection ?? null},
        ${avatar?.variant ?? null}
      )
      ON CONFLICT (address) DO UPDATE SET
        nickname = EXCLUDED.nickname,
        nickname_normalized = EXCLUDED.nickname_normalized,
        avatar_style = EXCLUDED.avatar_style,
        avatar_selection = EXCLUDED.avatar_selection,
        avatar_variant = EXCLUDED.avatar_variant,
        updated_at = NOW()
      RETURNING *
    `

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create profile' },
        { status: 500 }
      )
    }

    return NextResponse.json(rowToProfile(rows[0]), { status: 201 })
  } catch (error) {
    console.error('Error creating profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Validation schema for nickname update
const updateNicknameSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/i, 'Invalid address format'),
  newNickname: z.string()
    .min(3, 'Nickname must be at least 3 characters')
    .max(30, 'Nickname must be 30 characters or less')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Nickname must start with a letter and contain only letters, numbers, and underscores'),
})

/**
 * PATCH /api/profile
 * Update user's nickname (limited changes allowed)
 */
export async function PATCH(request: Request) {
  try {
    await ensureTables()

    const body = await request.json()
    const parsed = updateNicknameSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid request' },
        { status: 400 }
      )
    }

    const { address, newNickname } = parsed.data
    const normalizedAddress = address.toLowerCase()
    const normalizedNickname = newNickname.toLowerCase().replace(/[^a-z0-9_]/g, '')

    const sql = getDb()

    // Get current profile to check nickname change eligibility
    const currentProfile = await sql<ProfileRow[]>`
      SELECT * FROM profiles
      WHERE LOWER(address) = ${normalizedAddress}
      LIMIT 1
    `

    if (currentProfile.length === 0) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    const profile = currentProfile[0]

    // Check if user can change nickname
    if (!canChangeNickname(profile)) {
      // Calculate remaining cooldown
      let message = `You have reached the maximum of ${MAX_NICKNAME_CHANGES} nickname change(s)`

      if (profile.last_nickname_change && profile.nickname_change_count < MAX_NICKNAME_CHANGES) {
        const lastChange = new Date(profile.last_nickname_change).getTime()
        const nextAllowed = new Date(lastChange + NICKNAME_CHANGE_COOLDOWN_MS)
        message = `You can change your nickname again after ${nextAllowed.toLocaleDateString()}`
      }

      return NextResponse.json(
        { error: message, canChangeNickname: false },
        { status: 403 }
      )
    }

    // Check if new nickname is same as current
    if (profile.nickname_normalized === normalizedNickname) {
      return NextResponse.json(
        { error: 'New nickname must be different from current nickname' },
        { status: 400 }
      )
    }

    // Check if new nickname is taken by another address
    const existing = await sql<ProfileRow[]>`
      SELECT address FROM profiles
      WHERE nickname_normalized = ${normalizedNickname}
      AND LOWER(address) != ${normalizedAddress}
      LIMIT 1
    `

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'This nickname is already taken' },
        { status: 409 }
      )
    }

    // Update nickname with change tracking
    const rows = await sql<ProfileRow[]>`
      UPDATE profiles SET
        nickname = ${newNickname},
        nickname_normalized = ${normalizedNickname},
        nickname_change_count = COALESCE(nickname_change_count, 0) + 1,
        last_nickname_change = NOW(),
        updated_at = NOW()
      WHERE LOWER(address) = ${normalizedAddress}
      RETURNING *
    `

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update nickname' },
        { status: 500 }
      )
    }

    return NextResponse.json(rowToProfile(rows[0]))
  } catch (error) {
    console.error('Error updating nickname:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
