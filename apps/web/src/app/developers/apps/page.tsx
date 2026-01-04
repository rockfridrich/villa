'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppDashboard } from '@/components/developers/AppDashboard'

interface App {
  id: string
  appId: string
  appName: string
  status: 'active' | 'inactive'
  createdAt: string
  requestCount?: number
}

/**
 * Developer Apps Dashboard
 *
 * Shows registered apps and allows creating new ones.
 */
export default function DeveloperAppsPage() {
  const router = useRouter()
  const [apps, setApps] = useState<App[]>([])
  const [isLoading, setIsLoading] = useState(true)

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

      // Load apps from localStorage (will be replaced with API)
      if (parsed.apps && Array.isArray(parsed.apps)) {
        setApps(parsed.apps)
      }
    } catch {
      router.push('/developers')
      return
    }

    setIsLoading(false)
  }, [router])

  const handleRegisterNew = () => {
    router.push('/developers/apps/new')
  }

  const handleAppClick = (appId: string) => {
    // TODO: Navigate to app detail page
    console.log('Navigate to app:', appId)
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="animate-pulse text-ink-muted">Loading...</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-cream-50">
      <AppDashboard
        apps={apps}
        onRegisterNew={handleRegisterNew}
        onAppClick={handleAppClick}
      />
    </main>
  )
}
