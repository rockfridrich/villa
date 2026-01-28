'use client'

import { forwardRef, type HTMLAttributes } from 'react'
import { clsx } from 'clsx'

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive' | 'success' | 'warning'
}

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="alert"
        className={clsx(
          'rounded-lg border p-4',
          {
            // Default: cream background with neutral border
            'bg-cream-100 text-ink border-neutral-200': variant === 'default',
            // Destructive: error styling using semantic tokens
            'bg-error-bg text-error-text border-error-border': variant === 'destructive',
            // Success: green background using semantic tokens
            'bg-success-bg text-success-text border-success-border': variant === 'success',
            // Warning: yellow accent using semantic tokens
            'bg-warning-bg text-warning-text border-warning-border': variant === 'warning',
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

Alert.displayName = 'Alert'

interface AlertTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

export const AlertTitle = forwardRef<HTMLHeadingElement, AlertTitleProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <h5
        ref={ref}
        className={clsx('mb-1 font-medium leading-none tracking-tight', className)}
        {...props}
      >
        {children}
      </h5>
    )
  }
)

AlertTitle.displayName = 'AlertTitle'

interface AlertDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {}

export const AlertDescription = forwardRef<HTMLParagraphElement, AlertDescriptionProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx('text-sm [&_p]:leading-relaxed', className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

AlertDescription.displayName = 'AlertDescription'
