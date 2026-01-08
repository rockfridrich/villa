'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Shield, Fingerprint, Users, Check, AlertTriangle } from 'lucide-react'
import { Button, Card, CardContent, Spinner } from '@/components/ui'
import { FaceRecoverySetup, ProfileSettings } from '@/components/sdk'
import type { ProfileData, ProfileUpdate } from '@/components/sdk'
import type { AvatarConfig } from '@/types'
import type { CustomAvatar } from '@/lib/storage/tinycloud'
import { useIdentityStore } from '@/lib/store'
import { isChainConnected, isEnrolled, getCurrentChain } from '@/lib/contracts'

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
  const { identity, updateProfile } = useIdentityStore()
  const [view, setView] = useState<SettingsView>('main')
  const [chainConnected, setChainConnected] = useState<boolean | null>(null)
  const [currentChainId, setCurrentChainId] = useState<number>(31337)
  const [faceRecoveryEnabled, setFaceRecoveryEnabled] = useState(false)
  const [checkingEnrollment, setCheckingEnrollment] = useState(true)
  const [enrollmentResult, setEnrollmentResult] = useState<{
    faceKeyHash: string
    proofHex: string
    txHash: string
  } | null>(null)

  // Profile state
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)

  // Check if chain is connected and enrollment status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const chain = getCurrentChain()
        setCurrentChainId(chain.id)
        const connected = await isChainConnected(chain.id)
        setChainConnected(connected)

        if (connected && identity?.address) {
          // Check if already enrolled for user's actual address on connected chain
          const enrolled = await isEnrolled(identity.address as `0x${string}`, chain.id)
          setFaceRecoveryEnabled(enrolled)
        }
      } catch (err) {
        console.error('Failed to check status:', err)
        setChainConnected(false)
      } finally {
        setCheckingEnrollment(false)
      }
    }

    checkStatus()
  }, [identity?.address])

  // Fetch profile on mount
  useEffect(() => {
    if (!identity?.address) return

    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/profile/${identity.address}`)
        const data = await res.json()

        // Convert avatar to proper format
        // identity.avatar can be string | AvatarConfig | undefined
        // ProfileData.avatar needs AvatarConfig | CustomAvatar
        let avatarConfig: AvatarConfig | CustomAvatar

        // If avatar is missing or is a string (legacy), create default AvatarConfig
        if (!identity.avatar || typeof identity.avatar === 'string') {
          avatarConfig = {
            style: 'avataaars' as const,
            selection: 'other' as const,
            variant: 0,
          }
        } else {
          // It's already AvatarConfig
          avatarConfig = identity.avatar
        }

        setProfile({
          address: identity.address,
          nickname: data.nickname,
          displayName: identity.displayName || data.nickname || '',
          avatar: avatarConfig,
          canChangeNickname: data.canChangeNickname ?? true,
          nicknameChangeCount: data.nicknameChangeCount ?? 0,
        })
      } catch (err) {
        console.error('Failed to fetch profile:', err)
      } finally {
        setLoadingProfile(false)
      }
    }

    fetchProfile()
  }, [identity])

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
      available: chainConnected === true,
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

  const handleProfileUpdate = async (updates: ProfileUpdate) => {
    if (!identity) return

    try {
      // Update nickname via API if changed
      if (updates.nickname) {
        await fetch('/api/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: identity.address,
            newNickname: updates.nickname
          }),
        })
      }

      // Update local identity store for display name and avatar
      if (updates.displayName !== undefined || updates.avatar !== undefined) {
        // Store accepts AvatarConfig directly or string
        // For CustomAvatar, store the dataUrl string
        let avatarForStore: string | { style: 'avataaars' | 'bottts'; selection: 'male' | 'female' | 'other'; variant: number } | undefined

        if (updates.avatar) {
          // Check if it's a CustomAvatar (has 'type' property with value 'custom')
          const isCustom = 'type' in updates.avatar && updates.avatar.type === 'custom'
          if (isCustom) {
            // CustomAvatar → store dataUrl string
            avatarForStore = (updates.avatar as CustomAvatar).dataUrl
          } else {
            // AvatarConfig → store object (cast to validated type)
            const config = updates.avatar as AvatarConfig
            avatarForStore = {
              style: config.style,
              selection: config.selection,
              variant: config.variant,
            }
          }
        }

        updateProfile(
          updates.displayName ?? identity.displayName,
          avatarForStore
        )
      }

      // Refresh profile data
      const res = await fetch(`/api/profile/${identity.address}`)
      const data = await res.json()

      // Convert avatar back to proper format for ProfileData
      const avatarSource = updates.avatar ?? identity.avatar
      let avatarConfig: AvatarConfig | CustomAvatar

      if (!avatarSource || typeof avatarSource === 'string') {
        avatarConfig = {
          style: 'avataaars' as const,
          selection: 'other' as const,
          variant: 0,
        }
      } else {
        // It's already AvatarConfig or CustomAvatar
        avatarConfig = avatarSource
      }

      setProfile({
        address: identity.address,
        nickname: data.nickname,
        displayName: updates.displayName ?? identity.displayName,
        avatar: avatarConfig,
        canChangeNickname: data.canChangeNickname ?? true,
        nicknameChangeCount: data.nicknameChangeCount ?? 0,
      })
    } catch (err) {
      console.error('Failed to update profile:', err)
      throw err
    }
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

      {/* Chain Status Banner */}
      {chainConnected === false && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-800 font-medium">
              {currentChainId === 31337
                ? 'Local blockchain not running'
                : currentChainId === 84532
                  ? 'Face Recovery temporarily unavailable'
                  : 'Face Recovery not available on this network'}
            </p>
            <p className="text-amber-700 text-sm mt-1">
              {currentChainId === 31337 ? (
                <>
                  Run <code className="bg-amber-100 px-1 rounded">npm run anvil</code> then{' '}
                  <code className="bg-amber-100 px-1 rounded">npm run deploy:local</code> to enable face recovery testing.
                </>
              ) : currentChainId === 84532 ? (
                <>Face recovery contracts are being deployed. Check back soon.</>
              ) : (
                <>Face recovery is only available on Base Sepolia testnet.</>
              )}
            </p>
          </div>
        </div>
      )}

      {chainConnected === true && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-green-800 font-medium">
              {currentChainId === 31337 ? 'Local blockchain connected' : 'Base Sepolia Testnet connected'}
            </p>
            <p className="text-green-700 text-sm mt-1">
              Face recovery is available{currentChainId === 84532 ? ' on testnet' : ' for testing'}.
            </p>
          </div>
        </div>
      )}

      {chainConnected === null && (
        <div className="bg-cream-100 rounded-lg p-4 mb-6 flex items-center gap-3">
          <Spinner size="sm" />
          <p className="text-ink-muted">Checking blockchain connection...</p>
        </div>
      )}

      {/* Profile Section */}
      {loadingProfile ? (
        <div className="bg-cream-100 rounded-lg p-4 mb-8 flex items-center gap-3">
          <Spinner size="sm" />
          <p className="text-ink-muted">Loading profile...</p>
        </div>
      ) : profile ? (
        <section className="mb-8">
          <ProfileSettings
            profile={profile}
            onUpdate={handleProfileUpdate}
            asModal={false}
          />
        </section>
      ) : null}

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
                <span className="text-ink-muted block mb-1">Connected Chain</span>
                <span className="text-ink font-mono break-all text-xs">
                  {currentChainId === 31337 ? 'Anvil Local (31337)' : 'Base Sepolia (84532)'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
