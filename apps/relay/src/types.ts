import type { Address } from 'viem'

export interface MerchantConfig {
  address: Address
  maxGasPerDay: bigint
  allowedOperations: string[]
}

export interface RelayRequest {
  operation: string
  target: Address
  value: bigint
  data: `0x${string}`
  signature: `0x${string}`
}

export interface RelayResponse {
  success: boolean
  txHash?: `0x${string}`
  error?: string
}

export interface HealthResponse {
  status: 'ok' | 'degraded' | 'error'
  chain: 'base' | 'base-sepolia'
  chainId: number
  blockNumber: bigint
  timestamp: number
}
