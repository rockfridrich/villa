import { Hono } from 'hono'

const ens = new Hono()

/**
 * ENS CCIP-Read gateway for offchain resolution
 * Implements EIP-3668: CCIP Read
 *
 * This allows ENS names like alice.proofofretreat.eth to resolve
 * using our offchain database instead of on-chain storage.
 */

/**
 * GET /ens/resolve
 * CCIP-Read compatible resolver endpoint
 *
 * Query params:
 * - sender: address (ENS resolver contract)
 * - data: bytes (encoded resolver call)
 *
 * Returns CCIP-Read format (EIP-3668):
 * {
 *   data: "0x..." // ABI-encoded response
 * }
 */
ens.get('/resolve', async (c) => {
  try {
    const sender = c.req.query('sender')
    const data = c.req.query('data')

    if (!sender || !data) {
      return c.json(
        {
          error: 'Missing required parameters: sender, data',
        },
        400
      )
    }

    // TODO: Decode the resolver call from `data`
    // This would typically be:
    // - addr(bytes32 node) - resolve name to address
    // - name(bytes32 node) - reverse resolution
    // - text(bytes32 node, string key) - text records
    //
    // For now, return a placeholder response

    // EIP-3668 response format
    return c.json({
      data: '0x', // ABI-encoded response would go here
    })
  } catch (error) {
    console.error('ENS resolution error:', error)
    return c.json(
      {
        error: 'Failed to resolve ENS name',
      },
      500
    )
  }
})

/**
 * POST /ens/resolve
 * Alternative endpoint for CCIP-Read (some clients use POST)
 */
ens.post('/resolve', async (c) => {
  try {
    const body = await c.req.json()
    const { sender, data } = body

    if (!sender || !data) {
      return c.json(
        {
          error: 'Missing required fields: sender, data',
        },
        400
      )
    }

    // Same logic as GET endpoint
    return c.json({
      data: '0x',
    })
  } catch (error) {
    console.error('ENS resolution error:', error)
    return c.json(
      {
        error: 'Failed to resolve ENS name',
      },
      500
    )
  }
})

/**
 * GET /ens/addr/:name
 * Simplified address resolution (non-CCIP-Read format)
 * Useful for direct API calls
 *
 * Example: /ens/addr/alice.proofofretreat.eth
 */
ens.get('/addr/:name', (c) => {
  const name = c.req.param('name')

  // Extract nickname from ENS name
  // alice.proofofretreat.eth -> alice
  const match = name.match(/^(.+)\.proofofretreat\.eth$/)

  if (!match) {
    return c.json(
      {
        error: 'Invalid ENS name format. Expected: {nickname}.proofofretreat.eth',
      },
      400
    )
  }

  const nickname = match[1]

  // TODO: Look up address in database
  // For now, return placeholder
  return c.json(
    {
      error: 'Nickname not found',
    },
    404
  )
})

/**
 * GET /ens/name/:address
 * Reverse resolution (address to ENS name)
 * Simplified, non-CCIP-Read format
 *
 * Example: /ens/name/0x1234...
 */
ens.get('/name/:address', (c) => {
  const address = c.req.param('address')

  // TODO: Look up nickname in database
  // For now, return placeholder
  return c.json(
    {
      error: 'No ENS name found for this address',
    },
    404
  )
})

export default ens
