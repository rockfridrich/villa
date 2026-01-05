'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { Terminal, Play, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

/**
 * SDK Iframe Test Page
 *
 * Tests the actual iframe-based SDK flow that external developers use.
 * Shows postMessage events in real-time.
 */

interface LogEntry {
  id: number
  timestamp: Date
  type: 'info' | 'send' | 'receive' | 'error' | 'success'
  message: string
  data?: unknown
}

export default function IframeTestPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [result, setResult] = useState<{ success: boolean; data?: unknown; error?: string } | null>(null)
  const logIdRef = useRef(0)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const addLog = useCallback((type: LogEntry['type'], message: string, data?: unknown) => {
    const entry: LogEntry = {
      id: logIdRef.current++,
      timestamp: new Date(),
      type,
      message,
      data,
    }
    setLogs(prev => [...prev, entry])
    return entry.id
  }, [])

  // Listen for postMessage from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Log all messages for debugging
      addLog('receive', `postMessage from ${event.origin}`, event.data)

      // Handle Villa auth messages
      if (event.data?.type?.startsWith('VILLA_AUTH_') || event.data?.type?.startsWith('AUTH_')) {
        const { type, identity, error, code } = event.data

        if (type === 'VILLA_AUTH_READY' || type === 'AUTH_READY') {
          addLog('info', 'Auth iframe ready')
        } else if (type === 'VILLA_AUTH_SUCCESS' || type === 'AUTH_SUCCESS') {
          addLog('success', 'Authentication successful!', identity)
          setResult({ success: true, data: identity })
          closeAuth()
        } else if (type === 'VILLA_AUTH_ERROR' || type === 'AUTH_ERROR') {
          addLog('error', `Authentication error: ${error}`, { code })
          setResult({ success: false, error })
          closeAuth()
        } else if (type === 'VILLA_AUTH_CANCEL' || type === 'AUTH_CLOSE') {
          addLog('info', 'User cancelled authentication')
          setResult({ success: false, error: 'Cancelled' })
          closeAuth()
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [addLog])

  const openAuth = useCallback(() => {
    setIsAuthOpen(true)
    setResult(null)
    addLog('info', 'Opening auth iframe...')
    addLog('send', 'Creating iframe with src', {
      url: '/auth?appId=sdk-test&scopes=profile,wallet',
    })
  }, [addLog])

  const closeAuth = useCallback(() => {
    setIsAuthOpen(false)
    addLog('info', 'Closing auth iframe')
  }, [addLog])

  const clearLogs = useCallback(() => {
    setLogs([])
    setResult(null)
    logIdRef.current = 0
  }, [])

  // Handle iframe load
  const handleIframeLoad = useCallback(() => {
    addLog('info', 'Iframe loaded successfully')
  }, [addLog])

  return (
    <div className="min-h-screen bg-cream-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif text-ink">SDK Iframe Test</h1>
            <p className="text-ink-muted mt-1">
              Test the real iframe-based auth flow with postMessage logging
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={clearLogs}>
              Clear Logs
            </Button>
            <a href="/sdk-demo" className="inline-flex items-center px-4 py-2 bg-neutral-100 rounded-lg text-sm hover:bg-neutral-200">
              ← Back to Demo
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Controls & Result */}
          <div className="space-y-6">
            {/* Launch Button */}
            <Card>
              <CardHeader>
                <CardTitle>1. Launch Auth</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-ink-muted">
                  Click to open the Villa auth iframe. This is what external apps do when calling{' '}
                  <code className="bg-neutral-100 px-1 rounded">villa.signIn()</code>
                </p>

                <Button
                  onClick={openAuth}
                  disabled={isAuthOpen}
                  className="w-full"
                  size="lg"
                >
                  {isAuthOpen ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Auth in Progress...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      Open Auth Iframe
                    </>
                  )}
                </Button>

                {/* Code snippet */}
                <div className="p-3 bg-neutral-900 rounded-lg">
                  <pre className="text-xs text-green-400 overflow-x-auto">
{`// External app integration
import { Villa } from '@villa/sdk'

const villa = new Villa({ appId: 'your-app' })

const result = await villa.signIn({
  scopes: ['profile', 'wallet'],
  onProgress: (step) => console.log(step)
})

if (result.success) {
  console.log('Identity:', result.identity)
}`}
                  </pre>
                </div>
              </CardContent>
            </Card>

            {/* Result */}
            <Card>
              <CardHeader>
                <CardTitle>2. Result</CardTitle>
              </CardHeader>
              <CardContent>
                {result === null ? (
                  <div className="text-center py-8 text-ink-muted">
                    <Terminal className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Complete auth flow to see result</p>
                  </div>
                ) : result.success ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">Success!</span>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <pre className="text-xs text-green-800 overflow-x-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-medium">Failed</span>
                    </div>
                    <p className="text-sm text-red-600">{result.error}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Architecture */}
            <Card>
              <CardHeader>
                <CardTitle>Architecture</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="w-6 h-6 rounded-full bg-accent-yellow text-accent-brown flex items-center justify-center text-xs font-bold">1</span>
                    <div>
                      <p className="font-medium">App calls villa.signIn()</p>
                      <p className="text-ink-muted text-xs">SDK creates fullscreen iframe</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-6 h-6 rounded-full bg-accent-yellow text-accent-brown flex items-center justify-center text-xs font-bold">2</span>
                    <div>
                      <p className="font-medium">Iframe loads /auth</p>
                      <p className="text-ink-muted text-xs">Shows VillaAuth React component</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-6 h-6 rounded-full bg-accent-yellow text-accent-brown flex items-center justify-center text-xs font-bold">3</span>
                    <div>
                      <p className="font-medium">User authenticates</p>
                      <p className="text-ink-muted text-xs">Passkey → Nickname → Avatar</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-6 h-6 rounded-full bg-accent-yellow text-accent-brown flex items-center justify-center text-xs font-bold">4</span>
                    <div>
                      <p className="font-medium">postMessage to parent</p>
                      <p className="text-ink-muted text-xs">AUTH_SUCCESS with identity</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Logs */}
          <Card className="h-[calc(100vh-200px)] flex flex-col">
            <CardHeader className="flex-shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="w-5 h-5" />
                  postMessage Logs
                </CardTitle>
                <span className="text-xs text-ink-muted bg-neutral-100 px-2 py-1 rounded">
                  {logs.length} events
                </span>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto space-y-2 pr-2 font-mono text-xs">
                {logs.length === 0 ? (
                  <div className="text-center py-12 text-ink-muted">
                    <Terminal className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Events will appear here</p>
                  </div>
                ) : (
                  logs.map(log => (
                    <div
                      key={log.id}
                      className={`p-2 rounded ${
                        log.type === 'error' ? 'bg-red-50 border-l-2 border-red-500' :
                        log.type === 'success' ? 'bg-green-50 border-l-2 border-green-500' :
                        log.type === 'send' ? 'bg-blue-50 border-l-2 border-blue-500' :
                        log.type === 'receive' ? 'bg-purple-50 border-l-2 border-purple-500' :
                        'bg-neutral-50 border-l-2 border-neutral-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] uppercase font-bold ${
                          log.type === 'error' ? 'text-red-600' :
                          log.type === 'success' ? 'text-green-600' :
                          log.type === 'send' ? 'text-blue-600' :
                          log.type === 'receive' ? 'text-purple-600' :
                          'text-neutral-500'
                        }`}>
                          {log.type}
                        </span>
                        <span className="text-ink-muted">
                          {log.timestamp.toLocaleTimeString()}.{log.timestamp.getMilliseconds().toString().padStart(3, '0')}
                        </span>
                      </div>
                      <p className="text-ink mt-1">{log.message}</p>
                      {log.data !== undefined && (
                        <pre className="text-[10px] text-ink-muted mt-1 overflow-x-auto">
                          {typeof log.data === 'string' ? log.data : JSON.stringify(log.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))
                )}
                <div ref={logsEndRef} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Auth Iframe Overlay */}
      {isAuthOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="relative w-full max-w-md h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Close button */}
            <button
              onClick={closeAuth}
              className="absolute top-4 right-4 z-10 p-2 bg-white/80 rounded-full hover:bg-white shadow"
            >
              <X className="w-5 h-5" />
            </button>

            {/* The actual iframe - this is what external apps embed */}
            <iframe
              ref={iframeRef}
              src="/auth?appId=sdk-test&scopes=profile,wallet"
              className="w-full h-full border-0"
              allow="publickey-credentials-get *; publickey-credentials-create *"
              onLoad={handleIframeLoad}
              title="Villa Auth"
            />
          </div>
        </div>
      )}
    </div>
  )
}
