/**
 * Session Management Tests
 *
 * Tests for localStorage-based session persistence.
 */

import { describe, test, expect, beforeEach } from 'vitest'
import { saveSession, loadSession, clearSession, isSessionValid } from '../session'
import type { VillaSession } from '../types'

describe('session', () => {
  const mockIdentity = {
    address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
    nickname: 'alice',
    avatar: {
      style: 'adventurer' as const,
      seed: 'alice',
    },
  }

  const createValidSession = (expiresIn = 7 * 24 * 60 * 60 * 1000): VillaSession => ({
    identity: mockIdentity,
    expiresAt: Date.now() + expiresIn,
    isValid: true,
  })

  const createExpiredSession = (): VillaSession => ({
    identity: mockIdentity,
    expiresAt: Date.now() - 1000, // Expired 1 second ago
    isValid: true,
  })

  beforeEach(() => {
    localStorage.clear()
  })

  describe('saveSession', () => {
    test('saves session to localStorage', () => {
      const session = createValidSession()
      saveSession(session)

      const stored = localStorage.getItem('villa_session')
      expect(stored).toBeTruthy()
      expect(JSON.parse(stored!)).toEqual(session)
    })

    test('overwrites existing session', () => {
      const session1 = createValidSession()
      const session2 = {
        ...createValidSession(),
        identity: {
          ...mockIdentity,
          nickname: 'bob',
        },
      }

      saveSession(session1)
      saveSession(session2)

      const stored = localStorage.getItem('villa_session')
      expect(JSON.parse(stored!).identity.nickname).toBe('bob')
    })

    test('handles localStorage errors gracefully', () => {
      // Mock localStorage to throw
      const originalSetItem = localStorage.setItem
      localStorage.setItem = () => {
        throw new Error('Storage full')
      }

      const session = createValidSession()
      expect(() => saveSession(session)).not.toThrow()

      // Restore
      localStorage.setItem = originalSetItem
    })
  })

  describe('loadSession', () => {
    test('loads valid session from localStorage', () => {
      const session = createValidSession()
      localStorage.setItem('villa_session', JSON.stringify(session))

      const loaded = loadSession()
      expect(loaded).toEqual(session)
    })

    test('returns null when no session exists', () => {
      const loaded = loadSession()
      expect(loaded).toBeNull()
    })

    test('returns null and clears expired session', () => {
      const session = createExpiredSession()
      localStorage.setItem('villa_session', JSON.stringify(session))

      const loaded = loadSession()
      expect(loaded).toBeNull()
      expect(localStorage.getItem('villa_session')).toBeNull()
    })

    test('returns null for malformed JSON', () => {
      localStorage.setItem('villa_session', 'invalid-json')

      const loaded = loadSession()
      expect(loaded).toBeNull()
    })

    test('returns null for empty string', () => {
      localStorage.setItem('villa_session', '')

      const loaded = loadSession()
      expect(loaded).toBeNull()
    })

    test('handles localStorage errors gracefully', () => {
      // Mock localStorage to throw
      const originalGetItem = localStorage.getItem
      localStorage.getItem = () => {
        throw new Error('Storage error')
      }

      expect(() => loadSession()).not.toThrow()
      expect(loadSession()).toBeNull()

      // Restore
      localStorage.getItem = originalGetItem
    })
  })

  describe('clearSession', () => {
    test('removes session from localStorage', () => {
      const session = createValidSession()
      localStorage.setItem('villa_session', JSON.stringify(session))

      clearSession()
      expect(localStorage.getItem('villa_session')).toBeNull()
    })

    test('does not throw when no session exists', () => {
      expect(() => clearSession()).not.toThrow()
    })

    test('handles localStorage errors gracefully', () => {
      // Mock localStorage to throw
      const originalRemoveItem = localStorage.removeItem
      localStorage.removeItem = () => {
        throw new Error('Storage error')
      }

      expect(() => clearSession()).not.toThrow()

      // Restore
      localStorage.removeItem = originalRemoveItem
    })
  })

  describe('isSessionValid', () => {
    test('returns true for valid, non-expired session', () => {
      const session = createValidSession()
      expect(isSessionValid(session)).toBe(true)
    })

    test('returns false for expired session', () => {
      const session = createExpiredSession()
      expect(isSessionValid(session)).toBe(false)
    })

    test('returns false for null session', () => {
      expect(isSessionValid(null as any)).toBe(false)
    })

    test('returns false for undefined session', () => {
      expect(isSessionValid(undefined as any)).toBe(false)
    })

    test('returns false for session without identity', () => {
      const session = {
        identity: null,
        expiresAt: Date.now() + 1000,
        isValid: true,
      }
      expect(isSessionValid(session as any)).toBe(false)
    })

    test('returns false for session without expiresAt', () => {
      const session = {
        identity: mockIdentity,
        expiresAt: null,
        isValid: true,
      }
      expect(isSessionValid(session as any)).toBe(false)
    })

    test('returns false for session expiring exactly now', () => {
      const session = {
        identity: mockIdentity,
        expiresAt: Date.now(),
        isValid: true,
      }
      expect(isSessionValid(session)).toBe(false)
    })

    test('returns true for session expiring in 1ms', () => {
      const session = {
        identity: mockIdentity,
        expiresAt: Date.now() + 1,
        isValid: true,
      }
      expect(isSessionValid(session)).toBe(true)
    })
  })
})
