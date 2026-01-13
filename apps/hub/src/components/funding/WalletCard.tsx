/**
 * WalletCard - Display user's Base balance with Add Funds CTA
 *
 * Shows USDC and ETH balances on Base network.
 * Primary entry point for cross-chain deposits.
 *
 * Design decisions:
 * - Card layout matches existing home page pattern
 * - Balance hierarchy: USDC primary (payment focus), ETH secondary (gas)
 * - Add Funds button integrated at bottom (primary CTA)
 * - Mobile-first: fits home page layout, 44px touch target
 * - Loading state: skeleton loaders for balances
 * - Empty state: Encourages first deposit
 */

'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Wallet } from 'lucide-react'
import { AddFundsButton } from './AddFundsButton'

export interface WalletBalance {
  usdc: string
  eth: string
}

export interface WalletCardProps {
  address: string
  balance?: WalletBalance
  isLoading?: boolean
}

/**
 * Format token amount with proper decimals
 * USDC: 2 decimals, ETH: 4 decimals
 */
function formatBalance(amount: string, token: 'USDC' | 'ETH'): string {
  const decimals = token === 'USDC' ? 2 : 4
  const num = parseFloat(amount)

  if (isNaN(num)) return '0.00'

  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/**
 * Skeleton loader for balance line
 */
function BalanceSkeleton() {
  return (
    <div className="flex justify-between items-center animate-pulse">
      <div className="h-4 w-12 bg-neutral-100 rounded" />
      <div className="h-4 w-20 bg-neutral-100 rounded" />
    </div>
  )
}

export function WalletCard({ address, balance, isLoading }: WalletCardProps) {
  const hasBalance = balance && (parseFloat(balance.usdc) > 0 || parseFloat(balance.eth) > 0)

  return (
    <Card>
      <CardContent className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-ink-muted" />
          <span className="font-medium text-ink">Wallet</span>
        </div>

        {/* Balances */}
        <div className="space-y-3">
          {isLoading ? (
            <>
              <BalanceSkeleton />
              <BalanceSkeleton />
            </>
          ) : (
            <>
              {/* USDC - Primary balance */}
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-ink-muted">USDC</span>
                <span className="text-lg font-semibold text-ink">
                  ${balance ? formatBalance(balance.usdc, 'USDC') : '0.00'}
                </span>
              </div>

              {/* ETH - Secondary balance */}
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-ink-muted">ETH</span>
                <span className="text-base text-ink">
                  {balance ? formatBalance(balance.eth, 'ETH') : '0.0000'}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Empty state helper text */}
        {!isLoading && !hasBalance && (
          <p className="text-xs text-ink-muted">
            Add funds from any chain to get started
          </p>
        )}

        {/* Add Funds CTA */}
        <AddFundsButton recipientAddress={address} className="w-full" />
      </CardContent>
    </Card>
  )
}
