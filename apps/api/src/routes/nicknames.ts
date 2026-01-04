import { Hono } from 'hono'
import type { Address, Hex } from 'viem'
import { verifyNicknameClaimSignature } from '../lib/signature'

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
 * In-memory storage for nicknames (will be replaced with database)
 * Maps nickname -> address
 */
const nicknameStore = new Map<string, string>()
const addressStore = new Map<string, string>()

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
nicknames.get('/check/:nickname', (c) => {
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

  const taken = nicknameStore.has(normalized)

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

    // Check if already taken
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

    // Check if address already has a nickname
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
      ens: `${normalized}.proofofretreat.eth`,
    })
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
nicknames.get('/resolve/:nickname', (c) => {
  const nickname = c.req.param('nickname')
  const normalized = normalizeNickname(nickname)

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
    ens: `${normalized}.proofofretreat.eth`,
  })
})

/**
 * GET /nicknames/reverse/:address
 * Reverse lookup - get nickname for address
 */
nicknames.get('/reverse/:address', (c) => {
  const address = c.req.param('address')
  const normalized = address.toLowerCase()

  const nickname = addressStore.get(normalized)

  if (!nickname) {
    return c.json(
      {
        error: 'No nickname found for this address',
      },
      404
    )
  }

  return c.json({
    address: normalized,
    nickname,
    ens: `${nickname}.proofofretreat.eth`,
  })
})

export default nicknames
