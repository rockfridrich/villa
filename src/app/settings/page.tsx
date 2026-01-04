'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Shield, Fingerprint, Users, Check, AlertTriangle } from 'lucide-react'
import { Button, Card, CardContent, Spinner } from '@/components/ui'
import { FaceRecoverySetup } from '@/components/sdk'
import { useIdentityStore } from '@/lib/store'
import { isAnvilRunning, isEnrolled, ANVIL_ACCOUNTS } from '@/lib/contracts'

type SettingsView = 'main' | 'face-recovery'

interface RecoveryMethod {
  id: string
  name: string
  description: string
  icon: typeof Shield
  enabled: boolean
  available: boolean
}

export default function SettingsPage() {
  const router = useRouter()
  const { identity } = useIdentityStore()
  const [view, setView] = useState<SettingsView>('main')
  const [anvilConnected, setAnvilConnected] = useState<boolean | null>(null)
  const [faceRecoveryEnabled, setFaceRecoveryEnabled] = useState(false)
  const [checkingEnrollment, setCheckingEnrollment] = useState(true)
  const [enrollmentResult, setEnrollmentResult] = useState<{
    faceKeyHash: string
    proofHex: string
    txHash: string
  } | null>(null)

  // Check if Anvil is running and enrollment status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const connected = await isAnvilRunning()
        setAnvilConnected(connected)

        if (connected) {
          // Check if already enrolled (using test account for local dev)
          const enrolled = await isEnrolled(ANVIL_ACCOUNTS.user1.address)
          setFaceRecoveryEnabled(enrolled)
        }
      } catch (err) {
        console.error('Failed to check status:', err)
        setAnvilConnected(false)
      } finally {
        setCheckingEnrollment(false)
      }
    }

    checkStatus()
  }, [])

  // Redirect if not authenticated
  useEffect(() => {
    if (!identity) {
      router.replace('/onboarding')
    }
  }, [identity, router])

  if (!identity) {
    return null
  }

  const recoveryMethods: RecoveryMethod[] = [
    {
      id: 'face',
      name: 'Face Recovery',
      description: faceRecoveryEnabled
        ? 'Enabled - Use your face to recover'
        : 'Use your face to recover your account',
      icon: Fingerprint,
      enabled: faceRecoveryEnabled,
      available: anvilConnected === true,
    },
    {
      id: 'guardians',
      name: 'Village Guardians',
      description: 'Ask trusted friends to help recover',
      icon: Users,
      enabled: false,
      available: false, // Phase 2
    },
  ]

  const handleFaceRecoveryComplete = (result: {
    faceKeyHash: string
    proofHex: string
    txHash: string
  }) => {
    setEnrollmentResult(result)
    setFaceRecoveryEnabled(true)
    setView('main')
  }

  if (view === 'face-recovery') {
    return (
      <main className="min-h-screen bg-cream-50">
        <FaceRecoverySetup
          address={identity.address}
          onComplete={handleFaceRecoveryComplete}
          onCancel={() => setView('main')}
          onError={(error) => console.error('Face recovery error:', error)}
        />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-cream-50 p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.push('/home')}
          className="p-2 hover:bg-cream-100 rounded-lg transition-colors"
          aria-label="Back to home"
        >
          <ChevronLeft className="h-5 w-5 text-ink" />
        </button>
        <h1 className="text-2xl font-bold text-ink">Settings</h1>
      </div>

      {/* Anvil Status Banner */}
      {anvilConnected === false && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-800 font-medium">Local blockchain not running</p>
            <p className="text-amber-700 text-sm mt-1">
              Run <code className="bg-amber-100 px-1 rounded">npm run anvil</code> then{' '}
              <code className="bg-amber-100 px-1 rounded">npm run deploy:local</code> to enable face
              recovery testing.
            </p>
          </div>
        </div>
      )}

      {anvilConnected === true && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-green-800 font-medium">Local blockchain connected</p>
            <p className="text-green-700 text-sm mt-1">
              Anvil is running. Face recovery is available for testing.
            </p>
          </div>
        </div>
      )}

      {anvilConnected === null && (
        <div className="bg-cream-100 rounded-lg p-4 mb-6 flex items-center gap-3">
          <Spinner size="sm" />
          <p className="text-ink-muted">Checking blockchain connection...</p>
        </div>
      )}

      {/* Recovery Methods Section */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-ink mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Account Recovery
        </h2>

        <div className="space-y-3">
          {recoveryMethods.map((method) => (
            <Card key={method.id} className={!method.available ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        method.enabled
                          ? 'bg-accent-green/20'
                          : method.available
                            ? 'bg-cream-100'
                            : 'bg-cream-100'
                      }`}
                    >
                      <method.icon
                        className={`h-5 w-5 ${
                          method.enabled
                            ? 'text-accent-green'
                            : method.available
                              ? 'text-ink'
                              : 'text-ink-muted'
                        }`}
                      />
                    </div>
                    <div>
                      <h3 className="font-medium text-ink">{method.name}</h3>
                      <p className="text-sm text-ink-muted">{method.description}</p>
                    </div>
                  </div>

                  <div>
                    {checkingEnrollment && method.id === 'face' ? (
                      <Spinner size="sm" />
                    ) : method.enabled ? (
                      <div className="flex items-center gap-1 text-accent-green text-sm font-medium">
                        <Check className="h-4 w-4" />
                        Enabled
                      </div>
                    ) : method.available ? (
                      <Button
                        size="sm"
                        onClick={() => {
                          if (method.id === 'face') {
                            setView('face-recovery')
                          }
                        }}
                      >
                        Set up
                      </Button>
                    ) : (
                      <span className="text-sm text-ink-muted">Coming soon</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Enrollment Result (for debugging) */}
      {enrollmentResult && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-ink mb-4">Enrollment Details</h2>
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-ink-muted block mb-1">Transaction Hash</span>
                  <span className="text-ink font-mono break-all text-xs">
                    {enrollmentResult.txHash}
                  </span>
                </div>
                <div>
                  <span className="text-ink-muted block mb-1">Face Key Hash</span>
                  <span className="text-ink font-mono break-all text-xs">
                    {enrollmentResult.faceKeyHash}
                  </span>
                </div>
                <div>
                  <span className="text-ink-muted block mb-1">Proof (first 66 chars)</span>
                  <span className="text-ink font-mono break-all text-xs">
                    {enrollmentResult.proofHex.slice(0, 66)}...
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Account Info */}
      <section>
        <h2 className="text-lg font-semibold text-ink mb-4">Account</h2>
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-ink-muted block mb-1">Villa ID Address</span>
                <span className="text-ink font-mono break-all text-xs">{identity.address}</span>
              </div>
              <div>
                <span className="text-ink-muted block mb-1">Test Account (Anvil)</span>
                <span className="text-ink font-mono break-all text-xs">
                  {ANVIL_ACCOUNTS.user1.address}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
