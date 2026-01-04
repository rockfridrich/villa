'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Dices } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui'
import { AvatarPreview } from './AvatarPreview'
import { createAvatarConfig } from '@/lib/avatar'
import type { AvatarStyleSelection, AvatarConfig } from '@/types'

interface AvatarSelectionProps {
  /** Wallet address for avatar generation */
  walletAddress: string
  /** Callback when avatar is selected */
  onSelect: (config: AvatarConfig) => void
  /** Timer duration in seconds (default 30) */
  timerDuration?: number
}

const STYLE_OPTIONS: { value: AvatarStyleSelection; label: string; description: string }[] = [
  { value: 'female', label: 'Female', description: 'Long hair styles' },
  { value: 'male', label: 'Male', description: 'Short hair styles' },
  { value: 'other', label: 'Other', description: 'Fun robots' },
]

/**
 * Avatar selection component with timer
 * Per product spec: 30-second countdown, auto-select at 0
 */
export function AvatarSelection({
  walletAddress,
  onSelect,
  timerDuration = 30,
}: AvatarSelectionProps) {
  const [selection, setSelection] = useState<AvatarStyleSelection>('female')
  const [variant, setVariant] = useState(0)
  const [timer, setTimer] = useState(timerDuration)
  const [isSelecting, setIsSelecting] = useState(false)
  const [rollCount, setRollCount] = useState(0)
  const [isRolling, setIsRolling] = useState(false)

  // Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Check for reduced motion preference
  const prefersReducedMotion = useRef(
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  ).current

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  // Timer countdown
  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (!isMounted.current) return

      setTimer((t) => {
        if (t <= 1) {
          // Auto-select when timer reaches 0
          handleSelect()
          return 0
        }
        return t - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = useCallback(() => {
    if (isSelecting) return
    setIsSelecting(true)

    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    const config = createAvatarConfig(selection, variant)
    onSelect(config)
  }, [selection, variant, onSelect, isSelecting])

  const handleRandomize = () => {
    setIsRolling(true)
    setVariant((v) => v + 1)
    setRollCount((c) => c + 1)

    // Reset rolling animation
    setTimeout(() => setIsRolling(false), 300)
  }

  const handleStyleChange = (newSelection: AvatarStyleSelection) => {
    setSelection(newSelection)
    // Reset variant when changing style for fresh look
    setVariant(0)
  }

  // Timer styling based on remaining time
  const timerColor = timer <= 5 ? 'text-red-500' : timer <= 10 ? 'text-amber-500' : 'text-ink-muted'
  const timerPulse = timer <= 5 ? 'animate-pulse' : ''

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-serif text-ink">Pick your look</h2>
        <p className="text-ink-muted text-sm">
          Choose a style that represents you
        </p>
      </div>

      {/* Style selector - 3 options */}
      <div className="flex gap-3 justify-center max-w-sm mx-auto">
        {STYLE_OPTIONS.map((option) => (
          <motion.button
            key={option.value}
            onClick={() => handleStyleChange(option.value)}
            disabled={isSelecting}
            whileHover={!isSelecting && !prefersReducedMotion ? { scale: 1.02 } : {}}
            transition={{ duration: 0.15 }}
            className={`
              flex-1 flex flex-col items-center gap-2 p-3 rounded-xl transition-all
              ${selection === option.value
                ? 'bg-accent-yellow border-2 border-accent-brown shadow-md'
                : 'bg-cream-100 border-2 border-transparent hover:border-cream-300'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            style={{
              scale: selection === option.value && !prefersReducedMotion ? 1.05 : 1
            }}
          >
            <div className="w-14 h-14 rounded-full overflow-hidden bg-cream-200 shadow-sm">
              <AvatarPreview
                walletAddress={walletAddress}
                selection={option.value}
                variant={0}
                size={56}
              />
            </div>
            <span className="text-sm font-medium text-ink">
              {option.label}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Avatar preview with randomize */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <AvatarPreview
            walletAddress={walletAddress}
            selection={selection}
            variant={variant}
            size={160}
            className="shadow-lg"
          />
        </div>

        {/* Playful Randomize Button */}
        <motion.button
          onClick={handleRandomize}
          disabled={isSelecting}
          whileHover={!isSelecting && !prefersReducedMotion ? { scale: 1.05 } : {}}
          whileTap={!isSelecting && !prefersReducedMotion ? { scale: 0.95 } : {}}
          transition={{ duration: 0.2 }}
          className={`
            group flex items-center gap-3 px-6 py-3
            bg-gradient-to-r from-purple-500 to-pink-500
            hover:from-purple-600 hover:to-pink-600
            text-white font-semibold rounded-full
            shadow-lg hover:shadow-xl
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          <motion.div
            animate={
              isRolling && !prefersReducedMotion
                ? { rotate: 360 }
                : { rotate: 0 }
            }
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <Dices className="w-5 h-5" />
          </motion.div>
          <span>Roll the dice!</span>
          {rollCount > 0 && (
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm">
              {rollCount}
            </span>
          )}
        </motion.button>
      </div>

      {/* Timer */}
      <motion.div
        className="text-center"
        initial={prefersReducedMotion ? {} : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <span className={`font-mono text-2xl ${timerColor} ${timerPulse}`}>
          0:{timer.toString().padStart(2, '0')}
        </span>
      </motion.div>

      {/* Select button */}
      <Button
        size="lg"
        className="w-full"
        onClick={() => handleSelect()}
        disabled={isSelecting}
      >
        {isSelecting ? 'Saving...' : 'Select'}
      </Button>

      {/* Helper text */}
      <p className="text-center text-xs text-ink-muted">
        {timer > 0
          ? 'Take your time, or let the timer choose for you'
          : 'Avatar selected!'}
      </p>
    </div>
  )
}
