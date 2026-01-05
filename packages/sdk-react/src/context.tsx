'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import type { Identity, VillaConfig } from '@rockfridrich/villa-sdk'

/**
 * Auth result from Villa authentication
 */
export interface VillaAuthResult {
  success: true
  identity: Identity
}

export interface VillaAuthError {
  success: false
  error: string
  code: 'CANCELLED' | 'AUTH_FAILED' | 'NETWORK_ERROR' | 'TIMEOUT'
}

export type VillaAuthResponse = VillaAuthResult | VillaAuthError

interface VillaContextValue {
  /** Current authenticated identity */
  identity: Identity | null
  /** Whether auth is in progress */
  isLoading: boolean
  /** Whether user is authenticated */
  isAuthenticated: boolean
  /** Start sign in flow */
  signIn: () => Promise<VillaAuthResponse>
  /** Sign out and clear identity */
  signOut: () => void
  /** SDK configuration */
  config: VillaConfig
}

const VillaContext = createContext<VillaContextValue | null>(null)

const STORAGE_KEY = 'villa-identity'
const AUTH_URL = 'https://villa.cash/auth'

// Trusted origins for postMessage validation - must be exact match
const TRUSTED_ORIGINS = new Set([
  'https://villa.cash',
  'https://www.villa.cash',
  'https://beta.villa.cash',
  'https://dev-1.villa.cash',
  'https://dev-2.villa.cash',
  'https://developers.villa.cash',
  'https://localhost:3000',
  'https://localhost:3001',
])

interface VillaProviderProps {
  children: ReactNode
  config: VillaConfig
}

/**
 * Villa Provider - Wrap your app with this to enable authentication
 *
 * @example
 * ```tsx
 * <VillaProvider config={{ appId: 'your-app' }}>
 *   <App />
 * </VillaProvider>
 * ```
 */
export function VillaProvider({ children, config }: VillaProviderProps) {
  const [identity, setIdentity] = useState<Identity | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Load stored identity on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setIdentity(JSON.parse(stored))
      }
    } catch {
      // Ignore storage errors
    }
  }, [])

  const signIn = useCallback(async (): Promise<VillaAuthResponse> => {
    setIsLoading(true)

    return new Promise((resolve) => {
      // Create iframe for auth
      const iframe = document.createElement('iframe')
      const params = new URLSearchParams({
        appId: config.appId,
        network: config.network || 'base',
        origin: window.location.origin,
      })

      iframe.src = `${AUTH_URL}?${params}`
      iframe.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border: none;
        z-index: 99999;
        background: transparent;
        opacity: 0;
        transition: opacity 0.3s ease-in-out;
      `

      // Create loading overlay
      const loadingOverlay = document.createElement('div')
      loadingOverlay.id = 'villa-loading-overlay'
      loadingOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 99998;
        transition: opacity 0.3s ease-in-out;
      `
      loadingOverlay.innerHTML = `
        <div style="
          width: 48px;
          height: 48px;
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-top-color: #F5C44E;
          border-radius: 50%;
          animation: villa-spin 0.8s linear infinite;
        "></div>
        <style>
          @keyframes villa-spin {
            to { transform: rotate(360deg); }
          }
        </style>
      `
      document.body.appendChild(loadingOverlay)

      // Show iframe with fade-in when loaded
      iframe.onload = () => {
        loadingOverlay.style.opacity = '0'
        setTimeout(() => loadingOverlay.remove(), 300)
        iframe.style.opacity = '1'
      }

      // Listen for auth result
      const handleMessage = (event: MessageEvent) => {
        // Validate origin - must be exact match against trusted origins
        if (!TRUSTED_ORIGINS.has(event.origin)) return

        const data = event.data || {}
        const { type, identity, error, code } = data

        // Handle both new format (identity on root) and legacy format (payload.identity)
        const resolvedIdentity = identity || data.payload?.identity

        if (type === 'VILLA_AUTH_SUCCESS' || type === 'AUTH_SUCCESS') {
          if (!resolvedIdentity) {
            console.warn('[Villa SDK] VILLA_AUTH_SUCCESS received without identity')
            return
          }
          const newIdentity: Identity = resolvedIdentity
          setIdentity(newIdentity)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newIdentity))
          cleanup()
          resolve({ success: true, identity: newIdentity })
        }

        if (type === 'VILLA_AUTH_ERROR' || type === 'AUTH_ERROR') {
          cleanup()
          resolve({
            success: false,
            error: error || data.payload?.error || 'Authentication failed',
            code: code || data.payload?.code || 'AUTH_FAILED',
          })
        }

        if (type === 'VILLA_AUTH_CANCEL' || type === 'AUTH_CLOSE') {
          cleanup()
          resolve({
            success: false,
            error: 'Authentication cancelled',
            code: 'CANCELLED',
          })
        }
      }

      const cleanup = () => {
        window.removeEventListener('message', handleMessage)
        iframe.remove()
        // Clean up loading overlay if it still exists
        const overlay = document.getElementById('villa-loading-overlay')
        if (overlay) overlay.remove()
        setIsLoading(false)
      }

      window.addEventListener('message', handleMessage)
      document.body.appendChild(iframe)

      // Timeout after 5 minutes
      setTimeout(() => {
        cleanup()
        resolve({
          success: false,
          error: 'Authentication timed out',
          code: 'TIMEOUT',
        })
      }, 5 * 60 * 1000)
    })
  }, [config])

  const signOut = useCallback(() => {
    setIdentity(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const value: VillaContextValue = {
    identity,
    isLoading,
    isAuthenticated: !!identity,
    signIn,
    signOut,
    config,
  }

  return <VillaContext.Provider value={value}>{children}</VillaContext.Provider>
}

/**
 * Hook to access Villa context
 * Must be used within VillaProvider
 */
export function useVillaContext(): VillaContextValue {
  const context = useContext(VillaContext)
  if (!context) {
    throw new Error('useVillaContext must be used within a VillaProvider')
  }
  return context
}
