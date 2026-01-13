/**
 * Nickname API client
 * Queries the backend API for nickname lookups
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api'

export interface NicknameCheckResult {
  available: boolean
  normalized: string
  reason?: 'taken' | 'invalid' | 'reserved'
  error?: string
}

export interface NicknameResolveResult {
  nickname: string
  address: string
  ens: string
}

export interface NicknameReverseResult {
  address: string
  nickname: string
  ens: string
}

/**
 * Check if a nickname is available
 */
export async function checkNickname(nickname: string): Promise<NicknameCheckResult> {
  const response = await fetch(`${API_BASE}/nicknames/check/${encodeURIComponent(nickname)}`)
  return response.json()
}

/**
 * Resolve a nickname to an address
 */
export async function resolveNickname(nickname: string): Promise<NicknameResolveResult | null> {
  const response = await fetch(`${API_BASE}/nicknames/resolve/${encodeURIComponent(nickname)}`)
  if (!response.ok) return null
  return response.json()
}

/**
 * Reverse lookup - get nickname for an address
 * Used for returning user detection
 *
 * @param address - The wallet address to look up
 * @returns The nickname info if found, null otherwise
 */
export async function getNicknameByAddress(address: string): Promise<NicknameReverseResult | null> {
  try {
    const response = await fetch(`${API_BASE}/nicknames/reverse/${encodeURIComponent(address)}`)
    if (!response.ok) return null
    return response.json()
  } catch {
    // Network error or API unavailable - fail gracefully
    return null
  }
}

/**
 * Check if an address has a registered nickname
 * Convenience wrapper around getNicknameByAddress
 */
export async function hasNickname(address: string): Promise<boolean> {
  const result = await getNicknameByAddress(address)
  return result !== null
}
