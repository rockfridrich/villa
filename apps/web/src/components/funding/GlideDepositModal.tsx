/**
 * GlideDepositModal Component
 *
 * Villa-themed wrapper around Glide SDK deposit widget.
 * Handles success/error states with Villa design language.
 *
 * Design decisions:
 * - Bottom sheet on mobile (via Radix Dialog with mobile-optimized styles)
 * - Desktop: Centered modal with max-w-lg
 * - Success state: Lottie celebration + confirmation message + block explorer link
 * - Error state: Clear message + retry button with same params
 * - Loading state: Villa spinner (not Glide's default)
 * - Villa chrome wraps Glide iframe/widget (we control outer UI, not transaction flow)
 *
 * Mobile-first considerations:
 * - Bottom sheet on mobile (slide-up animation)
 * - Full-height content area for Glide widget
 * - Safe area insets respected (iOS)
 * - Swipe-to-dismiss (Radix Dialog default)
 *
 * States managed:
 * 1. Loading: Glide SDK initializing
 * 2. Active: Glide widget rendered
 * 3. Success: Transaction completed, show celebration
 * 4. Error: Transaction failed, show error + retry
 *
 * What Villa controls:
 * - Modal open/close
 * - Success celebration UI
 * - Error message display
 * - Theme passed to Glide
 *
 * What Glide controls (security-critical):
 * - Wallet connection
 * - Token/chain selection
 * - Amount input
 * - Fee display
 * - Transaction signing
 * - Status polling
 * - In-progress error handling
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { ExternalLink, AlertCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  Spinner,
} from '@/components/ui'
import { SuccessCelebration } from '@/components/ui/success-celebration'
import { getGlideConfig, getErrorMessage, type FundingTransaction } from '@/lib/glide'

interface GlideDepositModalProps {
  /**
   * Modal open state (controlled by parent).
   */
  isOpen: boolean

  /**
   * Close handler (pass to parent).
   */
  onClose: () => void

  /**
   * User's Porto smart account address (Base).
   */
  recipientAddress: string

  /**
   * Optional: Callback when transaction completes successfully.
   */
  onSuccess?: (transaction: FundingTransaction) => void

  /**
   * Optional: Callback when transaction fails.
   */
  onError?: (error: Error) => void
}

type ModalState = 'loading' | 'active' | 'success' | 'error'

/**
 * Villa-themed modal wrapper for Glide deposit widget.
 *
 * Usage:
 * ```tsx
 * <GlideDepositModal
 *   isOpen={isModalOpen}
 *   onClose={() => setIsModalOpen(false)}
 *   recipientAddress={identity.address}
 * />
 * ```
 */
export function GlideDepositModal({
  isOpen,
  onClose,
  recipientAddress,
  onSuccess,
  onError,
}: GlideDepositModalProps) {
  const [state, setState] = useState<ModalState>('loading')
  const [error, setError] = useState<Error | null>(null)
  const [transaction, setTransaction] = useState<FundingTransaction | null>(null)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setState('loading')
      setError(null)
      setTransaction(null)

      // Simulate Glide SDK initialization
      // TODO: Replace with actual Glide SDK integration
      const timer = setTimeout(() => {
        setState('active')
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Handle transaction success
  const handleSuccess = useCallback(
    (tx: FundingTransaction) => {
      setTransaction(tx)
      setState('success')
      onSuccess?.(tx)

      // Future: Track analytics
      // trackEvent('funding_deposit_completed', {
      //   amount: tx.amount,
      //   token: tx.token,
      //   source_chain: tx.sourceChain,
      // })
    },
    [onSuccess]
  )

  // Handle transaction error
  const handleError = useCallback(
    (err: Error) => {
      setError(err)
      setState('error')
      onError?.(err)

      // Future: Track analytics
      // trackEvent('funding_deposit_failed', {
      //   error_type: err.message,
      // })
    },
    [onError]
  )

  // Handle retry after error
  const handleRetry = () => {
    setState('loading')
    setError(null)

    // Re-initialize Glide widget
    setTimeout(() => {
      setState('active')
    }, 500)
  }

  // Get Glide config
  const glideConfig = getGlideConfig(recipientAddress)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Loading State */}
        {state === 'loading' && (
          <>
            <DialogHeader>
              <DialogTitle>Add Funds</DialogTitle>
              <DialogDescription>Connecting to funding service...</DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-center py-12">
              <Spinner className="w-8 h-8" />
            </div>
          </>
        )}

        {/* Active State - Glide Widget */}
        {state === 'active' && (
          <>
            <DialogHeader>
              <DialogTitle>Add Funds</DialogTitle>
              <DialogDescription>
                Deposit from any chain to your Villa ID
              </DialogDescription>
            </DialogHeader>

            {/* TODO: Replace with actual Glide widget integration */}
            <div className="py-8 space-y-4">
              <div className="p-4 bg-cream-100 rounded-lg border border-neutral-100 text-center">
                <p className="text-sm text-ink-muted">
                  Glide widget will be integrated here
                </p>
                <p className="mt-2 text-xs text-ink-muted">
                  Config: {glideConfig.destinationChainId} (Base)
                </p>
              </div>

              {/* Temporary demo buttons */}
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() =>
                    handleSuccess({
                      txHash: '0x1234...5678',
                      amount: '100',
                      token: 'USDC',
                      sourceChain: 'Ethereum',
                      timestamp: Date.now(),
                      status: 'success',
                    })
                  }
                >
                  Test Success
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => handleError(new Error('Transaction failed'))}
                >
                  Test Error
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Success State */}
        {state === 'success' && transaction && (
          <>
            <DialogHeader>
              <DialogTitle>Funds Added!</DialogTitle>
              <DialogDescription>
                Your funds will arrive in about 2 minutes
              </DialogDescription>
            </DialogHeader>

            <div className="py-6 space-y-6">
              {/* Lottie celebration */}
              <div className="flex justify-center">
                <SuccessCelebration />
              </div>

              {/* Transaction details */}
              <div className="space-y-3 p-4 bg-success-bg rounded-lg border border-success-border">
                <div className="flex justify-between text-sm">
                  <span className="text-ink-muted">Amount</span>
                  <span className="font-medium text-ink">
                    {transaction.amount} {transaction.token}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ink-muted">From</span>
                  <span className="font-medium text-ink">{transaction.sourceChain}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ink-muted">To</span>
                  <span className="font-medium text-ink">Villa (Base)</span>
                </div>
              </div>

              {/* Block explorer link */}
              {transaction.txHash && (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    const explorerUrl = `https://basescan.org/tx/${transaction.txHash}`
                    window.open(explorerUrl, '_blank', 'noopener,noreferrer')
                  }}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on Block Explorer
                </Button>
              )}

              {/* Close button */}
              <Button variant="primary" className="w-full" onClick={onClose}>
                Done
              </Button>
            </div>
          </>
        )}

        {/* Error State */}
        {state === 'error' && error && (
          <>
            <DialogHeader>
              <DialogTitle>Transaction Failed</DialogTitle>
              <DialogDescription>
                {getErrorMessage(error)}
              </DialogDescription>
            </DialogHeader>

            <div className="py-6 space-y-6">
              {/* Error icon */}
              <div className="flex justify-center">
                <div className="p-4 bg-error-bg rounded-full">
                  <AlertCircle className="w-12 h-12 text-error-text" />
                </div>
              </div>

              {/* Error message */}
              <div className="p-4 bg-error-bg rounded-lg border border-error-border">
                <p className="text-sm text-error-text text-center">
                  {getErrorMessage(error)}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={onClose}>
                  Cancel
                </Button>
                <Button variant="primary" className="flex-1" onClick={handleRetry}>
                  Try Again
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
