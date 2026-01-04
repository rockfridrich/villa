import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { clsx } from 'clsx'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'default' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'default', disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={clsx(
          'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-150',
          'focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:ring-offset-2 focus:ring-offset-cream-50',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          {
            // Primary: Yellow background with brown text (Proof of Retreat style)
            'bg-accent-yellow text-accent-brown hover:bg-villa-600 active:bg-villa-700': variant === 'primary',
            // Secondary: Cream background with ink text
            'bg-cream-100 text-ink hover:bg-cream-200 border border-neutral-100': variant === 'secondary',
            // Ghost: Transparent with ink text
            'text-ink-light hover:text-ink hover:bg-cream-100': variant === 'ghost',
            'min-h-11 px-3 py-2 text-sm': size === 'sm',
            'min-h-11 px-4 py-2 text-base': size === 'default',
            'min-h-14 px-6 py-3 text-lg': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
