'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Fingerprint, Check, AlertCircle } from 'lucide-react'
import { Button, Input, Spinner } from '@/components/ui'
import { useIdentityStore } from '@/lib/store'
import { displayNameSchema } from '@/lib/validation'
import {
  createAccount,
  signIn,
  checkExistingAccount,
  isPortoSupported,
  resetPorto,
} from '@/lib/porto'

type Step =
  | 'welcome'
  | 'connecting'
  | 'success'
  | 'profile'
  | 'error'

interface ErrorState {
  message: string
  retry: () => void
}

export default function OnboardingPage() {
  const router = useRouter()
  const { identity, setIdentity } = useIdentityStore()

  const [step, setStep] = useState<Step>('welcome')
  const [displayName, setDisplayName] = useState('')
  const [nameError, setNameError] = useState<string>()
  const [error, setError] = useState<ErrorState | null>(null)
  const [address, setAddress] = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState(true)
  const [hasExistingAccount, setHasExistingAccount] = useState(false)

  // Ref for inline Porto container
  const portoContainerRef = useRef<HTMLDivElement | null>(null)

  // Check Porto support and existing account on mount
  useEffect(() => {
    const checkSupport = async () => {
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
        return
      }

      // Check if user has existing Porto account
      const existingAddress = await checkExistingAccount()
      if (existingAddress) {
        setHasExistingAccount(true)
      }
    }

    checkSupport()
  }, [])

  // Redirect if already has identity
  useEffect(() => {
    if (identity) {
      router.replace('/home')
    }
  }, [identity, router])

  const handleCreateAccount = async () => {
    setStep('connecting')

    // Wait for container to be available
    await new Promise(resolve => setTimeout(resolve, 100))

    try {
      // Reset Porto to ensure fresh instance with inline container
      resetPorto()
      // Porto shows its create account UI in the inline container
      const result = await createAccount(portoContainerRef.current)

      if (!result.success) {
        throw result.error
      }

      // Store the Porto wallet address
      setAddress(result.address)

      // Show success and move to profile
      setStep('success')
      setTimeout(() => setStep('profile'), 1500)
    } catch (err) {
      const message = getErrorMessage(err as Error)
      setError({
        message,
        retry: () => {
          setError(null)
          resetPorto()
          setStep('welcome')
        },
      })
      setStep('error')
    }
  }

  const handleSignIn = async () => {
    setStep('connecting')

    // Wait for container to be available
    await new Promise(resolve => setTimeout(resolve, 100))

    try {
      // Reset Porto to ensure fresh instance with inline container
      resetPorto()
      // Porto shows passkey selection in the inline container
      const result = await signIn(portoContainerRef.current)

      if (!result.success) {
        throw result.error
      }

      // Store the Porto wallet address
      setAddress(result.address)

      // Check if we have a stored identity with this address
      if (identity && identity.address === result.address) {
        // Already have identity, go home
        router.replace('/home')
        return
      }

      // New sign-in (different device?), need profile setup
      setStep('success')
      setTimeout(() => setStep('profile'), 1500)
    } catch (err) {
      const message = getErrorMessage(err as Error)
      setError({
        message,
        retry: () => {
          setError(null)
          resetPorto()
          setStep('welcome')
        },
      })
      setStep('error')
    }
  }

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

    setIdentity({
      address,
      displayName: result.data,
      createdAt: Date.now(),
    })

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

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-cream-50">
      <div className="w-full max-w-md">
        {step === 'welcome' && (
          <WelcomeStep
            onCreateNew={handleCreateAccount}
            onSignIn={handleSignIn}
            hasExistingAccount={hasExistingAccount}
          />
        )}

        {step === 'connecting' && (
          <ConnectingStep portoContainerRef={portoContainerRef} />
        )}

        {step === 'success' && <SuccessStep />}

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

        {step === 'error' && error && (
          <ErrorStep message={error.message} onRetry={error.retry} />
        )}
      </div>
    </main>
  )
}

function WelcomeStep({
  onCreateNew,
  onSignIn,
  hasExistingAccount,
}: {
  onCreateNew: () => void
  onSignIn: () => void
  hasExistingAccount: boolean
}) {
  return (
    <div className="text-center space-y-8">
      <div className="space-y-4">
        <div className="w-16 h-16 mx-auto bg-accent-yellow rounded-2xl flex items-center justify-center">
          <Fingerprint className="w-8 h-8 text-accent-brown" />
        </div>
        <h1 className="text-3xl font-serif tracking-tight text-ink">Villa</h1>
        <p className="text-ink-muted text-lg">
          Your identity. No passwords.
        </p>
      </div>
      <div className="space-y-3">
        {hasExistingAccount ? (
          <>
            <Button size="lg" className="w-full" onClick={onSignIn}>
              Sign In with Passkey
            </Button>
            <Button size="lg" variant="secondary" className="w-full" onClick={onCreateNew}>
              Create New Identity
            </Button>
          </>
        ) : (
          <>
            <Button size="lg" className="w-full" onClick={onCreateNew}>
              Create New Identity
            </Button>
            <Button size="lg" variant="secondary" className="w-full" onClick={onSignIn}>
              Sign In with Passkey
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

function ConnectingStep({
  portoContainerRef,
}: {
  portoContainerRef: React.MutableRefObject<HTMLDivElement | null>
}) {
  return (
    <div className="text-center space-y-4">
      <div className="space-y-2">
        <h2 className="text-xl font-serif text-ink">Connecting...</h2>
        <p className="text-ink-muted text-sm">
          Complete the biometric prompt
        </p>
      </div>
      {/* Inline Porto container - full height for dialog */}
      <div
        ref={portoContainerRef}
        className="min-h-[520px] h-[60vh] max-h-[640px] w-full rounded-lg bg-cream-100 border border-neutral-100 overflow-hidden"
      />
    </div>
  )
}

function SuccessStep() {
  return (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 mx-auto bg-accent-green rounded-full flex items-center justify-center animate-bounce">
        <Check className="w-10 h-10 text-white" />
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
        <h2 className="text-2xl font-serif text-ink">Set Up Profile</h2>
        <p className="text-ink-muted">
          What should we call you?
        </p>
      </div>
      <div className="space-y-4">
        <Input
          type="text"
          placeholder="Your name"
          value={displayName}
          onChange={(e) => onDisplayNameChange(e.target.value)}
          error={error}
          autoFocus
          maxLength={50}
        />
        <Button
          size="lg"
          className="w-full"
          onClick={onSubmit}
          disabled={!displayName.trim() || isPending}
        >
          {isPending ? <Spinner size="sm" /> : 'Continue'}
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

function getErrorMessage(error: Error): string {
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
