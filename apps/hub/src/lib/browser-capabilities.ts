/**
 * Browser Capabilities Detection
 * Detects WebAuthn support, platform authenticators, and passkey managers
 *
 * @example
 * ```typescript
 * import {
 *   detectBrowserCapabilities,
 *   getPasskeyStorageDescription,
 *   supportsWebAuthnFeature
 * } from '@/lib/browser-capabilities'
 *
 * // Detect capabilities on page load
 * const capabilities = await detectBrowserCapabilities()
 *
 * // Check if passkeys are supported
 * if (!supportsWebAuthnFeature('platform', capabilities)) {
 *   showUnsupportedMessage()
 *   return
 * }
 *
 * // Show helpful storage description
 * const description = getPasskeyStorageDescription(capabilities)
 * // "Your passkey will be stored in iCloud Keychain and synced across your Apple devices."
 * ```
 */

export interface BrowserCapabilities {
  webauthnSupported: boolean
  platformAuthenticatorAvailable: boolean
  conditionalMediationAvailable: boolean
  platform: 'ios' | 'android' | 'macos' | 'windows' | 'linux' | 'unknown'
  browser: 'safari' | 'chrome' | 'firefox' | 'edge' | 'samsung' | 'unknown'
  detectedPasskeyManager: string | null
}

/**
 * Detect browser and platform capabilities for WebAuthn
 * @returns BrowserCapabilities object with detected features
 */
export async function detectBrowserCapabilities(): Promise<BrowserCapabilities> {
  const capabilities: BrowserCapabilities = {
    webauthnSupported: false,
    platformAuthenticatorAvailable: false,
    conditionalMediationAvailable: false,
    platform: detectPlatform(),
    browser: detectBrowser(),
    detectedPasskeyManager: null,
  }

  // Check WebAuthn support
  if (
    window.PublicKeyCredential &&
    typeof window.PublicKeyCredential === 'function'
  ) {
    capabilities.webauthnSupported = true

    // Check platform authenticator availability
    try {
      if (PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
        capabilities.platformAuthenticatorAvailable =
          await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      }
    } catch (error) {
      // Silently fail - capabilities.platformAuthenticatorAvailable remains false
      console.warn('Failed to check platform authenticator availability:', error)
    }

    // Check conditional mediation (autofill) support
    try {
      if (PublicKeyCredential.isConditionalMediationAvailable) {
        capabilities.conditionalMediationAvailable =
          await PublicKeyCredential.isConditionalMediationAvailable()
      }
    } catch (error) {
      // Silently fail - capabilities.conditionalMediationAvailable remains false
      console.warn('Failed to check conditional mediation availability:', error)
    }
  }

  // Detect passkey manager
  capabilities.detectedPasskeyManager = detectPasskeyManager(
    capabilities.platform,
    capabilities.browser,
    capabilities.platformAuthenticatorAvailable
  )

  return capabilities
}

/**
 * Detect operating system platform
 */
function detectPlatform(): BrowserCapabilities['platform'] {
  const userAgent = navigator.userAgent.toLowerCase()
  const platform = navigator.platform?.toLowerCase() || ''

  // iOS detection (including iPad on iOS 13+)
  if (
    /iphone|ipad|ipod/.test(userAgent) ||
    (platform === 'macintel' && navigator.maxTouchPoints > 1)
  ) {
    return 'ios'
  }

  // Android detection
  if (/android/.test(userAgent)) {
    return 'android'
  }

  // macOS detection
  if (/mac/.test(platform) && navigator.maxTouchPoints <= 1) {
    return 'macos'
  }

  // Windows detection
  if (/win/.test(platform)) {
    return 'windows'
  }

  // Linux detection
  if (/linux/.test(platform)) {
    return 'linux'
  }

  return 'unknown'
}

/**
 * Detect browser type
 */
function detectBrowser(): BrowserCapabilities['browser'] {
  const userAgent = navigator.userAgent.toLowerCase()

  // Edge (must check before Chrome since Edge includes "Chrome" in UA)
  if (/edg/.test(userAgent)) {
    return 'edge'
  }

  // Samsung Internet
  if (/samsungbrowser/.test(userAgent)) {
    return 'samsung'
  }

  // Chrome (includes Chromium-based browsers)
  if (/chrome/.test(userAgent) && !/edg/.test(userAgent)) {
    return 'chrome'
  }

  // Safari (must check after Chrome since Safari UA might include "Chrome")
  if (/safari/.test(userAgent) && !/chrome/.test(userAgent)) {
    return 'safari'
  }

  // Firefox
  if (/firefox/.test(userAgent)) {
    return 'firefox'
  }

  return 'unknown'
}

/**
 * Detect likely passkey manager based on platform, browser, and capabilities
 */
function detectPasskeyManager(
  platform: BrowserCapabilities['platform'],
  browser: BrowserCapabilities['browser'],
  platformAuthAvailable: boolean
): string | null {
  // No platform authenticator means no built-in passkey manager
  if (!platformAuthAvailable) {
    return null
  }

  // iOS - Always iCloud Keychain
  if (platform === 'ios') {
    return 'iCloud Keychain'
  }

  // macOS - iCloud Keychain (Safari) or Chrome Profile (Chrome)
  if (platform === 'macos') {
    if (browser === 'safari') {
      return 'iCloud Keychain'
    }
    if (browser === 'chrome' || browser === 'edge') {
      return 'Chrome Profile'
    }
    return 'iCloud Keychain' // Default for macOS
  }

  // Android - Google Password Manager
  if (platform === 'android') {
    return 'Google Password Manager'
  }

  // Windows - Windows Hello
  if (platform === 'windows') {
    return 'Windows Hello'
  }

  return null
}

/**
 * Get user-friendly description of passkey storage location
 */
export function getPasskeyStorageDescription(
  capabilities: BrowserCapabilities
): string {
  const manager = capabilities.detectedPasskeyManager

  if (!manager) {
    return 'Your passkey will be stored securely on this device.'
  }

  switch (manager) {
    case 'iCloud Keychain':
      return 'Your passkey will be stored in iCloud Keychain and synced across your Apple devices.'
    case 'Google Password Manager':
      return 'Your passkey will be stored in Google Password Manager and synced across your devices.'
    case 'Chrome Profile':
      return 'Your passkey will be stored in your Chrome profile and synced across devices where you\'re signed in.'
    case 'Windows Hello':
      return 'Your passkey will be stored securely using Windows Hello on this device.'
    default:
      return `Your passkey will be stored securely in ${manager}.`
  }
}

/**
 * Check if browser supports specific WebAuthn features
 */
export function supportsWebAuthnFeature(
  feature: 'basic' | 'platform' | 'autofill',
  capabilities: BrowserCapabilities
): boolean {
  switch (feature) {
    case 'basic':
      return capabilities.webauthnSupported
    case 'platform':
      return capabilities.webauthnSupported && capabilities.platformAuthenticatorAvailable
    case 'autofill':
      return capabilities.webauthnSupported && capabilities.conditionalMediationAvailable
    default:
      return false
  }
}

/**
 * Get help URL based on platform/browser for passkey setup
 */
export function getPasskeySetupHelpUrl(
  capabilities: BrowserCapabilities
): string {
  const { platform, browser } = capabilities

  // Platform-specific help
  if (platform === 'ios') {
    return 'https://support.apple.com/en-us/HT213305'
  }
  if (platform === 'android') {
    return 'https://support.google.com/accounts/answer/13548313'
  }
  if (platform === 'macos' && browser === 'safari') {
    return 'https://support.apple.com/en-us/HT213305'
  }
  if (platform === 'windows') {
    return 'https://support.microsoft.com/en-us/windows/passkeys-in-windows-301c8944-5ea2-452b-9886-97e4d2ef4422'
  }

  // Generic passkey info
  return 'https://www.passkeys.com/guides'
}
