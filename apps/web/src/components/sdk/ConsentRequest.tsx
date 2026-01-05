'use client'

import { useRef } from 'react'
import { Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'

interface Permission {
  type: 'identity:read' | 'credentials:read' | 'storage:app' | 'storage:shared:read'
  label: string
  value?: string // e.g., nickname value to show
}

interface ConsentRequestProps {
  appName: string
  appLogo?: string
  permissions: Permission[]
  onAllow: () => void
  onDeny: () => void
}

/**
 * Consent request screen for SDK authorization flow
 * Shows app name, permissions being requested, and allow/deny actions
 */
export function ConsentRequest({
  appName,
  appLogo,
  permissions,
  onAllow,
  onDeny,
}: ConsentRequestProps) {
  // Check for reduced motion preference
  const prefersReducedMotion = useRef(
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  ).current

  return (
    <div className="space-y-6">
      {/* Header with app logo and name */}
      <div className="text-center space-y-4">
        {appLogo && (
          <motion.div
            className="flex justify-center"
            initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <img
              src={appLogo}
              alt={`${appName} logo`}
              className="w-16 h-16 rounded-xl shadow-sm"
            />
          </motion.div>
        )}
        <motion.div
          className="space-y-2"
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <h2 className="text-2xl font-serif text-ink">
            {appName} wants access to:
          </h2>
        </motion.div>
      </div>

      {/* Permission list with checkmarks */}
      <motion.div
        className="space-y-3 bg-cream-100 rounded-xl p-4 border border-cream-200"
        initial={prefersReducedMotion ? {} : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        {permissions.map((permission, index) => (
          <motion.div
            key={permission.type}
            className="flex items-start gap-3"
            initial={prefersReducedMotion ? {} : { opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.3,
              delay: 0.3 + index * 0.1,
            }}
          >
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-5 h-5 bg-accent-yellow rounded-full flex items-center justify-center">
                <Check className="w-3.5 h-3.5 text-accent-brown" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-ink text-base">
                {permission.label}
                {permission.value && (
                  <span className="text-ink-muted ml-1">({permission.value})</span>
                )}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Actions */}
      <motion.div
        className="space-y-3"
        initial={prefersReducedMotion ? {} : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.4 + permissions.length * 0.1 }}
      >
        <motion.div
          whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
          transition={{ duration: 0.1 }}
        >
          <Button
            size="lg"
            variant="primary"
            className="w-full"
            onClick={onAllow}
          >
            Allow
          </Button>
        </motion.div>
        <motion.div
          whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
          transition={{ duration: 0.1 }}
        >
          <Button
            size="lg"
            variant="ghost"
            className="w-full"
            onClick={onDeny}
          >
            Deny
          </Button>
        </motion.div>
      </motion.div>

      {/* Helper text */}
      <motion.p
        className="text-center text-xs text-ink-muted"
        initial={prefersReducedMotion ? {} : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.5 + permissions.length * 0.1 }}
      >
        You can revoke access at any time in your Villa settings
      </motion.p>
    </div>
  )
}
