import { forwardRef, type HTMLAttributes } from "react";
import { clsx } from "clsx";

export interface AuthCardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
}

export const AuthCard = forwardRef<HTMLDivElement, AuthCardProps>(
  ({ className, title, description, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          "w-full max-w-sm mx-auto p-6 bg-white rounded-2xl shadow-villa",
          className,
        )}
        {...props}
      >
        {(title || description) && (
          <div className="text-center space-y-2 mb-6">
            {title && <h2 className="text-2xl font-serif text-ink">{title}</h2>}
            {description && (
              <p className="text-sm text-ink-muted">{description}</p>
            )}
          </div>
        )}
        {children}
      </div>
    );
  },
);

AuthCard.displayName = "AuthCard";
