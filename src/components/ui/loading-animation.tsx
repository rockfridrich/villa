'use client';

import { clsx } from 'clsx';

interface LoadingAnimationProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingAnimation({ size = 'md', className }: LoadingAnimationProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

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
      <div className="absolute rounded-full bg-villa-500/30 animate-pulse w-full h-full" />
      <div
        className="absolute rounded-full bg-villa-500/50 animate-pulse w-2/3 h-2/3"
        style={{ animationDelay: '150ms' }}
      />
      <div
        className="absolute rounded-full bg-villa-500 animate-pulse w-1/3 h-1/3"
        style={{ animationDelay: '300ms' }}
      />
    </div>
  );
}
