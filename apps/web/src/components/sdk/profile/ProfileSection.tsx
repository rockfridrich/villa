'use client'

import { ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'

interface ProfileSectionProps {
  /** Section label */
  label: string
  /** Section content */
  children: React.ReactNode
  /** Optional action button */
  action?: {
    label: string
    onClick: () => void
    icon?: React.ReactNode
    variant?: 'default' | 'chevron'
  }
  /** Helper text below the section */
  helperText?: string
  /** Whether content is disabled/read-only */
  disabled?: boolean
}

/**
 * Profile section wrapper with consistent styling
 */
export function ProfileSection({
  label,
  children,
  action,
  helperText,
  disabled,
}: ProfileSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-ink-muted">{label}</label>
        {action && action.variant !== 'chevron' && (
          <motion.button
            onClick={action.onClick}
            disabled={disabled}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="text-sm font-medium text-villa-500 hover:text-villa-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 min-h-[44px] px-2"
          >
            {action.icon}
            {action.label}
          </motion.button>
        )}
      </div>

      {action?.variant === 'chevron' ? (
        <motion.button
          onClick={action.onClick}
          disabled={disabled}
          whileHover={{ scale: 1.005 }}
          whileTap={{ scale: 0.995 }}
          className="w-full flex items-center justify-between p-3 bg-cream-50 rounded-xl border border-cream-200 hover:border-cream-300 transition-colors min-h-[44px] disabled:opacity-50"
        >
          <div className="flex-1 text-left">{children}</div>
          <ChevronRight className="w-5 h-5 text-ink-muted" />
        </motion.button>
      ) : (
        <div
          className={`p-3 bg-cream-50 rounded-xl border border-cream-200 ${disabled ? 'opacity-60' : ''}`}
        >
          {children}
        </div>
      )}

      {helperText && (
        <p className="text-xs text-ink-muted px-1">{helperText}</p>
      )}
    </div>
  )
}
