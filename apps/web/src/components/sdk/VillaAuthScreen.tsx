'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ShieldCheck, Loader2, AlertCircle, ChevronDown, ChevronUp, Info, Key, Chrome } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import { setWebAuthnHandlers, createAccountHeadless, signInHeadless } from '@/lib/porto'
import { PasskeyPrompt } from './PasskeyPrompt'

export interface VillaAuthScreenProps {
  /** Callback when authentication succeeds */
  onSuccess?: (address: string) => void
  /** Callback when user cancels */
  onCancel?: () => void
  /** Optional custom logo component */
  logo?: React.ReactNode
}

/**
 * VillaAuthScreen - Full-screen authentication UI using Porto relay mode
 *
 * WARNING: This component uses relay mode which breaks 1Password and passkey
 * ecosystem integrations. Use VillaAuth.tsx for main onboarding flows.
 *
 * Only use VillaAuthScreen for:
 * - SDK iframe scenarios (where Porto dialog won't render)
 * - Mobile in-app browsers with limited dialog support
 * - Custom headless integrations where full UI control is required
 *
 * For main Villa onboarding, use VillaAuth which preserves 1Password support.
 * See LEARNINGS.md Pattern 50 for details.
 */
export function VillaAuthScreen({
  onSuccess,
  onCancel: _onCancel,
  logo,
}: VillaAuthScreenProps) {
  const [error, setError] = useState<string | null>(null)
  const [passkeyMode, setPasskeyMode] = useState<'idle' | 'create' | 'authenticate'>('idle')
  const [showEducation, setShowEducation] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingAction, setLoadingAction] = useState<'signin' | 'create' | null>(null)

  const shouldReduceMotion = useReducedMotion()

  // Check for reduced motion preference
  const prefersReducedMotion = useRef(
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  ).current

  const springConfig = { type: "spring", stiffness: 300, damping: 40 } as const

  const containerVariants = shouldReduceMotion ? undefined : {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.3, staggerChildren: 0.08 },
    },
  }

  const itemVariants = shouldReduceMotion ? undefined : {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  }

  // Set up WebAuthn handlers on mount
  useEffect(() => {
    setWebAuthnHandlers({
      onPasskeyCreate: async () => {
        // Passkey creation prompt will show
      },
      onPasskeyGet: async () => {
        // Passkey authentication prompt will show
      },
      onComplete: (_result) => {
        // Handled in individual handlers
      },
      onError: (_error) => {
        // Handled in individual handlers
      },
    })

    return () => {
      // Clean up handlers on unmount
      setWebAuthnHandlers({})
    }
  }, [onSuccess])

  const handleSignIn = async () => {
    setError(null)
    setIsLoading(true)
    setLoadingAction('signin')
    setPasskeyMode('authenticate') // Show PasskeyPrompt overlay

    const result = await signInHeadless()

    setPasskeyMode('idle')
    setIsLoading(false)
    setLoadingAction(null)

    if (result.success) {
      onSuccess?.(result.address)
    } else {
      setError(result.error?.message || 'Sign in failed')
    }
  }

  const handleCreateAccount = async () => {
    setError(null)
    setIsLoading(true)
    setLoadingAction('create')
    setPasskeyMode('create') // Show PasskeyPrompt overlay

    const result = await createAccountHeadless()

    setPasskeyMode('idle')
    setIsLoading(false)
    setLoadingAction(null)

    if (result.success) {
      onSuccess?.(result.address)
    } else {
      setError(result.error?.message || 'Account creation failed')
    }
  }

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col min-h-[100dvh] justify-between p-6 bg-cream-50"
      >
        {/* Top: Logo */}
        <motion.div variants={itemVariants} className="pt-20">
          {logo || (
            <div className="text-center">
              <h1 className="text-2xl font-serif text-ink">Villa</h1>
            </div>
          )}
        </motion.div>

        {/* Center: Content */}
        <div className="w-full max-w-sm mx-auto space-y-6">
          {/* Headline */}
          <motion.div variants={itemVariants} className="text-center space-y-3">
            <h1 className="text-3xl font-serif text-ink leading-tight">
              Your identity.{' '}
              <span className="bg-gradient-to-r from-accent-yellow to-accent-green bg-clip-text text-transparent">
                No passwords.
              </span>
            </h1>
            <p className="text-sm text-ink-muted max-w-xs mx-auto">
              Sign in with your fingerprint, face, or security key
            </p>
          </motion.div>

          {/* Passkey Education - Expandable */}
          <motion.div variants={itemVariants}>
            <button
              onClick={() => setShowEducation(!showEducation)}
              className="w-full flex items-center justify-between p-4 bg-cream-100 hover:bg-cream-200 rounded-lg transition-colors duration-150 motion-reduce:transition-none"
              aria-expanded={showEducation}
              aria-controls="passkey-education"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-ink">
                <Info className="w-4 h-4 text-accent-brown" />
                Why passkeys?
              </span>
              {showEducation ? (
                <ChevronUp className="w-4 h-4 text-ink-muted" />
              ) : (
                <ChevronDown className="w-4 h-4 text-ink-muted" />
              )}
            </button>

            <AnimatePresence>
              {showEducation && (
                <motion.div
                  id="passkey-education"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 space-y-3 text-sm text-ink-light bg-white border border-neutral-100 rounded-lg mt-2">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 text-accent-green flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-ink">Phishing-resistant</p>
                        <p className="text-xs text-ink-muted mt-1">No passwords to steal or guess</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 text-accent-green flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-ink">Biometric security</p>
                        <p className="text-xs text-ink-muted mt-1">Face ID, Touch ID, or fingerprint</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 text-accent-green flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-ink">Works everywhere</p>
                        <p className="text-xs text-ink-muted mt-1">Sync across devices automatically</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-error-text bg-error-bg border border-error-border p-3 rounded-lg"
              role="alert"
              aria-live="polite"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </motion.div>
          )}

          {/* CTAs */}
          <motion.div variants={itemVariants} className="space-y-4">
            {/* Primary: Sign In */}
            <motion.button
              whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
              transition={springConfig}
              onClick={handleSignIn}
              disabled={isLoading}
              aria-label="Sign in with existing passkey"
              className="w-full min-h-14 px-6 py-3 text-base font-medium
                         bg-gradient-to-br from-accent-yellow via-villa-500 to-accent-yellow
                         hover:from-villa-600 hover:to-villa-700
                         text-accent-brown rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:ring-offset-2
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors duration-150 motion-reduce:transition-none"
            >
              {isLoading && loadingAction === 'signin' ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </motion.button>

            {/* Secondary: Create Villa ID */}
            <motion.button
              whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
              transition={springConfig}
              onClick={handleCreateAccount}
              disabled={isLoading}
              aria-label="Create new Villa ID with passkey"
              className="w-full min-h-14 px-6 py-3 text-base font-medium
                         bg-cream-100 hover:bg-cream-200
                         text-ink border border-neutral-100 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:ring-offset-2
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors duration-150 motion-reduce:transition-none"
            >
              {isLoading && loadingAction === 'create' ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </span>
              ) : (
                'Create Villa ID'
              )}
            </motion.button>
          </motion.div>

          {/* Supported Providers */}
          <motion.div
            variants={itemVariants}
            className="pt-4"
          >
            <p className="text-xs text-center text-ink-muted mb-3">Works with your device biometric</p>
            <div className="grid grid-cols-3 gap-3">
              {/* Row 1: Device Biometric Options */}
              <div className="flex flex-col items-center gap-2 p-3 bg-white rounded-lg border border-neutral-100">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                  <Key className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs text-ink-muted">iCloud</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-3 bg-white rounded-lg border border-neutral-100">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-green-600 flex items-center justify-center">
                  <span className="text-white text-xl font-bold">G</span>
                </div>
                <span className="text-xs text-ink-muted">Google</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-3 bg-white rounded-lg border border-neutral-100">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                  <span className="text-white text-xl font-bold">W</span>
                </div>
                <span className="text-xs text-ink-muted">Windows</span>
              </div>
              {/* Row 2: Browser & Hardware */}
              <div className="flex flex-col items-center gap-2 p-3 bg-white rounded-lg border border-neutral-100">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                  <Chrome className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs text-ink-muted">Browser</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-3 bg-white rounded-lg border border-neutral-100">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-600 to-blue-600 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs text-ink-muted">FIDO2</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-3 bg-white rounded-lg border border-neutral-100">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">1P</span>
                </div>
                <span className="text-xs text-ink-muted">1Password</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom: Trust Badge */}
        <motion.div
          variants={itemVariants}
          className="pb-8 flex items-center justify-center gap-2"
        >
          <ShieldCheck className="w-4 h-4 text-accent-green" />
          <span className="text-sm text-ink-muted">Secured by passkeys on Base</span>
        </motion.div>
      </motion.div>

      {/* PasskeyPrompt overlay - shows during WebAuthn ceremony */}
      <AnimatePresence>
        {passkeyMode !== 'idle' && (
          <PasskeyPrompt mode={passkeyMode} />
        )}
      </AnimatePresence>
    </>
  )
}
