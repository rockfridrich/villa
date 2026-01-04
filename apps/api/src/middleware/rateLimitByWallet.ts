import { Context, Next } from 'hono'
import { eq, and, gt } from 'drizzle-orm'
import { getDb, schema, isUsingFallback } from '../db/client'

/**
 * Rate limit configuration for app registrations
 */
const APP_REGISTRATION_LIMIT = 5 // 5 apps per wallet per day
const WINDOW_DURATION_MS = 24 * 60 * 60 * 1000 // 24 hours

/**
 * In-memory fallback for rate limiting (when DB unavailable)
 */
const rateLimitStore = new Map<
  string,
  { count: number; windowStart: Date }
>()

/**
 * Middleware to rate limit app registration by wallet address
 *
 * Limits each wallet to APP_REGISTRATION_LIMIT registrations per day.
 * Requires verifiedAddress to be set in context (use after verifyWalletSignature).
 */
export async function rateLimitByWallet(c: Context, next: Next) {
  const address = c.get('verifiedAddress')

  if (!address) {
    return c.json(
      {
        error: 'Unauthorized',
        details: 'Wallet address not verified',
      },
      401
    )
  }

  const normalizedAddress = address.toLowerCase()
  const now = new Date()

  try {
    if (isUsingFallback()) {
      // Use in-memory fallback
      const limit = rateLimitStore.get(normalizedAddress)

      if (!limit) {
        // First registration
        rateLimitStore.set(normalizedAddress, {
          count: 1,
          windowStart: now,
        })
        await next()
        return
      }

      // Check if window has expired
      const windowAge = now.getTime() - limit.windowStart.getTime()
      if (windowAge > WINDOW_DURATION_MS) {
        // Reset window
        limit.count = 1
        limit.windowStart = now
        await next()
        return
      }

      // Check if limit exceeded
      if (limit.count >= APP_REGISTRATION_LIMIT) {
        const resetAt = new Date(limit.windowStart.getTime() + WINDOW_DURATION_MS)
        const resetInHours = Math.ceil((resetAt.getTime() - now.getTime()) / (60 * 60 * 1000))

        return c.json(
          {
            error: 'Rate limit exceeded',
            limit: APP_REGISTRATION_LIMIT,
            resetIn: `${resetInHours} hours`,
            resetAt: resetAt.toISOString(),
          },
          429
        )
      }

      // Increment count
      limit.count++
      await next()
    } else {
      // Use database
      const db = getDb()

      // Get or create rate limit record
      const [limitRecord] = await db
        .select()
        .from(schema.appRegistrationLimits)
        .where(eq(schema.appRegistrationLimits.address, normalizedAddress))
        .limit(1)

      if (!limitRecord) {
        // First registration - create record
        await db.insert(schema.appRegistrationLimits).values({
          address: normalizedAddress,
          registrationsToday: 1,
          windowStartsAt: now,
        })
        await next()
        return
      }

      // Check if window has expired
      const windowAge = now.getTime() - limitRecord.windowStartsAt.getTime()
      if (windowAge > WINDOW_DURATION_MS) {
        // Reset window
        await db
          .update(schema.appRegistrationLimits)
          .set({
            registrationsToday: 1,
            windowStartsAt: now,
          })
          .where(eq(schema.appRegistrationLimits.address, normalizedAddress))

        await next()
        return
      }

      // Check if limit exceeded
      if (limitRecord.registrationsToday >= APP_REGISTRATION_LIMIT) {
        const resetAt = new Date(limitRecord.windowStartsAt.getTime() + WINDOW_DURATION_MS)
        const resetInHours = Math.ceil((resetAt.getTime() - now.getTime()) / (60 * 60 * 1000))

        return c.json(
          {
            error: 'Rate limit exceeded',
            limit: APP_REGISTRATION_LIMIT,
            resetIn: `${resetInHours} hours`,
            resetAt: resetAt.toISOString(),
          },
          429
        )
      }

      // Increment count
      await db
        .update(schema.appRegistrationLimits)
        .set({
          registrationsToday: limitRecord.registrationsToday + 1,
        })
        .where(eq(schema.appRegistrationLimits.address, normalizedAddress))

      await next()
    }
  } catch (error) {
    console.error('Rate limit check error:', error)
    return c.json(
      {
        error: 'Rate limit check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
}

/**
 * Reset rate limit for an address (for testing)
 */
export async function resetRateLimit(address: string): Promise<void> {
  const normalizedAddress = address.toLowerCase()

  if (isUsingFallback()) {
    rateLimitStore.delete(normalizedAddress)
  } else {
    const db = getDb()
    await db
      .delete(schema.appRegistrationLimits)
      .where(eq(schema.appRegistrationLimits.address, normalizedAddress))
  }
}
