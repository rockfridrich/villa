import { Porto, Dialog, Mode } from 'porto'
import type { ThemeFragment } from 'porto/theme'

/**
 * Proof of Retreat theme for Porto dialog
 * Cream backgrounds, ink text, yellow accents
 */
export const villaTheme: ThemeFragment = {
  colorScheme: 'light',

  // Yellow accent (#ffe047)
  accent: '#ffe047',

  // Primary button styling (yellow with brown text)
  primaryBackground: '#ffe047',
  primaryContent: '#382207',
  primaryBorder: '#ffe047',
  primaryHoveredBackground: '#f5d63d',
  primaryHoveredBorder: '#f5d63d',

  // Secondary button (cream with ink)
  secondaryBackground: '#fef9f0',
  secondaryContent: '#0d0d17',
  secondaryBorder: '#e0e0e6',
  secondaryHoveredBackground: '#fdf3e0',
  secondaryHoveredBorder: '#c4c4cc',

  // Base colors (cream backgrounds, ink text)
  baseBackground: '#fffcf8',
  baseAltBackground: '#fef9f0',
  basePlaneBackground: '#fdf3e0',
  baseContent: '#0d0d17',
  baseContentSecondary: '#45454f',
  baseContentTertiary: '#61616b',
  baseBorder: '#e0e0e6',
  baseHoveredBackground: '#fef9f0',

  // Frame (dialog container)
  frameBackground: '#fffcf8',
  frameBorder: '#e0e0e6',
  frameContent: '#0d0d17',
  frameRadius: 14,

  // Form fields
  fieldBackground: '#fffcf8',
  fieldContent: '#0d0d17',
  fieldContentSecondary: '#45454f',
  fieldBorder: '#e0e0e6',
  fieldFocusedBackground: '#fffcf8',
  fieldFocusedContent: '#0d0d17',
  fieldErrorBorder: '#ef4444',

  // Border radius (matches Tailwind config)
  radiusSmall: 6,
  radiusMedium: 10,
  radiusLarge: 14,

  // Status colors (green from brand)
  positiveBackground: '#e8f5e8',
  positiveContent: '#698f69',
  positiveBorder: '#698f69',

  negativeBackground: '#fee2e2',
  negativeContent: '#dc2626',
  negativeBorder: '#fca5a5',

  // Focus ring (yellow)
  focus: '#ffe047',

  // Links (brown accent)
  link: '#382207',

  // Separators
  separator: '#e0e0e6',
}

// Porto instance management
let portoInstance: ReturnType<typeof Porto.create> | null = null
let themeController: Dialog.ThemeController | null = null
let currentMode: 'popup' | 'inline' = 'popup'

// Note: Porto SDK labels customization is documented but not yet in types
// When available, add: signInPrompt, signIn, signUp, createAccount, dialogTitle
// See: https://porto.sh/sdk/guides/theming

/**
 * Porto Session Behavior
 *
 * Sessions are managed server-side by Porto (id.porto.sh). Key behaviors:
 *
 * - Passkey credentials persist in device secure enclave (indefinite)
 * - Porto session tokens: TTL not publicly documented, appears ~24h+
 * - After "logout", re-authentication is seamless (passkey auto-selects)
 * - True session termination requires user to remove passkey from device
 *
 * This is by design: passkeys provide "remembered device" UX similar to
 * biometric unlock on mobile apps. Users can switch accounts but their
 * passkey remains available for quick re-authentication.
 */

export interface PortoOptions {
  /** Container element for inline rendering */
  container?: HTMLElement | null
  /** Force recreate instance even if one exists */
  forceRecreate?: boolean
}

/**
 * Get or create Porto instance
 * @param options.container - If provided, uses experimental_inline mode
 * @param options.forceRecreate - Force recreate instance for mode switch
 */
export function getPorto(options: PortoOptions = {}): ReturnType<typeof Porto.create> {
  const { container, forceRecreate } = options
  const requestedMode = container ? 'inline' : 'popup'

  // Recreate if mode changed or forced
  if (portoInstance && (forceRecreate || currentMode !== requestedMode)) {
    portoInstance = null
    themeController = null
  }

  if (!portoInstance) {
    // Create theme controller for dynamic updates
    themeController = Dialog.createThemeController()
    currentMode = requestedMode

    if (container) {
      // Use experimental_inline for embedded dialog
      // experimental_inline expects element as a getter function
      portoInstance = Porto.create({
        mode: Mode.dialog({
          renderer: Dialog.experimental_inline({ element: () => container }),
          host: 'https://id.porto.sh/dialog',
          theme: villaTheme,
          themeController,
        }),
      })
    } else {
      // Use popup for standalone dialog
      portoInstance = Porto.create({
        mode: Mode.dialog({
          renderer: Dialog.popup({
            type: 'popup',
            size: { width: 380, height: 520 },
          }),
          host: 'https://id.porto.sh/dialog',
          theme: villaTheme,
          themeController,
        }),
      })
    }
  }
  return portoInstance
}

/**
 * Reset Porto instance (useful when switching between modes)
 */
export function resetPorto(): void {
  portoInstance = null
  themeController = null
}

/**
 * Update Porto theme dynamically
 */
export function updateTheme(theme: ThemeFragment): void {
  themeController?.setTheme(theme)
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

export interface AuthOptions {
  /** Container element for inline rendering */
  container?: HTMLElement | null
  /** Force recreate Porto instance (use when switching modes) */
  forceRecreate?: boolean
}

/**
 * Create a new Porto account
 * Shows the Porto sign-up flow directly
 * @param options.container - Optional element for inline rendering
 * @param options.forceRecreate - Force new instance (default: true for clean state)
 */
export async function createAccount(options: AuthOptions | HTMLElement | null = {}): Promise<PortoConnectResult> {
  // Support legacy signature: createAccount(containerElement)
  const opts: AuthOptions = options instanceof HTMLElement || options === null
    ? { container: options, forceRecreate: true }
    : { forceRecreate: true, ...options }

  try {
    // getPorto handles mode switching atomically - no separate resetPorto() needed
    const porto = getPorto({ container: opts.container, forceRecreate: opts.forceRecreate })

    // Use wallet_connect which shows the full Porto dialog
    // Porto will show create account UI for new users
    const result = await porto.provider.request({
      method: 'wallet_connect',
      params: [{
        capabilities: {
          // Don't require email for v1
          email: false,
        },
      }],
    })

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
 * Sign in with existing Porto account
 * Uses eth_requestAccounts which prompts for passkey selection
 * @param options.container - Optional element for inline rendering
 * @param options.forceRecreate - Force new instance (default: true for clean state)
 */
export async function signIn(options: AuthOptions | HTMLElement | null = {}): Promise<PortoConnectResult> {
  // Support legacy signature: signIn(containerElement)
  const opts: AuthOptions = options instanceof HTMLElement || options === null
    ? { container: options, forceRecreate: true }
    : { forceRecreate: true, ...options }

  try {
    // getPorto handles mode switching atomically - no separate resetPorto() needed
    const porto = getPorto({ container: opts.container, forceRecreate: opts.forceRecreate })

    // eth_requestAccounts prompts user to select existing passkey
    const accounts = await porto.provider.request({
      method: 'eth_requestAccounts',
    })

    if (accounts && accounts.length > 0) {
      return {
        success: true,
        address: accounts[0],
      }
    }

    return {
      success: false,
      error: new Error('No account selected'),
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error('Unknown error'),
    }
  }
}

/**
 * Connect to Porto - generic method that lets Porto decide the flow
 * @deprecated Use createAccount() or signIn() for explicit flows
 */
export async function connectPorto(): Promise<PortoConnectResult> {
  return createAccount()
}

/**
 * Disconnect from Porto (clears session and storage)
 * Ensures next sign-in requires passkey re-verification
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

  // Clear Porto cached session to force passkey re-verification
  clearPortoStorage()

  // Reset instance so next connection is fresh
  resetPorto()
}

/**
 * Clear Porto's localStorage entries
 * Forces re-authentication on next sign-in
 */
function clearPortoStorage(): void {
  if (typeof window === 'undefined') return

  // Clear all Porto-related storage keys
  const keysToRemove: string[] = []

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && (key.startsWith('porto') || key.includes('porto') || key.includes('ithaca'))) {
      keysToRemove.push(key)
    }
  }

  keysToRemove.forEach(key => localStorage.removeItem(key))

  // Also clear sessionStorage
  for (let i = sessionStorage.length - 1; i >= 0; i--) {
    const key = sessionStorage.key(i)
    if (key && (key.startsWith('porto') || key.includes('porto') || key.includes('ithaca'))) {
      sessionStorage.removeItem(key)
    }
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

/**
 * Sign a message using Porto (for SIWE authentication)
 * @param message The message to sign
 * @param address The address signing the message
 * @returns The signature as a hex string
 */
export async function signMessage(message: string, address: string): Promise<string> {
  const porto = getPorto()

  // Porto's provider.request expects typed params
  const signature = await porto.provider.request({
    method: 'personal_sign',
    params: [message as `0x${string}`, address as `0x${string}`],
  })

  return signature as string
}

/**
 * Generate a SIWE (Sign-In With Ethereum) message
 * Compatible with EIP-4361
 */
export function generateSiweMessage(params: {
  address: string
  domain?: string
  uri?: string
  nonce?: string
  issuedAt?: string
  expirationTime?: string
  statement?: string
}): string {
  const {
    address,
    domain = typeof window !== 'undefined' ? window.location.host : 'villa.cash',
    uri = typeof window !== 'undefined' ? window.location.origin : 'https://villa.cash',
    nonce = generateNonce(),
    issuedAt = new Date().toISOString(),
    statement = 'Sign in to Villa',
  } = params

  // EIP-4361 SIWE message format
  return [
    `${domain} wants you to sign in with your Ethereum account:`,
    address,
    '',
    statement,
    '',
    `URI: ${uri}`,
    `Version: 1`,
    `Chain ID: 8453`, // Base mainnet
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
  ].join('\n')
}

/**
 * Generate a random nonce for SIWE
 */
function generateNonce(): string {
  const array = new Uint8Array(16)
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array)
  } else {
    // Fallback for SSR
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256)
    }
  }
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Sign a SIWE message for authentication
 * Returns both the message and signature for verification
 */
export async function signSiweMessage(address: string, options?: {
  statement?: string
  nonce?: string
}): Promise<{ message: string; signature: string }> {
  const message = generateSiweMessage({
    address,
    statement: options?.statement,
    nonce: options?.nonce,
  })

  const signature = await signMessage(message, address)

  return { message, signature }
}
