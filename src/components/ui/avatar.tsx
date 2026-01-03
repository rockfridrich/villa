import { clsx } from 'clsx'

interface AvatarProps {
  src?: string
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getColorFromName(name: string): string {
  // Proof of Retreat palette - warm earth tones
  const colors = [
    'bg-accent-yellow',   // #ffe047
    'bg-accent-green',    // #698f69
    'bg-accent-brown',    // #382207
    'bg-amber-600',
    'bg-orange-700',
    'bg-rose-600',
    'bg-emerald-700',
    'bg-teal-600',
  ]

  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }

  return colors[Math.abs(hash) % colors.length]
}

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-20 h-20 text-xl',
  }

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={clsx(
          'rounded-full object-cover',
          sizeClasses[size],
          className
        )}
      />
    )
  }

  return (
    <div
      className={clsx(
        'rounded-full flex items-center justify-center font-medium text-white',
        sizeClasses[size],
        getColorFromName(name),
        className
      )}
    >
      {getInitials(name)}
    </div>
  )
}
