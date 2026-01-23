'use client'

import { useCallback } from 'react'
import { useAuth } from './hooks'
import {
  getAvatarUrl,
  getWeb3AvatarStyles,
  type Identity,
  type AvatarConfig,
} from '@rockfridrich/villa-sdk'
import type { VillaAuthResponse } from './context'

interface VillaAuthProps {
  /** Called when auth completes (success or failure) */
  onComplete: (result: VillaAuthResponse) => void
  /** Optional: App name shown in consent */
  appName?: string
  /** Optional: Custom button text */
  buttonText?: string
  /** Optional: Custom button className */
  className?: string
}

/**
 * VillaAuth - Simple auth button that triggers the full flow
 *
 * @example
 * ```tsx
 * <VillaAuth
 *   onComplete={(result) => {
 *     if (result.success) {
 *       console.log('Welcome', result.identity.nickname)
 *     }
 *   }}
 * />
 * ```
 */
export function VillaAuth({
  onComplete,
  buttonText = 'Sign in with Villa',
  className = '',
}: VillaAuthProps) {
  const { signIn, isLoading } = useAuth()

  const handleClick = useCallback(async () => {
    const result = await signIn()
    onComplete(result)
  }, [signIn, onComplete])

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={className}
      style={
        !className
          ? {
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: 500,
              backgroundColor: '#FFD93D',
              color: '#1a1a1a',
              border: 'none',
              borderRadius: '8px',
              cursor: isLoading ? 'wait' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
            }
          : undefined
      }
    >
      {isLoading ? 'Connecting...' : buttonText}
    </button>
  )
}

interface AvatarProps {
  /** User identity containing avatar config */
  identity: Identity
  /** Size in pixels */
  size?: number
  /** Optional className */
  className?: string
}

/**
 * Avatar - Display user's avatar
 *
 * @example
 * ```tsx
 * <Avatar identity={user} size={48} />
 * ```
 */
export function Avatar({ identity, size = 48, className = '' }: AvatarProps) {
  const url = getAvatarUrl(identity.address, identity.avatar)

  return (
    <img
      src={url}
      alt={`@${identity.nickname}`}
      width={size}
      height={size}
      className={className}
      style={{
        borderRadius: '50%',
        backgroundColor: '#f5f5f5',
      }}
    />
  )
}

interface AvatarPreviewProps {
  /** Avatar configuration */
  config: AvatarConfig
  /** Size in pixels */
  size?: number
  /** Optional className */
  className?: string
}

/**
 * AvatarPreview - Preview avatar from config
 *
 * @example
 * ```tsx
 * <AvatarPreview
 *   config={{ style: 'avataaars', seed: '0x...', gender: 'female' }}
 *   size={64}
 * />
 * ```
 */
export function AvatarPreview({
  config,
  size = 48,
  className = '',
}: AvatarPreviewProps) {
  const url = getAvatarUrl(config.seed, config)

  return (
    <img
      src={url}
      alt="Avatar preview"
      width={size}
      height={size}
      className={className}
      style={{
        borderRadius: '50%',
        backgroundColor: '#f5f5f5',
      }}
    />
  )
}

interface Web3AvatarProps {
  address: string
  size?: number
  className?: string
}

export function Web3Avatar({ address, size = 48, className = '' }: Web3AvatarProps) {
  const styles = getWeb3AvatarStyles(address)

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        ...styles,
      }}
    />
  )
}
