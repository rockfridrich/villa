/**
 * Avatar URL Generation
 *
 * Generates deterministic avatar URLs using DiceBear API.
 * No fetch required - just returns the URL for client-side rendering.
 */

import type { AvatarConfig } from './types'

const DICEBEAR_API = 'https://api.dicebear.com/7.x'

/**
 * Generates a deterministic avatar URL from a seed
 *
 * @param seed - Seed for deterministic generation (address, nickname, etc)
 * @param config - Optional avatar configuration
 * @returns URL to DiceBear SVG avatar
 *
 * @example
 * const url = getAvatarUrl('alice')
 * // => 'https://api.dicebear.com/7.x/adventurer/svg?seed=alice'
 *
 * const url = getAvatarUrl('bob', { style: 'bottts' })
 * // => 'https://api.dicebear.com/7.x/bottts/svg?seed=bob'
 */
export function getAvatarUrl(
  seed: string,
  config?: Partial<AvatarConfig>
): string {
  const style = config?.style || 'adventurer'
  const params = new URLSearchParams({ seed })

  // Add gender preference if provided and style supports it
  if (config?.gender) {
    params.set('gender', config.gender)
  }

  return `${DICEBEAR_API}/${style}/svg?${params.toString()}`
}

/**
 * Creates a complete AvatarConfig from partial input
 *
 * @param seed - Seed for avatar generation
 * @param partial - Partial avatar configuration
 * @returns Complete AvatarConfig with defaults
 */
export function createAvatarConfig(
  seed: string,
  partial?: Partial<AvatarConfig>
): AvatarConfig {
  return {
    style: partial?.style || 'adventurer',
    seed,
    gender: partial?.gender,
  }
}
