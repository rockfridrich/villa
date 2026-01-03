'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect, type ReactNode } from 'react'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient())
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Show loading spinner while hydrating to prevent blank page
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50">
        <div className="animate-spin w-8 h-8 border-4 border-accent-yellow border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
