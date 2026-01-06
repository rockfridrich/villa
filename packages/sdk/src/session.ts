/**
 * Session Management
 *
 * Handles localStorage persistence for authenticated sessions.
 * SECURITY: All localStorage data is validated with Zod before use.
 */

import { z } from 'zod'
import type { VillaSession } from './types'

const SESSION_KEY = 'villa_session'

/**
 * Zod schema for session validation
 * SECURITY: Never trust localStorage data - always validate
 */
const SessionSchema = z.object({
  identity: z.object({
    address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    nickname: z.string().min(1).max(50),
    avatar: z.object({
      style: z.enum(['adventurer', 'avataaars', 'bottts', 'thumbs']),
      seed: z.string(),
      gender: z.enum(['male', 'female', 'other']).optional(),
    }),
  }),
  expiresAt: z.number(),
  createdAt: z.number().optional(),
})

/**
 * Saves a session to localStorage
 */
export function saveSession(session: VillaSession): void {
  try {
    // Validate before saving to ensure data integrity
    const validated = SessionSchema.safeParse(session)
    if (!validated.success) {
      console.error('[Villa SDK] Invalid session data:', validated.error)
      return
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(validated.data))
  } catch (error) {
    console.error('[Villa SDK] Failed to save session:', error)
  }
}

/**
 * Loads session from localStorage
 *
 * SECURITY: Validates all parsed data with Zod schema
 * @returns Session if found and valid, null otherwise
 */
export function loadSession(): VillaSession | null {
  try {
    const stored = localStorage.getItem(SESSION_KEY)
    if (!stored) return null

    // SECURITY: Parse and validate in one step - never trust raw JSON
    let parsed: unknown
    try {
      parsed = JSON.parse(stored)
    } catch {
      console.error('[Villa SDK] Corrupted session data in localStorage')
      clearSession()
      return null
    }

    // Validate schema before using
    const result = SessionSchema.safeParse(parsed)
    if (!result.success) {
      console.error('[Villa SDK] Invalid session format:', result.error.message)
      clearSession()
      return null
    }

    const session = result.data as VillaSession

    // Check if session is still valid (not expired)
    if (!isSessionValid(session)) {
      clearSession()
      return null
    }

    return session
  } catch (error) {
    console.error('[Villa SDK] Failed to load session:', error)
    return null
  }
}

/**
 * Clears the session from localStorage
 */
export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch (error) {
    console.error('[Villa SDK] Failed to clear session:', error)
  }
}

/**
 * Checks if a session is still valid
 *
 * @param session - Session to validate
 * @returns true if session is valid and not expired
 */
export function isSessionValid(session: VillaSession): boolean {
  if (!session || !session.identity || !session.expiresAt) {
    return false
  }

  // Check if session has expired
  const now = Date.now()
  return session.expiresAt > now
}
