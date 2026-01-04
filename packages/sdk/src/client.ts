/**
 * Villa SDK Client
 *
 * Main SDK class providing identity, ENS, and avatar functionality.
 */

import type { AvatarConfig, VillaConfig, Identity, VillaSession } from './types'
import { resolveEns as resolveEnsName, reverseEns as reverseEnsAddress } from './ens'
import { getAvatarUrl as generateAvatarUrl } from './avatar'
import {
  createAuthIframe,
  destroyAuthIframe,
  onMessage,
  type AuthMessage,
} from './iframe'
import { saveSession, loadSession, clearSession, isSessionValid } from './session'

/**
 * Data scopes that apps can request
 */
export type Scope = 'profile' | 'wallet'

/**
 * Sign-in options
 */
export interface SignInOptions {
  /** What data to request from the user */
  scopes?: Scope[]
  /** Optional callback for progress updates */
  onProgress?: (step: SignInProgress) => void
  /** Maximum time to wait for auth (ms). Default: 5 minutes */
  timeout?: number
}

/**
 * Progress steps during sign-in flow
 */
export type SignInProgress =
  | { step: 'opening_auth'; message: 'Opening authentication flow' }
  | { step: 'waiting_for_user'; message: 'Waiting for user to authenticate' }
  | { step: 'processing'; message: 'Processing authentication' }
  | { step: 'complete'; message: 'Authentication complete' }

/**
 * Detailed error codes for sign-in failures
 */
export type SignInErrorCode =
  | 'CANCELLED' // User closed the auth flow
  | 'TIMEOUT' // Auth flow timed out
  | 'NETWORK_ERROR' // Failed to load auth page
  | 'INVALID_CONFIG' // Invalid SDK configuration
  | 'AUTH_ERROR' // General authentication error

/**
 * Sign-in result type
 */
export type SignInResult =
  | { success: true; identity: Identity }
  | { success: false; error: string; code: SignInErrorCode }

const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

/**
 * Villa SDK Client
 *
 * Provides identity resolution, ENS lookups, and avatar generation.
 *
 * @example
 * ```typescript
 * import { Villa } from '@villa/sdk'
 *
 * const villa = new Villa({
 *   appId: 'your-app-id',
 *   environment: 'testnet',
 * })
 *
 * const result = await villa.signIn({
 *   scopes: ['profile', 'wallet'],
 *   onProgress: (step) => console.log(step.message),
 * })
 *
 * if (result.success) {
 *   console.log('Welcome,', result.identity.nickname)
 * }
 * ```
 */
export class Villa {
  private config: Required<VillaConfig>
  private currentSession: VillaSession | null = null
  private authUrl: string

  /**
   * Creates a new Villa SDK instance
   *
   * @param config - SDK configuration
   * @throws {Error} If config is invalid
   */
  constructor(config: VillaConfig) {
    // Validate required fields
    if (!config.appId || typeof config.appId !== 'string') {
      throw new Error('[Villa SDK] appId is required and must be a string')
    }

    if (config.appId.trim().length === 0) {
      throw new Error('[Villa SDK] appId cannot be empty')
    }

    // Set defaults
    this.config = {
      appId: config.appId.trim(),
      network: config.network || 'base',
      apiUrl: config.apiUrl || 'https://api.villa.cash',
    }

    // Determine auth URL based on network
    this.authUrl =
      this.config.network === 'base-sepolia'
        ? 'https://beta.villa.cash/auth'
        : 'https://villa.cash/auth'

    // Try to load existing session
    this.currentSession = loadSession()
  }

  /**
   * Resolves an ENS name to an Ethereum address
   *
   * @param name - ENS name (e.g., 'vitalik.eth' or 'alice.base.eth')
   * @returns Address or null if not found
   */
  async resolveEns(name: string): Promise<string | null> {
    return resolveEnsName(name)
  }

  /**
   * Performs reverse ENS lookup (address to name)
   *
   * @param address - Ethereum address
   * @returns ENS name or null if not found
   */
  async reverseEns(address: string): Promise<string | null> {
    return reverseEnsAddress(address)
  }

  /**
   * Generates a deterministic avatar URL
   *
   * @param seed - Seed for deterministic generation (address, nickname, etc)
   * @param config - Optional avatar configuration
   * @returns URL to DiceBear SVG avatar
   */
  getAvatarUrl(seed: string, config?: Partial<AvatarConfig>): string {
    return generateAvatarUrl(seed, config)
  }

  /**
   * Gets the current network configuration
   */
  getNetwork(): 'base' | 'base-sepolia' {
    return this.config.network || 'base'
  }

  /**
   * Gets the API URL
   */
  getApiUrl(): string {
    return this.config.apiUrl || 'https://api.villa.cash'
  }

  /**
   * Opens authentication flow and signs in the user
   *
   * Creates a fullscreen iframe with the Villa auth flow.
   * Returns the user's identity if successful.
   *
   * @param options - Sign-in options
   * @returns Promise resolving to sign-in result
   *
   * @example
   * ```typescript
   * const result = await villa.signIn({
   *   scopes: ['profile', 'wallet'],
   *   onProgress: (step) => {
   *     console.log(step.message)
   *   },
   *   timeout: 300000, // 5 minutes
   * })
   *
   * if (result.success) {
   *   console.log('Signed in as', result.identity.nickname)
   * } else {
   *   console.error('Sign-in failed:', result.error)
   * }
   * ```
   */
  async signIn(options?: SignInOptions): Promise<SignInResult> {
    const { scopes = ['profile'], onProgress, timeout = DEFAULT_TIMEOUT_MS } = options || {}

    // Validate scopes
    if (!Array.isArray(scopes) || scopes.length === 0) {
      return {
        success: false,
        error: 'At least one scope must be requested',
        code: 'INVALID_CONFIG',
      }
    }

    // Check for invalid scopes
    const validScopes: Scope[] = ['profile', 'wallet']
    const invalidScopes = scopes.filter((s) => !validScopes.includes(s))
    if (invalidScopes.length > 0) {
      return {
        success: false,
        error: `Invalid scopes: ${invalidScopes.join(', ')}`,
        code: 'INVALID_CONFIG',
      }
    }

    return new Promise((resolve) => {
      let timeoutId: NodeJS.Timeout | null = null
      let cleanup: (() => void) | null = null

      // Report progress: opening auth
      onProgress?.({
        step: 'opening_auth',
        message: 'Opening authentication flow',
      })

      // Create auth iframe with scopes as query params
      const authUrlWithScopes = `${this.authUrl}?scopes=${scopes.join(',')}&appId=${this.config.appId}`

      let iframe: HTMLIFrameElement
      try {
        iframe = createAuthIframe({ url: authUrlWithScopes })
      } catch (error) {
        resolve({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create auth iframe',
          code: 'NETWORK_ERROR',
        })
        return
      }

      // Report progress: waiting for user
      onProgress?.({
        step: 'waiting_for_user',
        message: 'Waiting for user to authenticate',
      })

      // Set up message listener
      cleanup = onMessage((message: AuthMessage) => {
        switch (message.type) {
          case 'AUTH_SUCCESS': {
            // Report progress: processing
            onProgress?.({
              step: 'processing',
              message: 'Processing authentication',
            })

            // Save session
            const session: VillaSession = {
              identity: message.identity,
              expiresAt: Date.now() + SESSION_DURATION_MS,
              isValid: true,
            }
            saveSession(session)
            this.currentSession = session

            // Clean up
            if (timeoutId) clearTimeout(timeoutId)
            cleanup?.()
            destroyAuthIframe()

            // Report progress: complete
            onProgress?.({
              step: 'complete',
              message: 'Authentication complete',
            })

            resolve({
              success: true,
              identity: message.identity,
            })
            break
          }

          case 'AUTH_ERROR': {
            // Clean up
            if (timeoutId) clearTimeout(timeoutId)
            cleanup?.()
            destroyAuthIframe()

            resolve({
              success: false,
              error: message.error,
              code: 'AUTH_ERROR',
            })
            break
          }

          case 'AUTH_CLOSE': {
            // User closed the auth flow
            if (timeoutId) clearTimeout(timeoutId)
            cleanup?.()
            destroyAuthIframe()

            resolve({
              success: false,
              error: 'Authentication cancelled by user',
              code: 'CANCELLED',
            })
            break
          }
        }
      })

      // Add iframe load error handling
      iframe.onerror = () => {
        if (timeoutId) clearTimeout(timeoutId)
        cleanup?.()
        destroyAuthIframe()

        resolve({
          success: false,
          error: 'Failed to load authentication page',
          code: 'NETWORK_ERROR',
        })
      }

      // Set up timeout
      timeoutId = setTimeout(() => {
        cleanup?.()
        destroyAuthIframe()

        resolve({
          success: false,
          error: `Authentication timed out after ${timeout}ms`,
          code: 'TIMEOUT',
        })
      }, timeout)
    })
  }

  /**
   * Signs out the current user
   *
   * Clears session from localStorage and memory.
   *
   * @example
   * ```typescript
   * await villa.signOut()
   * console.log('Signed out')
   * ```
   */
  async signOut(): Promise<void> {
    clearSession()
    this.currentSession = null
  }

  /**
   * Gets the current user's identity
   *
   * Returns null if no valid session exists.
   *
   * @returns Identity if authenticated, null otherwise
   *
   * @example
   * ```typescript
   * const identity = villa.getIdentity()
   * if (identity) {
   *   console.log('Welcome back,', identity.nickname)
   * } else {
   *   console.log('Please sign in')
   * }
   * ```
   */
  getIdentity(): Identity | null {
    // Try to load session if not in memory
    if (!this.currentSession) {
      this.currentSession = loadSession()
    }

    // Validate session
    if (!this.currentSession || !isSessionValid(this.currentSession)) {
      clearSession()
      this.currentSession = null
      return null
    }

    return this.currentSession.identity
  }

  /**
   * Checks if user is currently authenticated
   *
   * @returns true if user has a valid session
   *
   * @example
   * ```typescript
   * if (villa.isAuthenticated()) {
   *   // User is signed in
   * } else {
   *   // Show sign-in prompt
   * }
   * ```
   */
  isAuthenticated(): boolean {
    return this.getIdentity() !== null
  }

  /**
   * Gets the current SDK configuration
   *
   * @returns Current configuration
   */
  getConfig(): Readonly<Required<VillaConfig>> {
    return { ...this.config }
  }
}
