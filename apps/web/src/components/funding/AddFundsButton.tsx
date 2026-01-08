/**
 * AddFundsButton Component
 *
 * Entry point for cross-chain deposits via Glide SDK.
 * Placed on home page below profile card, opens GlideDepositModal.
 *
 * Design decisions:
 * - Primary variant (yellow accent) for high visibility as P1 feature
 * - 44px minimum touch target (min-h-11) for mobile accessibility
 * - Clear action copy: "Add Funds" not "Deposit" or "Bridge"
 * - Helper text explains capability: "From any chain" (user mental model)
 * - Only shown when user is authenticated (has identity)
 * - Disabled state if Glide project ID not configured
 *
 * Mobile-first considerations:
 * - Full-width button on mobile (w-full)
 * - Large touch target (min-h-11 = 44px)
 * - Icon + text for scannability
 * - Bottom sheet modal (handled by GlideDepositModal)
 *
 * Apple HIG compliance:
 * - Clear, action-oriented label
 * - Visible focus state (ring-2)
 * - Haptic feedback on tap (future: navigator.vibrate)
 */

'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui'
import { GlideDepositModal } from './GlideDepositModal'
import { GLIDE_PROJECT_ID } from '@/lib/glide'

interface AddFundsButtonProps {
  /**
   * User's Porto smart account address (Base).
   * This is the recipient address for all deposits.
   */
  recipientAddress: string

  /**
   * Optional: Show as secondary variant instead of primary.
   * Use for Settings page or less prominent placements.
   */
  variant?: 'primary' | 'secondary'

  /**
   * Optional: Custom className for layout adjustments.
   */
  className?: string
}

/**
 * Add Funds button that opens Glide deposit modal.
 *
 * Usage:
 * ```tsx
 * <AddFundsButton
 *   recipientAddress={identity.address}
 *   variant="primary"
 * />
 * ```
 */
export function AddFundsButton({
  recipientAddress,
  variant = 'primary',
  className,
}: AddFundsButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Disable if Glide not configured
  const isGlideConfigured = Boolean(GLIDE_PROJECT_ID)

  const handleOpenModal = () => {
    // Future: Track analytics event
    // trackEvent('funding_widget_opened', { source: 'home_page' })
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    // Future: Track analytics event
    // trackEvent('funding_widget_closed')
  }

  return (
    <>
      <div className={className}>
        <Button
          variant={variant}
          className="w-full"
          onClick={handleOpenModal}
          disabled={!isGlideConfigured}
          aria-label="Add funds to your Villa ID"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Funds
        </Button>
        <p className="mt-2 text-xs text-center text-ink-muted">
          {isGlideConfigured
            ? 'Deposit from any chain'
            : 'Funding temporarily unavailable'}
        </p>
      </div>

      <GlideDepositModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        recipientAddress={recipientAddress}
      />
    </>
  )
}
