import { Porto } from 'porto'

// Singleton Porto instance
let portoInstance: ReturnType<typeof Porto.create> | null = null

export function getPorto(): ReturnType<typeof Porto.create> {
  if (!portoInstance) {
    portoInstance = Porto.create()
  }
  return portoInstance
}

export interface ConnectResult {
  success: true
  address: string
}

export interface ConnectError {
  success: false
  error: Error
}

export type PortoConnectResult = ConnectResult | ConnectError

/**
 * Check if user has an existing Porto account connected
 */
export async function checkExistingAccount(): Promise<string | null> {
  try {
    const porto = getPorto()
    const result = await porto.provider.request({
      method: 'eth_accounts',
    })

    const accounts = result as string[]
    if (accounts && accounts.length > 0) {
      return accounts[0]
    }
    return null
  } catch {
    return null
  }
}

/**
 * Connect to Porto - creates new account or signs in existing
 * Porto handles the passkey prompt automatically
 */
export async function connectPorto(): Promise<PortoConnectResult> {
  try {
    const porto = getPorto()
    const result = await porto.provider.request({
      method: 'wallet_connect',
    })

    // wallet_connect returns { accounts: [{ address: '0x...' }] }
    const response = result as unknown as { accounts: readonly { address: string }[] }

    if (response.accounts && response.accounts.length > 0) {
      return {
        success: true,
        address: response.accounts[0].address,
      }
    }

    return {
      success: false,
      error: new Error('No account returned from Porto'),
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error('Unknown error'),
    }
  }
}

/**
 * Disconnect from Porto (clears session)
 */
export async function disconnectPorto(): Promise<void> {
  try {
    const porto = getPorto()
    await porto.provider.request({
      method: 'wallet_disconnect',
    })
  } catch {
    // Ignore disconnect errors
  }
}

/**
 * Check if Porto/WebAuthn is supported in this browser
 */
export function isPortoSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.PublicKeyCredential !== 'undefined'
  )
}
