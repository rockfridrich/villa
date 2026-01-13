/**
 * In-app browser detection and handling
 *
 * In-app browsers (Telegram, Instagram, etc.) have limited passkey support
 * and potential security concerns. We guide users to open in a real browser.
 */

export interface InAppBrowserInfo {
  isInApp: boolean
  app: 'telegram' | 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'snapchat' | 'tiktok' | 'wechat' | 'line' | 'unknown' | null
  instructions: string
  canOpenExternal: boolean
}

/**
 * Detect if running in an in-app browser
 */
export function detectInAppBrowser(): InAppBrowserInfo {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { isInApp: false, app: null, instructions: '', canOpenExternal: false }
  }

  const ua = navigator.userAgent.toLowerCase()

  // Telegram
  if (ua.includes('telegram') || ua.includes('tgweb')) {
    return {
      isInApp: true,
      app: 'telegram',
      instructions: 'Tap the ⋮ menu (top right) → "Open in Browser"',
      canOpenExternal: true,
    }
  }

  // Instagram
  if (ua.includes('instagram')) {
    return {
      isInApp: true,
      app: 'instagram',
      instructions: 'Tap the ⋯ menu (top right) → "Open in Browser"',
      canOpenExternal: true,
    }
  }

  // Facebook
  if (ua.includes('fban') || ua.includes('fbav') || ua.includes('fb_iab')) {
    return {
      isInApp: true,
      app: 'facebook',
      instructions: 'Tap the ⋯ menu (bottom right) → "Open in Browser"',
      canOpenExternal: true,
    }
  }

  // Twitter/X
  if (ua.includes('twitter') || (ua.includes('iphone') && ua.includes('mobile') && document.referrer.includes('t.co'))) {
    return {
      isInApp: true,
      app: 'twitter',
      instructions: 'Tap the ⋯ menu → "Open in Safari/Chrome"',
      canOpenExternal: true,
    }
  }

  // LinkedIn
  if (ua.includes('linkedin')) {
    return {
      isInApp: true,
      app: 'linkedin',
      instructions: 'Tap the ⋮ menu → "Open in Browser"',
      canOpenExternal: true,
    }
  }

  // Snapchat
  if (ua.includes('snapchat')) {
    return {
      isInApp: true,
      app: 'snapchat',
      instructions: 'Long press the link → "Open in Browser"',
      canOpenExternal: true,
    }
  }

  // TikTok
  if (ua.includes('tiktok') || ua.includes('musical_ly')) {
    return {
      isInApp: true,
      app: 'tiktok',
      instructions: 'Tap the ⋯ menu → "Open in Browser"',
      canOpenExternal: true,
    }
  }

  // WeChat
  if (ua.includes('micromessenger') || ua.includes('wechat')) {
    return {
      isInApp: true,
      app: 'wechat',
      instructions: 'Tap the ⋯ menu → "Open in Browser"',
      canOpenExternal: true,
    }
  }

  // LINE
  if (ua.includes('line/')) {
    return {
      isInApp: true,
      app: 'line',
      instructions: 'Tap the ⋮ menu → "Open in external browser"',
      canOpenExternal: true,
    }
  }

  // Generic WebView detection (Android)
  if (ua.includes('wv') || (ua.includes('android') && ua.includes('version/') && !ua.includes('chrome'))) {
    return {
      isInApp: true,
      app: 'unknown',
      instructions: 'Look for a menu option to "Open in Browser"',
      canOpenExternal: false,
    }
  }

  // Generic WebView detection (iOS)
  // iOS WebViews often lack Safari-specific features
  if (ua.includes('iphone') || ua.includes('ipad')) {
    // Safari has 'safari' in UA, WebViews typically don't
    if (!ua.includes('safari') || (ua.includes('safari') && (ua.includes('fbios') || ua.includes('instagram')))) {
      return {
        isInApp: true,
        app: 'unknown',
        instructions: 'Look for a menu option to "Open in Safari"',
        canOpenExternal: false,
      }
    }
  }

  return { isInApp: false, app: null, instructions: '', canOpenExternal: false }
}

/**
 * Get the app display name
 */
export function getAppDisplayName(app: InAppBrowserInfo['app']): string {
  const names: Record<NonNullable<InAppBrowserInfo['app']>, string> = {
    telegram: 'Telegram',
    instagram: 'Instagram',
    facebook: 'Facebook',
    twitter: 'X (Twitter)',
    linkedin: 'LinkedIn',
    snapchat: 'Snapchat',
    tiktok: 'TikTok',
    wechat: 'WeChat',
    line: 'LINE',
    unknown: 'this app',
  }
  return app ? names[app] : 'this app'
}

/**
 * Get the current page URL for copying
 */
export function getCurrentUrl(): string {
  if (typeof window === 'undefined') return ''
  return window.location.href
}

/**
 * Check if the browser supports passkeys/WebAuthn properly
 * In-app browsers often have broken or limited WebAuthn support
 */
export function hasFullPasskeySupport(): boolean {
  if (typeof window === 'undefined') return false

  // Basic WebAuthn check
  if (!window.PublicKeyCredential) return false

  // Check for platform authenticator (biometric)
  // This is async but we do a sync check for the API existence
  if (!PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
    return false
  }

  return true
}
