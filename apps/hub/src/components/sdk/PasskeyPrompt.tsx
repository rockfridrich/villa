'use client'

import { motion } from 'framer-motion'
import { Fingerprint, Scan } from 'lucide-react'

export interface PasskeyPromptProps {
  /** The mode of passkey operation */
  mode: 'create' | 'authenticate'
}

/**
 * PasskeyPrompt - Shows visual feedback during WebAuthn passkey operations
 *
 * Displays while browser's native biometric prompt is active.
 * Provides context about what's happening without blocking the native UI.
 */
export function PasskeyPrompt({ mode }: PasskeyPromptProps) {
  const isCreate = mode === 'create'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="w-full max-w-sm mx-6 bg-white rounded-2xl shadow-xl p-8 space-y-6"
      >
        {/* Animated icon */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="flex items-center justify-center"
        >
          {isCreate ? (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent-yellow to-villa-500 flex items-center justify-center">
              <Fingerprint className="w-10 h-10 text-accent-brown" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent-yellow to-villa-500 flex items-center justify-center">
              <Scan className="w-10 h-10 text-accent-brown" />
            </div>
          )}
        </motion.div>

        {/* Message */}
        <div className="text-center space-y-2">
          <h2 className="text-xl font-serif text-ink">
            {isCreate ? 'Creating your Villa ID' : 'Authenticating'}
          </h2>
          <p className="text-sm text-ink-light">
            {isCreate
              ? 'Use your fingerprint or face to secure your account'
              : 'Use your fingerprint or face to sign in'}
          </p>
        </div>

        {/* Pulsing indicator */}
        <div className="flex items-center justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
              className="w-2 h-2 rounded-full bg-accent-yellow"
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
