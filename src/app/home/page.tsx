'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Copy, Check } from 'lucide-react'
import { Button, Card, CardContent, Avatar } from '@/components/ui'
import { useIdentityStore } from '@/lib/store'
import { disconnectPorto } from '@/lib/porto'

export default function HomePage() {
  const router = useRouter()
  const { identity, clearIdentity } = useIdentityStore()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!identity) {
      router.replace('/onboarding')
    }
  }, [identity, router])

  if (!identity) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-cream-50">
        <div className="animate-spin w-8 h-8 border-4 border-accent-yellow border-t-transparent rounded-full" />
      </main>
    )
  }

  const handleLogout = async () => {
    await disconnectPorto()
    clearIdentity()
    router.replace('/onboarding')
  }

  const handleCopyAddress = async () => {
    await navigator.clipboard.writeText(identity.address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <main className="min-h-screen p-6 bg-cream-50">
      <div className="max-w-sm mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-serif text-ink">Villa</h1>
          <Button variant="ghost" size="default" onClick={handleLogout}>
            <LogOut className="w-5 h-5" />
          </Button>
        </header>

        <Card>
          <CardContent className="flex flex-col items-center space-y-4 py-8">
            <Avatar
              name={identity.displayName}
              src={identity.avatar}
              size="lg"
            />
            <div className="text-center space-y-1">
              <h2 className="text-xl font-serif text-ink">{identity.displayName}</h2>
              <button
                onClick={handleCopyAddress}
                className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors"
              >
                <span className="font-mono">{truncateAddress(identity.address)}</span>
                {copied ? (
                  <Check className="w-4 h-4 text-accent-green" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-ink-muted">Created</span>
              <span className="text-ink">{formatDate(identity.createdAt)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink-muted">Status</span>
              <span className="text-accent-green">Active</span>
            </div>
          </CardContent>
        </Card>

        <div className="pt-4">
          <Button
            variant="secondary"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </main>
  )
}
