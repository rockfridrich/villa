import { randomBytes } from 'crypto'

/**
 * Generate a secure API key for developer apps
 *
 * Format: vk_live_<32 random hex chars>
 * Example: vk_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
 */
export function generateApiKey(): string {
  const randomHex = randomBytes(32).toString('hex')
  return `vk_live_${randomHex}`
}

/**
 * Generate a unique app ID
 *
 * Format: app_<16 random hex chars>
 * Example: app_a1b2c3d4e5f6g7h8
 */
export function generateAppId(): string {
  const randomHex = randomBytes(16).toString('hex')
  return `app_${randomHex}`
}

/**
 * Validate API key format
 *
 * Must start with vk_live_ and have 32 hex characters
 */
export function isValidApiKey(apiKey: string): boolean {
  return /^vk_live_[a-f0-9]{64}$/.test(apiKey)
}

/**
 * Validate app ID format
 *
 * Must start with app_ and have 16 hex characters
 */
export function isValidAppId(appId: string): boolean {
  return /^app_[a-f0-9]{32}$/.test(appId)
}

/**
 * Mask API key for display (show only first and last 4 chars)
 *
 * Example: vk_live_a1b2...o5p6
 */
export function maskApiKey(apiKey: string): string {
  if (!isValidApiKey(apiKey)) {
    return '***'
  }

  const prefix = apiKey.slice(0, 12) // vk_live_a1b2
  const suffix = apiKey.slice(-4) // o5p6
  return `${prefix}...${suffix}`
}
