import { Hono } from 'hono'
import { eq, and, gt } from 'drizzle-orm'
import type { Address, Hex } from 'viem'
import { verifyNicknameClaimSignature } from '../lib/signature'
import { getDb, schema } from '../db/client'

const nicknames = new Hono()

/**
 * Reserved nicknames that cannot be claimed
 */
const RESERVED_NICKNAMES = new Set([
  'admin',
  'api',
  'system',
  'test',
  'villa',
  'proof',
  'retreat',
  'village',
  'support',
  'help',
  'mod',
  'moderator',
])

/**
 * In-memory fallback storage (used when DATABASE_URL not set)
 */
const nicknameStore = new Map<string, string>()
const addressStore = new Map<string, string>()

/**
 * Check if database is available
 */
function useDatabase(): boolean {
  return !!process.env.DATABASE_URL
}

/**
 * Normalize nickname to lowercase alphanumeric
 */
function normalizeNickname(nickname: string): string {
  return nickname
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9]/g, '') // Keep only alphanumeric
}

/**
 * Validate nickname format
 */
function validateNickname(nickname: string): { valid: boolean; error?: string } {
  const normalized = normalizeNickname(nickname)

  if (normalized.length < 3) {
    return { valid: false, error: 'Nickname must be at least 3 characters' }
  }

  if (normalized.length > 30) {
    return { valid: false, error: 'Nickname must be 30 characters or less' }
  }

  if (RESERVED_NICKNAMES.has(normalized)) {
    return { valid: false, error: 'This nickname is reserved' }
  }

  return { valid: true }
}

/**
 * GET /nicknames/check/:nickname
 * Check if nickname is available
 */
nicknames.get('/check/:nickname', async (c) => {
  const nickname = c.req.param('nickname')
  const normalized = normalizeNickname(nickname)

  const validation = validateNickname(normalized)
  if (!validation.valid) {
    return c.json({
      available: false,
      normalized,
      reason: 'invalid',
      error: validation.error,
    })
  }

  let taken = false

  if (useDatabase()) {
    const db = getDb()
    const existing = await db
      .select({ id: schema.profiles.id })
      .from(schema.profiles)
      .where(eq(schema.profiles.nicknameNormalized, normalized))
      .limit(1)

    // Also check reservations that haven't expired
    const reserved = await db
      .select({ id: schema.nicknameReservations.id })
      .from(schema.nicknameReservations)
      .where(
        and(
          eq(schema.nicknameReservations.nicknameNormalized, normalized),
          gt(schema.nicknameReservations.expiresAt, new Date())
        )
      )
      .limit(1)

    taken = existing.length > 0 || reserved.length > 0
  } else {
    taken = nicknameStore.has(normalized)
  }

  return c.json({
    available: !taken,
    normalized,
    ...(taken && { reason: 'taken' }),
  })
})

/**
 * POST /nicknames/claim
 * Claim a nickname (requires signature)
 *
 * Body: { nickname: string, address: string, signature: string }
 */
nicknames.post('/claim', async (c) => {
  try {
    const body = await c.req.json()
    const { nickname, address, signature } = body

    if (!nickname || !address || !signature) {
      return c.json(
        {
          success: false,
          error: 'Missing required fields: nickname, address, signature',
        },
        400
      )
    }

    const normalized = normalizeNickname(nickname)

    // Validate format
    const validation = validateNickname(normalized)
    if (!validation.valid) {
      return c.json(
        {
          success: false,
          error: validation.error,
          reason: 'invalid',
        },
        400
      )
    }

    if (useDatabase()) {
      const db = getDb()

      // Check if already taken
      const existing = await db
        .select({ id: schema.profiles.id })
        .from(schema.profiles)
        .where(eq(schema.profiles.nicknameNormalized, normalized))
        .limit(1)

      if (existing.length > 0) {
        return c.json(
          {
            success: false,
            error: 'This nickname is already taken',
            reason: 'taken',
          },
          409
        )
      }

      // Check if address already has a nickname
      const existingProfile = await db
        .select({ id: schema.profiles.id })
        .from(schema.profiles)
        .where(eq(schema.profiles.address, address.toLowerCase()))
        .limit(1)

      if (existingProfile.length > 0) {
        return c.json(
          {
            success: false,
            error: 'This address already has a nickname',
            reason: 'duplicate_address',
          },
          409
        )
      }

      // Verify signature
      const signatureValid = await verifyNicknameClaimSignature(
        normalized,
        address as Address,
        signature as Hex
      )

      if (!signatureValid) {
        return c.json(
          {
            success: false,
            error: 'Invalid signature',
            reason: 'invalid_signature',
          },
          401
        )
      }

      // Create profile with nickname
      const [profile] = await db
        .insert(schema.profiles)
        .values({
          address: address.toLowerCase(),
          nickname: normalized,
          nicknameNormalized: normalized,
        })
        .returning()

      // Log the action
      await db.insert(schema.auditLog).values({
        address: address.toLowerCase(),
        action: 'nickname_claimed',
        details: { nickname: normalized },
      })

      return c.json({
        success: true,
        nickname: normalized,
        address: address.toLowerCase(),
        ens: `${normalized}.villa.eth`,
        profileId: profile.id,
      })
    } else {
      // In-memory fallback
      if (nicknameStore.has(normalized)) {
        return c.json(
          {
            success: false,
            error: 'This nickname is already taken',
            reason: 'taken',
          },
          409
        )
      }

      if (addressStore.has(address.toLowerCase())) {
        return c.json(
          {
            success: false,
            error: 'This address already has a nickname',
            reason: 'duplicate_address',
          },
          409
        )
      }

      // Verify signature
      const signatureValid = await verifyNicknameClaimSignature(
        normalized,
        address as Address,
        signature as Hex
      )

      if (!signatureValid) {
        return c.json(
          {
            success: false,
            error: 'Invalid signature',
            reason: 'invalid_signature',
          },
          401
        )
      }

      // Store nickname
      nicknameStore.set(normalized, address.toLowerCase())
      addressStore.set(address.toLowerCase(), normalized)

      return c.json({
        success: true,
        nickname: normalized,
        address: address.toLowerCase(),
        ens: `${normalized}.villa.eth`,
      })
    }
  } catch (error) {
    console.error('Nickname claim error:', error)
    return c.json(
      {
        success: false,
        error: 'Internal server error',
      },
      500
    )
  }
})

/**
 * GET /nicknames/resolve/:nickname
 * Resolve nickname to address
 */
nicknames.get('/resolve/:nickname', async (c) => {
  const nickname = c.req.param('nickname')
  const normalized = normalizeNickname(nickname)

  if (useDatabase()) {
    const db = getDb()
    const [profile] = await db
      .select({
        address: schema.profiles.address,
        nickname: schema.profiles.nickname,
      })
      .from(schema.profiles)
      .where(eq(schema.profiles.nicknameNormalized, normalized))
      .limit(1)

    if (!profile) {
      return c.json(
        {
          error: 'Nickname not found',
        },
        404
      )
    }

    return c.json({
      nickname: profile.nickname,
      address: profile.address,
      ens: `${profile.nickname}.villa.eth`,
    })
  } else {
    const address = nicknameStore.get(normalized)

    if (!address) {
      return c.json(
        {
          error: 'Nickname not found',
        },
        404
      )
    }

    return c.json({
      nickname: normalized,
      address,
      ens: `${normalized}.villa.eth`,
    })
  }
})

/**
 * GET /nicknames/reverse/:address
 * Reverse lookup - get nickname for address
 */
nicknames.get('/reverse/:address', async (c) => {
  const address = c.req.param('address')
  const normalizedAddress = address.toLowerCase()

  if (useDatabase()) {
    const db = getDb()
    const [profile] = await db
      .select({
        address: schema.profiles.address,
        nickname: schema.profiles.nickname,
        avatarStyle: schema.profiles.avatarStyle,
        avatarSeed: schema.profiles.avatarSeed,
        avatarGender: schema.profiles.avatarGender,
      })
      .from(schema.profiles)
      .where(eq(schema.profiles.address, normalizedAddress))
      .limit(1)

    if (!profile || !profile.nickname) {
      return c.json(
        {
          error: 'No nickname found for this address',
        },
        404
      )
    }

    return c.json({
      address: profile.address,
      nickname: profile.nickname,
      ens: `${profile.nickname}.villa.eth`,
      avatar: {
        style: profile.avatarStyle,
        seed: profile.avatarSeed,
        gender: profile.avatarGender,
      },
    })
  } else {
    const nickname = addressStore.get(normalizedAddress)

    if (!nickname) {
      return c.json(
        {
          error: 'No nickname found for this address',
        },
        404
      )
    }

    return c.json({
      address: normalizedAddress,
      nickname,
      ens: `${nickname}.villa.eth`,
    })
  }
})

export default nicknames
