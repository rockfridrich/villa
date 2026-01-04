/**
 * Villa Contract Addresses
 *
 * Deployed contract addresses for Villa infrastructure.
 * See contracts/deployments/ for deployment details.
 */

import { baseSepolia, base } from 'viem/chains'
import type { Address, Chain } from 'viem'

/** Contract deployment info */
export interface ContractDeployment {
  /** Proxy address (user interacts with this) */
  proxy: Address
  /** Implementation address */
  implementation: Address
  /** Block number of deployment */
  deployedAt?: number
}

/** Chain-specific contract addresses */
export interface ChainContracts {
  /** VillaNicknameResolverV2 - ENS CCIP-Read gateway resolver */
  nicknameResolver: ContractDeployment
  /** BiometricRecoverySignerV2 - Face-based wallet recovery */
  recoverySigner: ContractDeployment
  /** Mock verifier (testnet only) */
  mockVerifier?: Address
}

/** Contract addresses by chain ID */
export const CONTRACTS: Record<number, ChainContracts> = {
  // Base Sepolia (Testnet) - Deployed 2026-01-05
  [baseSepolia.id]: {
    nicknameResolver: {
      proxy: '0xf4648423aC6b3f6328018c49B2102f4E9bA6D800',
      implementation: '0xd959290E5E5f99D1e56765aFcd1c786E9118AAe7',
      deployedAt: 22_000_000, // Approximate
    },
    recoverySigner: {
      proxy: '0xdFb55a363bdF549EE5C2e77D0aAaC39276ED5836',
      implementation: '0xbff139E1db248B60B0BEAA7864Ba180597714D7F',
      deployedAt: 22_000_000, // Approximate
    },
    mockVerifier: '0x3a4C091500159901deB27D8F5559ACD8a643A12b',
  },

  // Base Mainnet - Not yet deployed
  // [base.id]: {
  //   nicknameResolver: { proxy: '0x...', implementation: '0x...' },
  //   recoverySigner: { proxy: '0x...', implementation: '0x...' },
  // },
}

/**
 * Gets contract addresses for a chain
 *
 * @param chainId - Chain ID (e.g., 84532 for Base Sepolia)
 * @returns Chain contracts or null if not deployed
 *
 * @example
 * const contracts = getContracts(84532)
 * if (contracts) {
 *   console.log('Resolver:', contracts.nicknameResolver.proxy)
 * }
 */
export function getContracts(chainId: number): ChainContracts | null {
  return CONTRACTS[chainId] ?? null
}

/**
 * Gets contracts for a viem chain
 *
 * @param chain - Viem chain object
 * @returns Chain contracts or null if not deployed
 *
 * @example
 * import { baseSepolia } from 'viem/chains'
 * const contracts = getContractsForChain(baseSepolia)
 */
export function getContractsForChain(chain: Chain): ChainContracts | null {
  return getContracts(chain.id)
}

/**
 * Gets the nickname resolver proxy address
 *
 * @param chainId - Chain ID
 * @returns Proxy address or null
 */
export function getNicknameResolverAddress(chainId: number): Address | null {
  const contracts = getContracts(chainId)
  return contracts?.nicknameResolver.proxy ?? null
}

/**
 * Gets the recovery signer proxy address
 *
 * @param chainId - Chain ID
 * @returns Proxy address or null
 */
export function getRecoverySignerAddress(chainId: number): Address | null {
  const contracts = getContracts(chainId)
  return contracts?.recoverySigner.proxy ?? null
}

/** List of chains where Villa contracts are deployed */
export const DEPLOYED_CHAINS = Object.keys(CONTRACTS).map(Number)

/** Check if contracts are deployed on a chain */
export function isDeployed(chainId: number): boolean {
  return chainId in CONTRACTS
}
