import { Porto, Dialog, Mode } from 'porto'
import type { ThemeFragment } from 'porto/theme'

/**
 * Villa theme for Porto dialog
 * Maps Villa's design system to Porto's theme tokens
 */
export const villaTheme: ThemeFragment = {
  colorScheme: 'light dark',

  // Villa primary blue (#2563eb) for accents
  accent: ['#2563eb', '#3b82f6'],

  // Primary button styling (Villa blue)
  primaryBackground: ['#2563eb', '#3b82f6'],
  primaryContent: ['#ffffff', '#ffffff'],
  primaryBorder: ['#2563eb', '#3b82f6'],
  primaryHoveredBackground: ['#1d4ed8', '#2563eb'],
  primaryHoveredBorder: ['#1d4ed8', '#2563eb'],

  // Secondary button (subtle)
  secondaryBackground: ['#f1f5f9', '#1e293b'],
  secondaryContent: ['#334155', '#e2e8f0'],
  secondaryBorder: ['#e2e8f0', '#334155'],
  secondaryHoveredBackground: ['#e2e8f0', '#334155'],
  secondaryHoveredBorder: ['#cbd5e1', '#475569'],

  // Base colors (backgrounds, text)
  baseBackground: ['#ffffff', '#0f172a'],
  baseAltBackground: ['#f8fafc', '#1e293b'],
  basePlaneBackground: ['#f1f5f9', '#1e293b'],
  baseContent: ['#0f172a', '#f8fafc'],
  baseContentSecondary: ['#64748b', '#94a3b8'],
  baseContentTertiary: ['#94a3b8', '#64748b'],
  baseBorder: ['#e2e8f0', '#334155'],
  baseHoveredBackground: ['#f1f5f9', '#1e293b'],

  // Frame (dialog container)
  frameBackground: ['#ffffff', '#0f172a'],
  frameBorder: ['#e2e8f0', '#334155'],
  frameContent: ['#0f172a', '#f8fafc'],
  frameRadius: 16,

  // Form fields
  fieldBackground: ['#ffffff', '#1e293b'],
  fieldContent: ['#0f172a', '#f8fafc'],
  fieldContentSecondary: ['#64748b', '#94a3b8'],
  fieldBorder: ['#e2e8f0', '#334155'],
  fieldFocusedBackground: ['#ffffff', '#1e293b'],
  fieldFocusedContent: ['#0f172a', '#f8fafc'],
  fieldErrorBorder: ['#ef4444', '#f87171'],

  // Border radius
  radiusSmall: 6,
  radiusMedium: 8,
  radiusLarge: 12,

  // Status colors
  positiveBackground: ['#dcfce7', '#166534'],
  positiveContent: ['#166534', '#bbf7d0'],
  positiveBorder: ['#86efac', '#22c55e'],

  negativeBackground: ['#fee2e2', '#7f1d1d'],
  negativeContent: ['#dc2626', '#fecaca'],
  negativeBorder: ['#fca5a5', '#ef4444'],

  // Focus ring
  focus: ['#2563eb', '#3b82f6'],

  // Links
  link: ['#2563eb', '#60a5fa'],

  // Separators
  separator: ['#e2e8f0', '#334155'],
}

// Singleton Porto instance with Villa theme
let portoInstance: ReturnType<typeof Porto.create> | null = null
let themeController: Dialog.ThemeController | null = null

export function getPorto(): ReturnType<typeof Porto.create> {
  if (!portoInstance) {
    // Create theme controller for dynamic updates
    themeController = Dialog.createThemeController()

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
  return portoInstance
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

/**
 * Create a new Porto account
 * Shows the Porto sign-up flow directly
 */
export async function createAccount(): Promise<PortoConnectResult> {
  try {
    const porto = getPorto()

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
 */
export async function signIn(): Promise<PortoConnectResult> {
  try {
    const porto = getPorto()

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
