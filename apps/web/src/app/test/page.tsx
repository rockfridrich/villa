'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * SDK Test Harness Page
 *
 * Simulates how external apps integrate Villa SDK via iframe.
 * Used by E2E tests to verify iframe behavior.
 */
export default function TestPage() {
  const [showIframe, setShowIframe] = useState(false)
  const [isIframeReady, setIsIframeReady] = useState(false)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Listen for postMessage from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // In production, validate event.origin
      const { type } = event.data

      if (type === 'VILLA_READY') {
        setIsIframeReady(true)
      } else if (type === 'VILLA_AUTH_SUCCESS' || type === 'AUTH_SUCCESS') {
        setResult(event.data)
        setTimeout(() => setShowIframe(false), 1500)
      } else if (type === 'VILLA_AUTH_CANCEL' || type === 'AUTH_CLOSE') {
        setShowIframe(false)
      } else if (type === 'VILLA_AUTH_ERROR' || type === 'AUTH_ERROR') {
        setResult(event.data)
        setTimeout(() => setShowIframe(false), 2000)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // Custom event handler for tests
  useEffect(() => {
    const handleTestEvent = (e: Event) => {
      console.log('Test event received:', e.type)
      setShowIframe(true)
      setIsIframeReady(false)
    }

    window.addEventListener('villa:test:signIn', handleTestEvent as EventListener)
    return () => window.removeEventListener('villa:test:signIn', handleTestEvent as EventListener)
  }, [])

  // Expose global function for tests
  useEffect(() => {
    ;(window as unknown as { villaTestSignIn?: () => void }).villaTestSignIn = () => {
      console.log('villaTestSignIn called')
      setShowIframe(true)
      setIsIframeReady(false)
    }
  }, [])

  // Handle escape key
  useEffect(() => {
    if (!showIframe) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowIframe(false)
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [showIframe])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-cream-50">
      <div className="w-full max-w-md space-y-6 text-center">
        <h1 className="text-3xl font-serif text-ink">SDK Test Harness</h1>
        <p className="text-ink-muted">
          This page simulates SDK iframe integration for E2E tests.
        </p>

        <button
          onClick={() => setShowIframe(true)}
          className="bg-accent-yellow text-accent-brown px-6 py-3 rounded-lg font-medium hover:bg-accent-yellow/90 transition-colors"
        >
          Open Auth Iframe
        </button>

        {result && (
          <div className="p-4 bg-cream-100 rounded-lg">
            <pre className="text-xs text-left overflow-x-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Auth Iframe Overlay */}
      {showIframe && (
        <div
          data-testid="villa-auth-overlay"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-200"
          onClick={(e) => {
            // Close on overlay click (not iframe click)
            if (e.target === e.currentTarget) {
              setShowIframe(false)
            }
          }}
          style={{
            transition: window.matchMedia('(prefers-reduced-motion: reduce)').matches
              ? 'none'
              : 'opacity 200ms ease-in-out',
          }}
        >
          {/* Loading spinner */}
          {!isIframeReady && (
            <div
              data-testid="villa-auth-loading"
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className="w-8 h-8 border-4 border-accent-yellow border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Iframe */}
          <iframe
            ref={iframeRef}
            data-testid="villa-auth-iframe"
            data-ready={isIframeReady ? 'true' : 'false'}
            src="/auth?appId=test&scopes=profile,wallet"
            className="w-full max-w-md h-[90vh] bg-white rounded-2xl shadow-2xl border-0"
            allow="publickey-credentials-get *; publickey-credentials-create *"
            title="Villa Auth"
          />
        </div>
      )}
    </main>
  )
}
