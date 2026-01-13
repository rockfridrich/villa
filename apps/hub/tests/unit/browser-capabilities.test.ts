/**
 * Unit tests for browser capability detection
 */

import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import {
  detectBrowserCapabilities,
  getPasskeyStorageDescription,
  supportsWebAuthnFeature,
  getPasskeySetupHelpUrl,
  type BrowserCapabilities,
} from '../../src/lib/browser-capabilities'

describe('detectBrowserCapabilities', () => {
  let originalPublicKeyCredential: typeof window.PublicKeyCredential
  let originalNavigator: typeof navigator

  beforeEach(() => {
    originalPublicKeyCredential = window.PublicKeyCredential
    originalNavigator = navigator
  })

  afterEach(() => {
    // Restore original globals
    Object.defineProperty(window, 'PublicKeyCredential', {
      value: originalPublicKeyCredential,
      writable: true,
      configurable: true,
    })
    Object.defineProperty(window, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    })
  })

  it('detects when WebAuthn is not supported', async () => {
    // Remove PublicKeyCredential
    Object.defineProperty(window, 'PublicKeyCredential', {
      value: undefined,
      writable: true,
      configurable: true,
    })

    const capabilities = await detectBrowserCapabilities()

    expect(capabilities.webauthnSupported).toBe(false)
    expect(capabilities.platformAuthenticatorAvailable).toBe(false)
    expect(capabilities.conditionalMediationAvailable).toBe(false)
  })

  it('detects basic WebAuthn support', async () => {
    Object.defineProperty(window, 'PublicKeyCredential', {
      value: function () {},
      writable: true,
      configurable: true,
    })

    const capabilities = await detectBrowserCapabilities()

    expect(capabilities.webauthnSupported).toBe(true)
  })

  it('detects platform authenticator availability', async () => {
    const mockPublicKeyCredential = function () {}
    mockPublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable =
      async () => true

    Object.defineProperty(window, 'PublicKeyCredential', {
      value: mockPublicKeyCredential,
      writable: true,
      configurable: true,
    })

    const capabilities = await detectBrowserCapabilities()

    expect(capabilities.webauthnSupported).toBe(true)
    expect(capabilities.platformAuthenticatorAvailable).toBe(true)
  })

  it('detects conditional mediation availability', async () => {
    const mockPublicKeyCredential = function () {}
    mockPublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable =
      async () => true
    mockPublicKeyCredential.isConditionalMediationAvailable = async () => true

    Object.defineProperty(window, 'PublicKeyCredential', {
      value: mockPublicKeyCredential,
      writable: true,
      configurable: true,
    })

    const capabilities = await detectBrowserCapabilities()

    expect(capabilities.webauthnSupported).toBe(true)
    expect(capabilities.conditionalMediationAvailable).toBe(true)
  })

  it('handles errors during capability detection gracefully', async () => {
    const mockPublicKeyCredential = function () {}
    mockPublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable =
      async () => {
        throw new Error('Detection failed')
      }

    Object.defineProperty(window, 'PublicKeyCredential', {
      value: mockPublicKeyCredential,
      writable: true,
      configurable: true,
    })

    const capabilities = await detectBrowserCapabilities()

    expect(capabilities.webauthnSupported).toBe(true)
    expect(capabilities.platformAuthenticatorAvailable).toBe(false)
  })

  describe('platform detection', () => {
    it('detects iOS', async () => {
      Object.defineProperty(window, 'navigator', {
        value: {
          ...originalNavigator,
          userAgent: 'iPhone',
          platform: 'iPhone',
          maxTouchPoints: 5,
        },
        writable: true,
        configurable: true,
      })

      const capabilities = await detectBrowserCapabilities()
      expect(capabilities.platform).toBe('ios')
    })

    it('detects iPad on iOS 13+', async () => {
      Object.defineProperty(window, 'navigator', {
        value: {
          ...originalNavigator,
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)',
          platform: 'MacIntel',
          maxTouchPoints: 5,
        },
        writable: true,
        configurable: true,
      })

      const capabilities = await detectBrowserCapabilities()
      expect(capabilities.platform).toBe('ios')
    })

    it('detects Android', async () => {
      Object.defineProperty(window, 'navigator', {
        value: {
          ...originalNavigator,
          userAgent: 'Android',
          platform: 'Linux armv8l',
          maxTouchPoints: 5,
        },
        writable: true,
        configurable: true,
      })

      const capabilities = await detectBrowserCapabilities()
      expect(capabilities.platform).toBe('android')
    })

    it('detects macOS', async () => {
      Object.defineProperty(window, 'navigator', {
        value: {
          ...originalNavigator,
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          platform: 'MacIntel',
          maxTouchPoints: 0,
        },
        writable: true,
        configurable: true,
      })

      const capabilities = await detectBrowserCapabilities()
      expect(capabilities.platform).toBe('macos')
    })

    it('detects Windows', async () => {
      Object.defineProperty(window, 'navigator', {
        value: {
          ...originalNavigator,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0)',
          platform: 'Win32',
          maxTouchPoints: 0,
        },
        writable: true,
        configurable: true,
      })

      const capabilities = await detectBrowserCapabilities()
      expect(capabilities.platform).toBe('windows')
    })

    it('detects Linux', async () => {
      Object.defineProperty(window, 'navigator', {
        value: {
          ...originalNavigator,
          userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
          platform: 'Linux x86_64',
          maxTouchPoints: 0,
        },
        writable: true,
        configurable: true,
      })

      const capabilities = await detectBrowserCapabilities()
      expect(capabilities.platform).toBe('linux')
    })
  })

  describe('browser detection', () => {
    it('detects Safari', async () => {
      Object.defineProperty(window, 'navigator', {
        value: {
          ...originalNavigator,
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Safari/605.1.15',
        },
        writable: true,
        configurable: true,
      })

      const capabilities = await detectBrowserCapabilities()
      expect(capabilities.browser).toBe('safari')
    })

    it('detects Chrome', async () => {
      Object.defineProperty(window, 'navigator', {
        value: {
          ...originalNavigator,
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        writable: true,
        configurable: true,
      })

      const capabilities = await detectBrowserCapabilities()
      expect(capabilities.browser).toBe('chrome')
    })

    it('detects Edge', async () => {
      Object.defineProperty(window, 'navigator', {
        value: {
          ...originalNavigator,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
        },
        writable: true,
        configurable: true,
      })

      const capabilities = await detectBrowserCapabilities()
      expect(capabilities.browser).toBe('edge')
    })

    it('detects Firefox', async () => {
      Object.defineProperty(window, 'navigator', {
        value: {
          ...originalNavigator,
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0',
        },
        writable: true,
        configurable: true,
      })

      const capabilities = await detectBrowserCapabilities()
      expect(capabilities.browser).toBe('firefox')
    })

    it('detects Samsung Internet', async () => {
      Object.defineProperty(window, 'navigator', {
        value: {
          ...originalNavigator,
          userAgent: 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/20.0 Chrome/106.0.5249.126 Mobile Safari/537.36',
        },
        writable: true,
        configurable: true,
      })

      const capabilities = await detectBrowserCapabilities()
      expect(capabilities.browser).toBe('samsung')
    })
  })

  describe('passkey manager detection', () => {
    it('detects iCloud Keychain on iOS', async () => {
      Object.defineProperty(window, 'navigator', {
        value: {
          ...originalNavigator,
          userAgent: 'iPhone',
          platform: 'iPhone',
          maxTouchPoints: 5,
        },
        writable: true,
        configurable: true,
      })

      const mockPublicKeyCredential = function () {}
      mockPublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable =
        async () => true

      Object.defineProperty(window, 'PublicKeyCredential', {
        value: mockPublicKeyCredential,
        writable: true,
        configurable: true,
      })

      const capabilities = await detectBrowserCapabilities()
      expect(capabilities.detectedPasskeyManager).toBe('iCloud Keychain')
    })

    it('detects Google Password Manager on Android', async () => {
      Object.defineProperty(window, 'navigator', {
        value: {
          ...originalNavigator,
          userAgent: 'Android',
          platform: 'Linux armv8l',
          maxTouchPoints: 5,
        },
        writable: true,
        configurable: true,
      })

      const mockPublicKeyCredential = function () {}
      mockPublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable =
        async () => true

      Object.defineProperty(window, 'PublicKeyCredential', {
        value: mockPublicKeyCredential,
        writable: true,
        configurable: true,
      })

      const capabilities = await detectBrowserCapabilities()
      expect(capabilities.detectedPasskeyManager).toBe('Google Password Manager')
    })

    it('detects Windows Hello on Windows', async () => {
      Object.defineProperty(window, 'navigator', {
        value: {
          ...originalNavigator,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0)',
          platform: 'Win32',
          maxTouchPoints: 0,
        },
        writable: true,
        configurable: true,
      })

      const mockPublicKeyCredential = function () {}
      mockPublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable =
        async () => true

      Object.defineProperty(window, 'PublicKeyCredential', {
        value: mockPublicKeyCredential,
        writable: true,
        configurable: true,
      })

      const capabilities = await detectBrowserCapabilities()
      expect(capabilities.detectedPasskeyManager).toBe('Windows Hello')
    })

    it('detects Chrome Profile on macOS Chrome', async () => {
      Object.defineProperty(window, 'navigator', {
        value: {
          ...originalNavigator,
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          platform: 'MacIntel',
          maxTouchPoints: 0,
        },
        writable: true,
        configurable: true,
      })

      const mockPublicKeyCredential = function () {}
      mockPublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable =
        async () => true

      Object.defineProperty(window, 'PublicKeyCredential', {
        value: mockPublicKeyCredential,
        writable: true,
        configurable: true,
      })

      const capabilities = await detectBrowserCapabilities()
      expect(capabilities.detectedPasskeyManager).toBe('Chrome Profile')
    })

    it('returns null when no platform authenticator available', async () => {
      const mockPublicKeyCredential = function () {}
      mockPublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable =
        async () => false

      Object.defineProperty(window, 'PublicKeyCredential', {
        value: mockPublicKeyCredential,
        writable: true,
        configurable: true,
      })

      const capabilities = await detectBrowserCapabilities()
      expect(capabilities.detectedPasskeyManager).toBeNull()
    })
  })
})

describe('getPasskeyStorageDescription', () => {
  it('returns generic message when no manager detected', () => {
    const capabilities: BrowserCapabilities = {
      webauthnSupported: true,
      platformAuthenticatorAvailable: false,
      conditionalMediationAvailable: false,
      platform: 'unknown',
      browser: 'unknown',
      detectedPasskeyManager: null,
    }

    const description = getPasskeyStorageDescription(capabilities)
    expect(description).toContain('stored securely on this device')
  })

  it('returns iCloud Keychain description', () => {
    const capabilities: BrowserCapabilities = {
      webauthnSupported: true,
      platformAuthenticatorAvailable: true,
      conditionalMediationAvailable: false,
      platform: 'ios',
      browser: 'safari',
      detectedPasskeyManager: 'iCloud Keychain',
    }

    const description = getPasskeyStorageDescription(capabilities)
    expect(description).toContain('iCloud Keychain')
    expect(description).toContain('synced across your Apple devices')
  })

  it('returns Google Password Manager description', () => {
    const capabilities: BrowserCapabilities = {
      webauthnSupported: true,
      platformAuthenticatorAvailable: true,
      conditionalMediationAvailable: false,
      platform: 'android',
      browser: 'chrome',
      detectedPasskeyManager: 'Google Password Manager',
    }

    const description = getPasskeyStorageDescription(capabilities)
    expect(description).toContain('Google Password Manager')
  })
})

describe('supportsWebAuthnFeature', () => {
  it('checks basic WebAuthn support', () => {
    const capabilities: BrowserCapabilities = {
      webauthnSupported: true,
      platformAuthenticatorAvailable: false,
      conditionalMediationAvailable: false,
      platform: 'macos',
      browser: 'chrome',
      detectedPasskeyManager: null,
    }

    expect(supportsWebAuthnFeature('basic', capabilities)).toBe(true)
    expect(supportsWebAuthnFeature('platform', capabilities)).toBe(false)
    expect(supportsWebAuthnFeature('autofill', capabilities)).toBe(false)
  })

  it('checks platform authenticator support', () => {
    const capabilities: BrowserCapabilities = {
      webauthnSupported: true,
      platformAuthenticatorAvailable: true,
      conditionalMediationAvailable: false,
      platform: 'ios',
      browser: 'safari',
      detectedPasskeyManager: 'iCloud Keychain',
    }

    expect(supportsWebAuthnFeature('basic', capabilities)).toBe(true)
    expect(supportsWebAuthnFeature('platform', capabilities)).toBe(true)
    expect(supportsWebAuthnFeature('autofill', capabilities)).toBe(false)
  })

  it('checks autofill support', () => {
    const capabilities: BrowserCapabilities = {
      webauthnSupported: true,
      platformAuthenticatorAvailable: true,
      conditionalMediationAvailable: true,
      platform: 'android',
      browser: 'chrome',
      detectedPasskeyManager: 'Google Password Manager',
    }

    expect(supportsWebAuthnFeature('basic', capabilities)).toBe(true)
    expect(supportsWebAuthnFeature('platform', capabilities)).toBe(true)
    expect(supportsWebAuthnFeature('autofill', capabilities)).toBe(true)
  })
})

describe('getPasskeySetupHelpUrl', () => {
  it('returns iOS help URL', () => {
    const capabilities: BrowserCapabilities = {
      webauthnSupported: true,
      platformAuthenticatorAvailable: true,
      conditionalMediationAvailable: false,
      platform: 'ios',
      browser: 'safari',
      detectedPasskeyManager: 'iCloud Keychain',
    }

    const url = getPasskeySetupHelpUrl(capabilities)
    expect(url).toContain('apple.com')
  })

  it('returns Android help URL', () => {
    const capabilities: BrowserCapabilities = {
      webauthnSupported: true,
      platformAuthenticatorAvailable: true,
      conditionalMediationAvailable: false,
      platform: 'android',
      browser: 'chrome',
      detectedPasskeyManager: 'Google Password Manager',
    }

    const url = getPasskeySetupHelpUrl(capabilities)
    expect(url).toContain('google.com')
  })

  it('returns Windows help URL', () => {
    const capabilities: BrowserCapabilities = {
      webauthnSupported: true,
      platformAuthenticatorAvailable: true,
      conditionalMediationAvailable: false,
      platform: 'windows',
      browser: 'edge',
      detectedPasskeyManager: 'Windows Hello',
    }

    const url = getPasskeySetupHelpUrl(capabilities)
    expect(url).toContain('microsoft.com')
  })

  it('returns generic passkeys URL for unknown platform', () => {
    const capabilities: BrowserCapabilities = {
      webauthnSupported: true,
      platformAuthenticatorAvailable: false,
      conditionalMediationAvailable: false,
      platform: 'unknown',
      browser: 'unknown',
      detectedPasskeyManager: null,
    }

    const url = getPasskeySetupHelpUrl(capabilities)
    expect(url).toContain('passkeys.com')
  })
})
