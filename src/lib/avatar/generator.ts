/**
 * Avatar Generator using DiceBear avataaars
 * WU-4: Deterministic avatar generation from wallet address with explicit Male/Female
 */

import { createAvatar } from '@dicebear/core'
import { avataaars, bottts } from '@dicebear/collection'
import type { AvatarStyleSelection, AvatarConfig } from '@/types'
import { AVATAR_STYLE_MAP } from '@/types'
import { avatarStyleSelectionSchema } from '@/lib/validation'

// Constants for validation
const MAX_VARIANT = 10000
const ETHEREUM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/
const FALLBACK_ADDRESS = '0x0000000000000000000000000000000000000000'
const FALLBACK_VARIANT = 0

// Gender-specific hair options for avataaars
const MALE_HAIR = [
  'shortRound',
  'shortWaved',
  'shortCurly',
  'shortFlat',
  'dreads01',
  'dreads02',
  'frizzle',
  'shaggy',
  'shaggyMullet',
  'shavedSides',
  'sides',
  'theCaesar',
  'theCaesarAndSidePart',
] as const

const FEMALE_HAIR = [
  'bob',
  'bun',
  'curly',
  'curvy',
  'dreads',
  'frida',
  'fro',
  'froBand',
  'longButNotTooLong',
  'miaWallace',
  'straight01',
  'straight02',
  'straightAndStrand',
  'bigHair',
] as const

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
    console.warn(`Invalid avatar selection: ${selection}, using fallback 'female'`)
    return 'female'
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
 * Generate a deterministic seed from wallet address, selection, and variant
 * Including selection ensures different genders generate different avatars
 */
function generateSeed(
  walletAddress: string,
  selection: AvatarStyleSelection,
  variant: number
): string {
  return `${walletAddress.toLowerCase()}-${selection}-${variant}`
}

/**
 * Generate avatar SVG string based on selection
 * Same wallet + selection + variant = identical avatar forever (deterministic)
 */
function generateAvatarBySelection(selection: AvatarStyleSelection, seed: string): string {
  // "Other" uses bottts (cute robots) - gender-neutral and fun
  if (selection === 'other') {
    const avatar = createAvatar(bottts, {
      seed,
      size: 128,
    })
    return avatar.toString()
  }

  // Male/Female use avataaars with gender-specific options
  const isMale = selection === 'male'

  const avatar = createAvatar(avataaars, {
    seed,
    size: 128,
    // Gender-specific hair
    top: isMale ? [...MALE_HAIR] : [...FEMALE_HAIR],
    // Facial hair only for male (50% probability)
    facialHair: isMale
      ? ['beardLight', 'beardMajestic', 'beardMedium', 'moustacheFancy', 'moustacheMagnum']
      : [],
    facialHairProbability: isMale ? 50 : 0,
    // Accessories for variety
    accessories: ['prescription01', 'prescription02', 'round', 'sunglasses', 'wayfarers'],
    accessoriesProbability: 30,
    // Clothing options
    clothing: [
      'blazerAndShirt',
      'blazerAndSweater',
      'collarAndSweater',
      'hoodie',
      'shirtCrewNeck',
      'shirtScoopNeck',
      'shirtVNeck',
    ],
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

  const seed = generateSeed(validAddress, validSelection, validVariant)

  return generateAvatarBySelection(validSelection, seed)
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
