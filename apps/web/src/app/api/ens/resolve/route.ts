import { NextResponse } from 'next/server'
import { getDb, ensureTables } from '@/lib/db'
import type { ProfileRow } from '@/lib/db/schema'
import { encodeAbiParameters, parseAbiParameters, decodeAbiParameters } from 'viem'

// Disable caching - resolution data can change
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Decode DNS-encoded name to readable string
 * DNS encoding: [length][label][length][label]...[0]
 * Example: 0x05alice05villa04cash00 -> alice.villa.cash
 */
function decodeDnsName(data: Uint8Array): string {
  const labels: string[] = []
  let offset = 0

  while (offset < data.length) {
    const len = data[offset]
    if (len === 0) break

    offset++
    const label = new TextDecoder().decode(data.slice(offset, offset + len))
    labels.push(label)
    offset += len
  }

  return labels.join('.')
}

/**
 * Parse calldata to extract function selector and parameters
 * The contract sends resolver calldata (e.g., addr(bytes32) call)
 */
function parseCallData(callData: `0x${string}`): {
  selector: string
  node?: `0x${string}`
  coinType?: bigint
} {
  const selector = callData.slice(0, 10)

  // addr(bytes32 node) - selector: 0x3b3b57de
  if (selector === '0x3b3b57de') {
    const decoded = decodeAbiParameters(
      parseAbiParameters('bytes32'),
      `0x${callData.slice(10)}` as `0x${string}`
    )
    return { selector, node: decoded[0] as `0x${string}` }
  }

  // addr(bytes32 node, uint256 coinType) - selector: 0xf1cb7e06
  if (selector === '0xf1cb7e06') {
    const decoded = decodeAbiParameters(
      parseAbiParameters('bytes32, uint256'),
      `0x${callData.slice(10)}` as `0x${string}`
    )
    return { selector, node: decoded[0] as `0x${string}`, coinType: decoded[1] as bigint }
  }

  // text(bytes32 node, string key) - selector: 0x59d1d43c
  if (selector === '0x59d1d43c') {
    // For text records, we'd need more complex parsing
    // Currently just return the selector
    return { selector }
  }

  return { selector }
}

/**
 * POST /api/ens/resolve
 * CCIP-Read gateway for ENS resolution
 *
 * Request body: { sender, data }
 * - sender: contract address
 * - data: ABI-encoded resolver call
 *
 * Response: ABI-encoded address (for addr() calls)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    // Note: sender is extracted from body for future contract validation but not used yet
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { sender, data: callData } = body

    // Extract name from URL path if available (CCIP-Read pattern)
    // The URL template is typically: {url}/{sender}/{data}.json
    // For now, we extract from extraData passed separately

    // Parse the incoming calldata
    const { selector, coinType } = parseCallData(callData as `0x${string}`)

    // We need the DNS-encoded name - it's passed via different mechanisms
    // In the contract, it's passed as extraData to the callback
    // Check if extraData is in the body
    const dnsName = body.extraData || body.name

    // Name is required for resolution
    if (!dnsName) {
      return NextResponse.json(
        { error: 'Name parameter required (extraData or name field)' },
        { status: 400 }
      )
    }

    // Decode DNS-encoded name
    let decodedName: string
    try {
      // If it's hex-encoded
      if (typeof dnsName === 'string' && dnsName.startsWith('0x')) {
        const bytes = new Uint8Array(
          (dnsName.slice(2).match(/.{2}/g) || []).map(byte => parseInt(byte, 16))
        )
        decodedName = decodeDnsName(bytes)
      } else if (typeof dnsName === 'string') {
        // Already decoded string
        decodedName = dnsName
      } else {
        return NextResponse.json(
          { error: 'Invalid name format' },
          { status: 400 }
        )
      }
    } catch {
      return NextResponse.json(
        { error: 'Failed to decode name' },
        { status: 400 }
      )
    }

    // Extract nickname from the decoded name (e.g., "alice.villa.cash" -> "alice")
    const parts = decodedName.split('.')
    const nickname = parts[0]?.toLowerCase()

    if (!nickname) {
      return NextResponse.json(
        { error: 'Invalid nickname' },
        { status: 400 }
      )
    }

    // Look up in database
    await ensureTables()
    const sql = getDb()

    const rows = await sql<ProfileRow[]>`
      SELECT address FROM profiles
      WHERE nickname_normalized = ${nickname}
      LIMIT 1
    `

    // Handle addr() - ETH address (coinType 60 or undefined)
    if (selector === '0x3b3b57de' || (selector === '0xf1cb7e06' && coinType === 60n)) {
      if (rows.length === 0) {
        // Return zero address for not found
        const zeroAddress = '0x0000000000000000000000000000000000000000'
        const encoded = encodeAbiParameters(
          parseAbiParameters('address'),
          [zeroAddress as `0x${string}`]
        )
        return NextResponse.json({ data: encoded })
      }

      const address = rows[0].address as `0x${string}`
      const encoded = encodeAbiParameters(
        parseAbiParameters('address'),
        [address]
      )

      return NextResponse.json({ data: encoded })
    }

    // For other selectors (text records, etc.), return empty
    return NextResponse.json({ data: '0x' })

  } catch (error) {
    console.error('CCIP-Read gateway error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/ens/resolve/{sender}/{data}.json
 * Alternative CCIP-Read pattern using URL path parameters
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const pathParts = url.pathname.split('/')

  // Extract sender and data from path
  // Pattern: /api/ens/resolve/{sender}/{data}.json
  const dataJson = pathParts[pathParts.length - 1]
  const sender = pathParts[pathParts.length - 2]

  if (!sender || !dataJson) {
    return NextResponse.json(
      { error: 'Missing path parameters' },
      { status: 400 }
    )
  }

  const data = dataJson.replace('.json', '')

  // Delegate to POST handler logic
  return POST(new Request(request.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sender, data })
  }))
}
