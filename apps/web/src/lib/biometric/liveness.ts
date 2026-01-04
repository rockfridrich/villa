/**
 * Liveness detection provider for ZK proofs
 *
 * Uses Bionetta SDK when available, falls back to mock for local development.
 * Mock proofs use 0xdeadbeef prefix which MockGroth16Verifier accepts.
 */

import type { LivenessProof, LivenessState } from './types'

/** Magic prefix that MockGroth16Verifier accepts */
const MOCK_PROOF_PREFIX = new Uint8Array([0xde, 0xad, 0xbe, 0xef])

export interface LivenessProviderOptions {
  /** Callback for state changes */
  onStateChange?: (state: LivenessState) => void
  /** Use mock implementation (default: true for local dev) */
  useMock?: boolean
}

export class LivenessProvider {
  private options: LivenessProviderOptions
  private state: LivenessState = { status: 'idle', progress: 0, message: '' }
  private initialized = false

  constructor(options: LivenessProviderOptions = {}) {
    this.options = { useMock: true, ...options }
  }

  /** Initialize the liveness detection system */
  async initialize(): Promise<void> {
    if (this.initialized) return

    this.updateState({
      status: 'initializing',
      progress: 10,
      message: 'Loading liveness detection...',
    })

    if (this.options.useMock) {
      // Simulate initialization delay
      await this.delay(500)
      this.initialized = true
      this.updateState({ status: 'idle', progress: 0, message: 'Ready' })
      return
    }

    // Real Bionetta initialization would go here
    // TODO: Integrate @rarimo/bionetta-js-sdk-core when available
    throw new Error('Real Bionetta SDK not available yet')
  }

  /** Generate a ZK liveness proof from face image data */
  async generateProof(faceImageData: ImageData): Promise<LivenessProof> {
    if (!this.initialized) {
      await this.initialize()
    }

    this.updateState({
      status: 'proving',
      progress: 30,
      message: 'Analyzing face...',
    })

    if (this.options.useMock) {
      // Simulate proof generation stages
      await this.delay(800)
      this.updateState({
        status: 'proving',
        progress: 50,
        message: 'Generating ZK proof...',
      })

      await this.delay(1000)
      this.updateState({
        status: 'proving',
        progress: 80,
        message: 'Finalizing proof...',
      })

      await this.delay(500)

      // Generate mock proof that MockGroth16Verifier will accept
      const mockProof = new Uint8Array(256)
      mockProof.set(MOCK_PROOF_PREFIX, 0)
      // Add some deterministic data based on image
      const hash = this.simpleHash(faceImageData.data)
      mockProof.set(new Uint8Array([hash & 0xff, (hash >> 8) & 0xff]), 4)

      this.updateState({
        status: 'complete',
        progress: 100,
        message: 'Liveness verified',
      })

      return {
        proof: mockProof,
        publicInputs: ['1'], // Mock public input indicating liveness
        isValid: true,
      }
    }

    // Real Bionetta proof generation would go here
    throw new Error('Real Bionetta SDK not available yet')
  }

  /** Get current state */
  getState(): LivenessState {
    return { ...this.state }
  }

  /** Reset to idle state */
  reset(): void {
    this.updateState({ status: 'idle', progress: 0, message: '' })
  }

  private updateState(state: LivenessState): void {
    this.state = state
    this.options.onStateChange?.(state)
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  private simpleHash(data: Uint8ClampedArray): number {
    let hash = 0
    for (let i = 0; i < Math.min(data.length, 1000); i += 100) {
      hash = ((hash << 5) - hash + data[i]) | 0
    }
    return Math.abs(hash)
  }
}

/** Convert proof bytes to hex string for contract */
export function proofToHex(proof: Uint8Array): `0x${string}` {
  return `0x${Array.from(proof)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')}`
}

/** Generate a face key hash from address (for mock enrollment) */
export function generateFaceKeyHash(address: string): `0x${string}` {
  // In real implementation, this would be derived from face features
  // For mock, we just hash the address
  const encoder = new TextEncoder()
  const data = encoder.encode(address)
  let hash = 0x811c9dc5 // FNV offset basis
  for (let i = 0; i < data.length; i++) {
    hash ^= data[i]
    hash = Math.imul(hash, 0x01000193) // FNV prime
  }
  // Return as keccak-style hash (would be actual keccak in production)
  return `0x${hash.toString(16).padStart(64, '0')}`
}
