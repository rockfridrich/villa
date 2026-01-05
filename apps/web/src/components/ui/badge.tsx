'use client'

import { forwardRef, type HTMLAttributes } from 'react'
import { clsx } from 'clsx'

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
  size?: 'sm' | 'default'
}

export const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', size = 'default', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'inline-flex items-center rounded-md font-medium transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:ring-offset-2',
          {
            // Default: yellow accent with brown text (Villa brand)
            'bg-accent-yellow text-accent-brown': variant === 'default',
            // Secondary: cream background with ink text
            'bg-cream-100 text-ink-muted': variant === 'secondary',
            // Destructive: error styling
            'bg-[#fecaca] text-[#dc2626]': variant === 'destructive',
            // Outline: bordered style
            'border border-neutral-200 text-ink-muted': variant === 'outline',
            // Sizes
            'px-2 py-0.5 text-xs': size === 'sm',
            'px-2.5 py-0.5 text-sm': size === 'default',
          },
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Badge.displayName = 'Badge'
