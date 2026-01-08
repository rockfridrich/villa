'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { VillaAuth } from '@/components/sdk/VillaAuth'
import { VillaAuthScreen } from '@/components/sdk/VillaAuthScreen'
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
  Zap,
  AlertCircle,
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

// Demo configuration
interface DemoConfig {
  useLiveApi: boolean
  simulateErrors: boolean
  errorType: 'network' | 'notFound' | 'rateLimit' | null
  authMode: 'dialog' | 'relay'
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

  // Demo config
  const [demoConfig, setDemoConfig] = useState<DemoConfig>({
    useLiveApi: false,
    simulateErrors: false,
    errorType: null,
    authMode: 'dialog',
  })

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
      args: { nickname: queryInput, liveApi: demoConfig.useLiveApi },
    })

    // Handle error simulation
    if (demoConfig.simulateErrors && demoConfig.errorType) {
      await new Promise(resolve => setTimeout(resolve, 300))
      const errorMessages = {
        network: 'Network request failed',
        notFound: 'User not found',
        rateLimit: 'Rate limit exceeded. Try again later.',
      }
      updateLog(logId, {
        error: errorMessages[demoConfig.errorType],
        duration: Date.now() - startTime,
      })
      setQueryResult(null)
      return
    }

    if (demoConfig.useLiveApi) {
      // Real API call
      try {
        const response = await fetch(`/api/nicknames/resolve/${queryInput.toLowerCase()}`)
        const data = await response.json()

        if (!response.ok) {
          updateLog(logId, {
            error: data.error || `HTTP ${response.status}`,
            duration: Date.now() - startTime,
          })
          setQueryResult(null)
          return
        }

        // Fetch full profile for avatar data
        const profileResponse = await fetch(`/api/profile/${data.address}`)
        const profileData = profileResponse.ok ? await profileResponse.json() : null

        const result: UserProfile = {
          address: data.address,
          nickname: data.nickname,
          displayName: profileData?.displayName || data.nickname,
          avatar: profileData?.avatar || { style: 'avataaars', selection: 'female', variant: 0 },
          ensName: `${data.nickname}.villa.cash`,
        }

        setQueryResult(result)
        updateLog(logId, {
          result: {
            address: result.address,
            nickname: result.nickname,
            ensName: result.ensName,
            source: 'live_api',
          },
          duration: Date.now() - startTime,
        })
      } catch (error) {
        updateLog(logId, {
          error: error instanceof Error ? error.message : 'Network error',
          duration: Date.now() - startTime,
        })
        setQueryResult(null)
      }
    } else {
      // Mock response
      await new Promise(resolve => setTimeout(resolve, 500))

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
          source: 'mock',
        },
        duration: Date.now() - startTime,
      })
    }
  }, [queryInput, addLog, updateLog, demoConfig])

  // ENS Resolution (nickname.villa.cash → address)
  const handleEnsResolve = useCallback(async () => {
    if (!ensInput.trim()) return

    const startTime = Date.now()
    // Parse input - could be "alice" or "alice.villa.cash"
    const nickname = ensInput.replace('.villa.cash', '').toLowerCase()
    const fullEns = `${nickname}.villa.cash`

    const logId = addLog({
      method: 'villa.resolveENS(name)',
      args: { name: fullEns, liveApi: demoConfig.useLiveApi },
    })

    // Handle error simulation
    if (demoConfig.simulateErrors && demoConfig.errorType) {
      await new Promise(resolve => setTimeout(resolve, 300))
      const errorMessages = {
        network: 'Network request failed',
        notFound: 'ENS name not found',
        rateLimit: 'Rate limit exceeded. Try again later.',
      }
      updateLog(logId, {
        error: errorMessages[demoConfig.errorType],
        duration: Date.now() - startTime,
      })
      setEnsResult(null)
      return
    }

    if (demoConfig.useLiveApi) {
      // Real API call
      try {
        const response = await fetch(`/api/nicknames/resolve/${nickname}`)
        const data = await response.json()

        if (!response.ok) {
          updateLog(logId, {
            error: data.error || `HTTP ${response.status}`,
            duration: Date.now() - startTime,
          })
          setEnsResult(null)
          return
        }

        setEnsResult({ address: data.address, nickname: data.nickname })
        updateLog(logId, {
          result: {
            name: fullEns,
            address: data.address,
            dnssec: true,
            source: 'live_api',
          },
          duration: Date.now() - startTime,
        })
      } catch (error) {
        updateLog(logId, {
          error: error instanceof Error ? error.message : 'Network error',
          duration: Date.now() - startTime,
        })
        setEnsResult(null)
      }
    } else {
      // Mock response
      await new Promise(resolve => setTimeout(resolve, 600))

      const mockAddress = `0x${nickname.split('').map(c => c.charCodeAt(0).toString(16)).join('').slice(0, 40).padEnd(40, '0')}`

      setEnsResult({ address: mockAddress, nickname })
      updateLog(logId, {
        result: {
          name: fullEns,
          address: mockAddress,
          dnssec: true,
          source: 'mock',
        },
        duration: Date.now() - startTime,
      })
    }
  }, [ensInput, addLog, updateLog, demoConfig])

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
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent-yellow rounded-lg flex items-center justify-center">
                <Fingerprint className="w-6 h-6 sm:w-7 sm:h-7 text-accent-brown" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-serif text-ink">Villa SDK Demo</h1>
                <p className="text-xs sm:text-sm text-ink-muted">Third-Party Integration Guide</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto flex-wrap">
              {/* Auth Mode Toggle */}
              <button
                onClick={() => setDemoConfig(prev => ({
                  ...prev,
                  authMode: prev.authMode === 'dialog' ? 'relay' : 'dialog'
                }))}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg min-h-[44px] transition-colors ${
                  demoConfig.authMode === 'relay'
                    ? 'bg-accent-yellow/20 text-accent-brown border-2 border-accent-yellow'
                    : 'bg-neutral-100 text-ink-muted border-2 border-transparent'
                }`}
                title={demoConfig.authMode === 'relay' ? 'Relay mode (VillaAuthScreen)' : 'Dialog mode (VillaAuth)'}
              >
                <Fingerprint className={`w-4 h-4 ${demoConfig.authMode === 'relay' ? 'text-accent-brown' : 'text-ink-muted'}`} />
                <span className="text-sm font-medium">
                  {demoConfig.authMode === 'relay' ? 'Relay' : 'Dialog'}
                </span>
              </button>

              {/* Live API Toggle */}
              <button
                onClick={() => setDemoConfig(prev => ({ ...prev, useLiveApi: !prev.useLiveApi }))}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg min-h-[44px] transition-colors ${
                  demoConfig.useLiveApi
                    ? 'bg-accent-green/20 text-accent-green border-2 border-accent-green'
                    : 'bg-neutral-100 text-ink-muted border-2 border-transparent'
                }`}
                title={demoConfig.useLiveApi ? 'Using live API (beta.villa.cash)' : 'Using mock data'}
              >
                <Zap className={`w-4 h-4 ${demoConfig.useLiveApi ? 'text-accent-green' : 'text-ink-muted'}`} />
                <span className="text-sm font-medium">
                  {demoConfig.useLiveApi ? 'Live' : 'Mock'}
                </span>
              </button>

              {/* Error Simulation */}
              <div className="relative">
                <button
                  onClick={() => setDemoConfig(prev => ({
                    ...prev,
                    simulateErrors: !prev.simulateErrors,
                    errorType: !prev.simulateErrors ? 'network' : null,
                  }))}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg min-h-[44px] transition-colors ${
                    demoConfig.simulateErrors
                      ? 'bg-red-100 text-red-600 border-2 border-red-300'
                      : 'bg-neutral-100 text-ink-muted border-2 border-transparent'
                  }`}
                  title="Simulate API errors"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium hidden sm:inline">
                    {demoConfig.simulateErrors ? 'Errors On' : 'Errors'}
                  </span>
                </button>
                {demoConfig.simulateErrors && (
                  <select
                    value={demoConfig.errorType || 'network'}
                    onChange={(e) => setDemoConfig(prev => ({
                      ...prev,
                      errorType: e.target.value as DemoConfig['errorType'],
                    }))}
                    className="absolute top-full mt-1 right-0 text-xs bg-white border rounded-lg p-1 shadow-lg z-10"
                  >
                    <option value="network">Network Error</option>
                    <option value="notFound">Not Found</option>
                    <option value="rateLimit">Rate Limit</option>
                  </select>
                )}
              </div>

              {user && (
                <div className="flex items-center gap-2 px-3 py-2 bg-green-100 rounded-lg min-h-[44px]">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900">
                    @{user.nickname}
                  </span>
                </div>
              )}
              <Button
                size="sm"
                variant="secondary"
                onClick={clearLogs}
                className="min-h-[44px] min-w-[44px]"
              >
                <Trash2 className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Clear Logs</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-screen-2xl mx-auto p-4 sm:p-6">
        {/* Integration Guide Banner */}
        <div className="mb-6 p-6 bg-gradient-to-br from-accent-yellow/20 to-accent-green/10 rounded-xl border-2 border-accent-yellow/50">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-accent-yellow rounded-lg flex items-center justify-center flex-shrink-0">
              <Code className="w-6 h-6 text-accent-brown" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-serif text-ink mb-2">Integration Guide</h2>
              <p className="text-sm text-ink-muted mb-4">
                This demo showcases Villa SDK authentication for third-party apps.
                Test the complete flow from authentication to profile management.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-ink-muted">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent-green" />
                  <span>Passkey authentication</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent-green" />
                  <span>Nickname lookup</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent-green" />
                  <span>ENS resolution</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent-green" />
                  <span>Profile management</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[calc(100vh-180px)]">
          {/* Left: Components */}
          <div className="space-y-6">
            {/* Navigation */}
            <Card>
              <CardHeader>
                <CardTitle>SDK Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
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
                      className="min-h-[44px] justify-center"
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
                    {demoConfig.authMode === 'dialog'
                      ? 'VillaAuth: Popup dialog for quick integration'
                      : 'VillaAuthScreen: Full-screen relay mode for custom UI'}
                  </p>
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                    <strong>Current mode:</strong> {demoConfig.authMode === 'dialog' ? 'Dialog' : 'Relay'} —
                    Toggle in the header to compare both auth flows
                  </div>
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Button
                          variant="secondary"
                          onClick={() => setShowSettings(true)}
                          className="min-h-[44px]"
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Edit Profile
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={handleLogout}
                          className="text-red-600 hover:bg-red-50 min-h-[44px]"
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Sign Out Demo
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
                        <p className="text-sm text-ink-muted mb-2">No active session</p>
                        <p className="text-xs text-ink-muted mb-4">
                          Try the authentication flow with Villa passkeys
                        </p>
                        <Button
                          onClick={() => setShowAuth(true)}
                          size="lg"
                          className="min-h-[44px]"
                        >
                          <Fingerprint className="w-4 h-4 mr-2" />
                          Try It: Sign In with Villa
                        </Button>
                      </div>

                      {/* Code Example */}
                      <div className="relative">
                        <div className="absolute top-2 right-2 z-10">
                          <button
                            onClick={() => {
                              const dialogCode = `import { VillaAuth } from '@villa/sdk'

<VillaAuth
  appName="Your App"
  onComplete={(result) => {
    if (result.success) {
      // result.identity.address
      // result.identity.nickname
      // result.identity.avatar
    }
  }}
/>`
                              const relayCode = `import { VillaAuthScreen } from '@villa/sdk'

<VillaAuthScreen
  onSuccess={(address) => {
    // User authenticated
    console.log('Address:', address)
  }}
  onCancel={() => {
    // User cancelled
  }}
/>`
                              navigator.clipboard.writeText(demoConfig.authMode === 'dialog' ? dialogCode : relayCode)
                              setCopiedLog(-1)
                              setTimeout(() => setCopiedLog(null), 2000)
                            }}
                            className="p-2 rounded bg-neutral-800 hover:bg-neutral-700 transition-colors min-h-[44px] min-w-[44px]"
                            title="Copy code"
                          >
                            {copiedLog === -1 ? (
                              <CheckCircle2 className="w-4 h-4 text-green-400" />
                            ) : (
                              <Copy className="w-4 h-4 text-neutral-400" />
                            )}
                          </button>
                        </div>
                        <div className="p-3 bg-neutral-900 rounded-lg">
                          <pre className="text-xs text-green-400 overflow-x-auto">
{demoConfig.authMode === 'dialog' ? `import { VillaAuth } from '@villa/sdk'

<VillaAuth
  appName="Your App"
  onComplete={(result) => {
    if (result.success) {
      // result.identity.address
      // result.identity.nickname
      // result.identity.avatar
    }
  }}
/>` : `import { VillaAuthScreen } from '@villa/sdk'

<VillaAuthScreen
  onSuccess={(address) => {
    // User authenticated
    console.log('Address:', address)
  }}
  onCancel={() => {
    // User cancelled
  }}
/>`}
                          </pre>
                        </div>
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
                        className="min-h-[44px]"
                      />
                      <Button
                        onClick={handleQueryUser}
                        className="min-h-[44px] min-w-[44px]"
                      >
                        <Search className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Query</span>
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
                        className="min-h-[44px]"
                      />
                      <Button
                        onClick={handleEnsResolve}
                        className="min-h-[44px] min-w-[44px]"
                      >
                        <Globe className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Resolve</span>
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
                      <p className="text-sm mb-4">Sign in to access profile settings</p>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="mt-4 min-h-[44px]"
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
            <Card className="h-full flex flex-col lg:max-h-[calc(100vh-200px)]">
              <CardHeader className="flex-shrink-0 bg-neutral-900 text-white rounded-t-lg">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Terminal className="w-5 h-5" />
                    API Logs
                  </CardTitle>
                  <span className="text-xs text-neutral-400">
                    {logs.length} {logs.length === 1 ? 'call' : 'calls'}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden bg-neutral-50">
                <div className="h-full overflow-y-auto space-y-2 pr-2 py-2">
                  {logs.length === 0 ? (
                    <div className="text-center py-12 text-ink-muted">
                      <Code className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">API calls will appear here</p>
                      <p className="text-xs mt-2">Try authenticating or querying a user</p>
                    </div>
                  ) : (
                    logs.map(log => (
                      <div
                        key={log.id}
                        className={`p-3 rounded-lg text-sm font-mono transition-all ${
                          log.error
                            ? 'bg-red-50 border-2 border-red-300'
                            : 'bg-white border border-neutral-200 hover:border-accent-yellow'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-semibold ${log.error ? 'text-red-600' : 'text-accent-brown'}`}>
                                {log.method}
                              </span>
                              {log.duration !== undefined && (
                                <span className="text-xs px-2 py-0.5 bg-accent-yellow/20 text-accent-brown rounded">
                                  {log.duration}ms
                                </span>
                              )}
                            </div>
                            {log.args !== undefined && (
                              <pre className="text-xs text-ink-muted mt-2 overflow-x-auto bg-neutral-100 p-2 rounded">
                                {JSON.stringify(log.args, null, 2)}
                              </pre>
                            )}
                            {log.result !== undefined && (
                              <pre className="text-xs text-accent-green mt-2 overflow-x-auto bg-green-50 p-2 rounded">
                                → {JSON.stringify(log.result, null, 2)}
                              </pre>
                            )}
                            {log.error && (
                              <div className="mt-2 p-2 bg-red-100 rounded">
                                <p className="text-xs text-red-600 font-semibold">
                                  Error: {log.error}
                                </p>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handleCopyLog(log)}
                            className="p-2 text-ink-muted hover:text-ink rounded hover:bg-neutral-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                            title="Copy log"
                          >
                            {copiedLog === log.id ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        <div className="text-xs text-ink-muted mt-2 flex items-center gap-2">
                          <span className="w-2 h-2 bg-accent-yellow rounded-full"></span>
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

      {/* VillaAuth Modal - Dialog Mode */}
      {showAuth && demoConfig.authMode === 'dialog' && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAuth(false)
            }
          }}
        >
          <div className="bg-cream rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <VillaAuth
              appName="SDK Demo"
              onComplete={handleAuthComplete}
            />
          </div>
        </div>
      )}

      {/* VillaAuthScreen - Relay Mode */}
      {showAuth && demoConfig.authMode === 'relay' && (
        <div className="fixed inset-0 z-50">
          <VillaAuthScreen
            onSuccess={(address) => {
              const logId = addLog({
                method: 'VillaAuthScreen.onSuccess',
                args: { address },
              })
              // For demo purposes, create a mock profile
              const mockNickname = `user${address.slice(2, 8)}`
              const profile: UserProfile = {
                address,
                nickname: mockNickname,
                displayName: mockNickname,
                avatar: { style: 'avataaars', selection: 'female', variant: 0 },
                ensName: `${mockNickname}.villa.cash`,
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
              setShowAuth(false)
            }}
            onCancel={() => {
              addLog({
                method: 'VillaAuthScreen.onCancel',
              })
              setShowAuth(false)
            }}
          />
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
