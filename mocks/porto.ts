/**
 * Porto SDK Mock
 * 
 * This mock simulates the Porto SDK for testing purposes.
 * Spec: ENG-PORTO-001
 */

import { vi } from 'vitest'

export type PortoMockScenario = 
  | 'success'
  | 'user-rejected'
  | 'biometric-failed'
  | 'network-error'
  | 'timeout'
  | 'passkey-not-found'

export interface PortoMockOptions {
  scenario: PortoMockScenario
  delay?: number
  address?: string
}

const DEFAULT_ADDRESS = '0x1234567890123456789012345678901234567890'

export function createPortoMock(options: PortoMockOptions) {
  const { scenario, delay = 100, address = DEFAULT_ADDRESS } = options
  const simulateDelay = () => new Promise(resolve => setTimeout(resolve, delay))

  const connect = vi.fn(async () => {
    await simulateDelay()
    switch (scenario) {
      case 'success':
        return { addresses: [address], chainId: 1 }
      case 'user-rejected':
        throw new Error('User rejected the request')
      case 'biometric-failed':
        throw new Error('Biometric authentication failed')
      case 'network-error':
        throw new Error('Network request failed')
      case 'timeout':
        throw new Error('Request timed out')
      case 'passkey-not-found':
        throw new Error('No passkey found for this user')
      default:
        throw new Error(`Unknown scenario: ${scenario}`)
    }
  })

  const personalSign = vi.fn(async (_message: string) => {
    await simulateDelay()
    if (scenario !== 'success') throw new Error(`Cannot sign: ${scenario}`)
    return '0x' + '1'.repeat(130)
  })

  const disconnect = vi.fn(async () => {
    await simulateDelay()
  })

  return { connect, personalSign, disconnect, _scenario: scenario, _address: address }
}

export function createSuccessPortoMock(address?: string) {
  return createPortoMock({ scenario: 'success', address })
}

export function createRejectedPortoMock() {
  return createPortoMock({ scenario: 'user-rejected' })
}
