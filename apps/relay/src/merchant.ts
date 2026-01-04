import type { MerchantConfig } from './types'

/**
 * Determines if an operation should be sponsored based on merchant configuration
 *
 * @param operation - The operation identifier (e.g., "TRANSFER", "SWAP")
 * @param config - Merchant sponsoring configuration
 * @returns true if the operation qualifies for gas sponsoring
 */
export function shouldSponsor(
  operation: string,
  config: MerchantConfig
): boolean {
  // Check if operation is in the allowed list
  if (!config.allowedOperations.includes(operation)) {
    return false
  }

  // Additional checks would include:
  // - Daily gas usage limits (would need state tracking)
  // - Per-transaction gas limits
  // - Merchant balance verification
  // - Rate limiting per user

  return true
}

/**
 * Get default merchant configuration for testing
 */
export function getDefaultMerchantConfig(): MerchantConfig {
  return {
    address: '0x0000000000000000000000000000000000000000' as const,
    maxGasPerDay: BigInt('1000000000000000000'), // 1 ETH equivalent in gas
    allowedOperations: ['TRANSFER', 'SWAP', 'APPROVE']
  }
}
