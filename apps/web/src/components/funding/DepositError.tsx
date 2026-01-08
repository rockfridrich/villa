/**
 * DepositError - Error state for failed deposits
 *
 * Shows user-friendly error message with recovery options.
 * Design decisions:
 * - Red error color system (error-bg, error-border, error-text)
 * - Clear error icon (AlertCircle from lucide-react)
 * - Actionable error message (what went wrong + what to do)
 * - "Try different chain" suggestion for common failures
 * - Retry button preserves context (same flow, fresh attempt)
 * - Cancel option to exit without retry
 */

'use client'

import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import { getErrorMessage } from '@/lib/glide'

export interface DepositErrorProps {
  /**
   * Error object or message from Glide SDK
   */
  error: Error | string

  /**
   * Callback when user clicks "Try Again"
   */
  onRetry: () => void

  /**
   * Callback when user clicks "Cancel"
   */
  onCancel: () => void
}

/**
 * Error state display for failed cross-chain deposits.
 *
 * Usage:
 * ```tsx
 * <DepositError
 *   error={errorObject}
 *   onRetry={() => reinitializeGlide()}
 *   onCancel={() => closeModal()}
 * />
 * ```
 */
export function DepositError({ error, onRetry, onCancel }: DepositErrorProps) {
  const errorMessage = getErrorMessage(error)

  // Determine if error is recoverable
  const isRecoverable = !errorMessage.includes('temporarily unavailable')

  return (
    <div className="py-6 space-y-6">
      {/* Error icon */}
      <div className="flex justify-center">
        <div className="p-4 bg-error-bg rounded-full">
          <AlertCircle className="w-12 h-12 text-error-text" />
        </div>
      </div>

      {/* Error heading */}
      <div className="text-center space-y-2">
        <h3 className="text-xl font-serif text-ink">Transaction Failed</h3>
        <p className="text-sm text-ink-muted">
          Don&apos;t worry, no funds were lost
        </p>
      </div>

      {/* Error message card */}
      <div className="p-4 bg-error-bg rounded-lg border border-error-border">
        <p className="text-sm text-error-text text-center">{errorMessage}</p>
      </div>

      {/* Recovery suggestion */}
      {isRecoverable && (
        <div className="p-4 bg-warning-bg rounded-lg border border-warning-border">
          <p className="text-xs text-warning-text text-center">
            Tip: Try depositing from a different chain if this issue persists
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        {isRecoverable && (
          <Button variant="primary" className="flex-1" onClick={onRetry}>
            Try Again
          </Button>
        )}
      </div>
    </div>
  )
}
