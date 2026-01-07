'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Copy, Check, Pencil, X, Settings, ExternalLink, Compass, Globe } from 'lucide-react'
import { Button, Card, CardContent, Avatar, Input, Spinner } from '@/components/ui'
import { useIdentityStore } from '@/lib/store'
import { disconnectPorto } from '@/lib/porto'
import { displayNameSchema } from '@/lib/validation'
import {
  authenticateTinyCloud,
  syncToTinyCloud,
  isTinyCloudAuthenticatedFor,
  getRecentApps,
  trackAppUsage,
  type RecentApp,
} from '@/lib/storage/tinycloud-client'

// Featured ecosystem apps
const ECOSYSTEM_APPS = [
  {
    appId: 'residents',
    name: 'Residents',
    url: 'https://residents.proofofretreat.me/',
    description: 'Community directory',
  },
  {
    appId: 'map',
    name: 'Map',
    url: 'https://map.proofofretreat.me/',
    description: 'Village explorer',
  },
]

export default function HomePage() {
  const router = useRouter()
  const { identity, clearIdentity, updateProfile } = useIdentityStore()
  const [copied, setCopied] = useState(false)
  const [ensNameCopied, setEnsNameCopied] = useState(false)

  // Nickname editing state
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const [editError, setEditError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Recent apps state
  const [recentApps, setRecentApps] = useState<RecentApp[]>([])

  // Ref for tracking timeout to prevent memory leaks
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const ensCopyTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current)
      }
      if (ensCopyTimeoutRef.current) {
        clearTimeout(ensCopyTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!identity) {
      router.replace('/onboarding')
    }
  }, [identity, router])

  // Authenticate TinyCloud on mount for returning users on new devices
  useEffect(() => {
    if (!identity?.address) return

    // Load recent apps immediately from localStorage
    getRecentApps().then(setRecentApps).catch(console.warn)

    // Check if TinyCloud is already authenticated for this address
    if (isTinyCloudAuthenticatedFor(identity.address)) return

    // Trigger background authentication
    authenticateTinyCloud(identity.address)
      .then(success => {
        if (success) {
          syncToTinyCloud().catch(console.warn)
          // Reload recent apps after sync (may have newer data from TinyCloud)
          getRecentApps().then(setRecentApps).catch(console.warn)
        }
      })
      .catch(console.warn)
  }, [identity?.address])

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
    try {
      await navigator.clipboard.writeText(identity.address)
      setCopied(true)
      // Clear any existing timeout before setting a new one
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current)
      }
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Clipboard API can fail if permissions are denied or page doesn't have focus
      console.error('Failed to copy address:', err)
    }
  }

  const handleCopyEnsName = async () => {
    const ensName = `${identity.displayName}.villa.cash`
    try {
      await navigator.clipboard.writeText(ensName)
      setEnsNameCopied(true)
      if (ensCopyTimeoutRef.current) {
        clearTimeout(ensCopyTimeoutRef.current)
      }
      ensCopyTimeoutRef.current = setTimeout(() => setEnsNameCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy ENS name:', err)
    }
  }

  const handleStartEdit = () => {
    setEditValue(identity.displayName)
    setEditError(null)
    setIsEditing(true)
    // Focus input after render
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditValue('')
    setEditError(null)
  }

  const handleSaveEdit = async () => {
    // Remove @ prefix if user typed it
    const cleanValue = editValue.startsWith('@') ? editValue.slice(1) : editValue

    // Validate
    const result = displayNameSchema.safeParse(cleanValue)
    if (!result.success) {
      setEditError(result.error.errors[0]?.message || 'Invalid nickname')
      return
    }

    // Check if actually changed
    if (result.data === identity.displayName) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    setEditError(null)

    // Update via store
    const success = updateProfile(result.data)

    if (success) {
      setIsEditing(false)
      setEditValue('')
    } else {
      setEditError('Failed to update nickname')
    }
    setIsSaving(false)
  }

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }

  const handleVisitApp = async (app: typeof ECOSYSTEM_APPS[0]) => {
    // Track usage before navigating
    await trackAppUsage({
      appId: app.appId,
      name: app.name,
      url: app.url,
    })
    // Refresh recent apps list
    const updated = await getRecentApps()
    setRecentApps(updated)
    // Open in new tab
    window.open(app.url, '_blank', 'noopener,noreferrer')
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
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="lg" onClick={() => router.push('/settings')} aria-label="Settings">
              <Settings className="w-6 h-6" />
            </Button>
            <Button variant="ghost" size="lg" onClick={handleLogout} aria-label="Sign out">
              <LogOut className="w-6 h-6" />
            </Button>
          </div>
        </header>

        <Card>
          <CardContent className="flex flex-col items-center space-y-4 py-8">
            <Avatar
              name={identity.displayName}
              src={identity.avatar}
              walletAddress={identity.address}
              size="lg"
            />
            <div className="text-center space-y-1">
              {isEditing ? (
                <div className="space-y-2">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink text-base">@</span>
                    <Input
                      ref={inputRef}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                      onKeyDown={handleEditKeyDown}
                      className="pl-8 pr-10 text-center"
                      maxLength={30}
                      disabled={isSaving}
                    />
                    <button
                      onClick={handleCancelEdit}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {editError && (
                    <p className="text-xs text-red-500">{editError}</p>
                  )}
                  <Button
                    size="sm"
                    onClick={handleSaveEdit}
                    disabled={isSaving || !editValue}
                    className="w-full"
                  >
                    {isSaving ? <Spinner className="w-4 h-4" /> : 'Save'}
                  </Button>
                </div>
              ) : (
                <button
                  onClick={handleStartEdit}
                  className="group inline-flex items-center gap-2 text-xl font-serif text-ink hover:text-accent-brown transition-colors"
                >
                  <span>@{identity.displayName}</span>
                  <Pencil className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              )}
              {/* ENS Name - resolvable via CCIP-Read */}
              <button
                onClick={handleCopyEnsName}
                className="inline-flex items-center gap-1.5 text-sm text-accent-green hover:text-accent-brown transition-colors"
                title="Your ENS-compatible name - click to copy"
              >
                <Globe className="w-4 h-4" />
                <span>{identity.displayName}.villa.cash</span>
                {ensNameCopied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4 opacity-60" />
                )}
              </button>
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

        {/* Ecosystem Apps */}
        <Card>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-ink-muted" />
                <span className="font-medium text-ink">Ecosystem</span>
              </div>
            </div>

            {/* Recent Apps (if any) */}
            {recentApps.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs text-ink-muted uppercase tracking-wide">Recent</span>
                <div className="space-y-1">
                  {recentApps.slice(0, 3).map((app) => (
                    <button
                      key={app.appId}
                      onClick={() => handleVisitApp({ appId: app.appId, name: app.name, url: app.url, description: '' })}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-cream-100 transition-colors text-left"
                    >
                      <span className="text-sm text-ink">{app.name}</span>
                      <ExternalLink className="w-4 h-4 text-ink-muted" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Featured Apps */}
            <div className="space-y-2">
              <span className="text-xs text-ink-muted uppercase tracking-wide">
                {recentApps.length > 0 ? 'All Apps' : 'Apps'}
              </span>
              <div className="space-y-1">
                {ECOSYSTEM_APPS.map((app) => (
                  <button
                    key={app.appId}
                    onClick={() => handleVisitApp(app)}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-cream-100 transition-colors text-left"
                  >
                    <div>
                      <span className="text-sm text-ink">{app.name}</span>
                      <p className="text-xs text-ink-muted">{app.description}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-ink-muted" />
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="pt-4 space-y-2">
          <Button
            variant="secondary"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-2" />
            Switch Account
          </Button>
          <p className="text-xs text-ink-muted text-center">
            Your passkey stays active for quick sign-in
          </p>
        </div>
      </div>
    </main>
  )
}
