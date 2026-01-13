/**
 * Unit tests for WebAuthn error parsing
 */

import { describe, expect, it } from 'vitest'
import {
  parseWebAuthnError,
  formatWebAuthnErrorForLogging,
  isRecoverableWebAuthnError,
  requiresUserAction,
  type WebAuthnErrorCode,
} from '../../src/lib/webauthn-errors'

describe('parseWebAuthnError', () => {
  describe('signin context', () => {
    it('parses NotAllowedError', () => {
      const error = new DOMException('User cancelled', 'NotAllowedError')
      const result = parseWebAuthnError(error, 'signin')

      expect(result.code).toBe('NOT_ALLOWED')
      expect(result.title).toBe('Authentication cancelled')
      expect(result.action).toBe('retry')
      expect(result.actionLabel).toBe('Try Again')
    })

    it('parses AbortError as NotAllowedError', () => {
      const error = new DOMException('Aborted', 'AbortError')
      const result = parseWebAuthnError(error, 'signin')

      expect(result.code).toBe('NOT_ALLOWED')
      expect(result.action).toBe('retry')
    })

    it('parses InvalidStateError to suggest creating passkey', () => {
      const error = new DOMException('Invalid state', 'InvalidStateError')
      const result = parseWebAuthnError(error, 'signin')

      expect(result.code).toBe('INVALID_STATE_NO_PASSKEY')
      expect(result.title).toBe('No passkey found')
      expect(result.action).toBe('create')
      expect(result.actionLabel).toBe('Create Passkey')
    })

    it('parses NotSupportedError', () => {
      const error = new DOMException('Not supported', 'NotSupportedError')
      const result = parseWebAuthnError(error, 'signin')

      expect(result.code).toBe('NOT_SUPPORTED')
      expect(result.title).toBe('Passkeys not supported')
      expect(result.action).toBe('help')
    })

    it('parses SecurityError', () => {
      const error = new DOMException('Security error', 'SecurityError')
      const result = parseWebAuthnError(error, 'signin')

      expect(result.code).toBe('SECURITY_ERROR')
      expect(result.message).toContain('HTTPS')
      expect(result.action).toBe('help')
    })

    it('parses TimeoutError', () => {
      const error = new DOMException('Timeout', 'TimeoutError')
      const result = parseWebAuthnError(error, 'signin')

      expect(result.code).toBe('TIMEOUT')
      expect(result.title).toBe('Request timed out')
      expect(result.action).toBe('retry')
    })

    it('parses NetworkError', () => {
      const error = new DOMException('Network error', 'NetworkError')
      const result = parseWebAuthnError(error, 'signin')

      expect(result.code).toBe('NETWORK')
      expect(result.message).toContain('internet connection')
      expect(result.action).toBe('retry')
    })

    it('detects network errors from message', () => {
      const error = new Error('Failed due to network issues')
      const result = parseWebAuthnError(error, 'signin')

      expect(result.code).toBe('NETWORK')
      expect(result.action).toBe('retry')
    })
  })

  describe('create context', () => {
    it('parses NotAllowedError', () => {
      const error = new DOMException('User cancelled', 'NotAllowedError')
      const result = parseWebAuthnError(error, 'create')

      expect(result.code).toBe('NOT_ALLOWED')
      expect(result.title).toBe('Passkey creation cancelled')
      expect(result.message).toContain('creation was cancelled')
      expect(result.action).toBe('retry')
    })

    it('parses InvalidStateError to suggest signing in', () => {
      const error = new DOMException('Invalid state', 'InvalidStateError')
      const result = parseWebAuthnError(error, 'create')

      expect(result.code).toBe('INVALID_STATE_EXISTS')
      expect(result.title).toBe('Passkey already exists')
      expect(result.action).toBe('signin')
      expect(result.actionLabel).toBe('Sign In Instead')
    })

    it('parses TimeoutError', () => {
      const error = new DOMException('Timeout', 'TimeoutError')
      const result = parseWebAuthnError(error, 'create')

      expect(result.code).toBe('TIMEOUT')
      expect(result.action).toBe('retry')
    })
  })

  describe('unknown errors', () => {
    it('handles unknown error types', () => {
      const error = new Error('Something weird happened')
      const result = parseWebAuthnError(error, 'signin')

      expect(result.code).toBe('UNKNOWN')
      expect(result.title).toBe('Something went wrong')
      expect(result.action).toBe('retry')
      expect(result.message).toContain('Something weird happened')
    })

    it('handles null error', () => {
      const result = parseWebAuthnError(null, 'signin')

      expect(result.code).toBe('UNKNOWN')
      expect(result.action).toBe('retry')
    })

    it('handles undefined error', () => {
      const result = parseWebAuthnError(undefined, 'signin')

      expect(result.code).toBe('UNKNOWN')
      expect(result.action).toBe('retry')
    })

    it('handles non-object error', () => {
      const result = parseWebAuthnError('string error', 'signin')

      expect(result.code).toBe('UNKNOWN')
      expect(result.action).toBe('retry')
    })
  })
})

describe('formatWebAuthnErrorForLogging', () => {
  it('formats standard error', () => {
    const error = new DOMException('Test error', 'NotAllowedError')
    const formatted = formatWebAuthnErrorForLogging(error)

    expect(formatted.name).toBe('NotAllowedError')
    expect(formatted.message).toBe('Test error')
  })

  it('handles error with code', () => {
    const error = { name: 'CustomError', message: 'Test', code: 123 }
    const formatted = formatWebAuthnErrorForLogging(error)

    expect(formatted.code).toBe(123)
  })

  it('handles non-object error', () => {
    const formatted = formatWebAuthnErrorForLogging('string error')

    expect(formatted.error).toBe('string error')
  })

  it('handles null error', () => {
    const formatted = formatWebAuthnErrorForLogging(null)

    expect(formatted.error).toBe('null')
  })
})

describe('isRecoverableWebAuthnError', () => {
  it('identifies recoverable errors', () => {
    const recoverableCodes: WebAuthnErrorCode[] = [
      'NOT_ALLOWED',
      'TIMEOUT',
      'NETWORK',
      'UNKNOWN',
    ]

    recoverableCodes.forEach((code) => {
      expect(isRecoverableWebAuthnError(code)).toBe(true)
    })
  })

  it('identifies non-recoverable errors', () => {
    const nonRecoverableCodes: WebAuthnErrorCode[] = [
      'INVALID_STATE_NO_PASSKEY',
      'INVALID_STATE_EXISTS',
      'NOT_SUPPORTED',
      'SECURITY_ERROR',
    ]

    nonRecoverableCodes.forEach((code) => {
      expect(isRecoverableWebAuthnError(code)).toBe(false)
    })
  })
})

describe('requiresUserAction', () => {
  it('identifies errors requiring user action', () => {
    const actionRequiredCodes: WebAuthnErrorCode[] = [
      'INVALID_STATE_NO_PASSKEY',
      'INVALID_STATE_EXISTS',
      'NOT_SUPPORTED',
      'SECURITY_ERROR',
    ]

    actionRequiredCodes.forEach((code) => {
      expect(requiresUserAction(code)).toBe(true)
    })
  })

  it('identifies errors not requiring user action', () => {
    const noActionCodes: WebAuthnErrorCode[] = [
      'NOT_ALLOWED',
      'TIMEOUT',
      'NETWORK',
      'UNKNOWN',
    ]

    noActionCodes.forEach((code) => {
      expect(requiresUserAction(code)).toBe(false)
    })
  })
})
