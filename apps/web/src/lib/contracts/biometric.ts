/**
 * BiometricRecoverySigner contract interactions
 *
 * Supports multi-chain deployments:
 * - Anvil (local dev): 31337
 * - Base Sepolia (testnet): 84532
 */

import { type Address } from 'viem'
import { getPublicClient, getWalletClient, getCurrentChain, ANVIL_ACCOUNTS } from './client'

/** Local Anvil contract addresses */
const ANVIL_ADDRESSES = {
  BiometricRecoverySigner: '0x5FbDB2315678afecb367f032d93F642f64180aa3' as const,
  MockGroth16Verifier: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512' as const,
}

/** Base Sepolia contract addresses (deployed 2026-01-05) */
const SEPOLIA_ADDRESSES = {
  BiometricRecoverySigner: '0xdFb55a363bdF549EE5C2e77D0aAaC39276ED5836' as const,
  MockGroth16Verifier: '0x3a4C091500159901deB27D8F5559ACD8a643A12b' as const,
}

/**
 * Get contract addresses for a specific chain
 *
 * @param chainId - Chain ID (31337 for Anvil, 84532 for Base Sepolia)
 * @returns Contract addresses
 * @throws Error if chain is not supported
 */
export function getContractAddresses(chainId: number): {
  BiometricRecoverySigner: Address
  MockGroth16Verifier: Address
} {
  switch (chainId) {
    case 31337: // Anvil
      return ANVIL_ADDRESSES
    case 84532: // Base Sepolia
      return SEPOLIA_ADDRESSES
    default:
      throw new Error(`Unsupported chain ID: ${chainId}. Supported chains: 31337 (Anvil), 84532 (Base Sepolia)`)
  }
}

/** BiometricRecoverySigner ABI (subset needed for enrollment) */
const BIOMETRIC_ABI = [
  {
    name: 'enrollFace',
    type: 'function',
    inputs: [
      { name: 'faceKeyHash', type: 'bytes32' },
      { name: 'livenessProof', type: 'bytes' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'isEnrolled',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    name: 'getFaceKeyHash',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    name: 'getNextNonce',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const

interface EnrollFaceParams {
  account: `0x${string}`
  faceKeyHash: `0x${string}`
  livenessProof: `0x${string}`
  privateKey: `0x${string}`
  chainId?: number
}

/**
 * Enroll a face key hash for an account
 *
 * @param params - Enrollment parameters
 * @param params.account - Account address to enroll
 * @param params.faceKeyHash - Hash of face biometric template
 * @param params.livenessProof - ZK proof of liveness
 * @param params.privateKey - Private key to sign transaction
 * @param params.chainId - Optional chain ID (defaults to configured chain)
 * @returns Transaction hash
 *
 * @example
 * const hash = await enrollFace({
 *   account: '0x...',
 *   faceKeyHash: '0x...',
 *   livenessProof: '0x...',
 *   privateKey: '0x...',
 *   chainId: 84532, // Base Sepolia
 * })
 */
export async function enrollFace({
  account,
  faceKeyHash,
  livenessProof,
  privateKey,
  chainId,
}: EnrollFaceParams): Promise<`0x${string}`> {
  const chain = chainId ?? getCurrentChain().id
  const addresses = getContractAddresses(chain)
  const walletClient = getWalletClient(privateKey, chain)

  const hash = await walletClient.writeContract({
    address: addresses.BiometricRecoverySigner,
    abi: BIOMETRIC_ABI,
    functionName: 'enrollFace',
    args: [faceKeyHash, livenessProof],
    account: account,
  })

  return hash
}

/**
 * Check if an account has enrolled face recovery
 *
 * @param account - Account address to check
 * @param chainId - Optional chain ID (defaults to configured chain)
 * @returns true if account has enrolled
 *
 * @example
 * const enrolled = await isEnrolled('0x...', 84532)
 */
export async function isEnrolled(account: `0x${string}`, chainId?: number): Promise<boolean> {
  const chain = chainId ?? getCurrentChain().id
  const addresses = getContractAddresses(chain)
  const client = getPublicClient(chain)

  const result = await client.readContract({
    address: addresses.BiometricRecoverySigner,
    abi: BIOMETRIC_ABI,
    functionName: 'isEnrolled',
    args: [account],
  })

  return result
}

/**
 * Get the face key hash for an enrolled account
 *
 * @param account - Account address to query
 * @param chainId - Optional chain ID (defaults to configured chain)
 * @returns Face key hash (bytes32)
 *
 * @example
 * const hash = await getFaceKeyHash('0x...', 84532)
 */
export async function getFaceKeyHash(account: `0x${string}`, chainId?: number): Promise<`0x${string}`> {
  const chain = chainId ?? getCurrentChain().id
  const addresses = getContractAddresses(chain)
  const client = getPublicClient(chain)

  const result = await client.readContract({
    address: addresses.BiometricRecoverySigner,
    abi: BIOMETRIC_ABI,
    functionName: 'getFaceKeyHash',
    args: [account],
  })

  return result
}

/**
 * Wait for a transaction to be confirmed
 *
 * @param hash - Transaction hash
 * @param chainId - Optional chain ID (defaults to configured chain)
 *
 * @example
 * await waitForTransaction('0x...', 84532)
 */
export async function waitForTransaction(hash: `0x${string}`, chainId?: number): Promise<void> {
  const client = getPublicClient(chainId)
  await client.waitForTransactionReceipt({ hash })
}

// Re-export for backward compatibility
export { ANVIL_ACCOUNTS }
export const LOCAL_ADDRESSES = ANVIL_ADDRESSES
