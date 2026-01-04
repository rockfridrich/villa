/**
 * Avatar Generator using DiceBear
 * WU-4: Deterministic avatar generation from wallet address
 */

import { createAvatar } from '@dicebear/core'
import { lorelei, notionistsNeutral } from '@dicebear/collection'
import type { AvatarStyleSelection, AvatarConfig } from '@/types'
import { AVATAR_STYLE_MAP } from '@/types'
import { avatarStyleSelectionSchema } from '@/lib/validation'

// Constants for validation
const MAX_VARIANT = 10000
const ETHEREUM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/
const FALLBACK_ADDRESS = '0x0000000000000000000000000000000000000000'
const FALLBACK_VARIANT = 0

/**
 * Validate wallet address format
 */
function validateWalletAddress(address: string): string {
  if (!ETHEREUM_ADDRESS_REGEX.test(address)) {
    console.warn(`Invalid wallet address format: ${address}, using fallback`)
    return FALLBACK_ADDRESS
  }
  return address
}

/**
 * Validate avatar style selection
 */
function validateSelection(selection: AvatarStyleSelection): AvatarStyleSelection {
  const result = avatarStyleSelectionSchema.safeParse(selection)
  if (!result.success) {
    console.warn(`Invalid avatar selection: ${selection}, using fallback 'other'`)
    return 'other'
  }
  return result.data
}

/**
 * Validate variant number
 */
function validateVariant(variant: number): number {
  if (!Number.isInteger(variant) || variant < 0) {
    console.warn(`Invalid variant (must be non-negative integer): ${variant}, using fallback`)
    return FALLBACK_VARIANT
  }
  if (variant > MAX_VARIANT) {
    console.warn(`Variant ${variant} exceeds max ${MAX_VARIANT}, capping to max`)
    return MAX_VARIANT
  }
  return variant
}

/**
 * Generate a deterministic seed from wallet address and variant
 */
function generateSeed(walletAddress: string, variant: number): string {
  return `${walletAddress.toLowerCase()}-${variant}`
}

/**
 * Generate avatar SVG string using lorelei style
 * Same wallet + variant = identical avatar forever (deterministic)
 */
function generateLoreleiAvatar(seed: string): string {
  const avatar = createAvatar(lorelei, {
    seed,
    size: 128,
  })
  return avatar.toString()
}

/**
 * Generate avatar SVG string using notionists-neutral style
 */
function generateNotionistsAvatar(seed: string): string {
  const avatar = createAvatar(notionistsNeutral, {
    seed,
    size: 128,
  })
  return avatar.toString()
}

/**
 * Generate avatar from user selection
 * Maps user-friendly selection to DiceBear style
 * Validates inputs and uses fallback values if validation fails
 */
export function generateAvatarFromSelection(
  walletAddress: string,
  selection: AvatarStyleSelection,
  variant: number
): string {
  // Validate inputs - use fallback values if invalid
  const validAddress = validateWalletAddress(walletAddress)
  const validSelection = validateSelection(selection)
  const validVariant = validateVariant(variant)

  const seed = generateSeed(validAddress, validVariant)

  // Use notionists-neutral for "other", lorelei for male/female
  if (validSelection === 'other') {
    return generateNotionistsAvatar(seed)
  }
  return generateLoreleiAvatar(seed)
}

/**
 * Create avatar config from selection
 * Validates inputs and uses fallback values if validation fails
 */
export function createAvatarConfig(
  selection: AvatarStyleSelection,
  variant: number
): AvatarConfig {
  const validSelection = validateSelection(selection)
  const validVariant = validateVariant(variant)

  return {
    style: AVATAR_STYLE_MAP[validSelection],
    selection: validSelection,
    variant: validVariant,
  }
}

/**
 * Generate avatar data URL (for img src)
 * Validates inputs and uses fallback values if validation fails
 */
export function generateAvatarDataUrl(
  walletAddress: string,
  selection: AvatarStyleSelection,
  variant: number
): string {
  // Validation happens inside generateAvatarFromSelection
  const svg = generateAvatarFromSelection(walletAddress, selection, variant)
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

/**
 * Convert SVG to PNG using canvas
 * Note: Async because canvas operations can be slow
 *
 * @param svgString - SVG string to convert
 * @param size - Output size in pixels
 * @returns Base64 PNG data URL
 */
export async function svgToPng(svgString: string, size: number = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const svg = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svg)

    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        URL.revokeObjectURL(url)
        reject(new Error('Could not get canvas context'))
        return
      }

      ctx.drawImage(img, 0, 0, size, size)
      URL.revokeObjectURL(url)

      resolve(canvas.toDataURL('image/png'))
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load SVG'))
    }

    img.src = url
  })
}

/**
 * Generate PNG avatar
 * Validates inputs and uses fallback values if validation fails
 */
export async function generateAvatarPng(
  walletAddress: string,
  selection: AvatarStyleSelection,
  variant: number,
  size: number = 256
): Promise<string> {
  // Validation happens inside generateAvatarFromSelection
  const svg = generateAvatarFromSelection(walletAddress, selection, variant)
  return svgToPng(svg, size)
}
