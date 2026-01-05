'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui'
import { SignInWelcome } from './SignInWelcome'
import { NicknameSelection } from './NicknameSelection'
import { AvatarSelection } from './AvatarSelection'
import { createAccount, signIn, resetPorto } from '@/lib/porto'
import { useIdentityStore } from '@/lib/store'
import type { AvatarConfig } from '@/types'

/**
 * Villa Auth result returned to integrating apps
 */
export interface VillaAuthResult {
  success: true
  identity: {
    address: `0x${string}`
    nickname: string
    avatar: AvatarConfig
  }
}

export interface VillaAuthError {
  success: false
  error: string
  code: 'CANCELLED' | 'AUTH_FAILED' | 'NETWORK_ERROR' | 'TIMEOUT'
}

export type VillaAuthResponse = VillaAuthResult | VillaAuthError

interface VillaAuthProps {
  /** Called when auth flow completes (success or failure) */
  onComplete: (result: VillaAuthResponse) => void
  /** Optional: Skip to specific step (for testing) */
  initialStep?: AuthStep
  /** Optional: Pre-fill address (for returning users) */
  existingAddress?: `0x${string}`
  /** Optional: App name to show in consent */
  appName?: string
}

type AuthStep =
  | 'welcome'
  | 'connecting'
  | 'nickname'
  | 'avatar'
  | 'success'
  | 'error'

interface AuthState {
  step: AuthStep
  address: `0x${string}` | null
  nickname: string | null
  avatar: AvatarConfig | null
  error: string | null
  isReturningUser: boolean
}

/**
 * VillaAuth - One-prompt authentication flow
 *
 * Combines: Welcome → Passkey → Nickname → Avatar → Done
 *
 * @example
 * ```tsx
 * <VillaAuth
 *   onComplete={(result) => {
 *     if (result.success) {
 *       console.log('Welcome', result.identity.nickname)
 *       router.push('/dashboard')
 *     }
 *   }}
 * />
 * ```
 */
export function VillaAuth({
  onComplete,
  initialStep = 'welcome',
  existingAddress,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  appName = 'this app',
}: VillaAuthProps) {
  const [state, setState] = useState<AuthState>({
    step: initialStep,
    address: existingAddress || null,
    nickname: null,
    avatar: null,
    error: null,
    isReturningUser: false,
  })

  const containerRef = useRef<HTMLDivElement>(null)
  const { setIdentity, identity: storedIdentity } = useIdentityStore()

  // Check for reduced motion preference
  const prefersReducedMotion = useRef(
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  ).current

  // Check if returning user (has stored identity)
  useEffect(() => {
    if (storedIdentity?.address && storedIdentity?.displayName && storedIdentity?.avatar) {
      // Handle both legacy (string) and new (object) avatar formats
      const avatar: AvatarConfig | null = typeof storedIdentity.avatar === 'object'
        ? storedIdentity.avatar
        : null

      setState(prev => ({
        ...prev,
        isReturningUser: true,
        address: storedIdentity.address as `0x${string}`,
        nickname: storedIdentity.displayName,
        avatar,
      }))
    }
  }, [storedIdentity])

  // Handle sign in (existing user)
  const handleSignIn = useCallback(async () => {
    setState(prev => ({ ...prev, step: 'connecting', error: null }))

    try {
      if (!containerRef.current) throw new Error('Container not ready')

      const result = await signIn({ container: containerRef.current })

      if (!result.success) {
        throw new Error(result.error.message || 'No address returned from passkey')
      }

      const address = result.address as `0x${string}`

      // Check if we have stored profile for this address
      const storedAvatar = storedIdentity?.avatar && typeof storedIdentity.avatar === 'object'
        ? storedIdentity.avatar
        : null

      if (storedIdentity?.address === address && storedIdentity.displayName && storedAvatar) {
        // Returning user with complete profile - skip to success
        setState(prev => ({
          ...prev,
          step: 'success',
          address,
          nickname: storedIdentity.displayName,
          avatar: storedAvatar,
        }))

        setTimeout(() => {
          onComplete({
            success: true,
            identity: {
              address,
              nickname: storedIdentity.displayName!,
              avatar: storedAvatar,
            },
          })
        }, 1500)
      } else {
        // Need to check on-chain for nickname
        try {
          const response = await fetch(`/api/nicknames/address/${address}`)
          if (response.ok) {
            const data = await response.json()
            if (data.nickname) {
              // Has nickname, skip to avatar if needed
              setState(prev => ({
                ...prev,
                address,
                nickname: data.nickname,
                step: storedIdentity?.avatar ? 'success' : 'avatar',
              }))
              return
            }
          }
        } catch {
          // Continue to nickname step if lookup fails
        }

        // New profile needed
        setState(prev => ({
          ...prev,
          address,
          step: 'nickname',
        }))
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed'

      // Check if user cancelled
      if (message.toLowerCase().includes('cancel') || message.toLowerCase().includes('abort')) {
        setState(prev => ({
          ...prev,
          step: 'welcome',
          error: null,
        }))
        return
      }

      setState(prev => ({
        ...prev,
        step: 'error',
        error: message,
      }))
    } finally {
      resetPorto()
    }
  }, [onComplete, storedIdentity])

  // Handle create account (new user)
  const handleCreateAccount = useCallback(async () => {
    setState(prev => ({ ...prev, step: 'connecting', error: null }))

    try {
      if (!containerRef.current) throw new Error('Container not ready')

      const result = await createAccount({ container: containerRef.current })

      if (!result.success) {
        throw new Error(result.error.message || 'No address returned from passkey creation')
      }

      setState(prev => ({
        ...prev,
        address: result.address as `0x${string}`,
        step: 'nickname',
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Account creation failed'

      if (message.toLowerCase().includes('cancel') || message.toLowerCase().includes('abort')) {
        setState(prev => ({
          ...prev,
          step: 'welcome',
          error: null,
        }))
        return
      }

      setState(prev => ({
        ...prev,
        step: 'error',
        error: message,
      }))
    } finally {
      resetPorto()
    }
  }, [])

  // Handle nickname claim
  const handleNicknameClaim = useCallback(async (nickname: string) => {
    if (!state.address) return

    try {
      // Claim nickname via API
      const response = await fetch('/api/nicknames/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: state.address,
          nickname,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to claim nickname')
      }

      setState(prev => ({
        ...prev,
        nickname,
        step: 'avatar',
      }))
    } catch (error) {
      // Still proceed to avatar - nickname claim can be retried
      console.error('Nickname claim error:', error)
      setState(prev => ({
        ...prev,
        nickname,
        step: 'avatar',
      }))
    }
  }, [state.address])

  // Handle avatar selection
  const handleAvatarSelect = useCallback((avatar: AvatarConfig) => {
    if (!state.address || !state.nickname) return

    // Save to store
    setIdentity({
      address: state.address,
      displayName: state.nickname,
      avatar,
      createdAt: Date.now(),
    })

    setState(prev => ({
      ...prev,
      avatar,
      step: 'success',
    }))

    // Complete after celebration animation
    setTimeout(() => {
      onComplete({
        success: true,
        identity: {
          address: state.address!,
          nickname: state.nickname!,
          avatar,
        },
      })
    }, 1500)
  }, [state.address, state.nickname, setIdentity, onComplete])

  // Handle retry
  const handleRetry = useCallback(() => {
    resetPorto()
    setState(prev => ({
      ...prev,
      step: 'welcome',
      error: null,
    }))
  }, [])

  // Handle back navigation
  const handleBack = useCallback(() => {
    setState(prev => {
      switch (prev.step) {
        case 'nickname':
          return { ...prev, step: 'welcome' }
        case 'avatar':
          return { ...prev, step: 'nickname' }
        default:
          return prev
      }
    })
  }, [])

  // Check nickname availability
  const checkNicknameAvailability = useCallback(async (nickname: string) => {
    try {
      const response = await fetch(`/api/nicknames/check?nickname=${encodeURIComponent(nickname)}`)
      const data = await response.json()
      return {
        available: data.available,
        suggestion: data.suggestion,
      }
    } catch {
      return { available: true } // Optimistic fallback
    }
  }, [])

  // Animation variants
  const pageVariants = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, x: 20 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 },
      }

  const transition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.3, ease: 'easeInOut' as const }

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col">
      {/* Back button - shown on nickname/avatar steps */}
      {(state.step === 'nickname' || state.step === 'avatar') && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-4 left-4 z-10"
        >
          <button
            onClick={handleBack}
            className="p-2 rounded-full hover:bg-cream-100 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-6 h-6 text-ink" />
          </button>
        </motion.div>
      )}

      {/* Porto container - hidden but needed for passkey flow */}
      <div
        ref={containerRef}
        className={`
          fixed inset-0 z-50 bg-cream-50
          ${state.step === 'connecting' ? 'block' : 'hidden'}
        `}
      />

      {/* Main content */}
      <AnimatePresence mode="wait">
        {state.step === 'welcome' && (
          <motion.div
            key="welcome"
            {...pageVariants}
            transition={transition}
            className="flex-1"
          >
            <SignInWelcome
              onSignIn={handleSignIn}
              onCreateAccount={handleCreateAccount}
            />
          </motion.div>
        )}

        {state.step === 'connecting' && (
          <motion.div
            key="connecting"
            {...pageVariants}
            transition={transition}
            className="flex-1 flex items-center justify-center"
          >
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 text-accent-yellow animate-spin mx-auto" />
              <p className="text-ink-muted">Connecting...</p>
            </div>
          </motion.div>
        )}

        {state.step === 'nickname' && state.address && (
          <motion.div
            key="nickname"
            {...pageVariants}
            transition={transition}
            className="flex-1 flex items-center justify-center p-6"
          >
            <div className="w-full max-w-sm">
              <NicknameSelection
                onClaim={handleNicknameClaim}
                checkAvailability={checkNicknameAvailability}
              />
            </div>
          </motion.div>
        )}

        {state.step === 'avatar' && state.address && (
          <motion.div
            key="avatar"
            {...pageVariants}
            transition={transition}
            className="flex-1 flex items-center justify-center p-6"
          >
            <div className="w-full max-w-sm">
              <AvatarSelection
                walletAddress={state.address}
                onSelect={handleAvatarSelect}
                timerDuration={30}
              />
            </div>
          </motion.div>
        )}

        {state.step === 'success' && (
          <motion.div
            key="success"
            {...pageVariants}
            transition={transition}
            className="flex-1 flex items-center justify-center"
          >
            <div className="text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              >
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
              </motion.div>
              <h2 className="text-2xl font-serif text-ink">Welcome!</h2>
              <p className="text-ink-muted">
                {state.nickname ? `@${state.nickname}` : 'Setting up your profile...'}
              </p>
            </div>
          </motion.div>
        )}

        {state.step === 'error' && (
          <motion.div
            key="error"
            {...pageVariants}
            transition={transition}
            className="flex-1 flex items-center justify-center p-6"
          >
            <div className="text-center space-y-6 max-w-sm">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              >
                <XCircle className="w-16 h-16 text-red-500 mx-auto" />
              </motion.div>
              <div className="space-y-2">
                <h2 className="text-2xl font-serif text-ink">Something went wrong</h2>
                <p className="text-ink-muted text-sm">{state.error}</p>
              </div>
              <Button size="lg" onClick={handleRetry} className="w-full">
                Try Again
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
