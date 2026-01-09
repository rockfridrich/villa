'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertCircle, ExternalLink, Copy, CheckCircle2 } from 'lucide-react'
import { Button, Input, Spinner, SuccessCelebration } from '@/components/ui'
import { AvatarSelection } from '@/components/sdk'
import { VillaBridge } from '@rockfridrich/villa-sdk'
import { useIdentityStore } from '@/lib/store'
import { displayNameSchema } from '@/lib/validation'
import type { AvatarConfig } from '@/types'
import {
  isPortoSupported,
} from '@/lib/porto'
import {
  detectInAppBrowser,
  getAppDisplayName,
  getCurrentUrl,
  type InAppBrowserInfo,
} from '@/lib/browser'
import { authenticateTinyCloud, syncToTinyCloud, avatarStore } from '@/lib/storage/tinycloud-client'

type Step =
  | 'inapp-browser'
  | 'welcome'
  | 'connecting'
  | 'success'
  | 'welcome-back'  // Returning user on new device (has nickname, needs avatar)
  | 'profile'
  | 'avatar'
  | 'error'

interface ErrorState {
  message: string
  retry: () => void
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<OnboardingLoading />}>
      <OnboardingContent />
    </Suspense>
  )
}

function OnboardingLoading() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-cream-50">
      <div className="w-full max-w-md text-center">
        <Spinner size="lg" />
      </div>
    </main>
  )
}

function OnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { identity, setIdentity } = useIdentityStore()

  // Read URL params (available after hydration)
  const testStep = searchParams.get('step') as Step | null
  const testAddress = searchParams.get('address')
  const testDisplayName = searchParams.get('displayName')
  const isTestMode = Boolean(testStep && testAddress)

  // State - initialized to defaults, synced from URL params after hydration
  const [step, setStep] = useState<Step>('welcome')
  const [displayName, setDisplayName] = useState('')
  const [nameError, setNameError] = useState<string>()
  const [error, setError] = useState<ErrorState | null>(null)
  const [address, setAddress] = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState(true)
  const [inAppBrowser, setInAppBrowser] = useState<InAppBrowserInfo | null>(null)
  const [paramsLoaded, setParamsLoaded] = useState(false)

  // Sync state from URL params after hydration (searchParams is empty during SSR)
  useEffect(() => {
    if (testStep && testAddress) {
      setStep(testStep)
      setAddress(testAddress)
      if (testDisplayName) {
        setDisplayName(testDisplayName)
      }
    }
    setParamsLoaded(true)
  }, [testStep, testAddress, testDisplayName])

  // Ref for tracking timeouts to prevent memory leaks
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Check for in-app browser and Porto support on mount
  useEffect(() => {
    // Skip browser checks in test mode
    if (isTestMode) {
      return
    }

    // First check for in-app browser
    const browserInfo = detectInAppBrowser()
    if (browserInfo.isInApp) {
      setInAppBrowser(browserInfo)
      setStep('inapp-browser')
      return
    }

    // Then check Porto support
    if (!isPortoSupported()) {
      setIsSupported(false)
      setError({
        message:
          'Your browser does not support passkeys. Please use a modern browser like Safari, Chrome, or Edge.',
        retry: () => {
          window.location.reload()
        },
      })
      setStep('error')
    }
  }, [isTestMode])

  // Redirect if already has identity (skip in test mode)
  useEffect(() => {
    if (identity && !isTestMode) {
      router.replace('/home')
    }
  }, [identity, router, isTestMode])

  // VillaBridge reference for SDK iframe/popup auth
  const bridgeRef = useRef<VillaBridge | null>(null)

  // Check if user has existing profile
  const checkExistingProfile = useCallback(async (addr: string) => {
    try {
      const response = await fetch(`/api/nicknames/reverse/${addr}`)
      if (response.ok) {
        const data = await response.json()
        return data.nickname || null
      }
    } catch {
      // Continue to profile creation
    }
    return null
  }, [])

  // Handle SDK auth success
  // VillaBridge opens iframe to key.villa.cash for passkey auth
  const handleAuthSuccess = useCallback(async (authAddress: string) => {
    // Update local state with address
    setAddress(authAddress)

    // Check for existing profile
    const existingNickname = await checkExistingProfile(authAddress)
    if (existingNickname) {
      // User already has a nickname - show welcome back and skip to avatar
      setDisplayName(existingNickname)
      setStep('welcome-back')
    } else {
      // New user - collect nickname
      setStep('profile')
    }
  }, [checkExistingProfile])

  // Open SDK auth (iframe to key.villa.cash)
  const openAuth = useCallback(async () => {
    setStep('connecting')

    // Determine network based on chain ID
    const chainId = process.env.NEXT_PUBLIC_CHAIN_ID
    const network = chainId === '84532' ? 'base-sepolia' : 'base'

    // Check if running on localhost for local development
    const isLocalhost = typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

    // Create VillaBridge to open auth iframe
    // On localhost, explicitly set origin to use local auth page
    const bridge = new VillaBridge({
      appId: 'villa-web',
      network,
      debug: process.env.NODE_ENV === 'development',
      origin: isLocalhost ? 'https://localhost' : undefined,
    })
    bridgeRef.current = bridge

    // Set up event handlers
    bridge.on('success', (bridgeIdentity) => {
      handleAuthSuccess(bridgeIdentity.address)
      bridge.close()
    })

    bridge.on('cancel', () => {
      setStep('welcome')
      bridge.close()
    })

    bridge.on('error', (errorMsg) => {
      setError({
        message: errorMsg || 'Authentication failed',
        retry: () => {
          setError(null)
          setStep('welcome')
        },
      })
      setStep('error')
      bridge.close()
    })

    // Open the auth iframe/popup
    try {
      await bridge.open()
    } catch (err) {
      console.error('Failed to open auth:', err)
      setError({
        message: 'Failed to open authentication. Please try again.',
        retry: () => {
          setError(null)
          setStep('welcome')
        },
      })
      setStep('error')
    }
  }, [handleAuthSuccess])

  // Cleanup bridge on unmount
  useEffect(() => {
    return () => {
      bridgeRef.current?.close()
    }
  }, [])

  const handleSubmitProfile = () => {
    const result = displayNameSchema.safeParse(displayName)
    if (!result.success) {
      setNameError(result.error.errors[0]?.message ?? 'Invalid name')
      return
    }

    if (!address) {
      setError({
        message: 'No address found. Please try again.',
        retry: () => {
          setError(null)
          setStep('welcome')
        },
      })
      setStep('error')
      return
    }

    // Store validated display name and proceed to avatar
    setStep('avatar')
  }

  const saveProfile = async (
    address: string,
    nickname: string,
    avatar: AvatarConfig
  ) => {
    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          nickname,
          avatar: {
            style: avatar.style,
            selection: avatar.selection,
            variant: avatar.variant,
          },
        }),
      })

      if (!response.ok) {
        console.error('Failed to save profile:', await response.text())
      }
    } catch (error) {
      console.error('Error saving profile:', error)
    }
  }

  const handleAvatarSelected = (config: AvatarConfig) => {
    if (!address) {
      setError({
        message: 'No address found. Please try again.',
        retry: () => {
          setError(null)
          setStep('welcome')
        },
      })
      setStep('error')
      return
    }

    const result = displayNameSchema.safeParse(displayName)
    if (!result.success) {
      setStep('profile')
      return
    }

    // Save complete identity with avatar
    setIdentity({
      address,
      displayName: result.data,
      avatar: config,
      createdAt: Date.now(),
    })

    // Save avatar to TinyCloud for cross-device sync
    avatarStore.save({
      type: 'generated',
      style: config.style,
      selection: config.selection,
      variant: config.variant,
      createdAt: Date.now(),
    }).catch(console.warn)

    // Fire and forget - persist to API, authenticate TinyCloud, and sync
    saveProfile(address, result.data, config)
    authenticateTinyCloud(address)
      .then(() => syncToTinyCloud())
      .catch(console.warn)

    router.replace('/home')
  }

  if (!isSupported) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-cream-50">
        <div className="w-full max-w-sm">
          {error && <ErrorStep message={error.message} onRetry={error.retry} />}
        </div>
      </main>
    )
  }

  // Show loading until params are loaded
  // This prevents the welcome screen from flashing before test mode state is synced
  if (!paramsLoaded) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-cream-50">
        <div className="w-full max-w-md text-center">
          <Spinner size="lg" />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-cream-50">
      <div className="w-full max-w-md">
        {step === 'inapp-browser' && inAppBrowser && (
          <InAppBrowserStep browserInfo={inAppBrowser} />
        )}

        {(step === 'welcome' || step === 'connecting') && (
          <WelcomeStep
            onGetStarted={openAuth}
            isLoading={step === 'connecting'}
          />
        )}

        {step === 'success' && <SuccessStep />}

        {step === 'welcome-back' && displayName && (
          <WelcomeBackStep
            nickname={displayName}
            onContinue={() => setStep('avatar')}
          />
        )}

        {step === 'profile' && (
          <ProfileStep
            displayName={displayName}
            onDisplayNameChange={(value) => {
              setDisplayName(value)
              setNameError(undefined)
            }}
            error={nameError}
            onSubmit={handleSubmitProfile}
            isPending={false}
          />
        )}

        {step === 'avatar' && address && (
          <AvatarSelection
            walletAddress={address}
            onSelect={handleAvatarSelected}
            timerDuration={30}
          />
        )}

        {step === 'error' && error && (
          <ErrorStep message={error.message} onRetry={error.retry} />
        )}
      </div>
    </main>
  )
}

function InAppBrowserStep({
  browserInfo,
}: {
  browserInfo: InAppBrowserInfo
}) {
  const [copied, setCopied] = useState(false)
  const appName = getAppDisplayName(browserInfo.app)
  const url = getCurrentUrl()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: select text for manual copy
      const input = document.createElement('input')
      input.value = url
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="text-center space-y-6">
      <div className="space-y-4">
        <div className="w-16 h-16 mx-auto bg-accent-yellow rounded-2xl flex items-center justify-center">
          <ExternalLink className="w-8 h-8 text-accent-brown" />
        </div>
        <h1 className="text-2xl font-serif tracking-tight text-ink">
          Open in Browser
        </h1>
        <p className="text-ink-muted">
          For security, passkeys only work in{' '}
          <span className="font-medium text-ink">Safari</span> or{' '}
          <span className="font-medium text-ink">Chrome</span>.
        </p>
      </div>

      <div className="bg-cream-100 rounded-xl p-4 space-y-3">
        <p className="text-sm font-medium text-ink">
          You&apos;re in {appName}
        </p>
        <p className="text-sm text-ink-muted">
          {browserInfo.instructions}
        </p>
      </div>

      <div className="space-y-3">
        <Button
          size="lg"
          className="w-full"
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-5 h-5 mr-2" />
              Copy Link
            </>
          )}
        </Button>
        <p className="text-xs text-ink-muted">
          Then paste in Safari or Chrome
        </p>
      </div>

      <div className="pt-4 border-t border-neutral-100">
        <p className="text-xs text-ink-muted">
          Why? In-app browsers can&apos;t securely store passkeys.
          Opening in a real browser keeps your identity safe.
        </p>
      </div>
    </div>
  )
}

function SuccessStep() {
  return (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <SuccessCelebration size="lg" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-serif text-ink">Connected!</h2>
        <p className="text-ink-muted">
          Your secure identity is ready
        </p>
      </div>
    </div>
  )
}

function WelcomeStep({
  onGetStarted,
  isLoading,
}: {
  onGetStarted: () => void
  isLoading: boolean
}) {
  return (
    <div className="text-center space-y-8">
      <div className="space-y-4">
        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-accent-yellow to-villa-500 rounded-2xl flex items-center justify-center shadow-lg">
          <span className="text-4xl font-serif text-accent-brown">V</span>
        </div>
        <h1 className="text-3xl font-serif tracking-tight text-ink">
          Welcome to Villa
        </h1>
        <p className="text-ink-muted max-w-xs mx-auto">
          Your identity. No passwords. Just you.
        </p>
      </div>

      <div className="space-y-4">
        <Button
          size="lg"
          className="w-full"
          onClick={onGetStarted}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Opening...
            </>
          ) : (
            'Get Started'
          )}
        </Button>
        <p className="text-xs text-ink-muted">
          Sign in with your fingerprint, face, or security key
        </p>
      </div>

      <div className="pt-4 border-t border-neutral-100">
        <p className="text-xs text-ink-muted">
          Works with 1Password, iCloud Keychain, Google Password Manager, and hardware keys
        </p>
      </div>
    </div>
  )
}

function WelcomeBackStep({
  nickname,
  onContinue,
}: {
  nickname: string
  onContinue: () => void
}) {
  // Auto-advance after 2 seconds
  useEffect(() => {
    const timer = setTimeout(onContinue, 2000)
    return () => clearTimeout(timer)
  }, [onContinue])

  return (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <SuccessCelebration size="lg" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-serif text-ink">
          Welcome back, @{nickname}!
        </h2>
        <p className="text-ink-muted">
          Let&apos;s set up your look on this device
        </p>
      </div>
    </div>
  )
}

function ProfileStep({
  displayName,
  onDisplayNameChange,
  error,
  onSubmit,
  isPending,
}: {
  displayName: string
  onDisplayNameChange: (value: string) => void
  error?: string
  onSubmit: () => void
  isPending: boolean
}) {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-serif text-ink">Choose your @handle</h2>
        <p className="text-ink-muted">
          This is how others will find you
        </p>
      </div>
      <div className="space-y-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <span className="text-ink text-base">@</span>
          </div>
          <Input
            type="text"
            placeholder="yourname"
            value={displayName}
            onChange={(e) => onDisplayNameChange(e.target.value)}
            error={error}
            autoFocus
            maxLength={30}
            className="pl-8"
          />
        </div>
        <Button
          size="lg"
          className="w-full"
          onClick={onSubmit}
          disabled={!displayName.trim() || isPending}
        >
          {isPending ? <Spinner size="sm" /> : `Claim @${displayName || 'handle'}`}
        </Button>
      </div>
    </div>
  )
}

function ErrorStep({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-serif text-ink">Something went wrong</h2>
        <p className="text-ink-muted">{message}</p>
      </div>
      <Button size="lg" className="w-full" onClick={onRetry}>
        Try Again
      </Button>
    </div>
  )
}

// Error message helper - kept for future error handling improvements
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _getErrorMessage(error: Error): string {
  const message = error.message.toLowerCase()

  if (
    message.includes('rejected') ||
    message.includes('cancelled') ||
    message.includes('denied') ||
    message.includes('abort') ||
    message.includes('user cancel')
  ) {
    return 'You cancelled the request. Try again when ready.'
  }
  if (
    message.includes('biometric') ||
    message.includes('authentication failed') ||
    message.includes('verification')
  ) {
    return 'Biometric authentication failed. Please try again.'
  }
  if (message.includes('network') || message.includes('fetch')) {
    return 'Network error. Check your connection and try again.'
  }
  if (message.includes('timeout')) {
    return 'Request timed out. Please try again.'
  }
  if (message.includes('not supported')) {
    return 'Your browser does not support passkeys. Please use Safari, Chrome, or Edge.'
  }
  if (message.includes('not available')) {
    return 'Biometric authentication is not available on this device.'
  }

  return 'An error occurred. Please try again.'
}
