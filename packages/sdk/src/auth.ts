/**
 * Authentication Flow
 *
 * Main auth methods using Porto passkey flow via iframe.
 */

import type { Identity, VillaSession } from './types'
import {
  createAuthIframe,
  destroyAuthIframe,
  onMessage,
  type AuthMessage,
} from './iframe'
import { saveSession, loadSession, clearSession, isSessionValid } from './session'

export interface AuthOptions {
  /** Callback when authentication succeeds */
  onSuccess?: (identity: Identity) => void
  /** Callback when authentication fails */
  onError?: (error: Error) => void
  /** Callback when user closes auth flow */
  onClose?: () => void
}

const AUTH_URL = 'https://key.villa.cash/auth'
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

let currentSession: VillaSession | null = null

/**
 * Initializes auth state from localStorage
 */
function initializeAuth(): void {
  if (currentSession === null) {
    currentSession = loadSession()
  }
}

/**
 * Signs in a user via Porto passkey flow
 *
 * Creates fullscreen iframe, waits for auth completion.
 *
 * @param options - Auth flow callbacks
 * @returns Promise resolving to user identity
 */
export async function signIn(options?: AuthOptions): Promise<Identity> {
  return new Promise((resolve, reject) => {
    // Create auth iframe
    const iframe = createAuthIframe({ url: AUTH_URL })

    // Set up message listener
    const cleanup = onMessage((message: AuthMessage) => {
      switch (message.type) {
        case 'AUTH_SUCCESS': {
          // Save session
          const session: VillaSession = {
            identity: message.identity,
            expiresAt: Date.now() + SESSION_DURATION_MS,
            isValid: true,
          }
          saveSession(session)
          currentSession = session

          // Clean up iframe
          cleanup()
          destroyAuthIframe()

          // Call success callback
          options?.onSuccess?.(message.identity)

          resolve(message.identity)
          break
        }

        case 'AUTH_ERROR': {
          const error = new Error(message.error)

          // Clean up iframe
          cleanup()
          destroyAuthIframe()

          // Call error callback
          options?.onError?.(error)

          reject(error)
          break
        }

        case 'AUTH_CLOSE': {
          // User closed the auth flow
          const error = new Error('Authentication cancelled by user')

          // Clean up iframe
          cleanup()
          destroyAuthIframe()

          // Call close callback
          options?.onClose?.()

          reject(error)
          break
        }
      }
    })

    // Add iframe load error handling
    iframe.onerror = () => {
      const error = new Error('Failed to load authentication page')
      cleanup()
      destroyAuthIframe()
      options?.onError?.(error)
      reject(error)
    }
  })
}

/**
 * Signs out the current user
 *
 * Clears session from localStorage and memory.
 */
export async function signOut(): Promise<void> {
  clearSession()
  currentSession = null
}

/**
 * Checks if user is currently authenticated
 *
 * @returns true if user has valid session
 */
export function isAuthenticated(): boolean {
  initializeAuth()

  if (!currentSession) {
    return false
  }

  // Re-validate session
  if (!isSessionValid(currentSession)) {
    clearSession()
    currentSession = null
    return false
  }

  return true
}

/**
 * Gets the current user's identity
 *
 * @returns Identity if authenticated, null otherwise
 */
export function getIdentity(): Identity | null {
  initializeAuth()

  if (!isAuthenticated()) {
    return null
  }

  return currentSession?.identity || null
}
