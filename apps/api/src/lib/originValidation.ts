/**
 * Validate allowed origin URL format
 *
 * Requirements:
 * - Must be valid URL
 * - Must use https:// (or http://localhost for development)
 * - No wildcards in domain (security risk)
 * - No paths, query params, or fragments
 */
export function validateOrigin(origin: string): {
  valid: boolean
  error?: string
} {
  try {
    const url = new URL(origin)

    // Must be https or localhost
    if (url.protocol === 'http:') {
      if (url.hostname !== 'localhost' && !url.hostname.match(/^127\.\d+\.\d+\.\d+$/)) {
        return {
          valid: false,
          error: 'HTTP only allowed for localhost',
        }
      }
    } else if (url.protocol !== 'https:') {
      return {
        valid: false,
        error: 'Only HTTPS and localhost HTTP allowed',
      }
    }

    // No wildcards in hostname
    if (url.hostname.includes('*')) {
      return {
        valid: false,
        error: 'Wildcards not allowed in origin',
      }
    }

    // No paths, query params, or fragments
    if (url.pathname !== '/' || url.search || url.hash) {
      return {
        valid: false,
        error: 'Origin must be protocol + domain only (no path, query, or hash)',
      }
    }

    // No default ports in origin string
    const originWithoutPort = `${url.protocol}//${url.hostname}`
    if (
      (url.protocol === 'https:' && url.port === '443') ||
      (url.protocol === 'http:' && url.port === '80')
    ) {
      return {
        valid: false,
        error: 'Do not include default ports (80/443) in origin',
      }
    }

    return { valid: true }
  } catch (error) {
    return {
      valid: false,
      error: 'Invalid URL format',
    }
  }
}

/**
 * Validate array of origins
 *
 * Returns first validation error, or success if all valid
 */
export function validateOrigins(origins: string[]): {
  valid: boolean
  error?: string
  invalidOrigin?: string
} {
  if (!Array.isArray(origins)) {
    return {
      valid: false,
      error: 'Origins must be an array',
    }
  }

  if (origins.length === 0) {
    return {
      valid: false,
      error: 'At least one origin is required',
    }
  }

  if (origins.length > 10) {
    return {
      valid: false,
      error: 'Maximum 10 origins allowed',
    }
  }

  // Check for duplicates
  const uniqueOrigins = new Set(origins)
  if (uniqueOrigins.size !== origins.length) {
    return {
      valid: false,
      error: 'Duplicate origins not allowed',
    }
  }

  // Validate each origin
  for (const origin of origins) {
    if (typeof origin !== 'string') {
      return {
        valid: false,
        error: 'Each origin must be a string',
        invalidOrigin: String(origin),
      }
    }

    const validation = validateOrigin(origin)
    if (!validation.valid) {
      return {
        valid: false,
        error: validation.error,
        invalidOrigin: origin,
      }
    }
  }

  return { valid: true }
}

/**
 * Normalize origin for storage (remove trailing slash, default ports)
 */
export function normalizeOrigin(origin: string): string {
  try {
    const url = new URL(origin)
    return `${url.protocol}//${url.hostname}${url.port && url.port !== '80' && url.port !== '443' ? `:${url.port}` : ''}`
  } catch {
    return origin
  }
}
