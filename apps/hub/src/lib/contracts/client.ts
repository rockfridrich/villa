/**
 * Viem client configuration for multi-chain support
 *
 * Supports:
 * - Anvil (local dev): Chain ID 31337
 * - Base Sepolia (testnet): Chain ID 84532
 */

import { createPublicClient, createWalletClient, http, type Chain } from 'viem'
import { baseSepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

/** Local Anvil chain configuration */
export const anvilChain: Chain = {
  id: 31337,
  name: 'Anvil Local',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
  },
}

/** Base Sepolia RPC URL */
const BASE_SEPOLIA_RPC = 'https://sepolia.base.org'

/** Base Sepolia with explicit RPC (viem default is rate-limited) */
const baseSepoliaWithRpc: Chain = {
  ...baseSepolia,
  rpcUrls: {
    ...baseSepolia.rpcUrls,
    default: { http: [BASE_SEPOLIA_RPC] },
  },
}

/** Supported chains */
export const SUPPORTED_CHAINS = {
  anvil: anvilChain,
  baseSepolia: baseSepoliaWithRpc,
} as const

/** Get chain ID from environment or default to Anvil */
function getChainId(): number {
  const envChainId = process.env.NEXT_PUBLIC_CHAIN_ID
  if (!envChainId) return anvilChain.id

  const chainId = parseInt(envChainId, 10)
  if (isNaN(chainId)) {
    console.warn(`Invalid NEXT_PUBLIC_CHAIN_ID: ${envChainId}, defaulting to Anvil`)
    return anvilChain.id
  }

  return chainId
}

/** Get chain configuration by chain ID */
export function getChain(chainId: number): Chain {
  switch (chainId) {
    case 31337:
      return anvilChain
    case 84532:
      return baseSepoliaWithRpc
    default:
      console.warn(`Unsupported chain ID: ${chainId}, defaulting to Anvil`)
      return anvilChain
  }
}

/** Get the currently configured chain */
export function getCurrentChain(): Chain {
  return getChain(getChainId())
}

/**
 * Get RPC URL for a chain
 */
function getRpcUrl(chainId: number): string | undefined {
  switch (chainId) {
    case 84532:
      return BASE_SEPOLIA_RPC
    case 31337:
      return 'http://127.0.0.1:8545'
    default:
      return undefined
  }
}

/**
 * Get public client for the configured chain
 *
 * @param chainId - Optional chain ID override (defaults to NEXT_PUBLIC_CHAIN_ID)
 * @returns Viem public client
 *
 * @example
 * const client = getPublicClient() // Uses env chain
 * const sepoliaClient = getPublicClient(84532) // Explicit chain
 */
export function getPublicClient(chainId?: number): ReturnType<typeof createPublicClient> {
  const chain = chainId ? getChain(chainId) : getCurrentChain()
  const rpcUrl = getRpcUrl(chain.id)

  return createPublicClient({
    chain,
    transport: http(rpcUrl),
  })
}

/** Default public client (uses env-configured chain) */
export const publicClient = getPublicClient()

/** Anvil's default test accounts - DO NOT USE IN PRODUCTION */
export const ANVIL_ACCOUNTS = {
  // First account (deployer)
  deployer: {
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as const,
    privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as const,
  },
  // Second account (for testing)
  user1: {
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' as const,
    privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d' as const,
  },
} as const

/**
 * Get wallet client for a specific private key
 *
 * @param privateKey - Account private key (defaults to Anvil deployer for testing)
 * @param chainId - Optional chain ID override
 * @returns Viem wallet client
 */
export function getWalletClient(
  privateKey: `0x${string}` = ANVIL_ACCOUNTS.deployer.privateKey,
  chainId?: number
) {
  const account = privateKeyToAccount(privateKey)
  const chain = chainId ? getChain(chainId) : getCurrentChain()
  const rpcUrl = getRpcUrl(chain.id)

  return createWalletClient({
    account,
    chain,
    transport: http(rpcUrl),
  })
}

/**
 * Check if a chain is connected and responding
 *
 * @param chainId - Chain ID to check (defaults to configured chain)
 * @returns true if chain is connected
 *
 * @example
 * const isAnvil = await isChainConnected(31337)
 * const isSepolia = await isChainConnected(84532)
 */
export async function isChainConnected(chainId?: number): Promise<boolean> {
  try {
    const client = getPublicClient(chainId)
    const blockNumber = await client.getBlockNumber()
    return blockNumber >= BigInt(0)
  } catch {
    return false
  }
}

/**
 * Legacy alias for Anvil check
 * @deprecated Use isChainConnected(31337) instead
 */
export const isAnvilRunning = () => isChainConnected(31337)
