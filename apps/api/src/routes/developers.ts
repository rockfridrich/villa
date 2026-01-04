import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { getDb, schema, isUsingFallback } from '../db/client'
import { verifyWalletSignature, getVerifiedAddress, getRequestBody } from '../middleware/verifyWalletSignature'
import { rateLimitByWallet } from '../middleware/rateLimitByWallet'
import { generateApiKey, generateAppId, maskApiKey, isValidAppId } from '../lib/apiKey'
import { validateOrigins, normalizeOrigin } from '../lib/originValidation'

const developers = new Hono()

/**
 * In-memory fallback storage (used when DATABASE_URL not set)
 */
const appStore = new Map<string, schema.DeveloperApp>()
const appsByOwner = new Map<string, Set<string>>()
const apiKeyToAppId = new Map<string, string>()

/**
 * Validate app name
 */
function validateAppName(name: string): { valid: boolean; error?: string } {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'App name is required' }
  }

  const trimmed = name.trim()
  if (trimmed.length < 3) {
    return { valid: false, error: 'App name must be at least 3 characters' }
  }

  if (trimmed.length > 100) {
    return { valid: false, error: 'App name must be 100 characters or less' }
  }

  // Only allow alphanumeric, spaces, hyphens, underscores
  if (!/^[a-zA-Z0-9\s\-_]+$/.test(trimmed)) {
    return {
      valid: false,
      error: 'App name can only contain letters, numbers, spaces, hyphens, and underscores',
    }
  }

  return { valid: true }
}

/**
 * Validate app description
 */
function validateDescription(description: string | undefined): {
  valid: boolean
  error?: string
} {
  if (description === undefined || description === null) {
    return { valid: true } // Optional
  }

  if (typeof description !== 'string') {
    return { valid: false, error: 'Description must be a string' }
  }

  if (description.trim().length > 500) {
    return { valid: false, error: 'Description must be 500 characters or less' }
  }

  return { valid: true }
}

/**
 * POST /developers/apps
 * Register a new app (requires wallet signature)
 *
 * Body:
 * {
 *   name: string,
 *   description?: string,
 *   allowedOrigins: string[],
 *   message: string,
 *   signature: string,
 *   address: string
 * }
 */
developers.post('/apps', verifyWalletSignature, rateLimitByWallet, async (c) => {
  try {
    const address = getVerifiedAddress(c)
    const body = getRequestBody(c)
    const { name, description, allowedOrigins } = body

    // Validate app name
    const nameValidation = validateAppName(name)
    if (!nameValidation.valid) {
      return c.json(
        {
          error: nameValidation.error,
          field: 'name',
        },
        400
      )
    }

    // Validate description
    const descriptionValidation = validateDescription(description)
    if (!descriptionValidation.valid) {
      return c.json(
        {
          error: descriptionValidation.error,
          field: 'description',
        },
        400
      )
    }

    // Validate origins
    const originsValidation = validateOrigins(allowedOrigins)
    if (!originsValidation.valid) {
      return c.json(
        {
          error: originsValidation.error,
          field: 'allowedOrigins',
          invalidOrigin: originsValidation.invalidOrigin,
        },
        400
      )
    }

    // Generate app ID and API key
    const appId = generateAppId()
    const apiKey = generateApiKey()
    const normalizedOrigins = allowedOrigins.map(normalizeOrigin)

    const now = new Date()

    if (isUsingFallback()) {
      // Use in-memory fallback
      const app: schema.DeveloperApp = {
        id: appId,
        name: name.trim(),
        description: description?.trim() || null,
        ownerAddress: address,
        apiKey,
        allowedOrigins: normalizedOrigins,
        rateLimit: 100,
        createdAt: now,
        updatedAt: now,
      }

      appStore.set(appId, app)
      apiKeyToAppId.set(apiKey, appId)

      // Track by owner
      if (!appsByOwner.has(address)) {
        appsByOwner.set(address, new Set())
      }
      appsByOwner.get(address)!.add(appId)

      return c.json({
        id: appId,
        name: app.name,
        description: app.description,
        apiKey,
        allowedOrigins: normalizedOrigins,
        rateLimit: app.rateLimit,
        createdAt: app.createdAt!.toISOString(),
      })
    } else {
      // Use database
      const db = getDb()

      const [app] = await db
        .insert(schema.developerApps)
        .values({
          id: appId,
          name: name.trim(),
          description: description?.trim() || null,
          ownerAddress: address,
          apiKey,
          allowedOrigins: normalizedOrigins,
          rateLimit: 100,
        })
        .returning()

      // Log the action
      await db.insert(schema.auditLog).values({
        address,
        action: 'app_registered',
        details: {
          appId,
          appName: name.trim(),
          origins: normalizedOrigins,
        },
      })

      return c.json({
        id: app.id,
        name: app.name,
        description: app.description,
        apiKey: app.apiKey,
        allowedOrigins: app.allowedOrigins || [],
        rateLimit: app.rateLimit || 100,
        createdAt: app.createdAt?.toISOString() || new Date().toISOString(),
      })
    }
  } catch (error) {
    console.error('App registration error:', error)
    return c.json(
      {
        error: 'Failed to register app',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

/**
 * GET /developers/apps
 * List apps for authenticated wallet
 */
developers.get('/apps', verifyWalletSignature, async (c) => {
  try {
    const address = getVerifiedAddress(c)

    if (isUsingFallback()) {
      // Use in-memory fallback
      const ownerApps = appsByOwner.get(address) || new Set()
      const apps = Array.from(ownerApps)
        .map((appId) => appStore.get(appId))
        .filter((app): app is schema.DeveloperApp => app !== undefined)
        .map((app) => ({
          id: app.id,
          name: app.name,
          description: app.description,
          apiKey: maskApiKey(app.apiKey),
          allowedOrigins: app.allowedOrigins || [],
          rateLimit: app.rateLimit || 100,
          createdAt: app.createdAt!.toISOString(),
          updatedAt: app.updatedAt!.toISOString(),
        }))

      return c.json({
        apps,
        total: apps.length,
      })
    } else {
      // Use database
      const db = getDb()

      const apps = await db
        .select()
        .from(schema.developerApps)
        .where(eq(schema.developerApps.ownerAddress, address))
        .orderBy(schema.developerApps.createdAt)

      return c.json({
        apps: apps.map((app) => ({
          id: app.id,
          name: app.name,
          description: app.description,
          apiKey: maskApiKey(app.apiKey),
          allowedOrigins: app.allowedOrigins || [],
          rateLimit: app.rateLimit || 100,
          createdAt: app.createdAt?.toISOString() || new Date().toISOString(),
          updatedAt: app.updatedAt?.toISOString() || new Date().toISOString(),
        })),
        total: apps.length,
      })
    }
  } catch (error) {
    console.error('List apps error:', error)
    return c.json(
      {
        error: 'Failed to list apps',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

/**
 * GET /developers/apps/:id
 * Get app details (only owner can access)
 */
developers.get('/apps/:id', verifyWalletSignature, async (c) => {
  try {
    const address = getVerifiedAddress(c)
    const appId = c.req.param('id')

    // Validate app ID format
    if (!isValidAppId(appId)) {
      return c.json(
        {
          error: 'Invalid app ID format',
        },
        400
      )
    }

    if (isUsingFallback()) {
      // Use in-memory fallback
      const app = appStore.get(appId)

      if (!app) {
        return c.json(
          {
            error: 'App not found',
          },
          404
        )
      }

      // Check ownership
      if (app.ownerAddress !== address) {
        return c.json(
          {
            error: 'Forbidden',
            details: 'You do not own this app',
          },
          403
        )
      }

      return c.json({
        id: app.id,
        name: app.name,
        description: app.description,
        apiKey: app.apiKey, // Full API key only for owner
        allowedOrigins: app.allowedOrigins || [],
        rateLimit: app.rateLimit || 100,
        createdAt: app.createdAt!.toISOString(),
        updatedAt: app.updatedAt!.toISOString(),
      })
    } else {
      // Use database
      const db = getDb()

      const [app] = await db
        .select()
        .from(schema.developerApps)
        .where(eq(schema.developerApps.id, appId))
        .limit(1)

      if (!app) {
        return c.json(
          {
            error: 'App not found',
          },
          404
        )
      }

      // Check ownership
      if (app.ownerAddress !== address) {
        return c.json(
          {
            error: 'Forbidden',
            details: 'You do not own this app',
          },
          403
        )
      }

      return c.json({
        id: app.id,
        name: app.name,
        description: app.description,
        apiKey: app.apiKey, // Full API key only for owner
        allowedOrigins: app.allowedOrigins || [],
        rateLimit: app.rateLimit || 100,
        createdAt: app.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: app.updatedAt?.toISOString() || new Date().toISOString(),
      })
    }
  } catch (error) {
    console.error('Get app error:', error)
    return c.json(
      {
        error: 'Failed to get app',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

export default developers
