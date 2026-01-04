'use client'

import { useMemo } from 'react'
import { generateAvatarFromSelection } from '@/lib/avatar'
import type { AvatarStyleSelection } from '@/types'

interface AvatarPreviewProps {
  /** Wallet address for deterministic generation */
  walletAddress: string
  /** User's style selection */
  selection: AvatarStyleSelection
  /** Variant number */
  variant: number
  /** Size in pixels (default 128) */
  size?: number
  /** Additional CSS classes */
  className?: string
}

/**
 * Avatar preview component
 * Renders the avatar SVG inline for crisp display
 */
export function AvatarPreview({
  walletAddress,
  selection,
  variant,
  size = 128,
  className = '',
}: AvatarPreviewProps) {
  const dataUrl = useMemo(() => {
    if (!walletAddress) return ''
    const svgString = generateAvatarFromSelection(walletAddress, selection, variant)
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`
  }, [walletAddress, selection, variant])

  if (!dataUrl) {
    return (
      <div
        className={`bg-cream-100 rounded-full animate-pulse ${className}`}
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <img
      src={dataUrl}
      alt="Avatar"
      className={`rounded-full bg-cream-100 ${className}`}
      style={{ width: size, height: size }}
    />
  )
}
