/**
 * WebAuthn Error Mapping
 * Maps DOMException errors to user-friendly messages with actions
 *
 * @example
 * ```typescript
 * import { parseWebAuthnError } from '@/lib/webauthn-errors'
 *
 * try {
 *   await navigator.credentials.create({ publicKey: options })
 * } catch (error) {
 *   const errorInfo = parseWebAuthnError(error, 'create')
 *
 *   // Show user-friendly error
 *   toast.error(errorInfo.title, { description: errorInfo.message })
 *
 *   // Handle recovery action
 *   if (errorInfo.action === 'retry') {
 *     showRetryButton(errorInfo.actionLabel)
 *   }
 * }
 * ```
 */

export type WebAuthnErrorCode =
  | 'NOT_ALLOWED'
  | 'INVALID_STATE_NO_PASSKEY'
  | 'INVALID_STATE_EXISTS'
  | 'NOT_SUPPORTED'
  | 'SECURITY_ERROR'
  | 'TIMEOUT'
  | 'NETWORK'
  | 'UNKNOWN'

export interface WebAuthnErrorInfo {
  code: WebAuthnErrorCode
  title: string
  message: string
  action: 'retry' | 'create' | 'signin' | 'help' | null
  actionLabel?: string
}

/**
 * Parse WebAuthn errors and return user-friendly information
 * @param error - The error thrown by WebAuthn API
 * @param context - Whether the error occurred during signin or create
 * @returns WebAuthnErrorInfo with code, title, message, and suggested action
 */
export function parseWebAuthnError(
  error: unknown,
  context: 'signin' | 'create'
): WebAuthnErrorInfo {
  // Handle non-Error objects
  if (!error || typeof error !== 'object') {
    return {
      code: 'UNKNOWN',
      title: 'Something went wrong',
      message: 'An unexpected error occurred. Please try again.',
      action: 'retry',
      actionLabel: 'Try Again',
    }
  }

  const err = error as { name?: string; message?: string; code?: number }

  // NotAllowedError - User cancelled or operation not allowed
  if (err.name === 'NotAllowedError' || err.name === 'AbortError') {
    if (context === 'signin') {
      return {
        code: 'NOT_ALLOWED',
        title: 'Authentication cancelled',
        message: 'The authentication was cancelled. Please try again and approve the prompt.',
        action: 'retry',
        actionLabel: 'Try Again',
      }
    } else {
      return {
        code: 'NOT_ALLOWED',
        title: 'Passkey creation cancelled',
        message: 'Passkey creation was cancelled. Please try again and approve when prompted.',
        action: 'retry',
        actionLabel: 'Try Again',
      }
    }
  }

  // InvalidStateError - Different meanings in different contexts
  if (err.name === 'InvalidStateError') {
    if (context === 'signin') {
      return {
        code: 'INVALID_STATE_NO_PASSKEY',
        title: 'No passkey found',
        message: 'No passkey exists for this device. Create a new passkey to sign in.',
        action: 'create',
        actionLabel: 'Create Passkey',
      }
    } else {
      return {
        code: 'INVALID_STATE_EXISTS',
        title: 'Passkey already exists',
        message: 'A passkey already exists for this account on this device.',
        action: 'signin',
        actionLabel: 'Sign In Instead',
      }
    }
  }

  // NotSupportedError - WebAuthn not supported
  if (err.name === 'NotSupportedError') {
    return {
      code: 'NOT_SUPPORTED',
      title: 'Passkeys not supported',
      message: 'Your browser or device does not support passkeys. Try using a modern browser like Chrome, Safari, or Edge.',
      action: 'help',
      actionLabel: 'Learn More',
    }
  }

  // SecurityError - HTTPS or other security issues
  if (err.name === 'SecurityError') {
    return {
      code: 'SECURITY_ERROR',
      title: 'Security requirements not met',
      message: 'Passkeys require a secure connection (HTTPS). Please check your connection and try again.',
      action: 'help',
      actionLabel: 'Learn More',
    }
  }

  // TimeoutError - User took too long
  if (err.name === 'TimeoutError') {
    return {
      code: 'TIMEOUT',
      title: 'Request timed out',
      message: 'The authentication request timed out. Please try again.',
      action: 'retry',
      actionLabel: 'Try Again',
    }
  }

  // NetworkError - Connection issues
  if (err.name === 'NetworkError' || err.message?.toLowerCase().includes('network')) {
    return {
      code: 'NETWORK',
      title: 'Connection error',
      message: 'Unable to connect. Please check your internet connection and try again.',
      action: 'retry',
      actionLabel: 'Try Again',
    }
  }

  // Unknown error
  return {
    code: 'UNKNOWN',
    title: 'Something went wrong',
    message: err.message || 'An unexpected error occurred. Please try again.',
    action: 'retry',
    actionLabel: 'Try Again',
  }
}

/**
 * Format error for logging (strips sensitive data)
 */
export function formatWebAuthnErrorForLogging(error: unknown): Record<string, unknown> {
  if (!error || typeof error !== 'object') {
    return { error: String(error) }
  }

  const err = error as { name?: string; message?: string; code?: number; stack?: string }

  return {
    name: err.name || 'Unknown',
    message: err.message || 'No message',
    code: err.code,
    // Include stack in development only
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  }
}

/**
 * Check if error is recoverable (user can retry)
 */
export function isRecoverableWebAuthnError(errorCode: WebAuthnErrorCode): boolean {
  return [
    'NOT_ALLOWED',
    'TIMEOUT',
    'NETWORK',
    'UNKNOWN',
  ].includes(errorCode)
}

/**
 * Check if error requires user action (not just retry)
 */
export function requiresUserAction(errorCode: WebAuthnErrorCode): boolean {
  return [
    'INVALID_STATE_NO_PASSKEY',
    'INVALID_STATE_EXISTS',
    'NOT_SUPPORTED',
    'SECURITY_ERROR',
  ].includes(errorCode)
}
