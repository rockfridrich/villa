import { createPublicClient, http } from 'viem'
import { base, baseSepolia } from 'viem/chains'
import type { HealthResponse } from './types'

/**
 * Creates a public client for the configured chain
 */
export function createChainClient() {
  const isTestnet = process.env.CHAIN_ENV === 'testnet'
  const chain = isTestnet ? baseSepolia : base

  const rpcUrl = process.env.BASE_RPC_URL || (
    isTestnet
      ? 'https://sepolia.base.org'
      : 'https://mainnet.base.org'
  )

  return {
    client: createPublicClient({
      chain,
      transport: http(rpcUrl)
    }),
    chain
  }
}

/**
 * Performs health check by verifying chain connectivity
 */
export async function checkHealth(): Promise<HealthResponse> {
  try {
    const { client, chain } = createChainClient()

    const blockNumber = await client.getBlockNumber()

    return {
      status: 'ok',
      chain: chain.id === baseSepolia.id ? 'base-sepolia' : 'base',
      chainId: chain.id,
      blockNumber,
      timestamp: Date.now()
    }
  } catch (error) {
    return {
      status: 'error',
      chain: process.env.CHAIN_ENV === 'testnet' ? 'base-sepolia' : 'base',
      chainId: process.env.CHAIN_ENV === 'testnet' ? 84532 : 8453,
      blockNumber: BigInt(0),
      timestamp: Date.now()
    }
  }
}
