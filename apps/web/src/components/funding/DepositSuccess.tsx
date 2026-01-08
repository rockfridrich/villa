/**
 * DepositSuccess - Success celebration for completed deposits
 *
 * Shows after Glide transaction completes successfully.
 * Uses existing SuccessCelebration Lottie animation.
 *
 * Design decisions:
 * - Lottie celebration animation (existing success.json)
 * - Transaction details in success-colored card
 * - BaseScan link for on-chain verification
 * - "Done" CTA to close and return to home
 * - Mobile-optimized: Clear hierarchy, large touch targets
 */

'use client'

import { Button } from '@/components/ui/button'
import { SuccessCelebration } from '@/components/ui/success-celebration'
import { ExternalLink } from 'lucide-react'
import { getExplorerUrl, formatChainName } from '@/lib/glide'

export interface DepositSuccessProps {
  /**
   * Transaction hash on Base
   */
  txHash: string

  /**
   * Amount deposited (formatted, e.g. "100.00")
   */
  amount: string

  /**
   * Token symbol (e.g. "USDC", "ETH")
   */
  token: string

  /**
   * Source chain ID or name (e.g. 1 or "Ethereum")
   */
  sourceChain: string | number

  /**
   * Callback when user clicks "Done"
   */
  onContinue: () => void
}

/**
 * Success state display for cross-chain deposits.
 *
 * Usage:
 * ```tsx
 * <DepositSuccess
 *   txHash="0x1234..."
 *   amount="100.00"
 *   token="USDC"
 *   sourceChain="Ethereum"
 *   onContinue={() => closeModal()}
 * />
 * ```
 */
export function DepositSuccess({
  txHash,
  amount,
  token,
  sourceChain,
  onContinue,
}: DepositSuccessProps) {
  const sourceChainName =
    typeof sourceChain === 'number' ? formatChainName(sourceChain) : sourceChain

  const handleViewOnExplorer = () => {
    window.open(getExplorerUrl(txHash), '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="py-6 space-y-6">
      {/* Lottie celebration animation */}
      <div className="flex justify-center">
        <SuccessCelebration size="lg" />
      </div>

      {/* Success message */}
      <div className="text-center space-y-2">
        <h3 className="text-xl font-serif text-ink">Funds Added!</h3>
        <p className="text-sm text-ink-muted">
          Your funds will arrive in about 2 minutes
        </p>
      </div>

      {/* Transaction details */}
      <div className="space-y-3 p-4 bg-success-bg rounded-lg border border-success-border">
        <div className="flex justify-between items-baseline">
          <span className="text-sm text-ink-muted">Amount</span>
          <span className="text-lg font-semibold text-ink">
            {amount} {token}
          </span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-sm text-ink-muted">From</span>
          <span className="text-sm font-medium text-ink">{sourceChainName}</span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-sm text-ink-muted">To</span>
          <span className="text-sm font-medium text-ink">Villa (Base)</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="space-y-2">
        {/* Block explorer link */}
        <Button
          variant="secondary"
          className="w-full"
          onClick={handleViewOnExplorer}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          View on BaseScan
        </Button>

        {/* Continue button */}
        <Button variant="primary" className="w-full" onClick={onContinue}>
          Done
        </Button>
      </div>
    </div>
  )
}
