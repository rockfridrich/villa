'use client';

import { type ReactNode, isValidElement } from 'react';
import { clsx } from 'clsx';

interface EmptyStateProps {
  /**
   * The title to display
   */
  title: string;

  /**
   * The description text to display
   */
  description: string;

  /**
   * Optional action button or element
   */
  action?: ReactNode;

  /**
   * Optional illustration
   * Can be either Lottie animation data or a React node
   * Note: Lottie support will be added when LottieAnimation component exists
   */
  illustration?: ReactNode;

  /**
   * Optional CSS class names
   */
  className?: string;
}

/**
 * EmptyState component for displaying empty states
 *
 * Follows Villa design principles:
 * - 8pt spacing grid (p-6, gap-4)
 * - Typography hierarchy (text-lg for title, text-sm for description)
 * - Respects motion-reduce preference
 * - Centered flex column layout
 */
export function EmptyState({
  title,
  description,
  action,
  illustration,
  className,
}: EmptyStateProps) {
  return (
    <div className={clsx('flex flex-col items-center justify-center p-6 gap-4 text-center', className)}>
      {/* Illustration */}
      {illustration ? (
        <div className="w-24 h-24 flex items-center justify-center">
          {illustration}
        </div>
      ) : (
        /* Default placeholder if no illustration provided */
        <div className="w-24 h-24 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Text content */}
      <div className="flex flex-col gap-2 max-w-prose">
        <h3 className="text-lg font-semibold text-slate-900">
          {title}
        </h3>
        <p className="text-sm text-slate-600">
          {description}
        </p>
      </div>

      {/* Optional action */}
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  );
}
