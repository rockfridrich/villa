'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertCircle, ExternalLink, Copy, CheckCircle2 } from 'lucide-react'
import { Button, Input, Spinner, SuccessCelebration } from '@/components/ui'
import { AvatarSelection, VillaAuth, type VillaAuthResponse } from '@/components/sdk'
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
// Note: getNicknameByAddress removed - VillaAuth handles nickname lookup internally
import { authenticateTinyCloud, syncToTinyCloud } from '@/lib/storage/tinycloud-client'

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

  // Note: handleAuthSuccess removed - VillaAuth now handles full flow internally
  // and returns complete identity via handleVillaAuthComplete

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

    // Fire and forget - persist to API
    saveProfile(address, result.data, config)

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

  // Use VillaAuth (Porto dialog mode) for proper passkey manager integration
  // VillaAuth handles: welcome → passkey → nickname → avatar → success
  const handleVillaAuthComplete = async (result: VillaAuthResponse) => {
    if (result.success) {
      const { address: authAddress, nickname, avatar } = result.identity

      // Store complete identity
      setIdentity({
        address: authAddress,
        displayName: nickname,
        avatar,
        createdAt: Date.now(),
      })

      // Trigger TinyCloud sync in background
      authenticateTinyCloud(authAddress)
        .then(success => {
          if (success) {
            syncToTinyCloud().catch(console.warn)
          }
        })
        .catch(console.warn)

      // Go to home
      router.replace('/home')
    } else {
      // Handle error/cancel
      if (result.code !== 'CANCELLED') {
        setError({
          message: result.error,
          retry: () => setStep('welcome'),
        })
        setStep('error')
      }
    }
  }

  // Show VillaAuth for welcome/connecting steps (uses Porto dialog mode)
  if (step === 'welcome' || step === 'connecting') {
    return <VillaAuth onComplete={handleVillaAuthComplete} />
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-cream-50">
      <div className="w-full max-w-md">
        {step === 'inapp-browser' && inAppBrowser && (
          <InAppBrowserStep browserInfo={inAppBrowser} />
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
