'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DeveloperLanding } from '@/components/developers/DeveloperLanding'

/**
 * Developer Portal Landing Page
 *
 * Entry point for developers wanting to integrate Villa SDK.
 * Shows hero, features, and connect wallet CTA.
 */
export default function DevelopersPage() {
  const router = useRouter()
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Check if developer is already connected (has localStorage state)
    const developerState = localStorage.getItem('villa_developer')
    if (developerState) {
      try {
        const parsed = JSON.parse(developerState)
        if (parsed.address) {
          setIsConnected(true)
        }
      } catch {
        // Invalid state, ignore
      }
    }
  }, [])

  const handleConnect = async () => {
    if (isConnected) {
      // Already connected, go to dashboard
      router.push('/developers/apps')
      return
    }

    // TODO: Implement wallet connection
    // For now, mock connection for development
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      localStorage.setItem('villa_developer', JSON.stringify({
        address: '0x1234567890123456789012345678901234567890',
        apps: []
      }))
      setIsConnected(true)
      router.push('/developers/apps')
    }
  }

  return (
    <main className="min-h-screen bg-cream-50">
      <DeveloperLanding
        onConnect={handleConnect}
        isConnected={isConnected}
      />
    </main>
  )
}
