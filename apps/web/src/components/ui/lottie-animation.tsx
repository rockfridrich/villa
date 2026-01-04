'use client';

import { useMemo } from 'react';
import Lottie, { type LottieComponentProps } from 'lottie-react';
import { clsx } from 'clsx';
import { useMotionReduce } from '@/lib/hooks';

interface LottieAnimationProps {
  /**
   * Lottie animation data (JSON object)
   */
  animationData: unknown;

  /**
   * Whether to loop the animation
   * @default true
   */
  loop?: boolean;

  /**
   * Whether to autoplay the animation
   * @default true
   */
  autoplay?: boolean;

  /**
   * Optional CSS class names
   */
  className?: string;

  /**
   * Fallback content when reduced motion is preferred
   * If not provided, shows first frame of animation
   */
  fallback?: React.ReactNode;
}

/**
 * Reusable Lottie animation component with motion-reduce support
 *
 * Respects user's prefers-reduced-motion setting:
 * - If reduced motion preferred, shows static first frame or fallback
 * - Otherwise, plays the animation normally
 */
export function LottieAnimation({
  animationData,
  loop = true,
  autoplay = true,
  className,
  fallback,
}: LottieAnimationProps) {
  const prefersReducedMotion = useMotionReduce();

  // Lottie options for reduced motion (show first frame only)
  const lottieOptions = useMemo<
    Omit<LottieComponentProps, 'animationData'>
  >(() => {
    if (prefersReducedMotion) {
      return {
        loop: false,
        autoplay: false,
        initialSegment: [0, 1], // Show only first frame
      };
    }

    return {
      loop,
      autoplay,
    };
  }, [prefersReducedMotion, loop, autoplay]);

  // If reduced motion and custom fallback provided, use it
  if (prefersReducedMotion && fallback) {
    return <div className={className}>{fallback}</div>;
  }

  // Otherwise render Lottie (static first frame if reduced motion)
  return (
    <Lottie
      animationData={animationData}
      {...lottieOptions}
      className={clsx(className)}
      aria-hidden="true"
    />
  );
}
