/**
 * Viem client configuration for local Anvil development
 */

import { createPublicClient, createWalletClient, http, type Chain } from 'viem'
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

/** Public client for reading contract state */
export const publicClient = createPublicClient({
  chain: anvilChain,
  transport: http(),
})

/** Anvil's default test accounts */
export const ANVIL_ACCOUNTS = {
  // First account (deployer) - DO NOT USE IN PRODUCTION
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

/** Get wallet client for a specific private key */
export function getWalletClient(privateKey: `0x${string}` = ANVIL_ACCOUNTS.deployer.privateKey) {
  const account = privateKeyToAccount(privateKey)
  return createWalletClient({
    account,
    chain: anvilChain,
    transport: http(),
  })
}

/** Check if Anvil is running */
export async function isAnvilRunning(): Promise<boolean> {
  try {
    const blockNumber = await publicClient.getBlockNumber()
    return blockNumber >= BigInt(0)
  } catch {
    return false
  }
}
