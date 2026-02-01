'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, Suspense } from 'react'

/**
 * Auth Page Redirect
 *
 * Hub's /auth now redirects to Key app (key.villa.cash/auth).
 * Key is the single source of truth for passkey authentication.
 *
 * This redirect preserves query params for the SDK flow.
 */

function getKeyAuthUrl(): string {
  if (typeof window === 'undefined') return 'https://key.villa.cash/auth'
  
  const hostname = window.location.hostname
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3001/auth'
  }
  if (hostname === 'local.villa.cash') {
    return 'https://local-key.villa.cash/auth'
  }
  if (hostname === 'construction.villa.cash') {
    return 'https://key.villa.cash/auth'
  }
  
  return 'https://key.villa.cash/auth'
}

function AuthRedirectContent() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const baseUrl = getKeyAuthUrl()
    const params = searchParams.toString()
    const redirectUrl = params ? `${baseUrl}?${params}` : baseUrl
    
    window.location.replace(redirectUrl)
  }, [searchParams])

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-accent-yellow border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-ink-muted">Redirecting to authentication...</p>
      </div>
    </div>
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
      <AuthRedirectContent />
    </Suspense>
  )
}
