'use client';

import { clsx } from 'clsx';
import { useMotionReduce } from '@/lib/hooks';
// import { LottieAnimation } from './lottie-animation';

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

/**
 * Loading animation component
 *
 * Currently uses Tailwind's animate-pulse as fallback.
 * TODO: Replace with Lottie animation data when design provides JSON.
 *
 * Example with Lottie:
 * ```tsx
 * import loadingAnimation from '@/assets/animations/loading.json';
 *
 * return (
 *   <LottieAnimation
 *     animationData={loadingAnimation}
 *     loop
 *     className={sizeClasses[size]}
 *   />
 * );
 * ```
 */
export function LoadingAnimation({
  size = 'md',
  className
}: LoadingAnimationProps) {
  const prefersReducedMotion = useMotionReduce();

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

  // Fallback: Simple pulsing circles until we have Lottie JSON
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
      <div
        className={clsx(
          'absolute rounded-full bg-villa-500/30',
          prefersReducedMotion ? 'opacity-50' : 'animate-pulse',
          'w-full h-full'
        )}
      />
      <div
        className={clsx(
          'absolute rounded-full bg-villa-500/50',
          prefersReducedMotion ? 'opacity-70' : 'animate-pulse',
          'w-2/3 h-2/3'
        )}
        style={
          prefersReducedMotion
            ? undefined
            : { animationDelay: '150ms' }
        }
      />
      <div
        className={clsx(
          'absolute rounded-full bg-villa-500',
          prefersReducedMotion ? 'opacity-90' : 'animate-pulse',
          'w-1/3 h-1/3'
        )}
        style={
          prefersReducedMotion
            ? undefined
            : { animationDelay: '300ms' }
        }
      />
    </div>
  );
}
