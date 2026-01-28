import { forwardRef, type HTMLAttributes } from "react";
import { clsx } from "clsx";

export interface AuthErrorProps extends HTMLAttributes<HTMLDivElement> {
  message: string;
}

export const AuthError = forwardRef<HTMLDivElement, AuthErrorProps>(
  ({ className, message, ...props }, ref) => {
    if (!message) return null;

    return (
      <div
        ref={ref}
        role="alert"
        className={clsx(
          "p-3 bg-error-bg border border-error-border rounded-lg text-sm text-error-text",
          "animate-fade-in",
          className,
        )}
        {...props}
      >
        {message}
      </div>
    );
  },
);

AuthError.displayName = "AuthError";
