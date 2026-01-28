import { forwardRef, type InputHTMLAttributes } from 'react'
import { clsx } from 'clsx'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          className={clsx(
            'w-full min-h-11 px-4 py-2 rounded-lg border text-base',
            'bg-cream-50 text-ink',
            'transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:ring-offset-2 focus:ring-offset-cream-50',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'placeholder:text-ink-muted',
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-neutral-100',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-500">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
