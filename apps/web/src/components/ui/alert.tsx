'use client'

import { forwardRef, type HTMLAttributes } from 'react'
import { clsx } from 'clsx'

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive' | 'success'
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
            // Destructive: light pink/cream background with error styling
            'bg-[#fef0f0] text-[#dc2626] border-[#fecaca]': variant === 'destructive',
            // Success: light green background
            'bg-[#f0f9f0] text-accent-green border-[#d4e8d4]': variant === 'success',
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
