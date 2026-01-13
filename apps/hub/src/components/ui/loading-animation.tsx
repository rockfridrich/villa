'use client';

import { clsx } from 'clsx';
import { LottieAnimation } from './lottie-animation';
import loadingAnimationData from '@/../public/animations/loading.json';

interface LoadingAnimationProps {
  /**
   * Size variant
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Optional CSS class names
   */
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-16 h-16',
  lg: 'w-24 h-24',
};

/**
 * Loading animation component using Lottie
 *
 * Three pulsing dots that animate in sequence.
 * Respects prefers-reduced-motion by showing static first frame.
 */
export function LoadingAnimation({
  size = 'md',
  className
}: LoadingAnimationProps) {
  return (
    <div
      className={clsx(
        'relative flex items-center justify-center',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <LottieAnimation
        animationData={loadingAnimationData}
        loop
        className="w-full h-full"
        fallback={
          <div className="flex items-center justify-center gap-1">
            <div className="w-2 h-2 rounded-full bg-ink-muted" />
            <div className="w-2 h-2 rounded-full bg-ink-muted" />
            <div className="w-2 h-2 rounded-full bg-ink-muted" />
          </div>
        }
      />
    </div>
  );
}
