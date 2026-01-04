'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useIdentityStore } from '@/lib/store'

export default function Home() {
  const router = useRouter()
  const identity = useIdentityStore((state) => state.identity)

  useEffect(() => {
    if (identity) {
      router.replace('/home')
    } else {
      router.replace('/onboarding')
    }
  }, [identity, router])

  // Show loading while redirecting
  return (
    <main className="min-h-screen flex items-center justify-center bg-cream-50">
      <div className="animate-spin w-8 h-8 border-4 border-accent-yellow border-t-transparent rounded-full" />
    </main>
  )
}
