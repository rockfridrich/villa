/**
 * Unified Avatar API
 * Abstracts generated (DiceBear) and custom (TinyCloud) avatars for developers
 *
 * Usage:
 *   const url = await getAvatarUrl(identity.avatar, identity.address)
 *   <img src={url} />
 */

import { generateAvatarFromSelection, generateAvatarPng } from './generator'
import type { AvatarConfig } from '@/types'
import type { CustomAvatar } from '@/lib/storage/tinycloud'

// ============================================================================
// Types
// ============================================================================

/** Generated avatar from DiceBear */
export interface GeneratedAvatar {
  type: 'generated'
  config: AvatarConfig
}

/** Unified avatar type - either generated or custom uploaded */
export type Avatar = GeneratedAvatar | CustomAvatar

/** Output format for avatar */
export type AvatarFormat = 'svg' | 'png'

/** Options for avatar URL generation */
export interface AvatarUrlOptions {
  /** Output format (default: 'svg') */
  format?: AvatarFormat
  /** Size in pixels for PNG (default: 256) */
  size?: number
}

// ============================================================================
// Type Guards
// ============================================================================

/** Check if avatar is custom uploaded */
export function isCustomAvatar(avatar: Avatar | AvatarConfig | CustomAvatar | null): avatar is CustomAvatar {
  return avatar !== null && 'type' in avatar && avatar.type === 'custom'
}

/** Check if avatar is generated */
export function isGeneratedAvatar(avatar: Avatar | AvatarConfig | null): avatar is GeneratedAvatar {
  return avatar !== null && 'type' in avatar && avatar.type === 'generated'
}

/** Check if avatar is legacy AvatarConfig (no type field) */
export function isLegacyAvatarConfig(avatar: Avatar | AvatarConfig | CustomAvatar | null): avatar is AvatarConfig {
  return avatar !== null && 'style' in avatar && 'selection' in avatar && !('type' in avatar)
}

// ============================================================================
// Conversion Utilities
// ============================================================================

/** Convert legacy AvatarConfig to unified Avatar type */
export function toUnifiedAvatar(config: AvatarConfig): GeneratedAvatar {
  return {
    type: 'generated',
    config,
  }
}

/** Convert any avatar format to unified Avatar type */
export function normalizeAvatar(avatar: Avatar | AvatarConfig | CustomAvatar): Avatar {
  if (isCustomAvatar(avatar)) {
    return avatar
  }
  if (isGeneratedAvatar(avatar)) {
    return avatar
  }
  if (isLegacyAvatarConfig(avatar)) {
    return toUnifiedAvatar(avatar)
  }
  // Fallback - treat as legacy config
  return toUnifiedAvatar(avatar as AvatarConfig)
}

// ============================================================================
// Core API
// ============================================================================

/**
 * Get avatar as ready-to-use data URL
 *
 * This is the main function developers should use. It handles both
 * generated and custom avatars, returning a ready-to-use URL.
 *
 * @param avatar - The avatar (generated or custom)
 * @param walletAddress - User's wallet address (needed for generated avatars)
 * @param options - Output format and size options
 * @returns Data URL string ready for img src
 *
 * @example
 * // SVG (default, best quality)
 * const svgUrl = await getAvatarUrl(user.avatar, user.address)
 *
 * // PNG at specific size
 * const pngUrl = await getAvatarUrl(user.avatar, user.address, { format: 'png', size: 128 })
 */
export async function getAvatarUrl(
  avatar: Avatar | AvatarConfig | CustomAvatar | null,
  walletAddress: string,
  options: AvatarUrlOptions = {}
): Promise<string> {
  const { format = 'svg', size = 256 } = options

  // Handle null avatar
  if (!avatar) {
    // Return default avatar
    return getDefaultAvatarUrl(walletAddress, options)
  }

  // Custom avatar - already has dataUrl
  if (isCustomAvatar(avatar)) {
    // Custom avatars are stored as PNG/WebP, return as-is
    // If PNG format requested and custom is different, we could convert
    // but for now, custom avatars are already in optimal format
    return avatar.dataUrl
  }

  // Generated avatar
  const config = isGeneratedAvatar(avatar) ? avatar.config : avatar as AvatarConfig

  if (format === 'png') {
    return generateAvatarPng(walletAddress, config.selection, config.variant, size)
  }

  // SVG format
  const svg = generateAvatarFromSelection(walletAddress, config.selection, config.variant)
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`
}

/**
 * Get avatar URL synchronously (SVG only, generated avatars only)
 * Use this for performance-critical rendering where async isn't ideal
 *
 * @param avatar - The avatar (will fall back to default for custom)
 * @param walletAddress - User's wallet address
 * @returns SVG data URL
 */
export function getAvatarUrlSync(
  avatar: Avatar | AvatarConfig | CustomAvatar | null,
  walletAddress: string
): string {
  // Custom avatar - already has dataUrl
  if (avatar && isCustomAvatar(avatar)) {
    return avatar.dataUrl
  }

  // Generated or legacy config
  if (avatar) {
    const config = isGeneratedAvatar(avatar) ? avatar.config : avatar as AvatarConfig
    const svg = generateAvatarFromSelection(walletAddress, config.selection, config.variant)
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`
  }

  // Default avatar for null
  const svg = generateAvatarFromSelection(walletAddress, 'female', 0)
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`
}

/**
 * Get default avatar URL for a wallet address
 * Used when user hasn't set an avatar yet
 */
export function getDefaultAvatarUrl(
  walletAddress: string,
  options: AvatarUrlOptions = {}
): string {
  const { format = 'svg' } = options

  // Default to female avataaars variant 0
  if (format === 'png') {
    // Return a promise-compatible default for PNG
    // Note: This is sync but returns what would be the PNG
    // For true PNG, caller should use getAvatarUrl
    const svg = generateAvatarFromSelection(walletAddress, 'female', 0)
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`
  }

  const svg = generateAvatarFromSelection(walletAddress, 'female', 0)
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`
}

/**
 * Get avatar as raw SVG string
 * Useful for inline SVG rendering or manipulation
 */
export function getAvatarSvg(
  avatar: Avatar | AvatarConfig | null,
  walletAddress: string
): string | null {
  // Custom avatars don't have SVG
  if (avatar && isCustomAvatar(avatar)) {
    return null
  }

  if (!avatar) {
    return generateAvatarFromSelection(walletAddress, 'female', 0)
  }

  const config = isGeneratedAvatar(avatar) ? avatar.config : avatar as AvatarConfig
  return generateAvatarFromSelection(walletAddress, config.selection, config.variant)
}

// ============================================================================
// SDK Export Helper
// ============================================================================

/**
 * Resolved avatar ready for SDK consumers
 * All the complexity is hidden - just use the url
 */
export interface ResolvedAvatar {
  /** Ready-to-use URL for img src */
  url: string
  /** Whether this is a custom uploaded avatar */
  isCustom: boolean
  /** Original avatar data (for storage/reference) */
  original: Avatar | AvatarConfig | CustomAvatar
}

/**
 * Resolve avatar to a simple object with ready-to-use URL
 * This is the recommended API for SDK consumers
 */
export async function resolveAvatar(
  avatar: Avatar | AvatarConfig | CustomAvatar | null,
  walletAddress: string,
  options: AvatarUrlOptions = {}
): Promise<ResolvedAvatar> {
  const url = await getAvatarUrl(avatar, walletAddress, options)
  const isCustom = avatar !== null && isCustomAvatar(avatar)

  return {
    url,
    isCustom,
    original: avatar ?? toUnifiedAvatar({
      style: 'avataaars',
      selection: 'female',
      variant: 0,
    }),
  }
}
