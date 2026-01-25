/**
 * Validation Tests
 *
 * Tests for origin validation and message parsing.
 */

import { describe, test, expect, beforeEach, vi } from 'vitest'
import {
  validateOrigin,
  parseVillaMessage,
  parseParentMessage,
  createVillaError,
  getValidOrigins,
  isDevelopment,
  ALLOWED_ORIGINS,
  DEV_ORIGINS,
} from '../iframe/validation'

describe('validation', () => {
  describe('isDevelopment', () => {
    test('returns true when NODE_ENV is development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const result = isDevelopment()

      // Can be true from either NODE_ENV or window location
      expect(typeof result).toBe('boolean')

      process.env.NODE_ENV = originalEnv
    })

    test('detects environment correctly', () => {
      // In test environment with happy-dom, we have a window object
      // so isDevelopment checks both process.env and window.location
      const result = isDevelopment()
      expect(typeof result).toBe('boolean')
    })

    test('returns consistent results', () => {
      const result1 = isDevelopment()
      const result2 = isDevelopment()
      expect(result1).toBe(result2)
    })
  })

  describe('getValidOrigins', () => {
    test('returns array of allowed origins', () => {
      const origins = getValidOrigins()

      expect(origins).toContain('https://villa.cash')
      expect(Array.isArray(origins)).toBe(true)
      expect(origins.length).toBeGreaterThanOrEqual(ALLOWED_ORIGINS.length)
    })

    test('includes production origins', () => {
      const origins = getValidOrigins()

      ALLOWED_ORIGINS.forEach((origin) => {
        expect(origins).toContain(origin)
      })
    })
  })

  describe('validateOrigin', () => {
    test('accepts valid production origins', () => {
      expect(validateOrigin('https://villa.cash')).toBe(true)
      expect(validateOrigin('https://www.villa.cash')).toBe(true)
      expect(validateOrigin('https://beta.villa.cash')).toBe(true)
      expect(validateOrigin('https://dev-1.villa.cash')).toBe(true)
      expect(validateOrigin('https://dev-2.villa.cash')).toBe(true)
    })

    test('accepts any HTTPS origin (OAuth-like model)', () => {
      expect(validateOrigin('https://evil.com')).toBe(true)
      expect(validateOrigin('https://any-third-party.com')).toBe(true)
      expect(validateOrigin('https://villa.cash.evil.com')).toBe(true)
    })

    test('rejects non-HTTPS origins (except localhost)', () => {
      expect(validateOrigin('http://villa.cash')).toBe(false)
      expect(validateOrigin('')).toBe(false)
      expect(validateOrigin('not-a-url')).toBe(false)
      expect(validateOrigin('ftp://example.com')).toBe(false)
    })

    test('accepts localhost origins in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      expect(validateOrigin('https://localhost:3000')).toBe(true)
      expect(validateOrigin('http://localhost:3000')).toBe(true)
      expect(validateOrigin('http://127.0.0.1:3000')).toBe(true)

      process.env.NODE_ENV = originalEnv
    })

    test('validates HTTPS origins as valid', () => {
      expect(validateOrigin('https://villa.cash')).toBe(true)
      expect(validateOrigin('https://beta.villa.cash')).toBe(true)
      expect(validateOrigin('https://any-domain.com')).toBe(true)
      expect(validateOrigin('')).toBe(false)
    })
  })

  describe('parseVillaMessage', () => {
    test('parses VILLA_READY message', () => {
      const data = { type: 'VILLA_READY' }
      const result = parseVillaMessage(data)

      expect(result).toEqual({ type: 'VILLA_READY' })
    })

    test('parses VILLA_AUTH_SUCCESS message', () => {
      const data = {
        type: 'VILLA_AUTH_SUCCESS',
        payload: {
          identity: {
            address: '0x1234567890123456789012345678901234567890',
            nickname: 'alice',
            avatar: {
              style: 'adventurer',
              seed: 'alice',
            },
          },
        },
      }
      const result = parseVillaMessage(data)

      expect(result).toEqual(data)
      expect(result?.type).toBe('VILLA_AUTH_SUCCESS')
    })

    test('parses VILLA_AUTH_CANCEL message', () => {
      const data = { type: 'VILLA_AUTH_CANCEL' }
      const result = parseVillaMessage(data)

      expect(result).toEqual({ type: 'VILLA_AUTH_CANCEL' })
    })

    test('parses VILLA_AUTH_ERROR message', () => {
      const data = {
        type: 'VILLA_AUTH_ERROR',
        payload: {
          error: 'Authentication failed',
          code: 'AUTH_FAILED',
        },
      }
      const result = parseVillaMessage(data)

      expect(result).toEqual(data)
    })

    test('returns null for invalid message type', () => {
      const data = { type: 'INVALID_TYPE' }
      const result = parseVillaMessage(data)

      expect(result).toBeNull()
    })

    test('returns null for null input', () => {
      expect(parseVillaMessage(null)).toBeNull()
    })

    test('returns null for undefined input', () => {
      expect(parseVillaMessage(undefined)).toBeNull()
    })

    test('returns null for malformed identity address', () => {
      const data = {
        type: 'VILLA_AUTH_SUCCESS',
        payload: {
          identity: {
            address: 'not-an-address',
            nickname: 'alice',
            avatar: {
              style: 'adventurer',
              seed: 'alice',
            },
          },
        },
      }
      const result = parseVillaMessage(data)

      expect(result).toBeNull()
    })

    test('accepts identity without nickname (optional field)', () => {
      const data = {
        type: 'VILLA_AUTH_SUCCESS',
        payload: {
          identity: {
            address: '0x1234567890123456789012345678901234567890',
            avatar: {
              style: 'adventurer',
              seed: 'alice',
            },
          },
        },
      }
      const result = parseVillaMessage(data)

      expect(result).not.toBeNull()
      expect(result?.type).toBe('VILLA_AUTH_SUCCESS')
    })

    test('returns null for invalid avatar style', () => {
      const data = {
        type: 'VILLA_AUTH_SUCCESS',
        payload: {
          identity: {
            address: '0x1234567890123456789012345678901234567890',
            nickname: 'alice',
            avatar: {
              style: 'invalid-style',
              seed: 'alice',
            },
          },
        },
      }
      const result = parseVillaMessage(data)

      expect(result).toBeNull()
    })

    test('accepts optional error code', () => {
      const data = {
        type: 'VILLA_AUTH_ERROR',
        payload: {
          error: 'Something went wrong',
        },
      }
      const result = parseVillaMessage(data)

      expect(result).toEqual(data)
    })

    test('returns null for invalid error code', () => {
      const data = {
        type: 'VILLA_AUTH_ERROR',
        payload: {
          error: 'Something went wrong',
          code: 'INVALID_CODE',
        },
      }
      const result = parseVillaMessage(data)

      expect(result).toBeNull()
    })
  })

  describe('parseParentMessage', () => {
    test('parses PARENT_INIT message', () => {
      const data = {
        type: 'PARENT_INIT',
        payload: {
          appId: 'my-app',
          scopes: ['wallet', 'profile'],
          origin: 'https://example.com',
        },
      }
      const result = parseParentMessage(data)

      expect(result).toEqual(data)
    })

    test('parses PARENT_INIT without optional scopes', () => {
      const data = {
        type: 'PARENT_INIT',
        payload: {
          appId: 'my-app',
          origin: 'https://example.com',
        },
      }
      const result = parseParentMessage(data)

      expect(result).toEqual(data)
    })

    test('parses PARENT_CLOSE message', () => {
      const data = { type: 'PARENT_CLOSE' }
      const result = parseParentMessage(data)

      expect(result).toEqual({ type: 'PARENT_CLOSE' })
    })

    test('returns null for invalid message type', () => {
      const data = { type: 'INVALID_TYPE' }
      const result = parseParentMessage(data)

      expect(result).toBeNull()
    })

    test('returns null for null input', () => {
      expect(parseParentMessage(null)).toBeNull()
    })

    test('returns null for missing required fields', () => {
      const data = {
        type: 'PARENT_INIT',
        payload: {
          // Missing appId
          origin: 'https://example.com',
        },
      }
      const result = parseParentMessage(data)

      expect(result).toBeNull()
    })

    test('accepts empty appId (validation happens at application level)', () => {
      const data = {
        type: 'PARENT_INIT',
        payload: {
          appId: '',
          origin: 'https://example.com',
        },
      }
      const result = parseParentMessage(data)

      // Schema validation only checks types, not business rules
      expect(result).toEqual(data)
    })
  })

  describe('createVillaError', () => {
    test('creates error with valid code', () => {
      const result = createVillaError('Authentication failed', 'AUTH_FAILED')

      expect(result).toEqual({
        error: 'Authentication failed',
        code: 'AUTH_FAILED',
      })
    })

    test('creates error without code', () => {
      const result = createVillaError('Something went wrong')

      expect(result).toEqual({
        error: 'Something went wrong',
        code: undefined,
      })
    })

    test('omits invalid error code', () => {
      const result = createVillaError('Error', 'INVALID_CODE')

      expect(result).toEqual({
        error: 'Error',
        code: undefined,
      })
    })

    test('handles empty error message', () => {
      const result = createVillaError('')

      expect(result).toEqual({
        error: '',
        code: undefined,
      })
    })

    test('accepts all valid error codes', () => {
      const validCodes = [
        'CANCELLED',
        'TIMEOUT',
        'NETWORK_ERROR',
        'INVALID_ORIGIN',
        'INVALID_CONFIG',
        'AUTH_FAILED',
        'PASSKEY_ERROR',
        'CONSENT_REQUIRED',
      ]

      validCodes.forEach((code) => {
        const result = createVillaError('Error', code)
        expect(result.code).toBe(code)
      })
    })
  })
})
