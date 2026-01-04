/**
 * Villa SDK Client
 *
 * Main SDK class providing identity, ENS, and avatar functionality.
 */

import type { AvatarConfig, VillaConfig } from './types'
import { resolveEns as resolveEnsName, reverseEns as reverseEnsAddress } from './ens'
import { getAvatarUrl as generateAvatarUrl } from './avatar'

/**
 * Villa SDK Client
 *
 * Provides identity resolution, ENS lookups, and avatar generation.
 *
 * @example
 * const villa = new Villa({ appId: 'my-app' })
 *
 * // Resolve ENS name
 * const address = await villa.resolveEns('vitalik.eth')
 *
 * // Reverse lookup
 * const name = await villa.reverseEns('0xd8dA...')
 *
 * // Generate avatar
 * const url = villa.getAvatarUrl('alice', { style: 'bottts' })
 */
export class Villa {
  private config: VillaConfig

  constructor(config: VillaConfig) {
    this.config = {
      ...config,
      network: config.network || 'base',
      apiUrl: config.apiUrl || 'https://api.villa.cash',
    }
  }

  /**
   * Resolves an ENS name to an Ethereum address
   *
   * @param name - ENS name (e.g., 'vitalik.eth' or 'alice.base.eth')
   * @returns Address or null if not found
   */
  async resolveEns(name: string): Promise<string | null> {
    return resolveEnsName(name)
  }

  /**
   * Performs reverse ENS lookup (address to name)
   *
   * @param address - Ethereum address
   * @returns ENS name or null if not found
   */
  async reverseEns(address: string): Promise<string | null> {
    return reverseEnsAddress(address)
  }

  /**
   * Generates a deterministic avatar URL
   *
   * @param seed - Seed for deterministic generation (address, nickname, etc)
   * @param config - Optional avatar configuration
   * @returns URL to DiceBear SVG avatar
   */
  getAvatarUrl(seed: string, config?: Partial<AvatarConfig>): string {
    return generateAvatarUrl(seed, config)
  }

  /**
   * Gets the current network configuration
   */
  getNetwork(): 'base' | 'base-sepolia' {
    return this.config.network || 'base'
  }

  /**
   * Gets the API URL
   */
  getApiUrl(): string {
    return this.config.apiUrl || 'https://api.villa.cash'
  }
}
