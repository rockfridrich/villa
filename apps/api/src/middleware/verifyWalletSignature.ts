import { Context, Next } from 'hono'
import { verifyMessage, type Address, type Hex } from 'viem'

/**
 * Middleware to verify wallet signature for authenticated requests
 *
 * Expects request body to contain:
 * - address: Ethereum address
 * - message: The signed message
 * - signature: EIP-191 signature
 *
 * Verifies that the signature matches the address and message.
 * Sets c.var.address on success for downstream handlers.
 */
export async function verifyWalletSignature(c: Context, next: Next) {
  try {
    const body = await c.req.json()
    const { address, message, signature } = body

    if (!address || !message || !signature) {
      return c.json(
        {
          error: 'Missing required fields',
          required: ['address', 'message', 'signature'],
        },
        400
      )
    }

    // Verify signature matches message and address
    const isValid = await verifyMessage({
      address: address as Address,
      message,
      signature: signature as Hex,
    })

    if (!isValid) {
      return c.json(
        {
          error: 'Invalid signature',
          details: 'Signature does not match address and message',
        },
        401
      )
    }

    // Store verified address in context for downstream handlers
    c.set('verifiedAddress', address.toLowerCase())
    c.set('requestBody', body)

    await next()
  } catch (error) {
    console.error('Signature verification error:', error)
    return c.json(
      {
        error: 'Signature verification failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      400
    )
  }
}

/**
 * Extract verified address from context
 * Only available after verifyWalletSignature middleware
 */
export function getVerifiedAddress(c: Context): string {
  const address = c.get('verifiedAddress')
  if (!address) {
    throw new Error('Address not verified - ensure verifyWalletSignature middleware is applied')
  }
  return address
}

/**
 * Extract original request body from context
 * Available after verifyWalletSignature middleware
 */
export function getRequestBody(c: Context): any {
  return c.get('requestBody')
}
