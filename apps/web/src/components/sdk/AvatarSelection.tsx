'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Dices, Sparkles } from 'lucide-react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Button, SuccessCelebration } from '@/components/ui'
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

// Playful messages based on roll count
const getRollMessage = (count: number): string => {
  if (count === 0) return 'Feeling lucky?'
  if (count === 1) return 'One more spin!'
  if (count === 2) return 'Jackpot!'
  if (count === 3) return 'Still searching?'
  if (count <= 5) return 'Keep rolling!'
  if (count <= 9) return `${count} rolls - indecisive much? 😄`
  return '🎰 Casino champion!'
}

// Easter egg message for 10+ rolls
const getStreakMessage = (count: number): string => {
  if (count === 10) return '🎉 10 rolls! You really like variety!'
  if (count === 20) return '🌟 20 rolls! Professional avatar picker!'
  if (count === 50) return '🏆 50 ROLLS! You are a legend!'
  return ''
}

// Confetti particle component using Framer Motion
const ConfettiParticle = ({ delay, angle }: { delay: number; angle: number }) => {
  const shouldReduce = useReducedMotion()
  if (shouldReduce) return null

  const distance = 80 + Math.random() * 40
  const colors = ['bg-purple-500', 'bg-pink-500', 'bg-yellow-400', 'bg-blue-500', 'bg-green-500']
  const color = colors[Math.floor(Math.random() * colors.length)]

  return (
    <motion.div
      initial={{ scale: 0, x: 0, y: 0, opacity: 1, rotate: 0 }}
      animate={{
        scale: [0, 1, 0.5, 0],
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance - 20,
        opacity: [1, 1, 0.8, 0],
        rotate: 360 + Math.random() * 360,
      }}
      transition={{ delay, duration: 0.8, ease: 'easeOut' }}
      className={`absolute left-1/2 top-1/2 -ml-1 -mt-1 h-2 w-2 rounded-sm ${color}`}
      aria-hidden="true"
    />
  )
}

/**
 * Avatar selection component with timer
 * Per product spec: 30-second countdown, auto-select at 0
 * Enhanced with playful animations and gamification
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
  const [isCelebrating, setIsCelebrating] = useState(false)
  const [rollCount, setRollCount] = useState(0)
  const [isRolling, setIsRolling] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [slotMachineVariants, setSlotMachineVariants] = useState<number[]>([])
  const [currentSlotIndex, setCurrentSlotIndex] = useState(0)
  const [showStreakMessage, setShowStreakMessage] = useState(false)

  // Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const shouldReduceMotion = useReducedMotion()

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
    setIsCelebrating(true)

    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    // Show celebration, then complete after animation
    // 1500ms for reliable CI assertion timing (see LEARNINGS.md #16)
    setTimeout(() => {
      const config = createAvatarConfig(selection, variant)
      onSelect(config)
    }, 1500)
  }, [selection, variant, onSelect, isSelecting])

  const handleRandomize = () => {
    setIsRolling(true)
    setShowConfetti(true)

    // Increment roll count
    const newCount = rollCount + 1
    setRollCount(newCount)

    // Show easter egg message for milestone rolls
    const streakMsg = getStreakMessage(newCount)
    if (streakMsg) {
      setShowStreakMessage(true)
      setTimeout(() => setShowStreakMessage(false), 3000)
    }

    // Slot machine animation: cycle through 5-6 variants quickly
    if (!prefersReducedMotion) {
      const cycleCount = 6
      const variants = Array.from({ length: cycleCount }, (_, i) => variant + i + 1)
      setSlotMachineVariants(variants)
      setCurrentSlotIndex(0)

      // Cycle through variants with increasing delays (slot machine effect)
      variants.forEach((_, index) => {
        setTimeout(() => {
          if (isMounted.current) {
            setCurrentSlotIndex(index)
            if (index === variants.length - 1) {
              // Final variant
              setVariant(variants[index])
              setIsRolling(false)
              setSlotMachineVariants([])
            }
          }
        }, index * 100) // Speed up: 100ms per cycle
      })
    } else {
      // No animation, just update variant
      setVariant((v) => v + 1)
      setIsRolling(false)
    }

    // Hide confetti after animation
    setTimeout(() => setShowConfetti(false), 800)
  }

  const handleStyleChange = (newSelection: AvatarStyleSelection) => {
    setSelection(newSelection)
    // Reset variant when changing style for fresh look
    setVariant(0)
  }

  // Timer styling based on remaining time
  const timerColor = timer <= 5 ? 'text-red-500' : timer <= 10 ? 'text-amber-500' : 'text-ink-muted'
  const isTimerCritical = timer <= 5 && timer > 0

  // Get current display variant (slot machine or final)
  const displayVariant = slotMachineVariants.length > 0
    ? slotMachineVariants[currentSlotIndex]
    : variant

  // Show celebration overlay when selecting
  if (isCelebrating) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <div className="text-center space-y-6 py-8">
          <div className="flex justify-center">
            <SuccessCelebration size="lg" />
          </div>
          <div className="space-y-2">
            <motion.h2
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-serif text-ink"
            >
              {timer === 0 ? "Time's up!" : 'Perfect!'}
            </motion.h2>
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-ink-muted"
            >
              Your avatar is set
            </motion.p>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-serif text-ink">Pick your look</h2>
        <p className="text-ink-muted text-sm">
          Choose a style that represents you
        </p>
      </div>

      {/* Style selector - 3 options with swipe support on mobile */}
      <div className="flex gap-3 justify-center max-w-sm mx-auto touch-pan-x">
        {STYLE_OPTIONS.map((option) => (
          <motion.button
            key={option.value}
            onClick={() => handleStyleChange(option.value)}
            disabled={isSelecting}
            whileHover={!isSelecting && !shouldReduceMotion ? { scale: 1.05, y: -2 } : {}}
            whileTap={!isSelecting && !shouldReduceMotion ? { scale: 0.98 } : {}}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            className={`
              relative flex-1 flex flex-col items-center gap-2 p-3 rounded-xl transition-all min-w-11 min-h-11
              ${selection === option.value
                ? 'bg-accent-yellow border-2 border-accent-brown shadow-md'
                : 'bg-cream-100 border-2 border-transparent hover:border-cream-300'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {/* Glow effect on selected */}
            {selection === option.value && !shouldReduceMotion && (
              <motion.div
                layoutId="glow"
                className="absolute inset-0 rounded-xl bg-accent-yellow opacity-50 blur-md"
                initial={false}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <motion.div
              className="w-14 h-14 rounded-full overflow-hidden bg-cream-200 shadow-sm relative z-10"
              animate={selection === option.value && !shouldReduceMotion ? {
                scale: [1, 1.1, 1],
              } : {}}
              transition={{ duration: 0.3 }}
            >
              <AvatarPreview
                walletAddress={walletAddress}
                selection={option.value}
                variant={0}
                size={56}
              />
            </motion.div>
            <span className="text-sm font-medium text-ink relative z-10">
              {option.label}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Avatar preview with randomize and confetti */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          {/* Confetti particles */}
          <AnimatePresence>
            {showConfetti && !shouldReduceMotion && (
              <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: 12 }).map((_, i) => (
                  <ConfettiParticle
                    key={i}
                    delay={i * 0.05}
                    angle={(i * 30 * Math.PI) / 180}
                  />
                ))}
              </div>
            )}
          </AnimatePresence>

          {/* Avatar with bounce and morph */}
          <motion.div
            animate={!shouldReduceMotion ? {
              scale: isRolling ? [1, 1.1, 1] : 1,
              rotate: isRolling ? [0, -5, 5, -5, 0] : 0,
            } : {}}
            transition={{ duration: 0.5 }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={displayVariant}
                initial={!shouldReduceMotion ? { opacity: 0, scale: 0.8 } : {}}
                animate={{ opacity: 1, scale: 1 }}
                exit={!shouldReduceMotion ? { opacity: 0, scale: 1.2 } : {}}
                transition={{ duration: 0.15 }}
              >
                <AvatarPreview
                  walletAddress={walletAddress}
                  selection={selection}
                  variant={displayVariant}
                  size={160}
                  className="shadow-lg rounded-full"
                />
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Playful Randomize Button with dynamic message */}
        <div className="flex flex-col items-center gap-2">
          <motion.button
            onClick={handleRandomize}
            disabled={isSelecting}
            whileHover={!isSelecting && !shouldReduceMotion ? { scale: 1.05 } : {}}
            whileTap={!isSelecting && !shouldReduceMotion ? { scale: 0.95 } : {}}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            className={`
              group flex items-center gap-3 px-6 py-3 min-h-11
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
                isRolling && !shouldReduceMotion
                  ? { rotate: [0, 360, 720, 1080] }
                  : { rotate: 0 }
              }
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <Dices className="w-5 h-5" />
            </motion.div>
            <span>{getRollMessage(rollCount)}</span>
            {rollCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-white/20 px-2 py-0.5 rounded-full text-sm font-bold"
              >
                {rollCount}
              </motion.span>
            )}
          </motion.button>

          {/* Streak/gamification message */}
          <AnimatePresence>
            {showStreakMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full shadow-lg"
              >
                <Sparkles className="w-4 h-4 text-white" />
                <span className="text-sm font-bold text-white">
                  {getStreakMessage(rollCount)}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Fun streak indicator for 3+ rolls */}
          {rollCount >= 3 && !showStreakMessage && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-ink-muted italic"
            >
              {rollCount} rolls - indecisive much? 😄
            </motion.p>
          )}
        </div>
      </div>

      {/* Timer with dramatic countdown */}
      <motion.div
        className="text-center"
        initial={shouldReduceMotion ? {} : { opacity: 0 }}
        animate={!shouldReduceMotion && isTimerCritical ? {
          opacity: 1,
          scale: [1, 1.1, 1],
          rotate: [0, -2, 2, -2, 0],
        } : { opacity: 1 }}
        transition={{
          scale: { repeat: Infinity, duration: 1 },
          rotate: { repeat: Infinity, duration: 0.5 },
        }}
      >
        <motion.span
          className={`font-mono text-2xl font-bold ${timerColor}`}
          animate={!shouldReduceMotion && isTimerCritical ? {
            textShadow: [
              '0 0 0px rgba(239, 68, 68, 0)',
              '0 0 20px rgba(239, 68, 68, 0.8)',
              '0 0 0px rgba(239, 68, 68, 0)',
            ],
          } : {}}
          transition={{ duration: 1, repeat: Infinity }}
        >
          0:{timer.toString().padStart(2, '0')}
        </motion.span>
        {isTimerCritical && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-red-500 font-semibold mt-1"
          >
            ⏰ Hurry!
          </motion.p>
        )}
      </motion.div>

      {/* Select button */}
      <Button
        size="lg"
        className="w-full min-h-11"
        onClick={() => handleSelect()}
        disabled={isSelecting}
      >
        {isSelecting ? 'Saving...' : 'Select'}
      </Button>

      {/* Helper text with playful copy */}
      <motion.p
        key={timer}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center text-xs text-ink-muted"
      >
        {timer > 0
          ? timer <= 10
            ? 'Tick tock... time is running out!'
            : 'Take your time, or let the timer choose for you'
          : 'Avatar selected!'}
      </motion.p>
    </div>
  )
}
