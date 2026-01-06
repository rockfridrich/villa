/**
 * Authentication Tests
 *
 * Tests for signIn, signOut, isAuthenticated, and getIdentity.
 */

import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest'
import { signIn, signOut, isAuthenticated, getIdentity } from '../auth'
import * as iframe from '../iframe'
import * as session from '../session'
import type { Identity, VillaSession } from '../types'
import type { AuthMessage } from '../iframe'

// Mock iframe module
vi.mock('../iframe', () => ({
  createAuthIframe: vi.fn(),
  destroyAuthIframe: vi.fn(),
  onMessage: vi.fn(),
}))

describe('auth', () => {
  const mockIdentity: Identity = {
    address: '0x1234567890123456789012345678901234567890',
    nickname: 'alice',
    avatar: {
      style: 'adventurer',
      seed: 'alice',
    },
  }

  const mockIframe = {
    onerror: null as any,
  }

  let messageCallback: ((message: AuthMessage) => void) | null = null

  beforeEach(async () => {
    localStorage.clear()
    messageCallback = null
    vi.clearAllMocks()

    // Force auth module to reinitialize by signing out
    await signOut()

    // Setup default mocks
    vi.mocked(iframe.createAuthIframe).mockReturnValue(mockIframe as any)
    vi.mocked(iframe.destroyAuthIframe).mockImplementation(() => {})
    vi.mocked(iframe.onMessage).mockImplementation((handler) => {
      messageCallback = handler
      return vi.fn() // cleanup function
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('signIn', () => {
    test('resolves with identity on AUTH_SUCCESS', async () => {
      const promise = signIn()

      // Simulate successful auth message
      messageCallback?.({ type: 'AUTH_SUCCESS', identity: mockIdentity })

      const result = await promise
      expect(result).toEqual(mockIdentity)
    })

    test('saves session on successful authentication', async () => {
      const promise = signIn()

      messageCallback?.({ type: 'AUTH_SUCCESS', identity: mockIdentity })

      await promise

      // Check session was saved
      const stored = localStorage.getItem('villa_session')
      expect(stored).toBeTruthy()

      const savedSession: VillaSession = JSON.parse(stored!)
      expect(savedSession.identity).toEqual(mockIdentity)
      expect(savedSession.expiresAt).toBeGreaterThan(Date.now())
      expect(savedSession.isValid).toBe(true)
    })

    test('calls onSuccess callback', async () => {
      const onSuccess = vi.fn()
      const promise = signIn({ onSuccess })

      messageCallback?.({ type: 'AUTH_SUCCESS', identity: mockIdentity })

      await promise
      expect(onSuccess).toHaveBeenCalledWith(mockIdentity)
    })

    test('destroys iframe on successful authentication', async () => {
      const promise = signIn()

      messageCallback?.({ type: 'AUTH_SUCCESS', identity: mockIdentity })

      await promise
      expect(iframe.destroyAuthIframe).toHaveBeenCalled()
    })

    test('rejects with error on AUTH_ERROR', async () => {
      const promise = signIn()

      messageCallback?.({ type: 'AUTH_ERROR', error: 'Authentication failed' })

      await expect(promise).rejects.toThrow('Authentication failed')
    })

    test('calls onError callback on failure', async () => {
      const onError = vi.fn()
      const promise = signIn({ onError })

      messageCallback?.({ type: 'AUTH_ERROR', error: 'Authentication failed' })

      await expect(promise).rejects.toThrow()
      expect(onError).toHaveBeenCalledWith(expect.any(Error))
      expect(onError.mock.calls[0][0].message).toBe('Authentication failed')
    })

    test('destroys iframe on error', async () => {
      const promise = signIn()

      messageCallback?.({ type: 'AUTH_ERROR', error: 'Authentication failed' })

      await expect(promise).rejects.toThrow()
      expect(iframe.destroyAuthIframe).toHaveBeenCalled()
    })

    test('rejects when user closes auth flow', async () => {
      const promise = signIn()

      messageCallback?.({ type: 'AUTH_CLOSE' })

      await expect(promise).rejects.toThrow('Authentication cancelled by user')
    })

    test('calls onClose callback when user cancels', async () => {
      const onClose = vi.fn()
      const promise = signIn({ onClose })

      messageCallback?.({ type: 'AUTH_CLOSE' })

      await expect(promise).rejects.toThrow()
      expect(onClose).toHaveBeenCalled()
    })

    test('destroys iframe on user cancel', async () => {
      const promise = signIn()

      messageCallback?.({ type: 'AUTH_CLOSE' })

      await expect(promise).rejects.toThrow()
      expect(iframe.destroyAuthIframe).toHaveBeenCalled()
    })

    test('creates iframe with correct URL', async () => {
      const promise = signIn()

      expect(iframe.createAuthIframe).toHaveBeenCalledWith({
        url: 'https://villa.cash/auth',
      })

      // Clean up
      messageCallback?.({ type: 'AUTH_CLOSE' })
      await promise.catch(() => {})
    })

    test('rejects on iframe load error', async () => {
      const onError = vi.fn()
      const promise = signIn({ onError })

      // Trigger iframe error
      mockIframe.onerror?.()

      await expect(promise).rejects.toThrow('Failed to load authentication page')
      expect(onError).toHaveBeenCalled()
      expect(iframe.destroyAuthIframe).toHaveBeenCalled()
    })

    test('does not save session on error', async () => {
      const promise = signIn()

      messageCallback?.({ type: 'AUTH_ERROR', error: 'Failed' })

      await promise.catch(() => {})

      const stored = localStorage.getItem('villa_session')
      expect(stored).toBeNull()
    })

    test('does not save session on cancel', async () => {
      const promise = signIn()

      messageCallback?.({ type: 'AUTH_CLOSE' })

      await promise.catch(() => {})

      const stored = localStorage.getItem('villa_session')
      expect(stored).toBeNull()
    })

    test('handles multiple callbacks', async () => {
      const onSuccess = vi.fn()
      const onError = vi.fn()
      const onClose = vi.fn()

      const promise = signIn({ onSuccess, onError, onClose })

      messageCallback?.({ type: 'AUTH_SUCCESS', identity: mockIdentity })

      await promise

      expect(onSuccess).toHaveBeenCalledOnce()
      expect(onError).not.toHaveBeenCalled()
      expect(onClose).not.toHaveBeenCalled()
    })
  })

  describe('signOut', () => {
    test('clears session from localStorage', async () => {
      // Setup existing session
      const session: VillaSession = {
        identity: mockIdentity,
        expiresAt: Date.now() + 1000000,
        isValid: true,
      }
      localStorage.setItem('villa_session', JSON.stringify(session))

      await signOut()

      expect(localStorage.getItem('villa_session')).toBeNull()
    })

    test('clears in-memory session', async () => {
      // First sign in to create session
      const promise = signIn()
      messageCallback?.({ type: 'AUTH_SUCCESS', identity: mockIdentity })
      await promise

      expect(isAuthenticated()).toBe(true)

      // Sign out
      await signOut()

      expect(isAuthenticated()).toBe(false)
    })

    test('can be called multiple times safely', async () => {
      await signOut()
      await signOut()
      await signOut()

      expect(localStorage.getItem('villa_session')).toBeNull()
    })

    test('does not throw when no session exists', async () => {
      await expect(signOut()).resolves.toBeUndefined()
    })
  })

  describe('isAuthenticated', () => {
    test('returns false when no session exists', () => {
      expect(isAuthenticated()).toBe(false)
    })

    test('returns true for valid session', async () => {
      // Sign in to create valid session
      const promise = signIn()
      messageCallback?.({ type: 'AUTH_SUCCESS', identity: mockIdentity })
      await promise

      expect(isAuthenticated()).toBe(true)
    })

    test('returns false for expired session', async () => {
      // Create expired session
      const session: VillaSession = {
        identity: mockIdentity,
        expiresAt: Date.now() - 1000, // Expired
        isValid: true,
      }
      localStorage.setItem('villa_session', JSON.stringify(session))

      expect(isAuthenticated()).toBe(false)

      // Clean up any pending promises
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    test('clears expired session from storage', async () => {
      const session: VillaSession = {
        identity: mockIdentity,
        expiresAt: Date.now() - 1000,
        isValid: true,
      }
      localStorage.setItem('villa_session', JSON.stringify(session))

      isAuthenticated()

      expect(localStorage.getItem('villa_session')).toBeNull()

      // Clean up any pending promises
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    test('initializes from localStorage on first call', () => {
      const session: VillaSession = {
        identity: mockIdentity,
        expiresAt: Date.now() + 1000000,
        isValid: true,
      }
      localStorage.setItem('villa_session', JSON.stringify(session))

      expect(isAuthenticated()).toBe(true)
    })

    test('returns false after signOut', async () => {
      // Sign in
      const promise = signIn()
      messageCallback?.({ type: 'AUTH_SUCCESS', identity: mockIdentity })
      await promise

      expect(isAuthenticated()).toBe(true)

      // Sign out
      await signOut()

      expect(isAuthenticated()).toBe(false)
    })

    test('handles malformed session data', () => {
      localStorage.setItem('villa_session', 'invalid-json')

      expect(isAuthenticated()).toBe(false)
    })

    test('handles missing session fields', () => {
      const incompleteSession = {
        identity: null,
        expiresAt: Date.now() + 1000000,
      }
      localStorage.setItem('villa_session', JSON.stringify(incompleteSession))

      expect(isAuthenticated()).toBe(false)
    })
  })

  describe('getIdentity', () => {
    test('returns null when not authenticated', () => {
      expect(getIdentity()).toBeNull()
    })

    test('returns identity when authenticated', async () => {
      // Sign in
      const promise = signIn()
      messageCallback?.({ type: 'AUTH_SUCCESS', identity: mockIdentity })
      await promise

      const identity = getIdentity()
      expect(identity).toEqual(mockIdentity)
    })

    test('returns null after signOut', async () => {
      // Sign in
      const promise = signIn()
      messageCallback?.({ type: 'AUTH_SUCCESS', identity: mockIdentity })
      await promise

      expect(getIdentity()).toEqual(mockIdentity)

      // Sign out
      await signOut()

      expect(getIdentity()).toBeNull()
    })

    test('returns null for expired session', () => {
      const session: VillaSession = {
        identity: mockIdentity,
        expiresAt: Date.now() - 1000,
        isValid: true,
      }
      localStorage.setItem('villa_session', JSON.stringify(session))

      expect(getIdentity()).toBeNull()
    })

    test('loads identity from localStorage on first call', () => {
      const session: VillaSession = {
        identity: mockIdentity,
        expiresAt: Date.now() + 1000000,
        isValid: true,
      }
      localStorage.setItem('villa_session', JSON.stringify(session))

      const identity = getIdentity()
      expect(identity).toEqual(mockIdentity)
    })

    test('returns same identity on multiple calls', async () => {
      // Sign in
      const promise = signIn()
      messageCallback?.({ type: 'AUTH_SUCCESS', identity: mockIdentity })
      await promise

      const identity1 = getIdentity()
      const identity2 = getIdentity()

      expect(identity1).toEqual(identity2)
    })

    test('handles different identities correctly', async () => {
      // First identity
      const promise1 = signIn()
      messageCallback?.({ type: 'AUTH_SUCCESS', identity: mockIdentity })
      await promise1

      expect(getIdentity()?.nickname).toBe('alice')

      // Sign out and sign in with different identity
      await signOut()

      const newIdentity: Identity = {
        ...mockIdentity,
        nickname: 'bob',
      }

      const promise2 = signIn()
      messageCallback?.({ type: 'AUTH_SUCCESS', identity: newIdentity })
      await promise2

      expect(getIdentity()?.nickname).toBe('bob')
    })
  })

  describe('edge cases', () => {
    test('handles rapid signIn/signOut cycles', async () => {
      for (let i = 0; i < 5; i++) {
        const promise = signIn()
        messageCallback?.({ type: 'AUTH_SUCCESS', identity: mockIdentity })
        await promise

        expect(isAuthenticated()).toBe(true)

        await signOut()
        expect(isAuthenticated()).toBe(false)
      }
    })

    test('handles concurrent signIn attempts', async () => {
      // Only test that the second call replaces the first iframe
      const promise1 = signIn()

      // Second signIn should create a new iframe (destroying the first)
      const promise2 = signIn()

      // Send success to the active callback (should be promise2's)
      messageCallback?.({ type: 'AUTH_SUCCESS', identity: mockIdentity })

      // Promise2 should succeed
      await expect(promise2).resolves.toEqual(mockIdentity)

      // Promise1 may or may not resolve depending on timing
      // Just ensure no hanging promises
      await Promise.race([
        promise1,
        new Promise((resolve) => setTimeout(() => resolve('timeout'), 100)),
      ])
    })

    test('session expiry is set correctly', async () => {
      const beforeTime = Date.now()
      const promise = signIn()
      messageCallback?.({ type: 'AUTH_SUCCESS', identity: mockIdentity })
      await promise
      const afterTime = Date.now()

      const stored = localStorage.getItem('villa_session')
      const session: VillaSession = JSON.parse(stored!)

      const expectedExpiry = 7 * 24 * 60 * 60 * 1000 // 7 days
      expect(session.expiresAt).toBeGreaterThanOrEqual(beforeTime + expectedExpiry)
      expect(session.expiresAt).toBeLessThanOrEqual(afterTime + expectedExpiry + 1000)
    })

    test('handles empty error message', async () => {
      const promise = signIn()
      messageCallback?.({ type: 'AUTH_ERROR', error: '' })

      await expect(promise).rejects.toThrow()
    })

    test('preserves avatar config in session', async () => {
      const identityWithGender: Identity = {
        ...mockIdentity,
        avatar: {
          style: 'bottts',
          seed: 'alice',
          gender: 'female',
        },
      }

      const promise = signIn()
      messageCallback?.({ type: 'AUTH_SUCCESS', identity: identityWithGender })
      await promise

      const savedIdentity = getIdentity()
      expect(savedIdentity?.avatar.gender).toBe('female')
      expect(savedIdentity?.avatar.style).toBe('bottts')
    })
  })
})
