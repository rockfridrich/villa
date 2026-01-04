'use client';

import { useMemo } from 'react';
import Lottie, { type LottieComponentProps } from 'lottie-react';
import { clsx } from 'clsx';

interface LottieAnimationProps {
  animationData: unknown;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
  fallback?: React.ReactNode;
}

export function LottieAnimation({
  animationData,
  loop = true,
  autoplay = true,
  className,
  fallback,
}: LottieAnimationProps) {
  // Check for reduced motion preference
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const lottieOptions = useMemo<Omit<LottieComponentProps, 'animationData'>>(() => {
    if (prefersReducedMotion) {
      return {
        loop: false,
        autoplay: false,
        initialSegment: [0, 1],
      };
    }
    return { loop, autoplay };
  }, [prefersReducedMotion, loop, autoplay]);

  if (prefersReducedMotion && fallback) {
    return <div className={className}>{fallback}</div>;
  }

  return (
    <Lottie
      animationData={animationData}
      {...lottieOptions}
      className={clsx(className)}
      aria-hidden="true"
    />
  );
}
