'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppRegistration } from '@/components/developers/AppRegistration'

/**
 * New App Registration Page
 *
 * Form for registering a new app with Villa SDK.
 */
export default function NewAppPage() {
  const router = useRouter()
  const [developerAddress, setDeveloperAddress] = useState<string | null>(null)

  useEffect(() => {
    // Check if developer is connected
    const developerState = localStorage.getItem('villa_developer')
    if (!developerState) {
      router.push('/developers')
      return
    }

    try {
      const parsed = JSON.parse(developerState)
      if (!parsed.address) {
        router.push('/developers')
        return
      }
      setDeveloperAddress(parsed.address)
    } catch {
      router.push('/developers')
    }
  }, [router])

  const handleSuccess = (app: { id: string; name: string; apiKey: string }) => {
    // Update localStorage with new app
    const developerState = localStorage.getItem('villa_developer')
    if (developerState) {
      try {
        const parsed = JSON.parse(developerState)
        parsed.apps = parsed.apps || []
        parsed.apps.push({
          id: app.id,
          appId: app.id,
          appName: app.name,
          status: 'active',
          createdAt: new Date().toISOString(),
        })
        localStorage.setItem('villa_developer', JSON.stringify(parsed))
      } catch {
        // Ignore errors
      }
    }

    // Navigate to dashboard
    router.push('/developers/apps')
  }

  const handleCancel = () => {
    router.push('/developers/apps')
  }

  if (!developerAddress) {
    return (
      <main className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="animate-pulse text-ink-muted">Loading...</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-cream-50">
      <AppRegistration
        developerAddress={developerAddress}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </main>
  )
}
