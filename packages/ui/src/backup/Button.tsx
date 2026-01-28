import { forwardRef, type ButtonHTMLAttributes } from "react";
import { clsx } from "clsx";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "destructive";
  size?: "sm" | "default" | "lg";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "default",
      disabled,
      loading,
      children,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={clsx(
          "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150",
          "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-cream-50",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "active:scale-[0.98]",
          {
            "bg-accent-yellow text-accent-brown hover:bg-villa-600 focus:ring-accent-yellow":
              variant === "primary",
            "bg-cream-100 text-ink hover:bg-cream-200 border border-neutral-200 focus:ring-accent-yellow":
              variant === "secondary",
            "text-ink-muted hover:text-ink hover:bg-cream-100 focus:ring-neutral-200":
              variant === "ghost",
            "border-2 border-accent-yellow text-accent-brown hover:bg-accent-yellow/10 focus:ring-accent-yellow":
              variant === "outline",
            "bg-error-text text-white hover:bg-red-700 focus:ring-error-text":
              variant === "destructive",
            "min-h-11 px-3 py-2 text-sm": size === "sm",
            "min-h-11 px-4 py-2 text-base": size === "default",
            "min-h-14 px-6 py-4 text-lg": size === "lg",
          },
          className,
        )}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg
              className="w-4 h-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            {children}
          </span>
        ) : (
          children
        )}
      </button>
    );
  },
);

Button.displayName = "Button";
