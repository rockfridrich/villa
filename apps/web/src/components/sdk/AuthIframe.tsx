'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Spinner } from '@/components/ui/spinner'

/**
 * Auth message types for iframe communication
 * Mirrors types from @villa/sdk but defined locally for build independence
 */
export type AuthMessage =
  | { type: 'VILLA_AUTH_READY' }
  | { type: 'VILLA_AUTH_SUCCESS'; identity: { address: string; nickname: string; avatar: unknown } }
  | { type: 'VILLA_AUTH_ERROR'; error: string; code?: string }
  | { type: 'VILLA_AUTH_CANCEL' }
  | { type: 'VILLA_CONSENT_GRANTED'; appId: string }
  | { type: 'VILLA_CONSENT_DENIED'; appId: string }
  // Legacy support
  | { type: 'AUTH_SUCCESS'; identity: { address: string; nickname: string; avatar: unknown } }
  | { type: 'AUTH_ERROR'; error: string }
  | { type: 'AUTH_CLOSE' }

export interface AuthIframeProps {
  /** Whether iframe is visible */
  isOpen: boolean
  /** URL to load in iframe */
  url: string
  /** Called when iframe is ready */
  onReady?: () => void
  /** Called on successful authentication */
  onSuccess?: (message: Extract<AuthMessage, { type: 'VILLA_AUTH_SUCCESS' }>) => void
  /** Called on authentication error */
  onError?: (message: Extract<AuthMessage, { type: 'VILLA_AUTH_ERROR' }>) => void
  /** Called when user cancels */
  onCancel?: () => void
  /** Called when consent is granted */
  onConsentGranted?: (appId: string) => void
  /** Called when consent is denied */
  onConsentDenied?: (appId: string) => void
  /** Called when iframe should close */
  onClose: () => void
  /** Timeout in milliseconds (default: 30000) */
  timeout?: number
}

/**
 * Fullscreen iframe container for Villa SDK authentication flow
 *
 * Features:
 * - Fullscreen overlay with fade animations
 * - Loading state with spinner
 * - Timeout handling (30s default)
 * - Escape key to close
 * - postMessage bridge with validation
 * - Error boundary with retry
 */
export function AuthIframe({
  isOpen,
  url,
  onReady,
  onSuccess,
  onError,
  onCancel,
  onConsentGranted,
  onConsentDenied,
  onClose,
  timeout = 30000,
}: AuthIframeProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Handle incoming messages from iframe
   */
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      // Validate origin (basic check - iframe.ts does full validation)
      const trustedOrigins = [
        'https://villa.cash',
        'https://www.villa.cash',
        'https://beta.villa.cash',
        'https://dev-1.villa.cash',
        'https://dev-2.villa.cash',
        'http://localhost:3000',
        'http://localhost:3001',
        'https://localhost:3000',
      ]

      if (!trustedOrigins.includes(event.origin)) {
        return
      }

      const message = event.data as AuthMessage

      if (!message || !message.type) {
        return
      }

      // Clear timeout on any valid message
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = undefined
      }

      // Handle message types
      switch (message.type) {
        case 'VILLA_AUTH_READY':
          setIsLoading(false)
          onReady?.()
          break

        case 'VILLA_AUTH_SUCCESS':
        case 'AUTH_SUCCESS': // Legacy support
          setIsLoading(false)
          onSuccess?.(message as Extract<AuthMessage, { type: 'VILLA_AUTH_SUCCESS' }>)
          break

        case 'VILLA_AUTH_ERROR':
        case 'AUTH_ERROR': // Legacy support
          setIsLoading(false)
          setError(message.error)
          onError?.(message as Extract<AuthMessage, { type: 'VILLA_AUTH_ERROR' }>)
          break

        case 'VILLA_AUTH_CANCEL':
        case 'AUTH_CLOSE': // Legacy support
          setIsLoading(false)
          onCancel?.()
          onClose()
          break

        case 'VILLA_CONSENT_GRANTED':
          onConsentGranted?.(message.appId)
          break

        case 'VILLA_CONSENT_DENIED':
          onConsentDenied?.(message.appId)
          onClose()
          break
      }
    },
    [onReady, onSuccess, onError, onCancel, onConsentGranted, onConsentDenied, onClose]
  )

  /**
   * Handle iframe load event
   */
  const handleIframeLoad = useCallback(() => {
    // Note: VILLA_AUTH_READY message from iframe content is the real "ready" signal
    // This load event just means the HTML loaded, not that the app is interactive
  }, [])

  /**
   * Handle timeout
   */
  const handleTimeout = useCallback(() => {
    setIsLoading(false)
    setError('Authentication timed out. Please try again.')
    onError?.({
      type: 'VILLA_AUTH_ERROR',
      error: 'Timeout',
      code: 'TIMEOUT',
    })
  }, [onError])

  /**
   * Handle retry after error
   */
  const handleRetry = useCallback(() => {
    setError(null)
    setIsLoading(true)

    // Reload iframe
    if (iframeRef.current) {
      iframeRef.current.src = url
    }

    // Reset timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(handleTimeout, timeout)
  }, [url, timeout, handleTimeout])

  /**
   * Setup message listener and timeout
   */
  useEffect(() => {
    if (!isOpen) {
      return
    }

    // Add message listener
    window.addEventListener('message', handleMessage)

    // Start timeout
    timeoutRef.current = setTimeout(handleTimeout, timeout)

    // Cleanup
    return () => {
      window.removeEventListener('message', handleMessage)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [isOpen, handleMessage, handleTimeout, timeout])

  /**
   * Handle Escape key to close
   */
  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel?.()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onCancel, onClose])

  /**
   * Reset state when closed
   */
  useEffect(() => {
    if (!isOpen) {
      setIsLoading(true)
      setError(null)
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] bg-cream"
        >
          {/* Loading Overlay */}
          <AnimatePresence>
            {isLoading && !error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-cream z-10"
              >
                <Spinner size="lg" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Overlay */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute inset-0 flex items-center justify-center bg-cream z-10 p-6"
              >
                <div className="max-w-sm text-center space-y-4">
                  <div className="text-ink space-y-2">
                    <h2 className="text-xl font-serif">Something went wrong</h2>
                    <p className="text-sm text-ink-muted">{error}</p>
                  </div>
                  <div className="space-y-3">
                    <button
                      onClick={handleRetry}
                      className="w-full px-6 py-3 bg-yellow text-brown rounded-lg font-medium hover:bg-yellow-600 transition-colors min-h-[44px]"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={onClose}
                      className="w-full px-6 py-3 bg-cream-dark text-ink rounded-lg font-medium hover:bg-cream-darker transition-colors min-h-[44px]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Iframe */}
          <iframe
            ref={iframeRef}
            src={url}
            onLoad={handleIframeLoad}
            allow="publickey-credentials-get *; publickey-credentials-create *"
            className="w-full h-full border-0"
            title="Villa Authentication"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
