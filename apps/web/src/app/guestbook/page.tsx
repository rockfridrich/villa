'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Send, LogOut } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { VillaAuth } from '@/components/sdk/VillaAuth'
import { AvatarImage } from '@/components/sdk/AvatarImage'
import { useIdentityStore } from '@/lib/store'
import { disconnectPorto } from '@/lib/porto'

interface GuestbookEntry {
  id: string
  nickname: string
  avatar: unknown
  address: string
  message: string
  timestamp: number
}

const STORAGE_KEY = 'villa-guestbook-entries'

export default function GuestbookPage() {
  const router = useRouter()
  const { identity, clearIdentity } = useIdentityStore()
  const [message, setMessage] = useState('')
  const [entries, setEntries] = useState<GuestbookEntry[]>([])
  const [showAuth, setShowAuth] = useState(false)

  // Load entries from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setEntries(JSON.parse(stored))
      } catch {
        setEntries([])
      }
    }
  }, [])

  // Save entries to localStorage whenever they change
  useEffect(() => {
    if (entries.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
    }
  }, [entries])

  const handlePost = () => {
    if (!identity || !message.trim()) return

    const newEntry: GuestbookEntry = {
      id: `${Date.now()}-${identity.address}`,
      nickname: identity.displayName,
      avatar: identity.avatar,
      address: identity.address,
      message: message.trim(),
      timestamp: Date.now(),
    }

    setEntries([newEntry, ...entries])
    setMessage('')
  }

  const handleSignOut = async () => {
    await disconnectPorto()
    clearIdentity()
    router.replace('/onboarding')
  }

  const formatTime = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  // Show auth flow if not signed in
  if (!identity || showAuth) {
    return (
      <VillaAuth
        onComplete={(result) => {
          if (result.success) {
            setShowAuth(false)
          }
        }}
      />
    )
  }

  return (
    <main className="min-h-screen p-6 bg-cream-50">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-serif text-ink">Guestbook</h1>
          <Button variant="ghost" size="lg" onClick={handleSignOut} aria-label="Sign out">
            <LogOut className="w-6 h-6" />
          </Button>
        </header>

        {/* Signed in user info */}
        <div className="flex items-center gap-3 p-4 bg-cream-100 rounded-lg">
          <AvatarImage
            avatar={typeof identity.avatar === 'string' ? null : (identity.avatar || null)}
            walletAddress={identity.address}
            size={40}
          />
          <div>
            <p className="text-sm font-medium text-ink">Signed in as</p>
            <p className="text-sm text-ink-muted">@{identity.displayName}</p>
          </div>
        </div>

        {/* Post message */}
        <div className="space-y-3">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Leave a message..."
            maxLength={280}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handlePost()
              }
            }}
          />
          <div className="flex items-center justify-between">
            <span className="text-sm text-ink-muted">
              {message.length}/280
            </span>
            <Button
              onClick={handlePost}
              disabled={!message.trim()}
              size="default"
            >
              <Send className="w-4 h-4 mr-2" />
              Post
            </Button>
          </div>
        </div>

        {/* Messages list */}
        <div className="space-y-4">
          {entries.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-ink-muted">No messages yet. Be the first to sign!</p>
            </div>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.id}
                className="p-4 bg-white rounded-lg border border-neutral-100 space-y-3"
              >
                <div className="flex items-start gap-3">
                  <AvatarImage
                    avatar={typeof entry.avatar === 'string' ? null : (entry.avatar as never || null)}
                    walletAddress={entry.address}
                    size={40}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-medium text-ink">
                        @{entry.nickname}
                      </span>
                      <span className="text-xs text-ink-muted">
                        {formatTime(entry.timestamp)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-ink break-words">
                      {entry.message}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 text-center">
          <p className="text-xs text-ink-muted">
            Powered by Villa SDK • Messages stored locally
          </p>
        </div>
      </div>
    </main>
  )
}
