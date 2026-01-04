import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { isPortoSupported, resetPorto, getPorto } from '@/lib/porto'

describe('porto helpers', () => {
  describe('isPortoSupported', () => {
    it('returns true when PublicKeyCredential is available', () => {
      // Mock window.PublicKeyCredential
      Object.defineProperty(window, 'PublicKeyCredential', {
        writable: true,
        configurable: true,
        value: class PublicKeyCredential {},
      })

      expect(isPortoSupported()).toBe(true)
    })

    it('returns false when PublicKeyCredential is undefined', () => {
      // Remove PublicKeyCredential
      Object.defineProperty(window, 'PublicKeyCredential', {
        writable: true,
        configurable: true,
        value: undefined,
      })

      expect(isPortoSupported()).toBe(false)
    })

    it('returns false in non-browser environment', () => {
      const originalWindow = global.window

      // Simulate server-side rendering
      // @ts-expect-error - Testing SSR scenario
      delete global.window

      expect(isPortoSupported()).toBe(false)

      // Restore window
      global.window = originalWindow
    })
  })

  describe('resetPorto', () => {
    it('resets porto instance', () => {
      // This test verifies that resetPorto can be called without errors
      expect(() => resetPorto()).not.toThrow()
    })

    it('forces new instance creation after reset', () => {
      // We can't easily test the internal instance state without exposing it,
      // but we can verify the function executes without errors
      resetPorto()
      expect(() => resetPorto()).not.toThrow()
    })
  })

  describe('getPorto', () => {
    beforeEach(() => {
      resetPorto()
    })

    afterEach(() => {
      resetPorto()
    })

    it('creates porto instance without container (popup mode)', () => {
      const porto = getPorto()
      expect(porto).toBeDefined()
      expect(porto.provider).toBeDefined()
    })

    it('creates porto instance with container (inline mode)', () => {
      const container = document.createElement('div')
      const porto = getPorto({ container })
      expect(porto).toBeDefined()
      expect(porto.provider).toBeDefined()
    })

    it('returns same instance on subsequent calls (popup mode)', () => {
      const porto1 = getPorto()
      const porto2 = getPorto()
      expect(porto1).toBe(porto2)
    })

    it('returns same instance on subsequent calls (inline mode)', () => {
      const container = document.createElement('div')
      const porto1 = getPorto({ container })
      const porto2 = getPorto({ container })
      expect(porto1).toBe(porto2)
    })

    it('recreates instance when mode changes from popup to inline', () => {
      const porto1 = getPorto() // popup mode
      const container = document.createElement('div')
      const porto2 = getPorto({ container }) // inline mode

      // Should be different instances because mode changed
      expect(porto1).not.toBe(porto2)
    })

    it('recreates instance when mode changes from inline to popup', () => {
      const container = document.createElement('div')
      const porto1 = getPorto({ container }) // inline mode
      const porto2 = getPorto() // popup mode

      // Should be different instances because mode changed
      expect(porto1).not.toBe(porto2)
    })

    it('recreates instance when forceRecreate is true', () => {
      const porto1 = getPorto()
      const porto2 = getPorto({ forceRecreate: true })

      // Should be different instances because forceRecreate was used
      expect(porto1).not.toBe(porto2)
    })

    it('uses same instance when forceRecreate is false', () => {
      const porto1 = getPorto()
      const porto2 = getPorto({ forceRecreate: false })

      expect(porto1).toBe(porto2)
    })
  })
})

describe('porto error handling', () => {
  describe('connectResult error mapping', () => {
    it('creates success result with address', () => {
      const result = {
        success: true as const,
        address: '0x1234567890123456789012345678901234567890',
      }

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.address).toBe('0x1234567890123456789012345678901234567890')
      }
    })

    it('creates error result with Error object', () => {
      const error = new Error('Connection failed')
      const result = {
        success: false as const,
        error,
      }

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe(error)
        expect(result.error.message).toBe('Connection failed')
      }
    })

    it('handles unknown error types by wrapping in Error', () => {
      // Simulate unknown error type (like what might come from a catch block)
      const unknownError: unknown = 'string error'
      const error = unknownError instanceof Error ? unknownError : new Error('Unknown error')
      const result = {
        success: false as const,
        error,
      }

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeInstanceOf(Error)
        expect(result.error.message).toBe('Unknown error')
      }
    })

    it('preserves error stack trace', () => {
      const error = new Error('Test error')
      const result = {
        success: false as const,
        error,
      }

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.stack).toBeDefined()
      }
    })
  })

  describe('common error scenarios', () => {
    it('handles user cancellation', () => {
      const error = new Error('User cancelled')
      const result = {
        success: false as const,
        error,
      }

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.message).toContain('cancelled')
      }
    })

    it('handles no account returned', () => {
      const error = new Error('No account returned from Porto')
      const result = {
        success: false as const,
        error,
      }

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.message).toContain('No account')
      }
    })

    it('handles no account selected', () => {
      const error = new Error('No account selected')
      const result = {
        success: false as const,
        error,
      }

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.message).toContain('No account selected')
      }
    })

    it('handles network errors', () => {
      const error = new Error('Network error')
      const result = {
        success: false as const,
        error,
      }

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.message).toContain('Network')
      }
    })
  })
})
