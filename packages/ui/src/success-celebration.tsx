'use client';

import { clsx } from 'clsx';
import { Check } from 'lucide-react';
import { useEffect } from 'react';
import { LottieAnimation } from './lottie-animation';
import { useMotionReduce } from '@/lib/hooks';
import successAnimationData from '@/../public/animations/success.json';

interface SuccessCelebrationProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onComplete?: () => void;
}

const sizeClasses = { sm: 'w-16 h-16', md: 'w-24 h-24', lg: 'w-32 h-32' };
const checkSizes = { sm: 24, md: 36, lg: 48 };

function StaticCheckmark({ size }: { size: 'sm' | 'md' | 'lg' }) {
  return (
    <div className={clsx(sizeClasses[size], 'relative flex items-center justify-center rounded-full bg-green-500')}>
      <Check className="text-white" size={checkSizes[size]} strokeWidth={3} aria-hidden="true" />
    </div>
  );
}

/**
 * Success celebration animation using Lottie
 *
 * Green circle with checkmark and particle burst.
 * Respects prefers-reduced-motion with static fallback.
 */
export function SuccessCelebration({ size = 'md', className, onComplete }: SuccessCelebrationProps) {
  const prefersReducedMotion = useMotionReduce();

  // Animation duration is ~750ms (45 frames at 60fps)
  useEffect(() => {
    if (onComplete) {
      const timer = setTimeout(onComplete, 750);
      return () => clearTimeout(timer);
    }
  }, [onComplete]);

  return (
    <div className={clsx('relative', sizeClasses[size], className)}>
      <LottieAnimation
        animationData={successAnimationData}
        loop={false}
        className="w-full h-full"
        fallback={
          prefersReducedMotion ? <StaticCheckmark size={size} /> : undefined
        }
      />
    </div>
  );
}
