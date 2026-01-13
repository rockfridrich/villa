'use client'

import { useRef } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui'

interface SignInWelcomeProps {
  /** Callback when user taps Sign In */
  onSignIn: () => void
  /** Callback when user taps Create Villa ID */
  onCreateAccount: () => void
  /** Loading state */
  isLoading?: boolean
  /** Which action is loading ('signin' | 'create') */
  loadingAction?: 'signin' | 'create'
}

/**
 * SDK Welcome screen - Entry point for auth flow
 * Per product spec: Two CTAs, headline, footer, 44px touch targets
 */
export function SignInWelcome({
  onSignIn,
  onCreateAccount,
  isLoading = false,
  loadingAction,
}: SignInWelcomeProps) {
  // Check for reduced motion preference
  const prefersReducedMotion = useRef(
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  ).current

  // Animation variants for entrance
  const containerVariants = prefersReducedMotion
    ? undefined
    : {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            duration: 0.3,
            staggerChildren: 0.1,
          },
        },
      }

  const itemVariants = prefersReducedMotion
    ? undefined
    : {
        hidden: { opacity: 0, y: 10 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.3 },
        },
      }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center justify-between min-h-screen p-6"
    >
      {/* Logo/Brand Area */}
      <motion.div variants={itemVariants} className="pt-20" />

      {/* Main Content */}
      <div className="w-full max-w-sm space-y-8">
        {/* Headline */}
        <motion.div variants={itemVariants} className="text-center space-y-2">
          <h1 className="text-3xl font-serif text-ink">
            Your identity. No passwords.
          </h1>
        </motion.div>

        {/* CTAs */}
        <motion.div variants={itemVariants} className="space-y-4">
          {/* Primary: Sign In */}
          <motion.div
            whileTap={prefersReducedMotion || isLoading ? {} : { scale: 0.98 }}
            transition={{ duration: 0.1 }}
          >
            <Button
              size="lg"
              variant="primary"
              onClick={onSignIn}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading && loadingAction === 'signin' ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </Button>
          </motion.div>

          {/* Secondary: Create Villa ID */}
          <motion.div
            whileTap={prefersReducedMotion || isLoading ? {} : { scale: 0.98 }}
            transition={{ duration: 0.1 }}
          >
            <Button
              size="lg"
              variant="secondary"
              onClick={onCreateAccount}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading && loadingAction === 'create' ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </span>
              ) : (
                'Create Villa ID'
              )}
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.div variants={itemVariants} className="pb-8">
        <p className="text-sm text-ink-muted text-center">
          Secured by passkeys
        </p>
      </motion.div>
    </motion.div>
  )
}
