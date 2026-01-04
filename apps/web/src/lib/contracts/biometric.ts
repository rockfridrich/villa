/**
 * BiometricRecoverySigner contract interactions
 */

import { publicClient, getWalletClient, ANVIL_ACCOUNTS } from './client'

/** Contract addresses from local deployment */
const LOCAL_ADDRESSES = {
  BiometricRecoverySigner: '0x5FbDB2315678afecb367f032d93F642f64180aa3' as const,
  MockGroth16Verifier: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512' as const,
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
}

/**
 * Enroll a face key hash for an account
 * @returns Transaction hash
 */
export async function enrollFace({
  account,
  faceKeyHash,
  livenessProof,
  privateKey,
}: EnrollFaceParams): Promise<`0x${string}`> {
  const walletClient = getWalletClient(privateKey)

  const hash = await walletClient.writeContract({
    address: LOCAL_ADDRESSES.BiometricRecoverySigner,
    abi: BIOMETRIC_ABI,
    functionName: 'enrollFace',
    args: [faceKeyHash, livenessProof],
    account: account,
  })

  return hash
}

/**
 * Check if an account has enrolled face recovery
 */
export async function isEnrolled(account: `0x${string}`): Promise<boolean> {
  const result = await publicClient.readContract({
    address: LOCAL_ADDRESSES.BiometricRecoverySigner,
    abi: BIOMETRIC_ABI,
    functionName: 'isEnrolled',
    args: [account],
  })

  return result as boolean
}

/**
 * Get the face key hash for an enrolled account
 */
export async function getFaceKeyHash(account: `0x${string}`): Promise<`0x${string}`> {
  const result = await publicClient.readContract({
    address: LOCAL_ADDRESSES.BiometricRecoverySigner,
    abi: BIOMETRIC_ABI,
    functionName: 'getFaceKeyHash',
    args: [account],
  })

  return result as `0x${string}`
}

/**
 * Wait for a transaction to be confirmed
 */
export async function waitForTransaction(hash: `0x${string}`): Promise<void> {
  await publicClient.waitForTransactionReceipt({ hash })
}

export { LOCAL_ADDRESSES, ANVIL_ACCOUNTS }
