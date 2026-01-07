'use client'

import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useMemo, Suspense } from 'react'
import { VillaAuth, type VillaAuthResponse } from '@/components/sdk'

/**
 * Auth Page - SDK iframe target
 *
 * This page is loaded inside an iframe by the Villa SDK.
 * It handles the full auth flow and communicates back to the parent via postMessage.
 *
 * Query params:
 * - scopes: comma-separated list of requested scopes (e.g., "profile,wallet")
 * - appId: the integrating app's ID
 * - origin: (optional) parent origin for secure postMessage targeting
 */

// Villa-owned origins (always trusted, no query param needed)
const VILLA_ORIGINS = [
  'https://villa.cash',
  'https://www.villa.cash',
  'https://beta.villa.cash',
  'https://dev-1.villa.cash',
  'https://dev-2.villa.cash',
  'https://developers.villa.cash',
] as const

// Development origins (localhost only - NEVER use wildcard)
const DEV_ORIGINS = [
  'https://localhost:3000',
  'https://localhost:3001',
  'http://localhost:3000',
  'http://localhost:3001',
] as const

// Registered external app origins (allowlist for third-party integrations)
// Apps must register via developers.villa.cash to be added here
const REGISTERED_APP_ORIGINS = [
  // Lovable.dev (registered partner)
  'https://lovable.dev',
  'https://www.lovable.dev',
  // Add registered apps here after verification
] as const

function isInIframe(): boolean {
  try {
    return window.self !== window.top
  } catch {
    return true // Blocked access means we're in an iframe
  }
}

function isInPopup(): boolean {
  // Check if we're in a popup window opened by Villa SDK
  // 1. Check if window.opener exists (indicates popup)
  // 2. Check URL param for explicit mode=popup
  if (typeof window === 'undefined') return false

  const params = new URLSearchParams(window.location.search)
  const explicitMode = params.get('mode')

  return explicitMode === 'popup' || (window.opener != null && window.opener !== window)
}

/**
 * Check if origin is in the allowlist
 */
function isAllowedOrigin(origin: string): boolean {
  return (
    VILLA_ORIGINS.includes(origin as typeof VILLA_ORIGINS[number]) ||
    DEV_ORIGINS.includes(origin as typeof DEV_ORIGINS[number]) ||
    REGISTERED_APP_ORIGINS.includes(origin as typeof REGISTERED_APP_ORIGINS[number])
  )
}

/**
 * Get validated parent origin for secure postMessage
 *
 * Security model:
 * - Villa origins are always trusted
 * - Dev origins (localhost) are trusted in development only
 * - External apps MUST be in REGISTERED_APP_ORIGINS allowlist
 * - NEVER use wildcard ('*') - always specify exact origin
 */
function getValidatedParentOrigin(queryOrigin: string | null): string | null {
  // 1. Check Villa-owned origins first (from referrer)
  if (typeof document !== 'undefined' && document.referrer) {
    try {
      const referrerUrl = new URL(document.referrer)
      const referrerOrigin = referrerUrl.origin
      if (isAllowedOrigin(referrerOrigin)) {
        return referrerOrigin
      }
    } catch {
      // Invalid referrer URL
    }
  }

  // 2. Accept query param origin ONLY if in allowlist (registered apps)
  // SECURITY: Never accept arbitrary HTTPS origins - must be pre-registered
  if (queryOrigin && isAllowedOrigin(queryOrigin)) {
    return queryOrigin
  }

  // 3. In development, check for localhost origins (NEVER return wildcard)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // Return the specific localhost origin based on referrer or default
      if (typeof document !== 'undefined' && document.referrer) {
        try {
          const referrerUrl = new URL(document.referrer)
          if (DEV_ORIGINS.includes(referrerUrl.origin as typeof DEV_ORIGINS[number])) {
            return referrerUrl.origin
          }
        } catch {
          // Invalid referrer
        }
      }
      // Default to https localhost for passkey compatibility
      return 'https://localhost:3000'
    }
  }

  return null
}

function AuthPageContent() {
  const searchParams = useSearchParams()
  const hasNotifiedReady = useRef(false)

  // Parse query params
  const appId = searchParams.get('appId') || 'Villa'
  const queryOrigin = searchParams.get('origin')

  // Get validated parent origin once
  const targetOrigin = useMemo(() => {
    return getValidatedParentOrigin(queryOrigin)
  }, [queryOrigin])

  // Detect if we're in popup or iframe mode
  const inPopup = useMemo(() => isInPopup(), [])
  const inIframe = useMemo(() => isInIframe(), [])

  // Post message to parent window (iframe) or opener (popup) with validated origin
  const postToParent = useCallback((message: Record<string, unknown>) => {
    if (!inPopup && !inIframe) {
      // Not in iframe or popup context, skip posting
      return
    }

    if (!targetOrigin) {
      console.warn('[Villa Auth] No trusted origin found, message not sent:', message)
      return
    }

    // Post to opener (popup mode) or parent (iframe mode)
    const target = inPopup ? window.opener : window.parent
    if (target) {
      target.postMessage(message, targetOrigin)
    }
  }, [targetOrigin, inPopup, inIframe])

  // Notify parent that auth is ready
  useEffect(() => {
    if (!hasNotifiedReady.current) {
      hasNotifiedReady.current = true
      postToParent({ type: 'VILLA_READY' })
    }
  }, [postToParent])

  // Handle auth completion
  const handleComplete = useCallback((result: VillaAuthResponse) => {
    if (result.success) {
      // Map web app's AvatarConfig to SDK's Identity avatar format
      // Web: { style, selection, variant }
      // SDK: { style, seed, gender }
      const avatarConfig = result.identity.avatar
      const seed = `${result.identity.address}-${avatarConfig.variant}`

      const identity = {
        address: result.identity.address,
        nickname: result.identity.nickname,
        avatar: {
          style: avatarConfig.style,
          seed,
          gender: avatarConfig.selection,
        },
      }

      // Send both legacy and new message formats for compatibility
      postToParent({ type: 'AUTH_SUCCESS', identity })
      postToParent({ type: 'VILLA_AUTH_SUCCESS', payload: { identity } })

      // If in popup mode, close the window after a short delay
      if (inPopup) {
        setTimeout(() => {
          window.close()
        }, 500)
      }
    } else {
      if (result.code === 'CANCELLED') {
        postToParent({ type: 'AUTH_CLOSE' })
        postToParent({ type: 'VILLA_AUTH_CANCEL' })
      } else {
        postToParent({ type: 'AUTH_ERROR', error: result.error })
        postToParent({ type: 'VILLA_AUTH_ERROR', payload: { error: result.error, code: result.code } })
      }

      // If in popup mode, close on cancel/error too
      if (inPopup) {
        setTimeout(() => {
          window.close()
        }, 500)
      }
    }
  }, [postToParent, inPopup])

  return (
    <VillaAuth
      onComplete={handleComplete}
      appName={appId}
    />
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-accent-yellow border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-ink-muted">Loading...</p>
        </div>
      </div>
    }>
      <AuthPageContent />
    </Suspense>
  )
}
