'use client'

import { useMemo } from 'react'
import { getAvatarUrlSync, isCustomAvatar, type Avatar } from '@/lib/avatar'
import type { AvatarConfig } from '@/types'
import type { CustomAvatar } from '@/lib/storage/tinycloud'

export interface AvatarImageProps {
  /** The avatar (generated or custom) - accepts unified Avatar, legacy AvatarConfig, or CustomAvatar */
  avatar: Avatar | AvatarConfig | CustomAvatar | null
  /** User's wallet address (required for generated avatars) */
  walletAddress: string
  /** Size in pixels (default: 48) */
  size?: number
  /** Additional CSS classes */
  className?: string
  /** Alt text (default: "User avatar") */
  alt?: string
}

/**
 * Unified Avatar Image Component
 *
 * Renders any avatar type (generated or custom uploaded) as a simple img element.
 * Abstracts away the complexity of different avatar sources.
 *
 * @example
 * // Basic usage
 * <AvatarImage avatar={user.avatar} walletAddress={user.address} />
 *
 * // With custom size
 * <AvatarImage avatar={user.avatar} walletAddress={user.address} size={64} />
 *
 * // With Tailwind classes
 * <AvatarImage
 *   avatar={user.avatar}
 *   walletAddress={user.address}
 *   className="ring-2 ring-white shadow-lg"
 * />
 */
export function AvatarImage({
  avatar,
  walletAddress,
  size = 48,
  className = '',
  alt = 'User avatar',
}: AvatarImageProps) {
  // Use sync version for better render performance
  const url = useMemo(
    () => getAvatarUrlSync(avatar, walletAddress),
    [avatar, walletAddress]
  )

  const isCustom = avatar !== null && isCustomAvatar(avatar)

  return (
    <img
      src={url}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full ${isCustom ? 'object-cover' : ''} ${className}`}
      style={{ width: size, height: size }}
      // Prevent layout shift
      loading="eager"
      decoding="sync"
    />
  )
}

/**
 * Avatar with loading placeholder
 * Shows skeleton while avatar data is loading
 */
export function AvatarImageWithFallback({
  avatar,
  walletAddress,
  size = 48,
  className = '',
  alt = 'User avatar',
  loading = false,
}: AvatarImageProps & { loading?: boolean }) {
  const url = useMemo(
    () => (avatar ? getAvatarUrlSync(avatar, walletAddress) : null),
    [avatar, walletAddress]
  )

  if (loading || !url) {
    return (
      <div
        className={`rounded-full bg-cream-200 animate-pulse ${className}`}
        style={{ width: size, height: size }}
        aria-label="Loading avatar"
      />
    )
  }

  return (
    <img
      src={url}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full ${className}`}
      style={{ width: size, height: size }}
      loading="eager"
      decoding="sync"
    />
  )
}
