import { verifyTypedData, type Address, type Hex } from 'viem'

/**
 * EIP-712 domain for nickname claims
 */
const NICKNAME_CLAIM_DOMAIN = {
  name: 'Villa Nickname Registry',
  version: '1',
  chainId: 1,
} as const

/**
 * EIP-712 types for nickname claim
 */
const NICKNAME_CLAIM_TYPES = {
  NicknameClaim: [
    { name: 'nickname', type: 'string' },
    { name: 'address', type: 'address' },
  ],
} as const

/**
 * Verify EIP-712 signature for nickname claim
 *
 * @param nickname - The claimed nickname
 * @param address - The claimer's address
 * @param signature - The EIP-712 signature
 * @returns True if signature is valid
 */
export async function verifyNicknameClaimSignature(
  nickname: string,
  address: Address,
  signature: Hex
): Promise<boolean> {
  try {
    const valid = await verifyTypedData({
      address,
      domain: NICKNAME_CLAIM_DOMAIN,
      types: NICKNAME_CLAIM_TYPES,
      primaryType: 'NicknameClaim',
      message: {
        nickname,
        address,
      },
      signature,
    })

    return valid
  } catch (error) {
    console.error('Signature verification failed:', error)
    return false
  }
}
