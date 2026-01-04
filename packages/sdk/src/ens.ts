/**
 * ENS Resolution
 *
 * Resolves ENS names to addresses and vice versa using viem.
 * Supports mainnet ENS with CCIP-Read for L2 names like .base.eth.
 */

import { createPublicClient, http, normalize } from 'viem'
import { mainnet } from 'viem/chains'

/**
 * Creates a public client for ENS resolution
 * ENS is on mainnet, but CCIP-Read allows L2 name resolution
 */
function createEnsClient() {
  return createPublicClient({
    chain: mainnet,
    transport: http(),
  })
}

/**
 * Resolves an ENS name to an Ethereum address
 *
 * @param name - ENS name (e.g., 'vitalik.eth' or 'alice.base.eth')
 * @returns Address or null if not found
 *
 * @example
 * const address = await resolveEns('vitalik.eth')
 * // => '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
 */
export async function resolveEns(name: string): Promise<string | null> {
  try {
    const client = createEnsClient()
    const address = await client.getEnsAddress({
      name: normalize(name),
    })

    return address || null
  } catch (error) {
    // ENS resolution can fail for various reasons:
    // - Name not registered
    // - Network issues
    // - Invalid name format
    console.warn(`Failed to resolve ENS name "${name}":`, error)
    return null
  }
}

/**
 * Performs reverse ENS lookup (address to name)
 *
 * @param address - Ethereum address
 * @returns ENS name or null if not found
 *
 * @example
 * const name = await reverseEns('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045')
 * // => 'vitalik.eth'
 */
export async function reverseEns(address: string): Promise<string | null> {
  try {
    const client = createEnsClient()
    const name = await client.getEnsName({
      address: address as `0x${string}`,
    })

    return name || null
  } catch (error) {
    console.warn(`Failed to reverse resolve address "${address}":`, error)
    return null
  }
}
