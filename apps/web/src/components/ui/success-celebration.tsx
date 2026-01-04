'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { clsx } from 'clsx';
import { Check } from 'lucide-react';
import { useEffect } from 'react';

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

export function SuccessCelebration({ size = 'md', className, onComplete }: SuccessCelebrationProps) {
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (onComplete) {
      const timer = setTimeout(onComplete, 600);
      return () => clearTimeout(timer);
    }
  }, [onComplete]);

  if (prefersReducedMotion) {
    return <div className={className}><StaticCheckmark size={size} /></div>;
  }

  return (
    <div className={clsx('relative', sizeClasses[size], className)}>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="absolute inset-0 rounded-full bg-green-500"
      />
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 15 }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <Check className="text-white" size={checkSizes[size]} strokeWidth={3} aria-hidden="true" />
      </motion.div>
      {[0, 1, 2, 3, 4].map((i) => {
        const angle = (i * 72 * Math.PI) / 180;
        const distance = size === 'sm' ? 40 : size === 'md' ? 50 : 60;
        return (
          <motion.div
            key={i}
            initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
            animate={{ scale: [0, 1, 0], x: Math.cos(angle) * distance, y: Math.sin(angle) * distance, opacity: [1, 1, 0] }}
            transition={{ delay: 0.2, duration: 0.4, ease: 'easeOut' }}
            className="absolute left-1/2 top-1/2 -ml-1 -mt-1 h-2 w-2 rounded-full bg-green-400"
            aria-hidden="true"
          />
        );
      })}
    </div>
  );
}
