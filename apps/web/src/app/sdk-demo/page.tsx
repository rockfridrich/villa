'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { VillaAuth } from '@/components/sdk/VillaAuth'
import { ProfileSettings } from '@/components/sdk/ProfileSettings'
import { AvatarPreview } from '@/components/sdk/AvatarPreview'
import type { AvatarConfig } from '@/types'
import {
  Code,
  Copy,
  CheckCircle2,
  User,
  Search,
  Settings,
  LogOut,
  Terminal,
  Fingerprint,
  Trash2,
  Globe,
  ExternalLink,
} from 'lucide-react'

interface LogEntry {
  id: number
  timestamp: Date
  method: string
  args?: unknown
  result?: unknown
  error?: string
  duration?: number
}

interface UserProfile {
  address: string
  nickname: string
  displayName: string
  avatar: AvatarConfig
  ensName: string // nickname.villa.cash
}

/**
 * SDK Demo Page - Complete Integration Guide
 *
 * Shows the full Villa SDK flow:
 * 1. Authentication (VillaAuth popup)
 * 2. Query user data
 * 3. ENS resolution (nickname.villa.cash)
 * 4. Profile settings (edit avatar/name)
 * 5. Logout
 */
export default function SDKDemoPage() {
  // User state
  const [user, setUser] = useState<UserProfile | null>(null)
  const [showAuth, setShowAuth] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // Query state
  const [queryInput, setQueryInput] = useState('')
  const [queryResult, setQueryResult] = useState<UserProfile | null>(null)
  const [ensInput, setEnsInput] = useState('')
  const [ensResult, setEnsResult] = useState<{ address: string; nickname: string } | null>(null)

  // UI state
  const [activeSection, setActiveSection] = useState<'auth' | 'query' | 'ens' | 'settings'>('auth')
  const [copiedLog, setCopiedLog] = useState<number | null>(null)

  // Logs
  const [logs, setLogs] = useState<LogEntry[]>([])
  const logIdRef = useRef(0)
  const logsEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  // Add log
  const addLog = useCallback((entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
    const newLog: LogEntry = {
      ...entry,
      id: logIdRef.current++,
      timestamp: new Date(),
    }
    setLogs(prev => [...prev, newLog])
    return newLog.id
  }, [])

  // Update log
  const updateLog = useCallback((id: number, updates: Partial<LogEntry>) => {
    setLogs(prev => prev.map(log => log.id === id ? { ...log, ...updates } : log))
  }, [])

  // Clear logs
  const clearLogs = useCallback(() => {
    setLogs([])
    logIdRef.current = 0
  }, [])

  // Handle VillaAuth complete
  const handleAuthComplete = useCallback((result: {
    success: boolean
    identity?: { address: string; nickname: string; avatar: AvatarConfig }
    error?: string
  }) => {
    const logId = addLog({
      method: 'VillaAuth.onComplete',
      args: { type: result.success ? 'success' : 'error' },
    })

    if (result.success && result.identity) {
      const profile: UserProfile = {
        address: result.identity.address,
        nickname: result.identity.nickname,
        displayName: result.identity.nickname,
        avatar: result.identity.avatar,
        ensName: `${result.identity.nickname}.villa.cash`,
      }
      setUser(profile)
      updateLog(logId, {
        result: {
          address: profile.address,
          nickname: profile.nickname,
          ensName: profile.ensName,
        },
        duration: 0,
      })
    } else {
      updateLog(logId, { error: result.error || 'Authentication failed' })
    }
    setShowAuth(false)
  }, [addLog, updateLog])

  // Handle logout
  const handleLogout = useCallback(() => {
    const logId = addLog({ method: 'villa.logout()' })
    setUser(null)
    setQueryResult(null)
    updateLog(logId, { result: { success: true }, duration: 50 })
  }, [addLog, updateLog])

  // Query user by nickname
  const handleQueryUser = useCallback(async () => {
    if (!queryInput.trim()) return

    const startTime = Date.now()
    const logId = addLog({
      method: 'villa.getProfile(nickname)',
      args: { nickname: queryInput },
    })

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))

    // Mock response - in real app this queries the database
    const mockAddress = `0x${queryInput.toLowerCase().split('').map(c => c.charCodeAt(0).toString(16)).join('').slice(0, 40).padEnd(40, '0')}`

    const result: UserProfile = {
      address: mockAddress,
      nickname: queryInput.toLowerCase(),
      displayName: queryInput,
      avatar: { style: 'avataaars', selection: 'female', variant: 0 },
      ensName: `${queryInput.toLowerCase()}.villa.cash`,
    }

    setQueryResult(result)
    updateLog(logId, {
      result: {
        address: result.address,
        nickname: result.nickname,
        ensName: result.ensName,
      },
      duration: Date.now() - startTime,
    })
  }, [queryInput, addLog, updateLog])

  // ENS Resolution (nickname.villa.cash → address)
  const handleEnsResolve = useCallback(async () => {
    if (!ensInput.trim()) return

    const startTime = Date.now()
    // Parse input - could be "alice" or "alice.villa.cash"
    const nickname = ensInput.replace('.villa.cash', '').toLowerCase()
    const fullEns = `${nickname}.villa.cash`

    const logId = addLog({
      method: 'villa.resolveENS(name)',
      args: { name: fullEns },
    })

    // Simulate DNSSEC-compatible ENS resolution
    await new Promise(resolve => setTimeout(resolve, 600))

    // Mock address from nickname (deterministic for demo)
    const mockAddress = `0x${nickname.split('').map(c => c.charCodeAt(0).toString(16)).join('').slice(0, 40).padEnd(40, '0')}`

    setEnsResult({ address: mockAddress, nickname })
    updateLog(logId, {
      result: {
        name: fullEns,
        address: mockAddress,
        dnssec: true,
      },
      duration: Date.now() - startTime,
    })
  }, [ensInput, addLog, updateLog])

  // Handle profile update
  const handleProfileUpdate = useCallback(async (updates: { displayName?: string; avatar?: AvatarConfig }) => {
    if (!user) return

    const logId = addLog({
      method: 'villa.updateProfile(updates)',
      args: updates,
    })

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300))

    setUser(prev => prev ? {
      ...prev,
      displayName: updates.displayName || prev.displayName,
      avatar: updates.avatar || prev.avatar,
    } : null)

    updateLog(logId, { result: { success: true }, duration: 300 })
  }, [user, addLog, updateLog])

  // Copy log
  const handleCopyLog = useCallback((log: LogEntry) => {
    const logText = JSON.stringify({
      method: log.method,
      args: log.args,
      result: log.result,
      error: log.error,
      duration: log.duration,
    }, null, 2)
    navigator.clipboard.writeText(logText)
    setCopiedLog(log.id)
    setTimeout(() => setCopiedLog(null), 2000)
  }, [])

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Header */}
      <header className="bg-cream-100 border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-screen-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent-yellow rounded-lg flex items-center justify-center">
                <Fingerprint className="w-6 h-6 text-accent-brown" />
              </div>
              <div>
                <h1 className="text-2xl font-serif text-ink">Villa SDK Demo</h1>
                <p className="text-sm text-ink-muted">Complete Integration Guide</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {user && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900">
                    @{user.nickname}
                  </span>
                </div>
              )}
              <Button size="sm" variant="secondary" onClick={clearLogs}>
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Logs
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-screen-2xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[calc(100vh-180px)]">
          {/* Left: Components */}
          <div className="space-y-6">
            {/* Navigation */}
            <Card>
              <CardHeader>
                <CardTitle>SDK Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'auth', label: '1. Auth', icon: Fingerprint },
                    { id: 'query', label: '2. Query', icon: Search },
                    { id: 'ens', label: '3. ENS', icon: Globe },
                    { id: 'settings', label: '4. Settings', icon: Settings },
                  ].map(section => (
                    <Button
                      key={section.id}
                      size="sm"
                      variant={activeSection === section.id ? 'primary' : 'secondary'}
                      onClick={() => setActiveSection(section.id as typeof activeSection)}
                    >
                      <section.icon className="w-4 h-4 mr-2" />
                      {section.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 1. Authentication */}
            {activeSection === 'auth' && (
              <Card>
                <CardHeader>
                  <CardTitle>Authentication</CardTitle>
                  <p className="text-sm text-ink-muted mt-1">
                    VillaAuth handles passkey → nickname → avatar in one popup
                  </p>
                </CardHeader>
                <CardContent>
                  {user ? (
                    <div className="space-y-4">
                      {/* Current User */}
                      <div className="flex items-center gap-4 p-4 bg-cream-100 rounded-xl">
                        <AvatarPreview
                          walletAddress={user.address}
                          selection={user.avatar.selection}
                          variant={user.avatar.variant}
                          size={64}
                          className="rounded-full"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-ink truncate">{user.displayName}</p>
                          <p className="text-sm text-ink-muted">@{user.nickname}</p>
                          <p className="text-xs text-villa-500 font-mono">{user.ensName}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          variant="secondary"
                          onClick={() => setShowSettings(true)}
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Edit Profile
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={handleLogout}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Logout
                        </Button>
                      </div>

                      {/* Code Example */}
                      <div className="p-3 bg-neutral-900 rounded-lg">
                        <pre className="text-xs text-green-400 overflow-x-auto">
{`// Logout
await villa.logout()

// Check session
const user = villa.getCurrentUser()
if (!user) redirect('/login')`}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-center py-8">
                        <User className="w-16 h-16 mx-auto mb-4 text-ink-muted opacity-50" />
                        <p className="text-ink-muted mb-4">No active session</p>
                        <Button onClick={() => setShowAuth(true)}>
                          <Fingerprint className="w-4 h-4 mr-2" />
                          Sign In with Villa
                        </Button>
                      </div>

                      {/* Code Example */}
                      <div className="p-3 bg-neutral-900 rounded-lg">
                        <pre className="text-xs text-green-400 overflow-x-auto">
{`import { VillaAuth } from '@villa/sdk'

<VillaAuth
  appName="Your App"
  onComplete={(result) => {
    if (result.success) {
      // result.identity.address
      // result.identity.nickname
      // result.identity.avatar
    }
  }}
/>`}
                        </pre>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 2. Query User Data */}
            {activeSection === 'query' && (
              <Card>
                <CardHeader>
                  <CardTitle>Query User Profile</CardTitle>
                  <p className="text-sm text-ink-muted mt-1">
                    Look up any user by their nickname
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter nickname (e.g., alice)"
                        value={queryInput}
                        onChange={(e) => setQueryInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleQueryUser()}
                      />
                      <Button onClick={handleQueryUser}>
                        <Search className="w-4 h-4 mr-2" />
                        Query
                      </Button>
                    </div>

                    {queryResult && (
                      <div className="p-4 bg-cream-100 rounded-xl space-y-3">
                        <div className="flex items-center gap-3">
                          <AvatarPreview
                            walletAddress={queryResult.address}
                            selection={queryResult.avatar.selection}
                            variant={queryResult.avatar.variant}
                            size={48}
                            className="rounded-full"
                          />
                          <div>
                            <p className="font-medium text-ink">@{queryResult.nickname}</p>
                            <p className="text-xs text-villa-500">{queryResult.ensName}</p>
                          </div>
                        </div>
                        <div className="text-xs font-mono text-ink-muted break-all">
                          {queryResult.address}
                        </div>
                      </div>
                    )}

                    {/* Code Example */}
                    <div className="p-3 bg-neutral-900 rounded-lg">
                      <pre className="text-xs text-green-400 overflow-x-auto">
{`// Query by nickname
const profile = await villa.getProfile('alice')

// Returns:
{
  address: '0x...',
  nickname: 'alice',
  ensName: 'alice.villa.cash',
  avatar: { style, selection, variant }
}`}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 3. ENS Resolution */}
            {activeSection === 'ens' && (
              <Card>
                <CardHeader>
                  <CardTitle>ENS Resolution</CardTitle>
                  <p className="text-sm text-ink-muted mt-1">
                    Resolve nickname.villa.cash → wallet address (DNSSEC compatible)
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="alice or alice.villa.cash"
                        value={ensInput}
                        onChange={(e) => setEnsInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleEnsResolve()}
                      />
                      <Button onClick={handleEnsResolve}>
                        <Globe className="w-4 h-4 mr-2" />
                        Resolve
                      </Button>
                    </div>

                    {ensResult && (
                      <div className="p-4 bg-cream-100 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-ink-muted">ENS Name</span>
                          <span className="font-medium text-villa-600">
                            {ensResult.nickname}.villa.cash
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-ink-muted">Address</span>
                          <span className="font-mono text-xs text-ink truncate max-w-[200px]">
                            {ensResult.address}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-ink-muted">DNSSEC</span>
                          <span className="text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            Verified
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Architecture Note */}
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                      <p className="font-medium mb-1">How it works:</p>
                      <ul className="text-xs space-y-1 list-disc list-inside">
                        <li>Nicknames stored in database with wallet address</li>
                        <li>CCIP-Read resolver for villa.cash subdomain</li>
                        <li>DNSSEC compatible for maximum compatibility</li>
                        <li>Works with any ENS-compatible wallet/app</li>
                      </ul>
                    </div>

                    {/* Code Example */}
                    <div className="p-3 bg-neutral-900 rounded-lg">
                      <pre className="text-xs text-green-400 overflow-x-auto">
{`// Resolve ENS to address
const address = await villa.resolveENS('alice.villa.cash')

// Reverse resolve address to ENS
const ensName = await villa.reverseENS('0x...')
// Returns: 'alice.villa.cash'

// Works with ethers.js too
const address = await provider.resolveName('alice.villa.cash')`}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 4. Profile Settings */}
            {activeSection === 'settings' && (
              <Card>
                <CardHeader>
                  <CardTitle>Profile Settings</CardTitle>
                  <p className="text-sm text-ink-muted mt-1">
                    Edit display name and upload custom avatar
                  </p>
                </CardHeader>
                <CardContent>
                  {user ? (
                    <div className="space-y-4">
                      <ProfileSettings
                        profile={{
                          address: user.address,
                          nickname: user.nickname,
                          displayName: user.displayName,
                          avatar: user.avatar,
                        }}
                        onUpdate={async (updates) => {
                          await handleProfileUpdate(updates as { displayName?: string; avatar?: AvatarConfig })
                        }}
                        asModal={false}
                        allowAvatarUpload={true}
                      />

                      {/* Note */}
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                        <p className="font-medium">Avatar Upload</p>
                        <p className="text-xs mt-1">
                          Custom photo upload is only available in Settings, not during onboarding.
                          Onboarding uses generated avatars for quick setup.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-ink-muted">
                      <Settings className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Sign in to access settings</p>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="mt-4"
                        onClick={() => {
                          setActiveSection('auth')
                          setShowAuth(true)
                        }}
                      >
                        Sign In First
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Logs */}
          <div className="space-y-6">
            <Card className="h-full flex flex-col">
              <CardHeader className="flex-shrink-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Terminal className="w-5 h-5" />
                    API Logs
                  </CardTitle>
                  <span className="text-xs text-ink-muted">
                    {logs.length} calls
                  </span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto space-y-2 pr-2">
                  {logs.length === 0 ? (
                    <div className="text-center py-12 text-ink-muted">
                      <Code className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>API calls will appear here</p>
                    </div>
                  ) : (
                    logs.map(log => (
                      <div
                        key={log.id}
                        className={`p-3 rounded-lg text-sm font-mono ${
                          log.error
                            ? 'bg-red-50 border border-red-200'
                            : 'bg-neutral-100'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={log.error ? 'text-red-600' : 'text-villa-600'}>
                                {log.method}
                              </span>
                              {log.duration !== undefined && (
                                <span className="text-xs text-ink-muted">
                                  {log.duration}ms
                                </span>
                              )}
                            </div>
                            {log.args && (
                              <pre className="text-xs text-ink-muted mt-1 overflow-x-auto">
                                {JSON.stringify(log.args, null, 2)}
                              </pre>
                            )}
                            {log.result && (
                              <pre className="text-xs text-green-600 mt-1 overflow-x-auto">
                                → {JSON.stringify(log.result, null, 2)}
                              </pre>
                            )}
                            {log.error && (
                              <p className="text-xs text-red-600 mt-1">
                                Error: {log.error}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleCopyLog(log)}
                            className="p-1 text-ink-muted hover:text-ink rounded"
                            title="Copy log"
                          >
                            {copiedLog === log.id ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        <div className="text-xs text-ink-muted mt-1">
                          {log.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={logsEndRef} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* VillaAuth Modal */}
      {showAuth && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-cream rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <VillaAuth
              appName="SDK Demo"
              onComplete={handleAuthComplete}
            />
          </div>
        </div>
      )}

      {/* ProfileSettings Modal */}
      {showSettings && user && (
        <ProfileSettings
          profile={{
            address: user.address,
            nickname: user.nickname,
            displayName: user.displayName,
            avatar: user.avatar,
          }}
          onUpdate={async (updates) => {
            await handleProfileUpdate(updates as { displayName?: string; avatar?: AvatarConfig })
          }}
          onClose={() => setShowSettings(false)}
          asModal={true}
          allowAvatarUpload={true}
        />
      )}
    </div>
  )
}
