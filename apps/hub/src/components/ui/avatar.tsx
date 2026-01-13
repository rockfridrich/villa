import { clsx } from 'clsx'
import Image from 'next/image'
import type { AvatarConfig } from '@/types'
import { generateAvatarFromSelection } from '@/lib/avatar'

interface AvatarProps {
  /** Image URL, data URL, or AvatarConfig for DiceBear generation */
  src?: string | AvatarConfig
  /** Wallet address - required when src is AvatarConfig */
  walletAddress?: string
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

export function Avatar({ src, walletAddress, name, size = 'md', className }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-20 h-20 text-xl',
  }

  const sizePixels = {
    sm: 32,
    md: 48,
    lg: 80,
  }

  // Handle AvatarConfig - generate SVG from DiceBear
  if (src && typeof src === 'object' && 'selection' in src && walletAddress) {
    const svgString = generateAvatarFromSelection(walletAddress, src.selection, src.variant)
    const dataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`
    return (
      <img
        src={dataUrl}
        alt={name}
        width={sizePixels[size]}
        height={sizePixels[size]}
        className={clsx('rounded-full object-cover', sizeClasses[size], className)}
      />
    )
  }

  // Handle string src (URL or data URL)
  if (src && typeof src === 'string') {
    return (
      <Image
        src={src}
        alt={name}
        width={sizePixels[size]}
        height={sizePixels[size]}
        className={clsx(
          'rounded-full object-cover',
          sizeClasses[size],
          className
        )}
      />
    )
  }

  // Fallback to initials
  return (
    <div
      className={clsx(
        'rounded-full flex items-center justify-center font-medium text-cream-50',
        sizeClasses[size],
        getColorFromName(name),
        className
      )}
    >
      {getInitials(name)}
    </div>
  )
}
