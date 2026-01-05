'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { NicknameSelection } from '@/components/sdk/NicknameSelection'
import { AvatarSelection } from '@/components/sdk/AvatarSelection'
import { SignInWelcome } from '@/components/sdk/SignInWelcome'
import { checkNickname } from '@/lib/nickname'
import type { AvatarConfig, VillaIdentity } from '@/types'
import {
  Code,
  Copy,
  CheckCircle2,
  User,
  Image as ImageIcon,
  Globe,
  Settings,
  LogOut,
  Terminal,
  Fingerprint,
  Trash2,
  RefreshCw,
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

/**
 * SDK Demo Page
 *
 * Interactive showcase of all Villa SDK functions with real-time logs.
 * Split view: Components (left) | Code/Logs (right)
 *
 * Note: This demo uses simulated SDK calls to demonstrate functionality
 * without requiring full authentication flow.
 */
export default function SDKDemoPage() {
  // Mock SDK config
  const [sdkConfig] = useState({
    appId: 'villa-sdk-demo',
    network: 'base-sepolia' as const,
    apiUrl: 'https://api.villa.cash',
  })

  // Authentication state
  const [identity, setIdentity] = useState<VillaIdentity | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingAction, setLoadingAction] = useState<'signin' | 'create' | null>(null)

  // UI state
  const [activeSection, setActiveSection] = useState<'welcome' | 'nickname' | 'avatar' | 'ens' | 'config'>('welcome')
  const [ensInput, setEnsInput] = useState('')
  const [addressInput, setAddressInput] = useState('')
  const [ensResult, setEnsResult] = useState<string | null>(null)
  const [reverseEnsResult, setReverseEnsResult] = useState<string | null>(null)
  const [copiedLog, setCopiedLog] = useState<number | null>(null)

  // Logs
  const [logs, setLogs] = useState<LogEntry[]>([])
  const logIdRef = useRef(0)
  const logsEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll logs to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  // Add log entry
  const addLog = useCallback((entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
    const newLog: LogEntry = {
      ...entry,
      id: logIdRef.current++,
      timestamp: new Date(),
    }
    setLogs(prev => [...prev, newLog])
    return newLog.id
  }, [])

  // Update log entry (for duration tracking)
  const updateLog = useCallback((id: number, updates: Partial<LogEntry>) => {
    setLogs(prev => prev.map(log => log.id === id ? { ...log, ...updates } : log))
  }, [])

  // Clear logs
  const clearLogs = useCallback(() => {
    setLogs([])
    logIdRef.current = 0
  }, [])

  // Mock Sign In
  const handleSignIn = useCallback(async () => {
    setIsLoading(true)
    setLoadingAction('signin')
    const startTime = Date.now()
    const logId = addLog({ method: 'villa.signIn()', args: { scopes: ['profile'] } })

    try {
      // Simulate authentication delay
      await new Promise(resolve => setTimeout(resolve, 1500))

      const mockIdentity: VillaIdentity = {
        walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8',
        nickname: 'demo_user',
        avatar: {
          style: 'avataaars',
          selection: 'male',
          variant: 0,
        },
        isNewUser: false,
      }

      const duration = Date.now() - startTime

      setIdentity(mockIdentity)
      updateLog(logId, { result: mockIdentity, duration })
      setActiveSection('config')
    } catch (error) {
      const duration = Date.now() - startTime
      updateLog(logId, {
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      })
    } finally {
      setIsLoading(false)
      setLoadingAction(null)
    }
  }, [addLog, updateLog])

  // Mock Create Account
  const handleCreateAccount = useCallback(async () => {
    setIsLoading(true)
    setLoadingAction('create')
    const startTime = Date.now()
    const logId = addLog({ method: 'villa.signIn()', args: { scopes: ['profile'], note: 'Creating new account' } })

    try {
      // Simulate authentication delay
      await new Promise(resolve => setTimeout(resolve, 2000))

      const mockIdentity: VillaIdentity = {
        walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8',
        nickname: null,
        avatar: null,
        isNewUser: true,
      }

      const duration = Date.now() - startTime

      setIdentity(mockIdentity)
      updateLog(logId, { result: mockIdentity, duration })
      setActiveSection('nickname')
    } catch (error) {
      const duration = Date.now() - startTime
      updateLog(logId, {
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      })
    } finally {
      setIsLoading(false)
      setLoadingAction(null)
    }
  }, [addLog, updateLog])

  // Sign Out
  const handleSignOut = useCallback(async () => {
    const startTime = Date.now()
    const logId = addLog({ method: 'villa.signOut()' })

    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      const duration = Date.now() - startTime

      setIdentity(null)
      updateLog(logId, { result: 'Signed out successfully', duration })
      setActiveSection('welcome')
    } catch (error) {
      const duration = Date.now() - startTime
      updateLog(logId, {
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      })
    }
  }, [addLog, updateLog])

  // Claim Nickname
  const handleClaimNickname = useCallback(async (nickname: string) => {
    const startTime = Date.now()
    const logId = addLog({ method: 'onClaim(nickname)', args: { nickname } })

    try {
      await new Promise(resolve => setTimeout(resolve, 1000))

      const duration = Date.now() - startTime
      updateLog(logId, {
        result: { success: true, nickname },
        duration,
      })

      // Update identity with nickname
      if (identity) {
        setIdentity({ ...identity, nickname })
      }

      setActiveSection('avatar')
    } catch (error) {
      const duration = Date.now() - startTime
      updateLog(logId, {
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      })
    }
  }, [addLog, updateLog, identity])

  // Avatar Selected
  const handleAvatarSelected = useCallback((config: AvatarConfig) => {
    addLog({
      method: 'onSelect(avatarConfig)',
      args: config,
      result: 'Avatar configuration saved',
    })

    // Update identity with avatar
    if (identity) {
      setIdentity({ ...identity, avatar: config })
    }

    setActiveSection('config')
  }, [addLog, identity])

  // Mock Resolve ENS
  const handleResolveEns = useCallback(async () => {
    if (!ensInput.trim()) return

    const startTime = Date.now()
    const logId = addLog({ method: 'villa.resolveEns(name)', args: { name: ensInput } })

    try {
      await new Promise(resolve => setTimeout(resolve, 800))

      // Mock ENS resolution (vitalik.eth example)
      const address = ensInput.toLowerCase() === 'vitalik.eth'
        ? '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
        : null

      const duration = Date.now() - startTime

      setEnsResult(address)
      updateLog(logId, { result: { address: address || 'Not found' }, duration })
    } catch (error) {
      const duration = Date.now() - startTime
      updateLog(logId, {
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      })
    }
  }, [ensInput, addLog, updateLog])

  // Mock Reverse ENS
  const handleReverseEns = useCallback(async () => {
    if (!addressInput.trim()) return

    const startTime = Date.now()
    const logId = addLog({ method: 'villa.reverseEns(address)', args: { address: addressInput } })

    try {
      await new Promise(resolve => setTimeout(resolve, 800))

      // Mock reverse ENS lookup
      const name = addressInput.toLowerCase() === '0xd8da6bf26964af9d7eed9e03e53415d37aa96045'
        ? 'vitalik.eth'
        : null

      const duration = Date.now() - startTime

      setReverseEnsResult(name)
      updateLog(logId, { result: { name: name || 'Not found' }, duration })
    } catch (error) {
      const duration = Date.now() - startTime
      updateLog(logId, {
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      })
    }
  }, [addressInput, addLog, updateLog])

  // Get Avatar URL
  const handleGetAvatarUrl = useCallback(() => {
    if (!identity) return

    const startTime = Date.now()
    const logId = addLog({
      method: 'villa.getAvatarUrl(seed, config)',
      args: {
        seed: identity.walletAddress,
        config: identity.avatar,
      },
    })

    try {
      // Mock avatar URL generation
      const url = `https://api.dicebear.com/9.x/avataaars/svg?seed=${identity.walletAddress}`
      const duration = Date.now() - startTime

      updateLog(logId, { result: { url }, duration })
    } catch (error) {
      const duration = Date.now() - startTime
      updateLog(logId, {
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      })
    }
  }, [identity, addLog, updateLog])

  // Copy log to clipboard
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

  // Check if authenticated
  const isAuthenticated = identity !== null

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
                <p className="text-sm text-ink-muted">Interactive API Playground</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isAuthenticated && identity.nickname && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900">
                    @{identity.nickname}
                  </span>
                </div>
              )}
              <Button
                size="sm"
                variant="secondary"
                onClick={clearLogs}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Logs
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Split View */}
      <div className="max-w-screen-2xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[calc(100vh-180px)]">
          {/* Left: Components */}
          <div className="space-y-6">
            {/* Navigation */}
            <Card>
              <CardHeader>
                <CardTitle>Sections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'welcome', label: 'Authentication', icon: Fingerprint },
                    { id: 'nickname', label: 'Nickname', icon: User },
                    { id: 'avatar', label: 'Avatar', icon: ImageIcon },
                    { id: 'ens', label: 'ENS', icon: Globe },
                    { id: 'config', label: 'Config', icon: Settings },
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

            {/* Welcome / Authentication */}
            {activeSection === 'welcome' && (
              <Card>
                <CardHeader>
                  <CardTitle>Authentication</CardTitle>
                  <p className="text-sm text-ink-muted mt-1">
                    Sign in with passkey or create new Villa ID
                  </p>
                </CardHeader>
                <CardContent>
                  {!isAuthenticated ? (
                    <SignInWelcome
                      onSignIn={handleSignIn}
                      onCreateAccount={handleCreateAccount}
                      isLoading={isLoading}
                      loadingAction={loadingAction || undefined}
                    />
                  ) : (
                    <div className="space-y-4 text-center py-8">
                      <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-10 h-10 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-serif text-ink">Signed In</h3>
                        <p className="text-ink-muted mt-1">@{identity.nickname || 'new_user'}</p>
                        <p className="text-xs text-ink-muted mt-1 font-mono">
                          {identity.walletAddress.slice(0, 6)}...{identity.walletAddress.slice(-4)}
                        </p>
                      </div>
                      <Button
                        size="lg"
                        variant="secondary"
                        onClick={handleSignOut}
                        className="w-full"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Nickname Selection */}
            {activeSection === 'nickname' && (
              <Card>
                <CardHeader>
                  <CardTitle>Nickname Selection</CardTitle>
                  <p className="text-sm text-ink-muted mt-1">
                    Choose a unique handle with real-time availability check
                  </p>
                </CardHeader>
                <CardContent>
                  {isAuthenticated ? (
                    <NicknameSelection
                      onClaim={handleClaimNickname}
                      checkAvailability={async (nickname) => {
                        const result = await checkNickname(nickname)
                        return {
                          available: result.available,
                          suggestion: result.available ? undefined : `${nickname}${Math.floor(Math.random() * 100)}`,
                        }
                      }}
                    />
                  ) : (
                    <div className="text-center py-8 text-ink-muted">
                      <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Sign in to claim a nickname</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Avatar Selection */}
            {activeSection === 'avatar' && (
              <Card>
                <CardHeader>
                  <CardTitle>Avatar Selection</CardTitle>
                  <p className="text-sm text-ink-muted mt-1">
                    Choose your profile picture style
                  </p>
                </CardHeader>
                <CardContent>
                  {isAuthenticated ? (
                    <AvatarSelection
                      walletAddress={identity.walletAddress}
                      onSelect={handleAvatarSelected}
                      timerDuration={30}
                    />
                  ) : (
                    <div className="text-center py-8 text-ink-muted">
                      <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Sign in to select an avatar</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ENS Resolution */}
            {activeSection === 'ens' && (
              <Card>
                <CardHeader>
                  <CardTitle>ENS Resolution</CardTitle>
                  <p className="text-sm text-ink-muted mt-1">
                    Resolve ENS names and reverse lookups
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Forward Resolution */}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-ink">
                        Resolve ENS → Address
                      </label>
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          placeholder="vitalik.eth"
                          value={ensInput}
                          onChange={(e) => setEnsInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleResolveEns()}
                        />
                        <Button onClick={handleResolveEns}>
                          <Globe className="w-4 h-4 mr-2" />
                          Resolve
                        </Button>
                      </div>
                      {ensResult !== null && (
                        <div className="p-3 bg-cream-100 rounded-lg">
                          <p className="text-xs text-ink-muted mb-1">Result:</p>
                          <p className="font-mono text-sm text-ink break-all">
                            {ensResult || 'Not found'}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Reverse Resolution */}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-ink">
                        Reverse ENS → Name
                      </label>
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          placeholder="0x..."
                          value={addressInput}
                          onChange={(e) => setAddressInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleReverseEns()}
                        />
                        <Button onClick={handleReverseEns}>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Reverse
                        </Button>
                      </div>
                      {reverseEnsResult !== null && (
                        <div className="p-3 bg-cream-100 rounded-lg">
                          <p className="text-xs text-ink-muted mb-1">Result:</p>
                          <p className="font-mono text-sm text-ink break-all">
                            {reverseEnsResult || 'Not found'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Config & Session */}
            {activeSection === 'config' && (
              <div className="space-y-6">
                {/* Session Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Current Session</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isAuthenticated ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-ink-muted">Nickname</p>
                            <p className="font-medium text-ink">@{identity.nickname || 'new_user'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-ink-muted">Address</p>
                            <p className="font-mono text-sm text-ink">
                              {identity.walletAddress.slice(0, 6)}...{identity.walletAddress.slice(-4)}
                            </p>
                          </div>
                        </div>
                        <div className="pt-3 border-t border-neutral-200">
                          <p className="text-xs text-ink-muted mb-2">Avatar</p>
                          <div className="flex items-center gap-3">
                            <img
                              src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${identity.walletAddress}`}
                              alt={identity.nickname || 'avatar'}
                              className="w-12 h-12 rounded-full"
                            />
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={handleGetAvatarUrl}
                            >
                              Log Avatar URL
                            </Button>
                          </div>
                        </div>
                        <div className="pt-3 border-t border-neutral-200">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={handleSignOut}
                            className="w-full"
                          >
                            <LogOut className="w-4 h-4 mr-2" />
                            Sign Out
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-ink-muted">
                        <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No active session</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* SDK Config */}
                <Card>
                  <CardHeader>
                    <CardTitle>SDK Configuration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-ink-muted">App ID</p>
                        <p className="font-mono text-sm text-ink">{sdkConfig.appId}</p>
                      </div>
                      <div>
                        <p className="text-xs text-ink-muted">Network</p>
                        <p className="font-medium text-ink">{sdkConfig.network}</p>
                      </div>
                      <div>
                        <p className="text-xs text-ink-muted">API URL</p>
                        <p className="font-mono text-sm text-ink break-all">{sdkConfig.apiUrl}</p>
                      </div>
                      <div>
                        <p className="text-xs text-ink-muted">Authenticated</p>
                        <p className="font-medium text-ink">
                          {isAuthenticated ? 'Yes' : 'No'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Right: Logs & Code */}
          <div className="space-y-6">
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-ink" />
                    <CardTitle>Console Logs</CardTitle>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-ink-muted">
                    <Code className="w-4 h-4" />
                    <span>{logs.length} events</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-ink rounded-lg p-4 font-mono text-xs overflow-auto max-h-[calc(100vh-300px)] min-h-[400px]">
                  {logs.length === 0 ? (
                    <div className="text-center py-12 text-cream-300">
                      <Terminal className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No logs yet. Interact with the SDK to see events here.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {logs.map((log) => (
                        <div
                          key={log.id}
                          className="bg-cream-900/20 rounded-lg p-3 border border-cream-800 group hover:border-accent-yellow transition-colors"
                        >
                          {/* Header */}
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-accent-yellow font-semibold">
                                  {log.method}
                                </span>
                                {log.duration && (
                                  <span className="text-cream-400 text-[10px]">
                                    {log.duration}ms
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-cream-400 mt-0.5">
                                {log.timestamp.toLocaleTimeString()}
                              </div>
                            </div>
                            <button
                              onClick={() => handleCopyLog(log)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-cream-800 rounded"
                            >
                              {copiedLog === log.id ? (
                                <CheckCircle2 className="w-4 h-4 text-green-400" />
                              ) : (
                                <Copy className="w-4 h-4 text-cream-300" />
                              )}
                            </button>
                          </div>

                          {/* Args */}
                          {log.args !== undefined && (
                            <div className="mb-2">
                              <div className="text-cream-500 text-[10px] mb-1">Arguments:</div>
                              <pre className="text-cream-200 text-[11px] overflow-x-auto">
                                {JSON.stringify(log.args, null, 2)}
                              </pre>
                            </div>
                          )}

                          {/* Result */}
                          {log.result !== undefined && (
                            <div className="mb-2">
                              <div className="text-green-400 text-[10px] mb-1">Result:</div>
                              <pre className="text-green-200 text-[11px] overflow-x-auto">
                                {typeof log.result === 'string'
                                  ? log.result
                                  : JSON.stringify(log.result, null, 2)}
                              </pre>
                            </div>
                          )}

                          {/* Error */}
                          {log.error !== undefined && (
                            <div>
                              <div className="text-red-400 text-[10px] mb-1">Error:</div>
                              <pre className="text-red-200 text-[11px] overflow-x-auto">
                                {log.error}
                              </pre>
                            </div>
                          )}
                        </div>
                      ))}
                      <div ref={logsEndRef} />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
