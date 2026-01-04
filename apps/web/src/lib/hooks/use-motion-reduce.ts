'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to detect user's motion preference
 * Returns true if user prefers reduced motion
 */
export function useMotionReduce(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}

/**
 * Returns animation duration based on motion preference
 * @param normalDuration Duration in ms when motion is allowed
 * @param reducedDuration Duration in ms when reduced motion preferred (default: 0)
 */
export function useAnimationDuration(
  normalDuration: number,
  reducedDuration: number = 0
): number {
  const prefersReducedMotion = useMotionReduce();
  return prefersReducedMotion ? reducedDuration : normalDuration;
}
